// 客户端去背景 —— HSV 色键法去 #00FF00 绿幕
//
// 业界标准方案（Philipp Schmid / Google Cloud Medium 等）：
//   生成时让模型用 #00FF00 纯绿幕 + 2-3px 白描边 → 抠图时用 HSV 色空间检测
//   绿色 H ≈ 120°，S > 25%，V > 35% 的像素都视为绿幕
//   边缘 1-2 个像素加 alpha 渐变防锯齿
//
// 比 RGB 角点采样更鲁棒：能扛绿幕的轻微噪点和阴影，且不会误伤主体里"碰巧颜色像角点"的部分。

const cache = new Map();

export function loadCleanImage(url, opts = {}) {
  if (cache.has(url)) return cache.get(url);
  const p = (async () => {
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.crossOrigin = 'anonymous';
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    return removeGreenBg(img, opts);
  })().catch(err => { console.warn('[bg-clean]', url, err.message); return url; });
  cache.set(url, p);
  return p;
}

// 高效 RGB→H（仅算 hue，避免做完整 HSV）
function rgbToH(r, g, b) {
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  const d = max - min;
  if (d === 0) return -1; // 灰色，无色相
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return h;
}

function removeGreenBg(img, opts = {}) {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const id = ctx.getImageData(0, 0, w, h);
  const d = id.data;

  // HSV 检测参数（绿色 chroma key）
  const HUE_CENTER = opts.hue ?? 120;   // 纯绿 = 120°
  const HUE_TOL    = opts.hueTol ?? 50; // ±50° 范围 (70°-170°)
  const SAT_MIN    = opts.satMin ?? 0.25;
  const VAL_MIN    = opts.valMin ?? 0.35;
  const FADE_MIN   = opts.fadeMin ?? 0.55; // 边缘 hue 容忍：在 fade 区间用 alpha 渐变

  let removed = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i+3] === 0) continue;
    const r = d[i], g = d[i+1], b = d[i+2];
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    const v = max / 255;
    const s = max === 0 ? 0 : (max - min) / max;
    if (v < VAL_MIN || s < SAT_MIN) continue; // 灰/白/黑 一律保留
    const hue = rgbToH(r, g, b);
    if (hue < 0) continue;
    const hueDiff = Math.abs(hue - HUE_CENTER);
    if (hueDiff <= HUE_TOL) {
      // 完全绿：扒掉
      d[i+3] = 0;
      removed++;
    } else if (hueDiff <= HUE_TOL * (1 + FADE_MIN)) {
      // 边缘绿晕：alpha 渐变
      const t = (hueDiff - HUE_TOL) / (HUE_TOL * FADE_MIN);
      d[i+3] = Math.round(d[i+3] * t);
    }
  }

  // 第二轮：把绿色像素的 R/G/B 也降一下，免得边缘残留绿晕（despill）
  for (let i = 0; i < d.length; i += 4) {
    if (d[i+3] === 0) continue;
    const r = d[i], g = d[i+1], b = d[i+2];
    // 若 G 显著高于 R 和 B（典型绿溢），把 G 压到 R/B 的平均
    if (g > r + 15 && g > b + 15) {
      d[i+1] = Math.round((r + b) / 2);
    }
  }

  ctx.putImageData(id, 0, 0);
  return canvas.toDataURL('image/png');
}
