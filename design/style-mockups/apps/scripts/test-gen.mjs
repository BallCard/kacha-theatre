// 一次性测试 gpt-image-2 出图
// node test-gen.mjs
import { writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const KEY = (await readFile(join(__dirname, '.env'), 'utf-8')).match(/VECTRUST_API_KEY=(\S+)/)?.[1];
if (!KEY) { console.error('[err] no VECTRUST_API_KEY in .env'); process.exit(1); }
const BASE = 'https://api.openai-next.com/v1';

const body = {
  model: 'gpt-image-2',
  prompt: '明清官印朱砂大印，印面写"准奏"二字，魏碑楷体阳刻，朱砂红 #c8161d，印泥糊化边缘斑驳，方形外框，正面平视俯视，透明背景，写实质感，无阴影',
  size: '1024x1024',
  background: 'transparent',
  output_format: 'png',
  n: 1,
};

console.log('[req] POST', BASE + '/images/generations');
console.log('[req] model:', body.model);
const t0 = Date.now();
const ctrl = new AbortController();
const timer = setTimeout(() => ctrl.abort(), 300000);

try {
  const r = await fetch(BASE + '/images/generations', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: ctrl.signal,
  });
  clearTimeout(timer);
  console.log('[res] status', r.status, 'in', ((Date.now()-t0)/1000).toFixed(1)+'s');

  const txt = await r.text();
  if (!r.ok) {
    console.error('[error body]', txt.slice(0, 800));
    process.exit(1);
  }
  const j = JSON.parse(txt);
  console.log('[res] keys:', Object.keys(j));
  console.log('[res] data[0] keys:', j.data ? Object.keys(j.data[0]) : 'NO data');

  if (j.data?.[0]?.b64_json) {
    const buf = Buffer.from(j.data[0].b64_json, 'base64');
    await writeFile('test-seal.png', buf);
    console.log('[ok] saved test-seal.png', buf.length, 'bytes');
  } else if (j.data?.[0]?.url) {
    console.log('[ok] image url:', j.data[0].url);
    const r2 = await fetch(j.data[0].url);
    const buf = Buffer.from(await r2.arrayBuffer());
    await writeFile('test-seal.png', buf);
    console.log('[ok] downloaded test-seal.png', buf.length, 'bytes');
  } else {
    console.error('[error] unknown shape:', txt.slice(0, 500));
  }
} catch (err) {
  console.error('[fetch err]', err.message);
  process.exit(1);
}
