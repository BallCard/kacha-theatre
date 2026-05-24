// 端到端测延迟：用真实图打 /plot/v2/node，看冷启动 vs 缓存命中 vs 预热效果
import { readFile } from 'node:fs/promises';
import { fetch } from 'undici';

const API = 'http://localhost:3000/api/plot/v2/node';
const IMG = new URL('../../f324abed3e1d0663015b4e85319dddb4.jpg', import.meta.url);

async function loadImage() {
  const buf = await readFile(IMG);
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

async function call(pathKey, image, label, opts = {}) {
  const start = Date.now();
  const body = {
    theme: '宫斗剧', artStyle: '恋与深空', pathKey,
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
  console.log('=== 加载测试图 ===');
  const img = await loadImage();
  console.log(`图大小: ${(img.length / 1024).toFixed(0)} KB base64`);

  console.log('\n=== Round 1: 冷启动 root（无任何缓存）===');
  const root = await call('root', img, '冷启动');
  if (root.error) { console.error('root 失败，终止'); return; }
  const hash = root.imageHash;

  console.log('\n=== 等 2s 看 prefetch 进度，然后请求 A ===');
  await sleep(2000);
  const t1 = Date.now();
  const childA = await call('A', null, '点击 A', { imageHash: hash });
  console.log(`  → A 总耗时 ${Date.now() - t1}ms`);

  console.log('\n=== 立刻再请求一次 A（验证缓存命中）===');
  await call('A', null, '重复 A', { imageHash: hash });

  console.log('\n=== 等 4s 后请求 A.A，看深层 prefetch ===');
  await sleep(4000);
  await call('A.A', null, '点 A.A', { imageHash: hash });

  console.log('\n=== 立刻 A.A.A（终幕）===');
  await call('A.A.A', null, '终幕', { imageHash: hash });
}

main().catch((e) => { console.error(e); process.exit(1); });
