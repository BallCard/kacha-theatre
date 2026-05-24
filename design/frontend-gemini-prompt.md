# 咔嚓剧场 · 前端 Gemini Prompt（小程序风格 H5）

> 用法：把下方 `## 喂给 Gemini 的 Prompt` 整段复制贴到 Gemini，让它一次性生成完整工程。
> 后端 `/analyze` 还没跑通时，Gemini 用文件里的 mock 数据先跑通界面闭环。

---

## 喂给 Gemini 的 Prompt

```
你是一个资深前端工程师。请帮我做一个移动端 H5，视觉风格模仿微信小程序，跑在浏览器里。
项目名：咔嚓剧场。一个"用 AI 给办公室摸鱼照打分 + 改图玩梗"的工具。

# 一、技术栈（强约束）

- Vue 3 + Vite + TypeScript
- TailwindCSS（用于布局和基础样式）
- Konva.js（Canvas 图层 + 贴纸拖拽/缩放/旋转，必装这个，不要自己造轮子）
- html-to-image（导出长图，备选 html2canvas）
- pinia（状态管理，跨页面共享 analyze 结果）
- vue-router（hash 模式，3 个路由）
- 包管理 pnpm
- 不要引入 UI 库（不要 Vant、不要 Element），所有组件自己写，保持小程序简洁风
- 不引入后端，所有 /analyze 请求都用 mock 数据（见下方）

# 二、视觉风格（微信小程序质感）

- 背景：#f6f6f6 灰底
- 卡片：#ffffff 白底 + 12px 圆角 + 极轻阴影 box-shadow: 0 2px 8px rgba(0,0,0,0.04)
- 主色（朱红，来自御史台调性）：#d4222b
- 辅色（米黄）：#f0c869
- 文字主色：#2a2830，次色：#8a8a8a
- 字体：标题 / 称号用「楷体, KaiTi, STKaiti, serif」，正文用「-apple-system, PingFang SC, sans-serif」
- 圆角统一 12px，按钮 24px（pill 形）
- 间距：所有间距用 4 的倍数（4 / 8 / 12 / 16 / 24 / 32）
- 触感反馈：所有可点元素 active 状态有 0.95 缩放
- 设计尺寸：375 × 812（iPhone 13 mini 基准），做好自适应

# 三、3 个页面

## 页面 1：首页（路由 /）

布局自上而下：

1. **顶部状态条**（占位 44px，模仿小程序导航栏）：居中标题"咔嚓剧场"，楷体，朱红色
2. **欢迎卡片**：白色圆角卡，内有：
   - 朱红印章 emoji 风格图标（用 SVG，不要 emoji）
   - 副标题"明代御史 · 当代审稿"
   - 一句话引导："上传一张办公室日常，看你今日是几品摸鱼？"
3. **大按钮 #1**："📸 拍一张审审" — 主色朱红填充，白字
4. **大按钮 #2**："🖼️ 从相册选" — 白底朱红描边，朱红字
5. **底部三段卡片**（功能介绍，仿小程序「服务卡片」样式）：
   - 「AI 评分」"6 档段位，从打工新丁到假寐天尊"
   - 「修图二创」"贴纸 / 文字 / 换称号，亲手加彩"
   - 「一键导出」"竖版长图，发群里就是社交货币"
6. **底部留版权小字**："御史台 · 印 · 甲辰年"

交互：
- 点拍照按钮 → 调 `<input type="file" accept="image/*" capture="environment">` 触发摄像头
- 点相册按钮 → 调 `<input type="file" accept="image/*">`（不带 capture）
- 选完图：进入 loading 态（御史卷轴打开动画 + 文案"御史正在批阅奏折...")
- loading 假装等 3 秒，加载 mock 数据后跳到 /edit

## 页面 2：二创界面（路由 /edit）

这是核心交互页。布局自上而下：

1. **顶部导航栏**（44px）：左侧 ← 返回按钮，居中"二创"标题，右侧"完成"按钮（朱红字）
2. **海报预览区**（占主体，约 60% 高度，白底卡片，圆角 12px，居中显示）

海报内部从上到下：
   - **顶部标题栏**：朱红描边的"▌咔嚓剧场·御史房批复   甲辰年"
   - **段位徽章区**（关键视觉）：
     - 一张段位印章 PNG（从 6 张里按 level_tier 选），居中
     - 印章上叠加大字称号（48px 楷体，等级配色，可由用户切换）
     - 下方小字：「level_tier」段位名
     - 摸鱼指数进度条：底色 #e5e5e5，填充按等级配色，右侧分数数字
   - **图片区**：用户上传的照片，Konva.js Canvas 渲染，用户拖入的贴纸 / 文字也在这层
   - **奏折区**：白底圆角卡，内有：
     - `report.paragraph`（50-80 字楷体）
     - 分隔线
     - 「宜」三项 + 「忌」三项，左右两栏，宜用绿色 / 忌用灰色

3. **底部工具栏**（固定吸底，60px 高）：4 个 tab 图标 + 文字，平均分布：
   - 🏷️ **贴纸**
   - ✏️ **文字**
   - 👑 **称号**
   - ↶ **撤销**

4. **Tab 弹出抽屉**（点击 tab 后从底部滑上来，高度 50%，圆角 24px 顶角）：

   - **贴纸 Tab**：3 行 × 6 列 18 张缩略图 + 顶部 1 张大尺寸"御史封脸大印"。点击 → 在 Canvas 中心位置插入贴纸，自动选中可拖拽
   - **文字 Tab**：
     - 大输入框（占位"输入文字..."）
     - 字体选择：楷 / 宋 / 汉仪滑稽（3 个 chip）
     - 颜色选择：5 个圆点（朱红 / 金黄 / 黑 / 白 / 翠绿）
     - 「添加」按钮 → 把文字气泡插入 Canvas
   - **称号 Tab**：
     - `title_candidates` 数组里 3 个称号横排卡片，每张点击后高亮选中
     - 选中即时替换海报上的大字称号

5. **Canvas 内元素交互**（Konva.js 处理）：
   - 单击选中：周围出现虚线框 + 8 个缩放控制点 + 旋转柄 + 右上角 ❌ 删除按钮
   - 拖拽移动
   - 双指缩放（touch 设备）
   - 单击空白处取消选中
   - 删除按钮点击 → 移除该元素

6. **撤销栈**：保留最近 10 步用户操作（添加 / 删除 / 移动 / 缩放），点 ↶ tab 撤销最近一步

7. **完成按钮**（顶部右侧）：点击 → 跳到 /preview 页

## 页面 3：海报预览 / 导出（路由 /preview）

1. **顶部导航栏**：左侧 ← 返回到 /edit，居中"导出海报"
2. **海报展示**（占主体）：用 html-to-image 把 /edit 的海报区渲染为完整长图，1080×1920 比例缩放显示
3. **底部操作栏**（两个大按钮纵向排列）：
   - 「📥 保存到相册」按钮 — 朱红填充
   - 「🔗 复制分享链接」按钮 — 白底朱红描边
   - 提示文字："iOS 用户请长按图片保存"

# 四、Mock 数据（用于 /analyze 假返回）

文件位置：`src/mock/analyzeResults.ts`

```typescript
export const MOCK_RESULTS = [
  // 高分样例（假寐天尊）
  {
    pose_type: "趴桌型",
    desk_objects: ["半杯冷美式", "青轴键盘", "黑屏显示器"],
    moyu_score: 96,
    level_tier: "假寐天尊",
    title_candidates: ["摸鱼天尊", "玄机帝君", "假寐至尊"],
    report: {
      paragraph: "该员紫微星偏东南三度，未时困乏正盛，案上美式凉透成冰，屏幕已黑如墨，足证神游天外不下半盏茶。当为摸鱼一脉之神品。",
      yi: ["闭目养神", "假装思考", "等下班"],
      ji: ["开周会", "改PPT", "接电话"]
    },
    face_boxes: [{ x: 0.36, y: 0.22, w: 0.20, h: 0.24 }]
  },
  // 中分样例（划水侍郎）
  {
    pose_type: "椅背瘫型",
    desk_objects: ["半凉拿铁", "亮着的双屏", "未审 PPT"],
    moyu_score: 72,
    level_tier: "划水侍郎",
    title_candidates: ["假寐侍郎", "神隐巡按", "走神判官"],
    report: {
      paragraph: "该员紫微南移五度，恰逢申时神游方位，案上拿铁半凉，PPT 标题改之又改未见落笔，魂虽在席而心已远。",
      yi: ["假装翻文档", "刷消息", "续命咖啡"],
      ji: ["改稿", "汇报", "对齐需求"]
    },
    face_boxes: [{ x: 0.40, y: 0.18, w: 0.22, h: 0.26 }]
  },
  // 低分样例（划水学徒）
  {
    pose_type: "假装思考型",
    desk_objects: ["开着的 IDE", "敲过的笔记本", "热咖啡"],
    moyu_score: 35,
    level_tier: "划水学徒",
    title_candidates: ["初窥水道", "假装思考者", "敬业小卒"],
    report: {
      paragraph: "该员紫微入命星位端正，未时尚清醒，案上咖啡温热，键盘留有手温，看似认真实则魂在云端，初窥摸鱼之道。",
      yi: ["看注释", "查文档", "假装在改"],
      ji: ["开会", "拍肩膀", "被点名"]
    },
    face_boxes: []
  }
];

