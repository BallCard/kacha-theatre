// 极简 toast 浮层
let container;
function ensure() {
  if (container) return container;
  container = document.createElement('div');
  container.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:99999;pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:8px;';
  document.body.appendChild(container);
  const style = document.createElement('style');
  style.textContent = `
    @keyframes toast-in { from { opacity:0; transform: translateY(-12px) scale(.96); } to { opacity:1; transform: translateY(0) scale(1); } }
  `;
  document.head.appendChild(style);
  return container;
}
export function toast(message, { bg = 'rgba(20,20,20,.92)', color = '#fff', accent, duration = 2200 } = {}) {
  ensure();
  const el = document.createElement('div');
  el.style.cssText = `padding:10px 20px;background:${bg};color:${color};border-radius:9999px;font-size:13px;font-weight:500;box-shadow:0 10px 30px rgba(0,0,0,.3);pointer-events:auto;animation:toast-in .18s ease;${accent ? `border:1px solid ${accent};` : ''}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'all .2s ease';
    el.style.opacity = '0';
    el.style.transform = 'translateY(-8px)';
    setTimeout(() => el.remove(), 200);
  }, duration);
}
