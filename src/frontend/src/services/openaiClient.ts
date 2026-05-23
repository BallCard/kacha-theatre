/**
 * OpenAI-compatible client (走 openai-next.com 代理)。
 *
 * 提供两个能力：
 *  1. chatCompletion(...)  → 用 GPT 文本模型生成结构化剧情 JSON
 *  2. imageEdit(...)       → 用 gpt-image-2 / gpt-image-1 / dall-e-3 出图
 *                            其中 gpt-image-* 用 /v1/images/edits（带参考图，保真人脸）
 *                            dall-e-3 走 /v1/images/generations（纯文生图）作为最后降级
 *
 * 设计原则：
 *  - 直接 fetch，不引入 SDK，减少包体积
 *  - 模型降级自动进行（gpt-image-2 → gpt-image-1 → dall-e-3）
 *  - 调用方拿到的统一是 base64 dataURL
 */

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
const BASE_URL = (import.meta.env.VITE_OPENAI_BASE_URL as string | undefined) || 'https://api.openai-next.com/v1';
const PRIMARY_IMAGE_MODEL = (import.meta.env.VITE_IMAGE_MODEL as string | undefined) || 'gpt-image-2';
const CHAT_MODEL = (import.meta.env.VITE_CHAT_MODEL as string | undefined) || 'gpt-4o-mini';

const IMAGE_FALLBACK_CHAIN = [PRIMARY_IMAGE_MODEL, 'gpt-image-1', 'dall-e-3'].filter(
  (m, i, arr) => arr.indexOf(m) === i  // dedupe in case PRIMARY = 'gpt-image-1'
);

export class OpenAIClientError extends Error {
  constructor(message: string, public status?: number, public model?: string) {
    super(message);
    this.name = 'OpenAIClientError';
  }
}

function assertKey() {
  if (!API_KEY) {
    throw new OpenAIClientError(
      'VITE_OPENAI_API_KEY 未配置，请检查 src/frontend/.env'
    );
  }
}

// ============================================================
// Chat Completion（文本生成）
// ============================================================

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  messages: ChatMessage[];
  jsonMode?: boolean;       // 默认 true：用 response_format json_object 强制 JSON 输出
  temperature?: number;
  maxTokens?: number;
}

export async function chatCompletion(opts: ChatCompletionOptions): Promise<string> {
  assertKey();
  const body: Record<string, unknown> = {
    model: CHAT_MODEL,
    messages: opts.messages,
    temperature: opts.temperature ?? 0.9,
  };
  if (opts.maxTokens) body.max_tokens = opts.maxTokens;
  if (opts.jsonMode !== false) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new OpenAIClientError(`chat/completions failed: ${res.status} ${text}`, res.status);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new OpenAIClientError('chat/completions 返回结构异常，缺少 choices[0].message.content');
  }
  return content;
}

// ============================================================
// Image generation / edit（图生图，含降级链）
// ============================================================

export interface ImageEditOptions {
  prompt: string;                  // 主 prompt
  referenceImageBase64?: string;   // 参考图 base64 或 dataURL；不传则走纯文生图
  size?: '1024x1024' | '1024x1536' | '1536x1024' | '1792x1024' | '1024x1792';
  /** 主模型强制覆盖（用于测试） */
  forceModel?: string;
  /**
   * Fast 档：gpt-image-* 支持 'low' | 'medium' | 'high' | 'auto'；
   * dall-e-3 支持 'standard' | 'hd'。
   * 调用方传 'low' 时，dall-e-3 自动映射为 'standard'。
   */
  quality?: 'low' | 'medium' | 'high' | 'auto' | 'standard' | 'hd';
}

export interface ImageEditResult {
  imageDataUrl: string;            // 统一以 base64 dataURL 返回
  modelUsed: string;               // 实际生效的模型
  degraded: boolean;               // 是否走了降级
}

/**
 * 主入口：先用 gpt-image-2 试图生图（带参考图）；失败按降级链尝试。
 * 走到 dall-e-3 时自动改成纯文生图（参考图丢失，可接受）。
 */
