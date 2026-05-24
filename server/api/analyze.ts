import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { analyzeWithVLM } from '../lib/vlm.js';
import { sha1OfBase64, matchDemoResult } from '../lib/demo-match.js';
import { makeFallback } from '../lib/fallback.js';
import { validateAnalyzeResult } from '../lib/schema.js';
import { logEvent } from '../lib/logger.js';
import { sha256OfBase64, shortHash } from '../lib/hash.js';
import { getJson, putJson } from '../lib/cache.js';
import type { AnalyzeResult, AnalyzeRequest } from '../lib/types.js';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const HASH_MAP_PATH = join(process.cwd(), '..', 'assets', 'demo', 'hash-map.json');

let demoMapCache: Record<string, AnalyzeResult> | null = null;
async function loadDemoMap(): Promise<Record<string, AnalyzeResult>> {
  if (demoMapCache) return demoMapCache;
  try {
    const raw = await readFile(HASH_MAP_PATH, 'utf8');
    demoMapCache = JSON.parse(raw);
    return demoMapCache!;
  } catch {
    demoMapCache = {};
    return demoMapCache;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'METHOD_NOT_ALLOWED' }); return; }

  const body = req.body as AnalyzeRequest | undefined;
  if (!body || typeof body.image !== 'string') {
    res.status(400).json({ error: 'MISSING_IMAGE', message: '缺 image 字段' });
    return;
  }
  if (body.image.length > MAX_IMAGE_BYTES * 1.4) {
    res.status(400).json({ error: 'INVALID_IMAGE', message: 'image base64 超过 2MB' });
    return;
  }

  const hash = sha1OfBase64(body.image);
  const imageHash = shortHash(sha256OfBase64(body.image));
  await logEvent({ ev: 'analyze_start', hash, imageHash });

  // 1. demo hash 短路
  if (process.env.DEMO_MATCH_ON !== '0') {
    const demoMap = await loadDemoMap();
    const hit = matchDemoResult(hash, demoMap);
    if (hit) {
      const v = validateAnalyzeResult(hit);
      if (v.ok) {
        await logEvent({ ev: 'analyze_demo_hit', hash, tier: hit.level_tier, score: hit.moyu_score });
        res.status(200).json(hit);
        return;
      }
    }
  }

  // 2. 持久化哈希缓存（同一张图同一结果，prompt 升级走 CACHE_VERSION）
  const cached = await getJson<AnalyzeResult>('analyze', imageHash, 'result');
  if (cached) {
    const v = validateAnalyzeResult(cached);
    if (v.ok) {
      await logEvent({ ev: 'analyze_cache_hit', imageHash, tier: cached.level_tier });
      res.status(200).json(cached);
      return;
    }
  }

  // 3. VLM 调度
  try {
    const { result, trace } = await analyzeWithVLM(body.image, body.provider ?? 'doubao');
    await logEvent({
      ev: 'analyze_success',
      ms: trace.totalMs,
      source: trace.finalSource,
      score: result.moyu_score,
      tier: result.level_tier,
      attempts: trace.attempts.length,
    });
    // 仅 VLM 真生成结果写缓存；兜底（finalSource === 'fallback'）不写
    if (trace.finalSource !== 'fallback') {
      await putJson('analyze', imageHash, 'result', result);
    }
    res.status(200).json(result);
  } catch (e: any) {
    await logEvent({ ev: 'analyze_error', err: e?.message ?? String(e) });
    res.status(200).json(makeFallback());
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: '4mb' } },
};
