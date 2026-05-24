// 极简静态 + /api 代理服务器，专给三套设计原型用
//
//   node dev-server.mjs            -> 默认端口 4000，/api 反代到 :3001
//   PORT=4010 BACKEND=http://localhost:3001 node dev-server.mjs
//
// 不会动 src/frontend，也不会动 server/。

import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath, URL } from 'node:url';

const PORT = Number(process.env.PORT || 4000);
const BACKEND = process.env.BACKEND || 'http://localhost:3001';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon',
};

function proxy(req, res) {
  const target = new URL(req.url, BACKEND);
  const opts = {
    method: req.method,
    headers: { ...req.headers, host: target.host },
  };
  const upstream = http.request(target, opts, (up) => {
    res.writeHead(up.statusCode || 500, up.headers);
    up.pipe(res);
  });
  upstream.on('error', (err) => {
    console.error('[proxy] upstream error:', err.message);
    res.writeHead(502, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'BACKEND_UNREACHABLE', message: err.message }));
  });
  req.pipe(upstream);
}

async function serveStatic(req, res) {
  let urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = join(ROOT, urlPath);
  // 防御目录穿越
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); return res.end('forbidden');
  }
  try {
    const st = await stat(filePath);
    if (st.isDirectory()) {
      // 默认走目录下 index.html
      const idx = join(filePath, 'index.html');
      const buf = await readFile(idx);
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      return res.end(buf);
    }
    const buf = await readFile(filePath);
    const ext = extname(filePath).toLowerCase();
    res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream' });
    res.end(buf);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('not found: ' + urlPath);
  }
}

const server = http.createServer((req, res) => {
  if (req.url && req.url.startsWith('/api/')) return proxy(req, res);
  return serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`\n  咔嚓剧场 · 三套原型本地预览`);
  console.log(`  静态根目录   : ${ROOT}`);
  console.log(`  本地访问     : http://localhost:${PORT}/`);
  console.log(`  /api 反代到 : ${BACKEND}`);
  console.log(`  ?mock=1     : 不连后端、直接用 _shared/sample.json\n`);
});
