// 端到端测延迟：用真实图打 /plot/v2/node，看冷启动 vs 缓存命中 vs 预热效果
import { readFile } from 'node:fs/promises';
import { fetch } from 'undici';

const API = 'http://localhost:3000/api/plot/v2/node';
const IMG = new URL('../../f324abed3e1d0663015b4e85319dddb4.jpg', import.meta.url);
// 用没测过的组合，确保冷启动
const THEME = process.env.BENCH_THEME ?? '打脸';
const STYLE = process.env.BENCH_STYLE ?? '仙逆';

async function loadImage() {
  const buf = await readFile(IMG);
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

async function call(pathKey, image, label, opts = {}) {
  const start = Date.now();
  const body = {
    theme: THEME, artStyle: STYLE, pathKey,
    model: 'claude-sonnet-4-6', characterAName: 'A',
    ...(image ? { image } : {}),
    ...(opts.imageHash ? { imageHash: opts.imageHash } : {}),
  };
  const r = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const ms = Date.now() - start;
  const json = await r.json();
  const cache = json.cacheHit ? '⚡ HIT' : '✨ FRESH';
  const tag = json.error ? `ERR ${json.error}` : cache;
  console.log(`[${label}] ${pathKey.padEnd(8)} ${ms.toString().padStart(6)}ms  ${tag}  ${json.narration?.slice(0, 30) ?? json.detail ?? ''}`);
  return json;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log(`=== 加载测试图（theme=${THEME} style=${STYLE}）===`);
  const img = await loadImage();
  console.log(`图大小: ${(img.length / 1024).toFixed(0)} KB base64`);

  console.log('\n=== Round 1: 冷启动 root ===');
  const root = await call('root', img, '冷启动');
  if (root.error) { console.error('root 失败，终止'); return; }
  const hash = root.imageHash;

  console.log('\n=== 等 8s（模拟用户看节点），再请求 A ===');
  await sleep(8000);
  await call('A', null, '点击 A', { imageHash: hash });

  console.log('\n=== 立刻验证缓存命中（重复 A）===');
  await call('A', null, '重复 A', { imageHash: hash });

  console.log('\n=== 等 8s 再请求 A.A（看 depth-2 prefetch）===');
  await sleep(8000);
  await call('A.A', null, '点 A.A', { imageHash: hash });

  console.log('\n=== 终幕 A.A.A ===');
  await call('A.A.A', null, '终幕', { imageHash: hash });

  console.log('\n=== 全流程完成 ===');
}

main().catch((e) => { console.error(e); process.exit(1); });