export async function imageEdit(opts: ImageEditOptions): Promise<ImageEditResult> {
  assertKey();
  const chain = opts.forceModel ? [opts.forceModel] : IMAGE_FALLBACK_CHAIN;
  let lastErr: Error | null = null;

  for (let i = 0; i < chain.length; i++) {
    const model = chain[i];
    const degraded = i > 0;
    try {
      const dataUrl = await callImageApi(model, opts);
      return { imageDataUrl: dataUrl, modelUsed: model, degraded };
    } catch (err) {
      lastErr = err as Error;
      console.warn(`[openaiClient] model ${model} failed, trying next…`, err);
    }
  }

  throw new OpenAIClientError(
    `所有图像模型都失败了。最后错误：${lastErr?.message ?? '未知'}`,
  );
}

async function callImageApi(model: string, opts: ImageEditOptions): Promise<string> {
  const isDallE = model.startsWith('dall-e');
  const canUseEdits = !isDallE && !!opts.referenceImageBase64;
  const endpoint = canUseEdits ? '/images/edits' : '/images/generations';

  // dall-e-3 不支持 1024x1536，转成它支持的纵向尺寸
  const size = isDallE
    ? (opts.size === '1024x1536' ? '1024x1792' : opts.size === '1536x1024' ? '1792x1024' : '1024x1024')
    : (opts.size ?? '1024x1536');

  // Quality 跨模型映射
  const dallEQualities = new Set(['standard', 'hd']);
  const gptQualities = new Set(['low', 'medium', 'high', 'auto']);
  let quality: string | undefined = opts.quality;
  if (quality) {
    if (isDallE) {
      // gpt 档位映射到 dall-e 档位
      if (gptQualities.has(quality)) {
        quality = quality === 'high' ? 'hd' : 'standard';
      } else if (!dallEQualities.has(quality)) {
        quality = 'standard';
      }
    } else {
      if (dallEQualities.has(quality)) {
        quality = quality === 'hd' ? 'high' : 'low';
      } else if (!gptQualities.has(quality)) {
        quality = 'low';
      }
    }
  }

  if (canUseEdits) {
    // multipart/form-data for /images/edits
    const form = new FormData();
    form.append('model', model);
    form.append('prompt', opts.prompt);
    form.append('n', '1');
    form.append('size', size);
    if (quality) form.append('quality', quality);
    const blob = dataUrlToBlob(opts.referenceImageBase64!);
    form.append('image', blob, 'reference.png');

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${API_KEY}` },
      body: form,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new OpenAIClientError(`${endpoint} (${model}) failed: ${res.status} ${text}`, res.status, model);
    }
    return extractImageDataUrl(await res.json());
  }

  // /images/generations (JSON body)
  const body: Record<string, unknown> = {
    model,
    prompt: opts.prompt,
    n: 1,
    size,
  };
  if (quality) body.quality = quality;
  // gpt-image-* 总是返回 b64_json；dall-e-3 默认 url，要求 b64_json
  if (isDallE) body.response_format = 'b64_json';

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new OpenAIClientError(`${endpoint} (${model}) failed: ${res.status} ${text}`, res.status, model);
  }
  return extractImageDataUrl(await res.json());
}

function extractImageDataUrl(data: any): string {
  const item = data?.data?.[0];
  if (!item) throw new OpenAIClientError('images API 返回 data 为空');
  if (item.b64_json) {
    return `data:image/png;base64,${item.b64_json}`;
  }
  if (item.url) {
    // 兜底：dall-e-3 可能返回 url，调用方需要再 fetch；这里同步转换不现实
    // 直接把 url 包成 fake dataURL，让上层 <img src> 直接用
    return item.url as string;
  }
  throw new OpenAIClientError('images API 返回中既无 b64_json 也无 url');
}

// ============================================================
// Helpers
// ============================================================

function dataUrlToBlob(dataUrlOrBase64: string): Blob {
  // 接受 "data:image/xxx;base64,..." 或纯 base64
  let mime = 'image/png';
  let b64 = dataUrlOrBase64;
  const m = dataUrlOrBase64.match(/^data:(.+?);base64,(.*)$/);
  if (m) {
    mime = m[1];
    b64 = m[2];
  }
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export function hasApiKey(): boolean {
  return !!API_KEY;
}
