// 批量生成古风版 UI 资源
// 模型: gemini-3-pro-image-preview，4 并发，自动重试 1 次
// 用法: node gen-batch.mjs

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(__dirname, '..', '_assets');
const KEY = (await readFile(join(__dirname, '.env'), 'utf-8')).match(/VECTRUST_API_KEY=(\S+)/)?.[1];
const BASE = 'https://api.openai-next.com/v1';
const MODEL = 'gemini-3-pro-image-preview';
const CONCURRENCY = 4;
const SKIP_EXISTING = process.env.SKIP_EXISTING !== '0'; // 已存在的跳过，重生时 SKIP_EXISTING=0

await mkdir(ASSETS_DIR, { recursive: true });

const STYLE = '俯视平面构图，**整张图片背景为纯 #00FF00 亮绿色 chroma-key 绿幕** —— 绿色必须是均匀单一的 RGB(0,255,0)、不要任何渐变 / 阴影 / 噪点 / 光晕 / 纹理，主体（印章 / 卷轴 / 流苏 / 插画）必须带 2-3 像素清晰白色描边把自己和绿幕分隔开（这样后续抠图能干净分离）。主体本身禁止出现绿色像素。写实质感，无阴影投影';
const SEAL_BASE = '明清官印朱砂大印，朱砂红 #c8161d，印泥糊化边缘斑驳不均，魏碑楷体阳刻，' + STYLE;