// 上传图片后随机选一条返回，模拟真实 AI 输出的不确定性
export function mockAnalyze(): Promise<typeof MOCK_RESULTS[0]> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(MOCK_RESULTS[Math.floor(Math.random() * MOCK_RESULTS.length)]);
    }, 2500 + Math.random() * 1500); // 2.5-4s 模拟 VLM 延迟
  });
}
```

# 五、段位等级映射表（前端按 level_tier 查）

文件 `src/config/tiers.ts`：

```typescript
export const TIER_CONFIG = {
  "打工新丁":    { range: [0,20],   color: "#9aa1a8", seal: "/stickers/tier_seal_01_xinding.png" },
  "划水学徒":    { range: [21,40],  color: "#3b6fa0", seal: "/stickers/tier_seal_02_xuetu.png" },
  "摸鱼修士":    { range: [41,60],  color: "#3f8c5a", seal: "/stickers/tier_seal_03_xiushi.png" },
  "划水侍郎":    { range: [61,80],  color: "#7a3c8f", seal: "/stickers/tier_seal_04_shilang.png" },
  "摸鱼大将军":  { range: [81,95],  color: "#d4222b", seal: "/stickers/tier_seal_05_dajiangjun.png" },
  "假寐天尊":    { range: [96,100], color: "#d4222b", seal: "/stickers/tier_seal_06_tianzun.png", aura: true }
} as const;
```

`aura: true` 的等级在前端给印章加 CSS 七彩呼吸光晕动画（`@keyframes` 用 hue-rotate + scale 来回）。

# 六、贴纸资源清单

放在 `public/stickers/`：

- `seal_red_01.png` ~ `seal_red_06.png` — 朱红印（用户工具栏）
- `bubble_01.png` ~ `bubble_06.png` — 漫画气泡
- `yellow_tag_01.png` ~ `yellow_tag_06.png` — 便利贴
- `tier_seal_01_xinding.png` ~ `tier_seal_06_tianzun.png` — 段位印章（海报头部）
- `face_seal_big.png` — 御史封脸大印（工具栏置顶）

资源还在生图中，**先用占位图（200×200 灰色色块加文字）让界面跑通**。前端从 `public/stickers/` 读，后期把真图替换上去即可。

# 七、文件结构期望

```
src/
  main.ts
  App.vue
  router/index.ts
  stores/
    poster.ts          # pinia: 当前 analyze 结果 + 用户已添加的贴纸/文字
  pages/
    Home.vue           # 页面1
    Edit.vue           # 页面2
    Preview.vue        # 页面3
  components/
    PosterPreview.vue  # 海报渲染（在 Edit 和 Preview 都用）
    TierBadge.vue      # 段位印章 + 称号 + 进度条组件
    ReportCard.vue     # 奏折卡（paragraph + 宜忌）
    StickerCanvas.vue  # Konva.js 画布层
    ToolBar.vue        # 底部工具栏 + 抽屉
    StickerPicker.vue  # 贴纸 tab 内容
    TextPicker.vue     # 文字 tab 内容
    TitlePicker.vue    # 称号 tab 内容
  config/
    tiers.ts           # 等级映射表
  mock/
    analyzeResults.ts  # mock 数据
  styles/
    main.css           # tailwind import + 全局 CSS
