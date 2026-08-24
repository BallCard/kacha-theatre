// POST /api/plot/v2/node
// 单节点剧情生成 + 节点图生成 + 哈希缓存
//
// 性能优化：
//  - 服务端推测预热：节点 N 生成后，立即 fire-and-forget 触发 3 个子节点后台 job，
//    用户读文+做选择的窗口期被用来灌缓存，下一步通常已命中
//  - in-flight 去重：同 (hash, theme, style, pathKey) 同时多次请求共享同一 Promise
//  - 图尺寸 1024x1024（替代竖图 1024x1536，约省 30-40% 时间）

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sha256OfBase64, shortHash } from '../../../lib/hash.js';
import { getJson, putJson, getBinary, putBinary, publicUrl } from '../../../lib/cache.js';
import {
  THEMES, ART_STYLE_NAMES, type Theme, type ArtStyle,
  pickShot, pathDepth, pathAncestors, isFinalDepth,
} from '../../../lib/storyStyles.js';
import { buildStorySystemPrompt, buildStoryUserPrompt, applyArtStyle, type AncestorBrief } from '../../../lib/storyPrompt.js';
import { validateStoryNode, type StoryNodeOutput } from '../../../lib/storySchema.js';
import { callStoryLLM, tryParseJson } from '../../../lib/storyLLM.js';
import { generateImage } from '../../../lib/imageGen.js';
import { compressForReference } from '../../../lib/imageCompress.js';
import { logEvent } from '../../../lib/logger.js';

const A_WINS_RATE = Number(process.env.A_WINS_RATE ?? '0.10');
const DEFAULT_STORY_MODEL = process.env.STORY_MODEL ?? 'claude-sonnet-4-6';
const ALLOWED_STORY_MODELS = ['claude-sonnet-4-6', 'gpt-5', 'gpt-4o', 'gpt-4o-mini'];
const PREFETCH_CHILDREN = process.env.STORY_PREFETCH !== '0';   // 默认开
const IMAGE_SIZE = (process.env.STORY_IMAGE_SIZE ?? '1024x1024') as
  | '1024x1024' | '1024x1536' | '1536x1024';

interface NodeRequest {
  imageHash?: string;
  image?: string;
  theme: Theme;
  artStyle: ArtStyle;
  pathKey: string;
  model?: string;
  characterAName?: string;
  ancestors?: AncestorBrief[];
}

interface NodeResponse extends StoryNodeOutput {
  pathKey: string;
  imageHash: string;
  imageUrl: string;
  shotUsed: string;
  cacheHit: boolean;
  modelUsed?: string;
}

type ErrorResponse = { error: string; detail?: string; status: number };

interface CachedNode {
  pathKey: string;
  narration: string;
  characterLine?: string;
  imagePrompt: string;
  finalImagePrompt: string;
  choices: NodeResponse['choices'];
  ending: NodeResponse['ending'];
  shotUsed: string;
  modelUsed: string;
  ts: number;
}

function scopeKey(theme: Theme, artStyle: ArtStyle, pathKey: string): string {
  return `${theme}__${artStyle}/${pathKey}`;
}

function validatePath(p: string): boolean {
  if (p === 'root') return true;
  const segs = p.split('.');
  if (segs.length > 3) return false;
  return segs.every((s) => s === 'A' || s === 'B' || s === 'C');
}

function childPathKeys(pk: string): string[] {
  if (isFinalDepth(pk)) return [];
  const prefix = pk === 'root' ? '' : pk + '.';
  return ['A', 'B', 'C'].map((c) => prefix + c);
}

// ============================================================
// in-flight 去重：同 cache key 并发请求共享一个 Promise
// ============================================================
const inflight = new Map<string, Promise<NodeResponse | ErrorResponse>>();

function inflightKey(imageHash: string, theme: Theme, artStyle: ArtStyle, pathKey: string): string {
  return `${imageHash}/${theme}/${artStyle}/${pathKey}`;
}

// ============================================================
// 核心：纯函数式，可被 handler / 预热 / 预取复用
// ============================================================
interface RunOptions {
  prefetchChildren?: boolean;
}

