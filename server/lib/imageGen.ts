// Part 2 图像生成（搬自 src/frontend/src/services/openaiClient.ts）
// gpt-image-2 优先 → gpt-image-1 → dall-e-3 降级链
// 与现有 server/lib/vlm-relay.ts 复用同一 OPENAI_API_KEY / OPENAI_BASE_URL

import { fetch, FormData } from 'undici';

const PRIMARY_IMAGE_MODEL = process.env.IMAGE_MODEL ?? 'gpt-image-2';
const IMAGE_FALLBACK_CHAIN = [PRIMARY_IMAGE_MODEL, 'gpt-image-1', 'dall-e-3'].filter(
  (m, i, arr) => arr.indexOf(m) === i,
);

export interface ImageGenOptions {
  prompt: string;
  referenceImageBase64?: string;       // 含 dataURL 前缀亦可
  size?: '1024x1024' | '1024x1536' | '1536x1024' | '1792x1024' | '1024x1792';
  quality?: 'low' | 'medium' | 'high' | 'auto';
  timeoutMs?: number;
}

export interface ImageGenResult {
  pngBuffer: Buffer;
  modelUsed: string;
  degraded: boolean;
}

function getEnv() {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = (process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/$/, '');
  if (!apiKey) throw new Error('OPENAI_API_KEY missing for image generation');
  return { apiKey, baseUrl };
}

function dataUrlToParts(s: string): { mime: string; b64: string } {
  const m = s.match(/^data:(.+?);base64,(.*)$/);
  if (m) return { mime: m[1], b64: m[2] };
  return { mime: 'image/png', b64: s };
}

function base64ToBuffer(s: string): Buffer {
  const { b64 } = dataUrlToParts(s);
  return Buffer.from(b64, 'base64');
}

export async function generateImage(opts: ImageGenOptions): Promise<ImageGenResult> {
  const { apiKey, baseUrl } = getEnv();
  let lastErr: Error | null = null;

  for (let i = 0; i < IMAGE_FALLBACK_CHAIN.length; i++) {
    const model = IMAGE_FALLBACK_CHAIN[i];
    const degraded = i > 0;
    try {
      const buf = await callOnce(apiKey, baseUrl, model, opts);
      return { pngBuffer: buf, modelUsed: model, degraded };
    } catch (e: any) {
      lastErr = e instanceof Error ? e : new Error(String(e));
      // 继续降级
    }
  }
  throw new Error(`all image models failed: ${lastErr?.message ?? 'unknown'}`);
}

async function callOnce(
  apiKey: string,
  baseUrl: string,
  model: string,
  opts: ImageGenOptions,
): Promise<Buffer> {
  const isDallE = model.startsWith('dall-e');
  const canUseEdits = !isDallE && !!opts.referenceImageBase64;
  const endpoint = canUseEdits ? '/images/edits' : '/images/generations';

  const size = isDallE
    ? (opts.size === '1024x1536' ? '1024x1792' : opts.size === '1536x1024' ? '1792x1024' : '1024x1024')
    : (opts.size ?? '1024x1536');

  let quality = opts.quality;
  if (quality && isDallE) {
    // 在 dall-e-3 上把 gpt 档位映射为 dall-e 档位
    quality = (quality === 'high' ? 'hd' : 'standard') as any;
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 90_000);

  try {
    let res;
    if (canUseEdits) {
      const form = new FormData();
      form.append('model', model);
      form.append('prompt', opts.prompt);
      form.append('n', '1');
      form.append('size', size);
      if (quality) form.append('quality', quality as string);
      const { mime, b64 } = dataUrlToParts(opts.referenceImageBase64!);
      const blob = new Blob([Buffer.from(b64, 'base64')], { type: mime });
      form.append('image', blob as any, 'reference.png');

      res = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form as any,
        signal: ctrl.signal,
      });
    } else {
      const body: Record<string, unknown> = { model, prompt: opts.prompt, n: 1, size };
      if (quality) body.quality = quality;
      if (isDallE) body.response_format = 'b64_json';

      res = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`${endpoint} (${model}) http ${res.status}: ${text.slice(0, 200)}`);
    }
    const data = (await res.json()) as { data?: Array<{ b64_json?: string; url?: string }> };
    const item = data.data?.[0];
    if (item?.b64_json) return Buffer.from(item.b64_json, 'base64');
    if (item?.url) {
      // dall-e-3 偶尔返 url，再 fetch 拉回
      const imgRes = await fetch(item.url, { signal: ctrl.signal });
      if (!imgRes.ok) throw new Error(`fetch image url failed: ${imgRes.status}`);
      const ab = await imgRes.arrayBuffer();
      return Buffer.from(ab);
    }
    throw new Error('images API returned neither b64_json nor url');
  } finally {
    clearTimeout(timer);
  }
}

export { base64ToBuffer };