```

# 八、关键交互细节

1. **首页 → 二创 跳转动画**：御史卷轴打开（CSS 横向 scale 动画，2s），中间显示文案"御史正在批阅奏折..."，配毛笔涂写效果（用 CSS clip-path）
2. **段位徽章入场动画**：进入 /edit 时印章从画面外飞入 + 印泥盖下震动效果，假寐天尊额外多 0.5s 光晕呼吸
3. **贴纸添加位置**：默认 Canvas 中心；连续点击同一张贴纸两次时第二张落在第一张右下 +20px（避免重叠不可见）
4. **撤销栈**：每次 Canvas 操作（add/delete/transform end）push 一次 snapshot。最多保留 10 步
5. **导出长图**：用 `html-to-image` 把 `PosterPreview.vue` 整个 DOM 转成 PNG，分辨率 1080×1920。注意要先把 Konva.js 层做一次 toDataURL 转成 img 再合成（直接 DOM 截会丢 canvas 内容，需测试）

# 九、交付要求

- 一份完整可跑的 pnpm 工程，`pnpm install && pnpm dev` 能在 localhost:5173 起服务
- 移动端 H5，PC 浏览器开发者工具切到 iPhone 模拟器看
- 不要后端，所有 analyze 走 mock
- 占位贴纸用灰色色块 + 文件名文字，后续替换不影响功能
- 代码风格：functional + composition API，组件文件 ≤ 200 行
- 提供 README.md 说明启动方式

请开始。
```