async function runNode(body: NodeRequest, opts: RunOptions = {}): Promise<NodeResponse | ErrorResponse> {
  if (!body.theme || !THEMES.includes(body.theme)) return { error: 'INVALID_THEME', status: 400 };
  if (!body.artStyle || !ART_STYLE_NAMES.includes(body.artStyle)) return { error: 'INVALID_ART_STYLE', status: 400 };
  if (!body.pathKey || !validatePath(body.pathKey)) return { error: 'INVALID_PATH_KEY', status: 400 };

  const model = ALLOWED_STORY_MODELS.includes(body.model ?? '') ? (body.model as string) : DEFAULT_STORY_MODEL;
  const characterAName = (body.characterAName ?? 'A').slice(0, 12);

  let imageHash = body.imageHash ? shortHash(body.imageHash, 16) : null;
  if (!imageHash && body.image) imageHash = shortHash(sha256OfBase64(body.image));
  if (!imageHash) return { error: 'MISSING_IMAGE', detail: '首次请求需带 image', status: 400 };

  // source image 落盘 —— 首次到达时压到 ≤1024px JPEG，避免 6MB 原图反复上传打爆网关
  let referenceImageBase64: string | undefined;
  const sourceBuf = await getBinary('story', imageHash, 'source');
  if (sourceBuf) {
    referenceImageBase64 = `data:image/jpeg;base64,${sourceBuf.toString('base64')}`;
  } else if (body.image) {
    const rawB64 = body.image.includes(',') ? body.image.split(',')[1] : body.image;
    const rawBuf = Buffer.from(rawB64, 'base64');
    const small = await compressForReference(rawBuf, { maxSide: 1024, jpegQuality: 82 });
    await putBinary('story', imageHash, 'source', small);
    referenceImageBase64 = `data:image/jpeg;base64,${small.toString('base64')}`;
    await logEvent({ ev: 'story_source_stored', imageHash, rawKB: Math.round(rawBuf.length / 1024), smallKB: Math.round(small.length / 1024) });
  }
  if (!referenceImageBase64) return { error: 'MISSING_IMAGE', detail: '盘上无源图', status: 400 };

  const sk = scopeKey(body.theme, body.artStyle, body.pathKey);
  const ikey = inflightKey(imageHash, body.theme, body.artStyle, body.pathKey);

  // 缓存命中
  const cached = await getJson<CachedNode>('story', imageHash, sk);
  if (cached) {
    await logEvent({ ev: 'plot_cache_hit', imageHash, sk });
    schedulePrefetch(body, imageHash, opts);
    return {
      pathKey: body.pathKey,
      imageHash,
      imageUrl: publicUrl('story', imageHash, sk),
      narration: cached.narration,
      characterLine: cached.characterLine,
      imagePrompt: cached.finalImagePrompt,
      choices: cached.choices,
      ending: cached.ending,
      shotUsed: cached.shotUsed,
      modelUsed: cached.modelUsed,
      cacheHit: true,
    };
  }

  // in-flight 去重
  const ongoing = inflight.get(ikey);
  if (ongoing) {
    await logEvent({ ev: 'plot_dedup_wait', imageHash, sk });
    return ongoing;
  }

  const work = doGenerate(body, imageHash, sk, model, characterAName, referenceImageBase64).finally(() => {
    inflight.delete(ikey);
  });
  inflight.set(ikey, work);

  const result = await work;
  if (!('error' in result)) schedulePrefetch(body, imageHash, opts);
  return result;
}