const ASSETS = [
  // ===== P0 六枚固定朱印 =====
  { file: 'seal-zhunzou.png',   prompt: SEAL_BASE + '。正方形印面外框带粗双线，印面正中写"准奏"二字' },
  { file: 'seal-bohui.png',     prompt: SEAL_BASE + '。正方形外框带单线，印面斜对角一条淡淡的破损划痕，正中写"驳回"二字' },
  { file: 'seal-shenyou.png',   prompt: SEAL_BASE + '。圆形外框带双线（外粗内虚线），印面分上下两行"神游/太虚"四字楷体' },
  { file: 'seal-daji.png',      prompt: SEAL_BASE + '。椭圆形外框圆润，印面正中"大吉"二字楷体' },
  { file: 'seal-moyu.png',      prompt: SEAL_BASE + '。圆角方形外框带双线，印面分上下两行"摸鱼/有理"四字楷体，底部小字"御史房"' },
  { file: 'seal-fengtian.png',  prompt: SEAL_BASE + '。正方形外框带粗实线，印面分四格："奉天"在左上，"承运"在左下，"摸鱼"在右上，"特诏"在右下，竖中线分隔' },

  // ===== P0 六档段位印 =====
  { file: 'tier-1-dagongxinding.png',    prompt: SEAL_BASE + '。正方形大印带双层外框（外粗实，内细虚），印面竖排两列楷体阳刻"打工新丁"四字' },
  { file: 'tier-2-huashui-xuetu.png',    prompt: SEAL_BASE + '。正方形大印带双层外框（外粗实，内细虚），印面竖排两列楷体阳刻"划水学徒"四字' },
  { file: 'tier-3-moyu-xiushi.png',      prompt: SEAL_BASE + '。正方形大印带双层外框（外粗实，内细虚），印面竖排两列楷体阳刻"摸鱼修士"四字' },
  { file: 'tier-4-huashui-shilang.png',  prompt: SEAL_BASE + '。正方形大印带双层外框（外粗实，内细虚），印面竖排两列楷体阳刻"划水侍郎"四字' },
  { file: 'tier-5-moyu-dajiangjun.png',  prompt: SEAL_BASE + '。正方形大印带双层外框（外粗实，内细虚），印面竖排两列楷体阳刻"摸鱼大将军"五字' },
  { file: 'tier-6-jiamei-tianzun.png',   prompt: SEAL_BASE + '。正方形大印带双层外框（外粗实，内细虚），印面竖排两列楷体阳刻"假寐天尊"四字' },

  // ===== P0 模板类 =====
  {
    file: 'score-ticket-template.png',
    prompt: '古代驿站腰牌票券，木质米黄色 #f5e8c8 底，朱红 #c8161d 双线外框，顶部刻"摸鱼"二字楷体，中间留大块空白用于后续叠加数字，底部小字"厘"楷体，左右两端各一颗小铜钉装饰。整张图片背景为纯 #00FF00 亮绿色 chroma-key 绿幕，主体周围 2-3 像素白描边分离。横向长方形，写实质感',
    size: '1024x1024',
  },
  {
    file: 'face-seal.png',
    prompt: '圆形朱砂大印 #c8161d，外圈双线带"御史封脸"四字楷体顺时针环绕排列，圆心一个大号篆体"封"字，印泥糊化边缘斑驳。整张图片背景为纯 #00FF00 亮绿色 chroma-key 绿幕，印章周围 2-3 像素白描边分离，俯视，写实',
  },
  {
    file: 'title-stamp-template.png',
    prompt: '圆形朱砂封号印 #c8161d，外圈双层细线，圆心留大块完整空白用于后续叠加四字封号，外圈底部弧形小字"御史房印"楷体，印泥糊化效果，倾斜约 -8 度的盖章瞬间。整张图片背景为纯 #00FF00 亮绿色 chroma-key 绿幕，印章周围 2-3 像素白描边分离，俯视',
  },

  // ===== P1 框架装饰 =====
  {
    file: 'scroll-rod-top.png',
    prompt: '古代卷轴的木轴横放图，深胡桃木材质带年轮细纹，两端各一个朱红色 #c8161d 锥形铜帽（漆器质感带光泽），中间圆柱木杆有细微反光，水平方向，写实质感。整张图片背景为纯 #00FF00 亮绿色 chroma-key 绿幕，木轴周围 2-3 像素白描边分离，俯视，长宽比约 12:1',
  },
  {
    file: 'scroll-rod-bot.png',
    prompt: '古代卷轴的木轴横放图（底端版本，与顶端配对），深胡桃木材质带年轮细纹，两端各一个朱红色 #c8161d 锥形铜帽（漆器质感带光泽），中间圆柱木杆有细微反光，水平方向，写实质感。整张图片背景为纯 #00FF00 亮绿色 chroma-key 绿幕，木轴周围 2-3 像素白描边分离，俯视，长宽比约 12:1',
  },
  {
    file: 'tassel-left.png',
    prompt: '古代红色丝绸流苏穗子，顶端为金色 #b89545 编结圆球（中国结），下方垂直丝线穗散开，朱红色 #c8161d 主色配少量金色丝，绳结精细写实，单根垂直悬挂。整张图片背景为纯 #00FF00 亮绿色 chroma-key 绿幕，穗子周围 2-3 像素白描边分离',
  },
  {
    file: 'tassel-right.png',
    prompt: '古代红色丝绸流苏穗子（与左侧配对镜像版本），顶端为金色 #b89545 编结圆球，下方垂直丝线穗散开，朱红色 #c8161d 主色配少量金色丝，绳结精细写实，单根垂直悬挂。整张图片背景为纯 #00FF00 亮绿色 chroma-key 绿幕，穗子周围 2-3 像素白描边分离',
  },

  // ===== P2 背景纹理 =====
  {
    file: 'forbidden-city-watermark.png',
    prompt: '极简水墨画，紫禁城远景轮廓剪影，包括太和殿屋顶飞檐、左右偏殿、城墙、午门，没骨笔法极简笔触，单色深褐色 #5a4838，浅淡如水印，无任何色彩或细节填充，只剩剪影意境。整张图片背景为纯 #00FF00 亮绿色 chroma-key 绿幕，水墨建筑周围 2-3 像素白描边分离，水平宽幅构图',
  },

  // ===== P3 主 CTA =====
  {
    file: 'cta-shoot-stamp.png',
    prompt: '大型圆形朱砂印章，正圆形带粗双线外框，印面正中楷体阳刻"御览"两字（横向并排，单字占满印面约 70% 高度，笔画粗壮饱满），朱砂红 #c8161d，印泥糊化边缘斑驳，倾斜约 -8 度的盖章瞬间感。**印章主体外的所有像素必须是 RGB(0,255,0) 纯绿**，不允许任何接近黑色或灰色的反光、阴影或环境色，印章边缘必须有 2-3 像素连续闭合的白色描边把朱印和绿幕清晰分隔，俯视',
  },
  {
    file: 'loading-yubi.png',
    prompt: '单色水墨插画，一支毛笔从右上方斜下，笔尖朱砂红 #c8161d 蘸饱了浓墨，墨液即将滴落到部分展开的米黄卷轴上，卷轴显示"摸鱼"二字楷体未写完。墨色 #1a1612 写意笔触，传统国画风格。整张图片背景为纯 #00FF00 亮绿色 chroma-key 绿幕，画面主体周围 2-3 像素白描边分离，正方形构图',
  },
  {
    file: 'loading-scroll.png',
    prompt: '半展开的米黄色 #f5e8c8 卷轴铺在画面中央水平展开，两端各一根深胡桃木轴带朱红 #c8161d 锥形铜帽，卷轴上方一颗硕大朱砂红 #c8161d 墨滴正从空中下坠（带细长拖尾），墨滴正下方对应卷轴位置有一小片墨晕扩散。写意国画风，墨色 #1a1612。整张图片背景为纯 #00FF00 亮绿色 chroma-key 绿幕，画面主体周围 2-3 像素白描边分离，正方形构图',
  },
  {
    file: 'loading-stamp.png',
    prompt: '一枚朱砂大印从右上方向下俯冲盖章的瞬间，印面圆形朱砂红 #c8161d 带双线外框，印面正中楷体"印"字，印章倾斜约 -15 度仿佛即将砸落，印章下方一小片米黄色 #f5e8c8 卷轴一角露出，印章周围溅起几滴小小的朱砂墨星，带轻微动势线。写意国画风。整张图片背景为纯 #00FF00 亮绿色 chroma-key 绿幕，画面主体周围 2-3 像素白描边分离，正方形构图',
  },
];

