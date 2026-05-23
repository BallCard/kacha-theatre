import { createHash } from 'node:crypto';
import type { AnalyzeResult } from './types.js';

export function sha1OfBase64(b64: string): string {
  const stripped = b64.replace(/^data:image\/[^;]+;base64,/, '');
  return createHash('sha1').update(stripped).digest('hex');
}

export function matchDemoResult(
  hash: string,
  map: Record<string, AnalyzeResult>,
): AnalyzeResult | null {
  return map[hash] ?? null;
}