async function doGenerate(
  body: NodeRequest,
  imageHash: string,
  sk: string,
  model: string,
  characterAName: string,
  referenceImageBase64: string,
): Promise<NodeResponse | ErrorResponse> {
  // 父链镜头收集
  const ancestorKeys = pathAncestors(body.pathKey);
  const shotsUsedAncestors: string[] = [];
  const inferredAncestors: AncestorBrief[] = body.ancestors ?? [];
  for (const ak of ancestorKeys) {
    const c = await getJson<CachedNode>('story', imageHash, scopeKey(body.theme, body.artStyle, ak));
    if (c?.shotUsed) shotsUsedAncestors.push(c.shotUsed);
  }
  const shot = pickShot(shotsUsedAncestors);

  // 终幕 aWins roll
  let endingMode: 'me_wins' | 'a_wins' | undefined;
  if (isFinalDepth(body.pathKey)) {
    endingMode = Math.random() < A_WINS_RATE ? 'a_wins' : 'me_wins';
  }

  // LLM 链
  const systemPrompt = buildStorySystemPrompt(body.theme, body.artStyle, characterAName);
  const userPrompt = buildStoryUserPrompt({
    theme: body.theme, artStyle: body.artStyle, pathKey: body.pathKey,
    ancestors: inferredAncestors, shot, shotsUsedAncestors, endingMode, characterAName,
  }, characterAName);

  let validated: StoryNodeOutput | null = null;
  let llmModel = model;
  let lastErr: string | null = null;
  const modelChain = [model, ...(model !== DEFAULT_STORY_MODEL ? [DEFAULT_STORY_MODEL] : []), 'gpt-4o-mini']
    .filter((m, i, arr) => arr.indexOf(m) === i);

  for (const m of modelChain) {
    const llmRes = await callStoryLLM({ systemPrompt, userPrompt, model: m });
    if (!llmRes.ok) { lastErr = llmRes.error; continue; }
    const parsed = tryParseJson(llmRes.raw);
    if (!parsed) { lastErr = 'not json'; continue; }
    const v = validateStoryNode(parsed, !!endingMode);
    if (!v.ok) { lastErr = v.errors.join('; '); continue; }
    validated = v.data; llmModel = m; break;
  }

  if (!validated) {
    await logEvent({ ev: 'plot_llm_failed', imageHash, sk, err: lastErr });
    return { error: 'LLM_FAILED', detail: lastErr ?? 'unknown', status: 502 };
  }

  if (endingMode && validated.ending) {
    validated.ending.aWins = endingMode === 'a_wins';
  }

  const finalImagePrompt = applyArtStyle(validated.imagePrompt, body.artStyle, shot);
  let imgBuf: Buffer;
  try {
    const img = await generateImage({
      prompt: finalImagePrompt,
      referenceImageBase64,
      size: IMAGE_SIZE,
      quality: 'low',
    });
    imgBuf = img.pngBuffer;
  } catch (e: any) {
    await logEvent({ ev: 'plot_image_failed', imageHash, sk, err: e?.message ?? String(e) });
    return { error: 'IMAGE_FAILED', detail: e?.message ?? String(e), status: 502 };
  }

  await putBinary('story', imageHash, sk, imgBuf);

  const cachedNode: CachedNode = {
    pathKey: body.pathKey,
    narration: validated.narration,
    characterLine: validated.characterLine,
    imagePrompt: validated.imagePrompt,
    finalImagePrompt,
    choices: validated.choices,
    ending: validated.ending,
    shotUsed: shot,
    modelUsed: llmModel,
    ts: Date.now(),
  };
  await putJson('story', imageHash, sk, cachedNode);
  await logEvent({ ev: 'plot_generated', imageHash, sk, depth: pathDepth(body.pathKey), model: llmModel });

  return {
    pathKey: body.pathKey,
    imageHash,
    imageUrl: publicUrl('story', imageHash, sk),
    narration: validated.narration,
    characterLine: validated.characterLine,
    imagePrompt: finalImagePrompt,
    choices: validated.choices,
    ending: validated.ending,
    shotUsed: shot,
    modelUsed: llmModel,
    cacheHit: false,
  };
}

// ============================================================
// 推测预热：异步触发 3 个子节点；不递归（避免雪崩）
// ============================================================
function schedulePrefetch(body: NodeRequest, imageHash: string, opts: RunOptions) {
  if (opts.prefetchChildren === false) return;
  if (!PREFETCH_CHILDREN) return;
  const children = childPathKeys(body.pathKey);
  if (children.length === 0) return;

  setImmediate(() => {
    for (const childPath of children) {
      // 用 in-flight 去重 + 自带缓存命中跳过，浪费的只有计算调度
      runNode({
        imageHash,
        image: undefined,
        theme: body.theme,
        artStyle: body.artStyle,
        pathKey: childPath,
        model: body.model,
        characterAName: body.characterAName,
      }, { prefetchChildren: false }).catch(() => {});
    }
    logEvent({ ev: 'plot_prefetch_scheduled', imageHash, parent: body.pathKey, children }).catch(() => {});
  });
}

// ============================================================
// HTTP handler
// ============================================================
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'METHOD_NOT_ALLOWED' }); return; }

  const body = req.body as NodeRequest | undefined;
  if (!body) { res.status(400).json({ error: 'MISSING_BODY' }); return; }

  const result = await runNode(body, { prefetchChildren: true });
  if ('error' in result) {
    res.status(result.status).json({ error: result.error, detail: result.detail });
  } else {
    res.status(200).json(result);
  }
}

export const config = { api: { bodyParser: { sizeLimit: '4mb' } } };

// 给预热脚本直接 in-process 调用：预热模式自带遍历不需要再预热
export async function generateNodeInProcess(body: NodeRequest): Promise<NodeResponse | { error: string; detail?: string }> {
  const r = await runNode(body, { prefetchChildren: false });
  if ('error' in r) return { error: r.error, detail: r.detail };
  return r;
}