console.log(`[batch] ${ASSETS.length} assets · model=${MODEL} · concurrency=${CONCURRENCY}`);
console.log(`[batch] dir = ${ASSETS_DIR}`);
if (!KEY) { console.error('[err] no VECTRUST_API_KEY in .env'); process.exit(1); }

async function genOne(asset, attempt = 1) {
  const fp = join(ASSETS_DIR, asset.file);
  if (SKIP_EXISTING && existsSync(fp)) {
    console.log(`⊘ ${asset.file} skip (exists)`);
    return { file: asset.file, ok: true, skipped: true };
  }
  const t0 = Date.now();
  try {
    const r = await fetch(`${BASE}/images/generations`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt: asset.prompt,
        size: asset.size || '1024x1024',
        n: 1,
      }),
    });
    if (!r.ok) throw new Error(`${r.status}: ${(await r.text()).slice(0,160)}`);
    const j = await r.json();
    let buf;
    if (j.data?.[0]?.b64_json) buf = Buffer.from(j.data[0].b64_json, 'base64');
    else if (j.data?.[0]?.url) buf = Buffer.from(await (await fetch(j.data[0].url)).arrayBuffer());
    else throw new Error('unknown response shape');
    await writeFile(fp, buf);
    const dt = ((Date.now() - t0)/1000).toFixed(1);
    console.log(`✓ ${asset.file} ${dt}s ${(buf.length/1024).toFixed(0)}KB`);
    return { file: asset.file, ok: true };
  } catch (err) {
    const dt = ((Date.now() - t0)/1000).toFixed(1);
    if (attempt < 2) {
      console.warn(`× ${asset.file} ${dt}s [${err.message.slice(0,60)}] → retry`);
      await new Promise(r => setTimeout(r, 4000));
      return genOne(asset, attempt + 1);
    }
    console.error(`✗ ${asset.file} ${dt}s FAILED: ${err.message}`);
    return { file: asset.file, ok: false, err: err.message };
  }
}

// 并发限制器
async function runWithLimit(items, limit, fn) {
  const results = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      results[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return results;
}

const T0 = Date.now();
const results = await runWithLimit(ASSETS, CONCURRENCY, genOne);
const dt = ((Date.now() - T0)/1000).toFixed(1);
const ok = results.filter(r => r?.ok).length;
const skipped = results.filter(r => r?.skipped).length;
const failed = results.filter(r => r && !r.ok);
console.log(`\n[done] ${dt}s · OK=${ok}/${ASSETS.length}（含已跳过 ${skipped}）· failed=${failed.length}`);
if (failed.length) {
  console.log('failed list:');
  failed.forEach(r => console.log(`  - ${r.file}: ${r.err}`));
  console.log('\n重生失败的：SKIP_EXISTING=0 node gen-batch.mjs（会全量覆盖），或者手动删掉失败的 png 再跑（只补缺失的）');
}
