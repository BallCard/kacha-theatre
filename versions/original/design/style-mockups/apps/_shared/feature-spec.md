# 三套原型 · 功能补齐契约

## 任务背景

原前端（`src/frontend/`）有 4 屏，三套新原型当前只做了 home / loading / report / poster 静态展示。**核心二创编辑器（edit 屏）缺失**，poster 屏也没有真正导出。本次任务：把 edit 屏和真导出补齐。

## 共享模块（已就绪）

```js
import { createStage } from './_shared/sticker-engine.js';
import { exportNodeToPNG, showSaveModal, copyShareLink } from './_shared/export.js';
import { toast } from './_shared/toast.js';
```

### sticker-engine
- `createStage(el, { width, height, bgImageDataURL, handleStyle })` 返回 stage
- `stage.addSticker({ type:'svg'|'image'|'text', svg, imageUrl, text, fontFamily, color, fontSize, x, y, w, h, rotation, locked })`
- 拖动 = 拽 sticker；选中后右下角白圆 = 缩放+旋转，左上角红 × = 删除
- `stage.undo()` / `canUndo()`，最多 20 步
- handleStyle 可以传 `{ stroke, bg, delBg, outline }` 让控制点配色和你的设计风一致

### export
- `exportNodeToPNG(node, { pixelRatio:2.5, backgroundColor })` → dataURL
- `showSaveModal(dataUrl, { theme, title, hint })` 弹大图 + 长按保存提示 + 下载链接

### toast
- `toast('已添加贴纸', { bg, color, accent })`

## 新增的 edit 屏（在原报告屏和海报屏之间）

进入 edit 屏时，**`createStage` + 三类初始贴纸自动入场**：

1. **右上角段位印章**（基于 `level_tier`）：
   - 位置：x ≈ stageWidth - 70, y ≈ 80, 大小 ≈ 120×120, rotation: -12°
   - 内容：SVG 印章，写 `level_tier`（如 "摸鱼大将军"）
   - **风格用本套设计的主色和字体**

2. **左下角分数票据**（基于 `moyu_score`）：
   - 位置：x ≈ 90, y ≈ stageHeight - 80, 大小 ≈ 160×60, rotation: -4°
   - 内容：SVG "摸鱼+87" 票据
   - 同样用本套设计配色

3. **人脸封印**（如果 `face_boxes` 不为空，每个脸盖一个）：
   - 位置：脸框中心点（按 stageWidth/stageHeight 反归一化）
   - 大小：≈ box.w × stageWidth × 1.4
   - 内容："御史封脸印"圆形 SVG（带斜纹）

### 底部 ToolBar 抽屉（3 个 tab）

| Tab | 功能 |
|---|---|
| 🏷️ 贴纸库 | 至少 6 个朱印 SVG（"准奏"/"驳回"/"神游太虚"/"大吉"/"摸鱼有理"/"奉天承运"），点击加到画布中央 |
| ✍️ 文字御批 | 输入框 + 字体选项（楷体/宋体/滑稽体）+ 颜色选项（朱红/金黄/黑墨/皓白/翠绿）→ 加到画布 |
| 👑 封号切换 | 显示 3 个 `title_candidates`，点选切换当前选中的封号（不直接加到画布，记录在 state 里供 poster 屏用） |

抽屉打开时从底部滑上来，再点 tab 或点空白处关闭。Toolbar 左侧另外两个常驻按钮：撤销（disabled when !canUndo）、完成（进入 poster 屏）。

### 顶部 nav
- 返回（带 confirm "确定要返回吗？画布会清空"）
- 中间标题"二创神游御笔"
- 右上小标签显示当前段位 + 选中封号

### 提示条
画布上方一行小字（用 toast 出现也行）："👇 拖动贴纸调位置，右下角控制点拉伸+旋转"

---

## 海报屏（preview）增量需求

把当前的静态海报改成 **真正可导出的长图模板**：

1. 海报顶部包含**编辑屏 canvas 截图**（来自 `exportNodeToPNG(stage.el)`）作为主图
   - 流程：用户在 edit 屏点"完成"时，先 `stage.clearSelection()`，再 `exportNodeToPNG(stage.el)` 拿到 dataURL 存到 state
   - poster 屏顶部直接用 `<img src={capturedPhotoUrl}>` 展示
2. 海报正文：奏折标题 + paragraph + 宜忌 + 封号 + 流水号 + 印章装饰，全部用本套设计配色
3. 底部三个操作按钮：
   - **「制作电子诏书（生成长图）」** → 点击：`exportNodeToPNG(posterNode)` → `showSaveModal(dataUrl, {theme})`
   - **「复制分享链接」** → `copyShareLink()` → 成功 `toast('链接已复制')` 失败 `toast('请手动复制 URL')`
   - **「重审一张」** → confirm 后回到 home

---

## 全局增量

- **toast**：贴纸添加/删除、撤销、导出失败、复制成功，都用 toast 反馈
- **Exporting overlay**：导出 PNG 时全屏黑色半透 + 一个 loading spinner + "御笔著墨中..." 文字（持续到 showSaveModal 弹出再消失）
- **错误兜底**：`analyzeImage` 失败时（其实 api.js 已经自动 fallback 到 sample，但万一），抛错就 toast 提示 + 回到 home

---

## 风格约束

| 套 | sticker handle | save modal theme | toast bg |
|---|---|---|---|
| claude | stroke:#cc785c bg:#fff delBg:#cc785c outline:rgba(204,120,92,.6) | bg:rgba(24,23,21,.9) accent:#e8a55a btnBg:#cc785c btnText:#fff | rgba(24,23,21,.92) + accent:#e8a55a |
| verge | stroke:#3cffd0 bg:#000 delBg:#5200ff outline:#3cffd0 | bg:rgba(19,19,19,.9) accent:#3cffd0 btnBg:#3cffd0 btnText:#000 | #131313 with mint border |
| bugatti | stroke:#fff bg:#000 delBg:#fff(黑×) outline:rgba(255,255,255,.8) | bg:rgba(0,0,0,.95) accent:#fff btnBg:#fff btnText:#000 | rgba(0,0,0,.92) with white border |

## 检验
1. 访问 `http://localhost:4000/<style>.html?mock=1` 跑通 home → loading → **edit（可拖贴纸/加文字/换封号/撤销）** → poster（生成长图弹模态）
2. 真后端模式（不加 `?mock=1`）拍真照片，edit 屏底图应该是用户照片
3. 三类初始贴纸（段位印 / 分数票 / 人脸封）必须自动出现
4. 撤销至少能撤 3 步
5. 导出的长图能下载到本地（点 ⬇ 下载到本地）
