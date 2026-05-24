// 本地 Node HTTP 服务器：替代 vercel dev
// 通过 npm run dev 启动；监听 :3000；CORS 全开；适配 Vercel handler 签名。
//
// 用法：
//   npm run dev                 -> 默认 :3000
//   PORT=3001 npm run dev       -> 自定义端口
//
// 路由：
//   GET  /api/health    -> 健康检查
//   POST /api/analyze   -> VLM 审阅
//
// 设计：用 thin shim 把 IncomingMessage/ServerResponse 包成 VercelRequest/VercelResponse
// 兼容已有 handler，无需改动 server/api/*.ts。

import 'dotenv/config';
import http from 'node:http';
import { URL } from 'node:url';
import { readFile, stat } from 'node:fs/promises';
import { join, normalize, sep } from 'node:path';
import analyzeHandler from './api/analyze.js';
import healthHandler from './api/health.js';
import plotV2NodeHandler from './api/plot/v2/node.js';
import { cacheRoot } from './lib/cache.js';

const PORT = Number(process.env.PORT ?? 3000);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function setCORS(res: http.ServerResponse) {
  for (const [k, v] of Object.entries(CORS_HEADERS)) res.setHeader(k, v);
}

async function readBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve(undefined);
      try {
        const ctype = req.headers['content-type'] ?? '';
        if (ctype.includes('application/json')) resolve(JSON.parse(raw));
        else resolve(raw);
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

// 把 Node 原生 res 包成 Vercel-like 接口（只实现 handler 用到的方法）
function wrapRes(res: http.ServerResponse) {
  let statusCode = 200;
  const ext = {
    status(code: number) {
      statusCode = code;
      res.statusCode = code;
      return ext;
    },
    json(data: unknown) {
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.statusCode = statusCode;
      }
      res.end(JSON.stringify(data));
      return ext;
    },
    end(payload?: string) {
      res.end(payload);
      return ext;
    },
    setHeader: res.setHeader.bind(res),
    getHeader: res.getHeader.bind(res),
  };
  return ext;
}

const server = http.createServer(async (req, res) => {
  setCORS(res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  const pathname = url.pathname;

  let body: unknown = undefined;
  if (req.method === 'POST') {
    try {
      body = await readBody(req);
    } catch (e: any) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'INVALID_BODY', message: e?.message ?? 'parse failed' }));
      return;
    }
  }

  // 模拟 VercelRequest：附加 body / query
  const reqShim = Object.assign(req, {
    body,
    query: Object.fromEntries(url.searchParams.entries()),
  });
  const resShim = wrapRes(res);

  try {
    if (pathname === '/api/health') {
      await (healthHandler as any)(reqShim, resShim);
      return;
    }
    if (pathname === '/api/analyze') {
      await (analyzeHandler as any)(reqShim, resShim);
      return;
    }
    if (pathname === '/api/plot/v2/node') {
      await (plotV2NodeHandler as any)(reqShim, resShim);
      return;
    }
    // 静态托管缓存目录的 PNG（/cache/v1/story/.../xxx.png）
    if (pathname.startsWith('/cache/')) {
      await serveCache(pathname, res);
      return;
    }
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'NOT_FOUND', path: pathname }));
  } catch (e: any) {
    console.error('[server] handler error:', e);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'INTERNAL_ERROR', message: e?.message ?? String(e) }));
    }
  }
});

async function serveCache(urlPath: string, res: http.ServerResponse) {
  // /cache/<VERSION>/<ns>/<hash>/<scope...>.png
  // 把 URL 路径直接映射到 server/data/cache/<...>
  const rel = decodeURIComponent(urlPath.replace(/^\/cache\//, ''));
  const safe = normalize(rel).replace(/^(\.\.[\\/])+/, '');
  const root = cacheRoot();
  // cacheRoot 已经包含 v1，rel 第一段也是 v1，所以走 ../cache/<rel>
  const fullPath = join(root, '..', safe);
  try {
    const st = await stat(fullPath);
    if (!st.isFile()) { res.statusCode = 404; res.end(); return; }
    const buf = await readFile(fullPath);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.end(buf);
  } catch {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'CACHE_MISS', path: urlPath }));
  }
}

server.listen(PORT, () => {
  console.log(`\n  咔嚓剧场 · 本地 API 服务器`);
  console.log(`  POST http://localhost:${PORT}/api/analyze`);
  console.log(`  POST http://localhost:${PORT}/api/plot/v2/node`);
  console.log(`  GET  http://localhost:${PORT}/api/health`);
  console.log(`  GET  http://localhost:${PORT}/cache/...   (PNG 静态)`);
  console.log(`  CORS 已开 (*)\n`);
});
