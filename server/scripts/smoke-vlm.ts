// 真实 VLM 冒烟：用根目录 示例图片.jpg 跑一遍完整 analyze 链路
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { analyzeWithVLM } from '../lib/vlm.js';

const IMG = join(process.cwd(), '..', '示例图片.jpg');

async function toB64(path: string): Promise<string> {
  const buf = await readFile(path);
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

async function main() {
  console.log('loading image:', IMG);
  const b64 = await toB64(IMG);
  console.log('base64 length:', b64.length);

  console.log('\n>>> calling analyzeWithVLM (primary then fallback)...');
  const start = Date.now();
  const { result, trace } = await analyzeWithVLM(b64);
  const total = Date.now() - start;

  console.log('\n=== TRACE ===');
  console.log('finalSource:', trace.finalSource);
  console.log('totalMs:', trace.totalMs, '(measured:', total, 'ms)');
  trace.attempts.forEach((a, i) => {
    console.log(`  attempt ${i + 1}:`, JSON.stringify(a));
  });

  console.log('\n=== RESULT ===');
  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
