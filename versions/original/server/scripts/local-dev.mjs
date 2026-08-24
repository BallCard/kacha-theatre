// 本地 HTTP 服务（不走 vercel dev），把 api/*.ts 作为 handler 挂上去
// 用法：cd server && node --import tsx scripts/local-dev.mjs
import { createServer } from 'node:http';
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env') });

const { default: analyze } = await import('../api/analyze.ts');
const { default: health } = await import('../api/health.ts');

const PORT = Number(process.env.PORT || 3000);

function makeRes(res) {
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(JSON.stringify(obj));
    return res;
  };
  return res;
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve(undefined);
      try { resolve(JSON.parse(raw)); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  makeRes(res);

  try {
    if (url.pathname === '/api/health') {
      return health(req, res);
    }
    if (url.pathname === '/api/analyze') {
      try { req.body = await readBody(req); } catch { res.status(400).json({ error: 'INVALID_JSON' }); return; }
      return analyze(req, res);
    }
    res.status(404).json({ error: 'NOT_FOUND', path: url.pathname });
  } catch (err) {
    console.error('[handler-err]', err);
    if (!res.headersSent) res.status(500).json({ error: 'INTERNAL', message: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`[local-dev] http://localhost:${PORT}  (api/health, api/analyze)`);
});
