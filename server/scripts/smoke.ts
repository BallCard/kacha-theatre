// 不启 vercel dev 的本地冒烟：直接 import handler，构造 mock req/res。
// 验证：
//   1) /health 200 ok
//   2) /analyze 缺 image → 400
//   3) /analyze 任意图（无 key）→ 走 VLM 失败 → 返回 fallback (200)
import healthHandler from '../api/health.js';
import analyzeHandler from '../api/analyze.js';

type Res = {
  status: (n: number) => Res;
  json: (b: unknown) => void;
  end: () => void;
  _status?: number;
  _body?: unknown;
};

function mockRes(): Res {
  const r: Res = {
    status(n) { r._status = n; return r; },
    json(b)   { r._body = b; },
    end()     { /* noop */ },
  };
  return r;
}

async function main() {
  // 1. /health
  const r1 = mockRes();
  (healthHandler as any)({ method: 'GET' }, r1);
  console.log('health:', r1._status, JSON.stringify(r1._body));

  // 2. /analyze missing image
  const r2 = mockRes();
  await (analyzeHandler as any)({ method: 'POST', body: {} }, r2);
  console.log('analyze missing image:', r2._status, JSON.stringify(r2._body));

  // 3. /analyze with tiny fake image → VLM 没 key → fallback
  const r3 = mockRes();
  await (analyzeHandler as any)(
    { method: 'POST', body: { image: 'data:image/jpeg;base64,SGVsbG8=' } },
    r3,
  );
  console.log('analyze fallback path:', r3._status, 'has level_tier?', (r3._body as any)?.level_tier);
}

main().catch((e) => { console.error(e); process.exit(1); });
