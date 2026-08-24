// 共享 sticker 引擎 — 纯 DOM 拖拽 / 旋转 / 缩放 / 撤销，不依赖任何框架
//
// 用法：
//   import { createStage } from './_shared/sticker-engine.js';
//   const stage = createStage(stageEl, { width: 375, height: 500, bgImageDataURL });
//   const id = stage.addSticker({
//     type: 'svg' | 'image' | 'text',
//     svg, imageUrl, text, fontFamily, color, fontSize,
//     x, y, w, h, rotation,
//     locked: false  // true = 不可选不可删（背景层）
//   });
//   stage.setOnSelect(item => ...);   // 选中变化回调（用于刷新 toolbar）
//   stage.setOnChange(items => ...);  // 列表变化回调
//   stage.undo();
//   stage.canUndo();
//   stage.getItems();
//
// 选中时角点出现一个白色 handle（拖动 = 同时缩放+旋转），左上角出现红色 × 删除。

let nextId = 1;

export function createStage(el, opts = {}) {
  const width = opts.width || 375;
  const height = opts.height || 500;
  const handleStyle = opts.handleStyle || { stroke: '#000', bg: '#fff', delBg: '#d4222b', outline: 'rgba(0,0,0,0.6)' };

  el.style.position = 'relative';
  el.style.width = width + 'px';
  el.style.height = height + 'px';
  el.style.overflow = 'hidden';
  el.style.userSelect = 'none';
  el.style.touchAction = 'none';

  const bg = document.createElement('img');
  bg.alt = '';
  bg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;display:block;';
  if (opts.bgImageDataURL) bg.src = opts.bgImageDataURL;
  el.appendChild(bg);

  const style = document.createElement('style');
  style.textContent = `
    .sticker { position:absolute; left:0; top:0; transform-origin:center center; cursor:move; touch-action:none; }
    .sticker.selected { outline: 1.5px dashed ${handleStyle.outline}; outline-offset: 4px; }
    .sticker .sticker-handle, .sticker .sticker-delete { display:none; }
    .sticker.selected .sticker-handle { display:block; }
    .sticker.selected .sticker-delete { display:flex; }
    .sticker.locked { cursor:default; }
  `;
  el.appendChild(style);

  const items = [];
  let selectedId = null;
  let onChange = () => {};
  let onSelect = () => {};
  const history = [snapshot()];

  function snapshot() {
    return items.map(i => ({ id: i.id, x: i.x, y: i.y, w: i.w, h: i.h, rotation: i.rotation, data: i.data, locked: i.locked }));
  }
  function pushHistory() {
    history.push(snapshot());
    if (history.length > 20) history.shift();
  }

  el.addEventListener('pointerdown', (e) => {
    if (e.target === el || e.target === bg) selectItem(null);
  });

  function selectItem(id) {
    selectedId = id;
    items.forEach(i => i.el.classList.toggle('selected', i.id === id));
    onSelect(id ? items.find(i => i.id === id) : null);
  }

  function applyTransform(item) {
    item.el.style.transform = `translate(-50%,-50%) translate(${item.x}px, ${item.y}px) rotate(${item.rotation}deg)`;
    item.el.style.width = item.w + 'px';
    item.el.style.height = item.h + 'px';
  }

  function makeContent(opt) {
    if (opt.type === 'svg') {
      const c = document.createElement('div');
      c.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;pointer-events:none;';
      c.innerHTML = opt.svg || '';
      const svg = c.querySelector('svg');
      if (svg) { svg.style.width = '100%'; svg.style.height = '100%'; svg.removeAttribute('width'); svg.removeAttribute('height'); }
      return c;
    }
    if (opt.type === 'image') {
      const img = document.createElement('img');
      img.src = opt.imageUrl;
      img.crossOrigin = 'anonymous';
      img.style.cssText = 'width:100%;height:100%;object-fit:contain;pointer-events:none;';
      return img;
    }
    // text
    const t = document.createElement('div');
    t.textContent = opt.text || '';
    t.style.cssText = `width:100%;height:100%;display:flex;align-items:center;justify-content:center;white-space:nowrap;pointer-events:none;font-family:${opt.fontFamily || 'serif'};color:${opt.color || '#d4222b'};font-size:${opt.fontSize || 24}px;font-weight:${opt.fontWeight || 700};letter-spacing:${opt.letterSpacing || 'normal'};text-shadow:${opt.textShadow || 'none'};`;
    return t;
  }

  function addSticker(opt) {
    const id = nextId++;
    const wrap = document.createElement('div');
    wrap.className = 'sticker' + (opt.locked ? ' locked' : '');
    wrap.dataset.id = id;

    wrap.appendChild(makeContent(opt));

    const handle = document.createElement('div');
    handle.className = 'sticker-handle';
    handle.style.cssText = `position:absolute;right:-10px;bottom:-10px;width:20px;height:20px;background:${handleStyle.bg};border:2px solid ${handleStyle.stroke};border-radius:50%;cursor:nwse-resize;touch-action:none;`;
    wrap.appendChild(handle);

    const delBtn = document.createElement('div');
    delBtn.className = 'sticker-delete';
    delBtn.textContent = '×';
    delBtn.style.cssText = `position:absolute;left:-12px;top:-12px;width:22px;height:22px;background:${handleStyle.delBg};color:#fff;border-radius:50%;align-items:center;justify-content:center;font-family:sans-serif;font-weight:bold;font-size:16px;cursor:pointer;touch-action:none;`;
    wrap.appendChild(delBtn);

    el.appendChild(wrap);

    const item = {
      id, el: wrap, locked: !!opt.locked,
      x: opt.x ?? width / 2,
      y: opt.y ?? height / 2,
      w: opt.w ?? 100,
      h: opt.h ?? 100,
      rotation: opt.rotation ?? 0,
      data: { ...opt }
    };
    items.push(item);
    applyTransform(item);

    if (!opt.locked) {
      wrap.addEventListener('pointerdown', (e) => {
        if (e.target === handle || e.target === delBtn) return;
        e.stopPropagation();
        selectItem(id);
        // bring to front
        el.appendChild(wrap);
        const startX = e.clientX, startY = e.clientY;
        const origX = item.x, origY = item.y;
        wrap.setPointerCapture(e.pointerId);
        const onMove = (ev) => {
          item.x = origX + (ev.clientX - startX);
          item.y = origY + (ev.clientY - startY);
          applyTransform(item);
        };
        const onUp = () => {
          wrap.removeEventListener('pointermove', onMove);
          wrap.removeEventListener('pointerup', onUp);
          wrap.removeEventListener('pointercancel', onUp);
          pushHistory(); onChange(snapshot());
        };
        wrap.addEventListener('pointermove', onMove);
        wrap.addEventListener('pointerup', onUp);
        wrap.addEventListener('pointercancel', onUp);
      });

      handle.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        const rect = wrap.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const startDist = Math.hypot(e.clientX - cx, e.clientY - cy);
        const startAng = Math.atan2(e.clientY - cy, e.clientX - cx);
        const origW = item.w, origH = item.h, origRot = item.rotation;
        handle.setPointerCapture(e.pointerId);
        const onMove = (ev) => {
          const dist = Math.hypot(ev.clientX - cx, ev.clientY - cy);
          const ang = Math.atan2(ev.clientY - cy, ev.clientX - cx);
          const scale = Math.max(0.3, dist / Math.max(1, startDist));
          item.w = Math.max(24, origW * scale);
          item.h = Math.max(24, origH * scale);
          item.rotation = origRot + (ang - startAng) * 180 / Math.PI;
          applyTransform(item);
        };
        const onUp = () => {
          handle.removeEventListener('pointermove', onMove);
          handle.removeEventListener('pointerup', onUp);
          handle.removeEventListener('pointercancel', onUp);
          pushHistory(); onChange(snapshot());
        };
        handle.addEventListener('pointermove', onMove);
        handle.addEventListener('pointerup', onUp);
        handle.addEventListener('pointercancel', onUp);
      });

      delBtn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        removeSticker(id);
      });
    }

    pushHistory();
    onChange(snapshot());
    return id;
  }

  function removeSticker(id) {
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return;
    items[idx].el.remove();
    items.splice(idx, 1);
    if (selectedId === id) selectItem(null);
    pushHistory();
    onChange(snapshot());
  }

  function clearAll() {
    items.forEach(i => i.el.remove());
    items.length = 0;
    selectItem(null);
    pushHistory();
    onChange(snapshot());
  }

  function rebuildFromSnapshot(snap) {
    items.forEach(i => i.el.remove());
    items.length = 0;
    snap.forEach(s => {
      const opt = { ...s.data, x: s.x, y: s.y, w: s.w, h: s.h, rotation: s.rotation, locked: s.locked };
      addSticker(opt);
    });
    // 不再 pushHistory（避免循环）；最后一帧已经在外层管理
  }

  function undo() {
    if (history.length <= 1) return false;
    history.pop();
    const prev = history[history.length - 1];
    // 临时禁用 push 的方式：清空再添加，不触发 pushHistory
    items.forEach(i => i.el.remove());
    items.length = 0;
    prev.forEach(s => {
      const opt = { ...s.data, x: s.x, y: s.y, w: s.w, h: s.h, rotation: s.rotation, locked: s.locked };
      const id = nextId++;
      const wrap = document.createElement('div');
      wrap.className = 'sticker' + (opt.locked ? ' locked' : '');
      wrap.appendChild(makeContent(opt));
      const handle = document.createElement('div');
      handle.className = 'sticker-handle';
      handle.style.cssText = `position:absolute;right:-10px;bottom:-10px;width:20px;height:20px;background:${handleStyle.bg};border:2px solid ${handleStyle.stroke};border-radius:50%;cursor:nwse-resize;touch-action:none;`;
      wrap.appendChild(handle);
      const delBtn = document.createElement('div');
      delBtn.className = 'sticker-delete';
      delBtn.textContent = '×';
      delBtn.style.cssText = `position:absolute;left:-12px;top:-12px;width:22px;height:22px;background:${handleStyle.delBg};color:#fff;border-radius:50%;align-items:center;justify-content:center;font-family:sans-serif;font-weight:bold;font-size:16px;cursor:pointer;touch-action:none;`;
      wrap.appendChild(delBtn);
      el.appendChild(wrap);
      const item = { id, el: wrap, locked: !!opt.locked, x: opt.x, y: opt.y, w: opt.w, h: opt.h, rotation: opt.rotation, data: opt };
      items.push(item);
      applyTransform(item);
      // 重新挂事件
      if (!opt.locked) attachItemEvents(item, wrap, handle, delBtn);
    });
    selectItem(null);
    onChange(snapshot());
    return true;
  }

  function attachItemEvents(item, wrap, handle, delBtn) {
    wrap.addEventListener('pointerdown', (e) => {
      if (e.target === handle || e.target === delBtn) return;
      e.stopPropagation();
      selectItem(item.id);
      el.appendChild(wrap);
      const startX = e.clientX, startY = e.clientY;
      const origX = item.x, origY = item.y;
      wrap.setPointerCapture(e.pointerId);
      const onMove = (ev) => { item.x = origX + (ev.clientX - startX); item.y = origY + (ev.clientY - startY); applyTransform(item); };
      const onUp = () => {
        wrap.removeEventListener('pointermove', onMove);
        wrap.removeEventListener('pointerup', onUp);
        wrap.removeEventListener('pointercancel', onUp);
        pushHistory(); onChange(snapshot());
      };
      wrap.addEventListener('pointermove', onMove);
      wrap.addEventListener('pointerup', onUp);
      wrap.addEventListener('pointercancel', onUp);
    });
    handle.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      const rect = wrap.getBoundingClientRect();
      const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
      const startDist = Math.hypot(e.clientX - cx, e.clientY - cy);
      const startAng = Math.atan2(e.clientY - cy, e.clientX - cx);
      const origW = item.w, origH = item.h, origRot = item.rotation;
      handle.setPointerCapture(e.pointerId);
      const onMove = (ev) => {
        const dist = Math.hypot(ev.clientX - cx, ev.clientY - cy);
        const ang = Math.atan2(ev.clientY - cy, ev.clientX - cx);
        const scale = Math.max(0.3, dist / Math.max(1, startDist));
        item.w = Math.max(24, origW * scale); item.h = Math.max(24, origH * scale);
        item.rotation = origRot + (ang - startAng) * 180 / Math.PI;
        applyTransform(item);
      };
      const onUp = () => {
        handle.removeEventListener('pointermove', onMove);
        handle.removeEventListener('pointerup', onUp);
        handle.removeEventListener('pointercancel', onUp);
        pushHistory(); onChange(snapshot());
      };
      handle.addEventListener('pointermove', onMove);
      handle.addEventListener('pointerup', onUp);
      handle.addEventListener('pointercancel', onUp);
    });
    delBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); removeSticker(item.id); });
  }

  function setBackground(dataURL) {
    bg.src = dataURL;
  }

  return {
    addSticker, removeSticker, clearAll, undo, setBackground,
    setOnChange(fn) { onChange = fn; },
    setOnSelect(fn) { onSelect = fn; },
    clearSelection() { selectItem(null); },
    getItems: snapshot,
    canUndo: () => history.length > 1,
    el,
  };
}