---

## 怎么用这份 prompt

### 工作流建议

1. **第一轮**：把上面整段贴给 Gemini，让它产出完整工程脚手架 + 3 个页面骨架 + mock 数据接通。让 Gemini 用 codespace / Vercel preview 或 zip 给你。
2. **第二轮**（针对性）：跑起来后挑细节让它调，例：
   - "海报头部段位徽章太小，把印章直径调到 120px"
   - "工具栏抽屉滑入动画太快，从 200ms 改 400ms 带 ease-out"
   - "假寐天尊光晕动画太花哨，hue-rotate 范围从 360deg 改 60deg"
3. **第三轮**（接真后端）：mock 跑通后，把 `mockAnalyze` 改成真实 fetch `/analyze`。这一步你或后端同学手动接，不交给 Gemini，因为它不知道你后端的 base URL / 鉴权。

### 注意事项

- Gemini 可能漏 Konva.js 的 touch 手势处理（移动端拖拽），如果发现拖不动，反馈："Konva.js Stage 需要 `draggable` 属性 + `Konva.hitOnDragEnabled = true` 才能在 touch 设备上响应"
- 导出长图可能在 iOS Safari 失败，让它加上 fallback："不能直接下载时，把 dataURL 显示在 modal 里让用户长按保存"
- 等级配色对比度：「打工新丁」灰白色在浅米黄底上会糊，让它对每个等级配色单独验证可读性

### 与原 spec 的关系

这份 prompt 直接对应 `docs/superpowers/specs/2026-05-23-kacha-juchang-part1-design.md` §4 + §5 的实现。如果 spec 改了，记得同步改这份 prompt 再去重新喂 Gemini。
