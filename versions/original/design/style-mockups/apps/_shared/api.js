// 共享 API 封装 —— 三套原型都用这个
// 真实后端契约见 docs/api-contract.md
//   - POST /api/analyze  body: { image: "data:image/...;base64,..." }
//   - 200 返回 AnalyzeResult
// 行为：URL 加 ?mock=1 走本地样本；fetch 失败也自动回退到样本。

const SAMPLE_URL = '_shared/sample.json';

let _sampleCache = null;
async function loadSample() {
  if (_sampleCache) return _sampleCache;
  const r = await fetch(SAMPLE_URL);
  _sampleCache = await r.json();
  return _sampleCache;
}

export async function analyzeImage(dataUrl, { timeoutMs = 20000 } = {}) {
  const params = new URLSearchParams(location.search);
  const forceMock = params.has('mock') || params.has('offline');
  if (forceMock) {
    await new Promise(r => setTimeout(r, 600));
    return loadSample();
  }
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUrl }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`analyze failed ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[api] real backend failed, falling back to sample:', err);
    return loadSample();
  }
}

// 给一张占位 demo 图（不走相机/相册）：返回一个 dataURL（黑色 1x1）
// 真实测试请上传办公室照片
export function makeDemoImageDataURL() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#3d3d3a';
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = '#e8a55a';
  ctx.fillRect(20, 20, 24, 24);
  return c.toDataURL('image/jpeg', 0.9);
}
