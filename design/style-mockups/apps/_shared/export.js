// 导出 PNG + 保存模态 + 分享
// html-to-image 通过 jsdelivr ESM 加载

import * as htmlToImage from 'https://cdn.jsdelivr.net/npm/html-to-image@1.11.13/+esm';

export async function exportNodeToPNG(node, { pixelRatio = 2.5, backgroundColor = '#ffffff' } = {}) {
  // 等图片加载
  const imgs = node.querySelectorAll('img');
  await Promise.all([...imgs].map(img => {
    if (img.complete) return Promise.resolve();
    return new Promise(res => { img.onload = img.onerror = res; });
  }));
  return await htmlToImage.toPng(node, { pixelRatio, backgroundColor, cacheBust: true });
}

// 弹出保存模态（含长按指引 + 下载链接）
// theme: { bg, text, accent, btnBg, btnText }
export function showSaveModal(dataUrl, { theme = {}, title = '诏书成功摹制', hint = '手机请长按图片保存到相册', onClose } = {}) {
  const t = {
    bg: theme.bg || 'rgba(0,0,0,0.85)',
    text: theme.text || '#fff',
    accent: theme.accent || '#e8a55a',
    btnBg: theme.btnBg || '#fff',
    btnText: theme.btnText || '#000',
    closeBg: theme.closeBg || 'rgba(255,255,255,0.15)',
  };
  const backdrop = document.createElement('div');
  backdrop.style.cssText = `position:fixed;inset:0;background:${t.bg};backdrop-filter:blur(6px);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;`;
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
  const close = () => { backdrop.remove(); onClose?.(); };

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = `position:absolute;top:18px;right:18px;width:36px;height:36px;border:0;background:${t.closeBg};color:${t.text};font-size:20px;border-radius:50%;cursor:pointer;line-height:1;`;
  closeBtn.addEventListener('click', close);

  const img = document.createElement('img');
  img.src = dataUrl;
  img.style.cssText = 'max-width:340px;max-height:65vh;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.5);object-fit:contain;';

  const titleEl = document.createElement('div');
  titleEl.textContent = title;
  titleEl.style.cssText = `color:${t.accent};font-size:14px;font-weight:600;margin-top:16px;`;

  const hintEl = document.createElement('div');
  hintEl.innerHTML = hint;
  hintEl.style.cssText = `color:${t.text};opacity:.7;font-size:12px;margin-top:6px;text-align:center;line-height:1.5;`;

  const dlBtn = document.createElement('a');
  dlBtn.href = dataUrl;
  dlBtn.download = `moyu-yushi-${Date.now()}.png`;
  dlBtn.textContent = '⬇ 下载到本地';
  dlBtn.style.cssText = `margin-top:14px;padding:10px 22px;background:${t.btnBg};color:${t.btnText};border-radius:9999px;text-decoration:none;font-size:13px;font-weight:600;`;

  backdrop.append(closeBtn, img, titleEl, hintEl, dlBtn);
  document.body.appendChild(backdrop);
}

export async function copyShareLink() {
  try { await navigator.clipboard.writeText(location.href); return true; }
  catch { return false; }
}
