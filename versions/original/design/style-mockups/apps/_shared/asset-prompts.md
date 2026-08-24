# 古风版 · UI 资源生成提示词

> 所有资产存放路径：`design/style-mockups/apps/_assets/`
> 命名规则：见每项「文件名」
> 风格锚：朱砂红 `#c8161d` / 米黄宣纸 `#f5e8c8` / 墨黑 `#1a1612` / 楷体宋体 / 印泥糊化、明清官印、写意水墨
> 推荐工具：即梦 / 可灵 / 豆包 / Midjourney / DALL-E 3 / SD（SDXL+lora 古风模型最佳）

---

## P0 印章类（核心视觉，反复出现）

### 1. 六枚固定朱印（贴纸库）

**用途**：edit 屏底部"印玺"抽屉里的 6 枚可选印章
**尺寸**：每张 512×512 PNG，**透明背景**
**文件名**：`seal-zhunzou.png` / `seal-bohui.png` / `seal-shenyou.png` / `seal-daji.png` / `seal-moyu.png` / `seal-fengtian.png`

**中文 prompt（豆包/即梦/可灵）**：
```
明清官印朱砂大印，印面写"准奏"二字，魏碑楷体阳刻，朱砂红 #c8161d，印泥糊化边缘斑驳，方形外框，正面平视，背景纯透明，写实质感，4:1 比例像真印章盖在白纸上脱开的瞬间，无阴影
```
依次替换印面文字为：`准奏 / 驳回 / 神游太虚 / 大吉 / 摸鱼有理 / 奉天承运`

**英文 prompt（Midjourney/DALL-E）**：
```
Ming-Qing dynasty official Chinese vermilion seal stamp, square shape, the seal face engraves "准奏" in Wei-stele kaishu calligraphy, raised relief carving, cinnabar red #c8161d ink, ink-paste blurring at edges, slightly uneven impression, transparent background, photorealistic top-down view, isolated, no shadow, 1:1 ratio --niji --no border
```
变体提示：印面文字 + 形状轮流（方/圆/圆角方/双线方/椭圆）

**质量要点**：
- 务必带"印泥糊化"质感，不能是纯色填充
- 4 字印字距适中、不要被切到
- 透明背景一定要干净，不能带白色 halo

---

### 2. 六档段位印章（自动盖在右上角）

**用途**：edit 屏初始自动入场，写当前 `level_tier`
**尺寸**：每张 600×600 PNG，**透明背景**
**文件名**：`tier-1-dagongxinding.png` / `tier-2-huashui.png` / `tier-3-moyu-xiushi.png` / `tier-4-huashui-shilang.png` / `tier-5-moyu-dajiangjun.png` / `tier-6-jiamei-tianzun.png`

**中文 prompt**：
```
明清御史朱砂大印，正方形带双层边框（外粗内细虚线），印面竖排两列楷体阳刻"摸鱼 大将军"四字，朱砂红 #c8161d，印泥不均带破损感，左上和右下微微脱色，透明背景，俯视正面，无阴影
```
依次替换四字：`打工新丁 / 划水学徒 / 摸鱼修士 / 划水侍郎 / 摸鱼大将军 / 假寐天尊`

**英文 prompt**：
```
Imperial censor's vermilion seal, square with double border (outer solid thick, inner dashed thin), face shows 4 Chinese characters "摸鱼大将军" in two vertical columns kaishu engraved style, cinnabar red, uneven ink with partial fading top-left and bottom-right, transparent background, frontal flat view, no drop shadow
```

---

### 3. 分数票券（左下角自动盖入）

**用途**：edit 屏自动入场，写"摸鱼 +87 厘"
**尺寸**：800×280 PNG，**透明背景**
**文件名**：`score-ticket-template.png`（运行时叠数字）或直接生成定版 `score-87.png` 等

**中文 prompt**：
```
古代驿站腰牌票券，木质米黄色 #f5e8c8 底，朱红边框双线，顶部刻"摸鱼"二字楷体，中间留空（手工合成数字），底部小字"厘"，左右两端各一小铜钉，背景透明，俯视平铺，朱砂印泥盖章感
```

**英文 prompt**：
```
Ancient Chinese horizontal name-tag plaque, aged ivory bamboo/wood texture, cinnabar red double border, "摸鱼" kaishu at top, blank middle (for number overlay), small "厘" at bottom, two brass rivets, transparent background, top-down view, slight ink stamp texture
```

---

### 4. 人脸封印

**用途**：检测到人脸自动盖
**尺寸**：512×512 PNG，**透明背景**
**文件名**：`face-seal.png`

**中文 prompt**：
```
圆形朱砂大印，外圈双线"御史封脸"楷体环绕（顺时针，4 字均分），中心一个篆体"封"字，朱砂红 #c8161d，印泥糊化，透明背景，俯视
```

**英文 prompt**：
```
Circular Chinese cinnabar seal, outer ring with 4 kaishu characters "御史封脸" arranged clockwise, center single seal-script character "封", cinnabar red, blurred ink edges, transparent, top-down
```

---

### 5. 封号印（海报右下角）

**用途**：poster 屏右下角，叠 `title_candidates` 的选中项
**尺寸**：500×500 PNG，**透明背景**
**文件名**：`title-stamp-template.png`

**中文 prompt**：
```
圆形朱砂封号印，外双圈，内空白以填 4 字封号，外圈底部弧形小字"御史房印"楷体，朱砂红 #c8161d，印泥效果，倾斜 -8 度的盖章瞬间，透明背景
```

---

## P1 框架装饰

### 6. 木轴卷轴（上下两根）

**用途**：手机外框上下边缘的卷轴，所有屏都有
**尺寸**：上 700×60，下 700×60，**透明背景**
**文件名**：`scroll-rod-top.png` / `scroll-rod-bot.png`（或一张通用 `scroll-rod.png`）

**中文 prompt**：
```
古代卷轴的木轴横放，深胡桃木材质带年轮，两端各一个朱红色锥形铜帽（漆器质感），中间圆柱木杆带细微反光，整体水平方向，写实质感，透明背景，俯视，长宽比 12:1
```

**英文 prompt**：
```
Ancient Chinese scroll wooden rod, horizontal, dark walnut wood with subtle grain, both ends capped with crimson red lacquered conical caps with brass rings, slight specular highlight along the rod, photorealistic, transparent background, top-down isometric, 12:1 aspect ratio
```

**质量要点**：
- 两端的红色帽帽要清晰
- 木纹要细但不能太花
- 透明背景，导出后可直接 CSS `background-image` 平铺横向

---

### 7. 流苏穗子（左右各一对，共 2 张镜像）

**用途**：卷轴下垂的流苏装饰
**尺寸**：120×320 PNG，**透明背景**
**文件名**：`tassel-left.png` / `tassel-right.png`

**中文 prompt**：
```
古代红色丝绸流苏穗子，顶端有金色编结圆球，下方垂直丝线穗散开，朱红色 #c8161d 主色配少量金色丝，绳结精细写实，单根垂直悬挂，透明背景
```

**英文 prompt**：
```
Traditional Chinese red silk tassel, top with golden braided knot sphere, hanging vertical silk threads spreading downward, crimson red with subtle gold strands, intricate knot detail, photorealistic, single vertical hanging, transparent background
```

---

## P2 背景纹理

### 8. 紫禁城水墨水印

**用途**：海报底纹（淡淡的紫禁城轮廓）
**尺寸**：1200×800 PNG，**透明背景**
**文件名**：`forbidden-city-watermark.png`

**中文 prompt**：
```
写意水墨画，紫禁城远景轮廓，包括太和殿屋顶、左右偏殿、城墙、宫门，极简笔触，单色深褐 #5a4838，浅淡的没骨笔法，不要任何上色或细节，只剩剪影意境，透明背景，水平构图
```

**英文 prompt**：
```
Minimalist Chinese ink painting, Forbidden City silhouette, central main hall with curved roof, side halls, city wall, gates, monochrome dark brown #5a4838, light brush strokes, no color or detail, just silhouette suggestion, transparent background, horizontal composition
```

CSS 用法：`opacity: 0.07; mix-blend-mode: multiply`

---

### 9. 宣纸底纹（可选）

**用途**：取代当前 CSS 粒子点，做真正的宣纸质感底
**尺寸**：1500×2000 JPG（**不透明，平铺**）
**文件名**：`xuanzhi-bg.jpg`

**中文 prompt**：
```
旧宣纸特写，米黄色 #f5e8c8 底，自然纤维纹路，微微的褐色斑点和水渍，边缘略有破损起翘，没有任何文字图案，纯素纸张材质，俯视近距离拍摄，自然光，4:5 比例
```

**英文 prompt**：
```
Aged Chinese rice paper close-up texture, warm ivory #f5e8c8 background, natural fibrous grain, subtle brown spots and water stains, slight torn edges, no text or pattern, pure paper material, top-down macro shot, natural lighting, 4:5
```

---

## P3 主 CTA

### 10. 首页"拍一张审审"印章按钮

**用途**：home 屏中央大圆 CTA
**尺寸**：500×500 PNG，**透明背景**
**文件名**：`cta-shoot-stamp.png`

**中文 prompt**：
```
古代大型朱砂圆印，正圆形带粗双线外框，印面竖排四字楷体阳刻"拍一张审审"，朱砂红 #c8161d，印泥糊化边缘，中间略糊但字仍清晰，倾斜 -8 度，盖章瞬间感，透明背景，俯视
```

**英文 prompt**：
```
Large round Chinese cinnabar seal stamp, thick double border, face engraves 5 characters "拍一张审审" vertically in kaishu, cinnabar red, slightly smudged ink-paste impression, tilted -8 degrees, just-stamped moment feel, transparent background, top-down
```

---

### 11. 加载页 · 御笔批阅插画

**用途**：loading 屏中心装饰
**尺寸**：800×800 PNG，**透明背景**
**文件名**：`loading-yubi.png`

**中文 prompt**：
```
单色水墨插画，一支毛笔从右上方斜下，笔尖朱砂红 #c8161d 蘸饱了墨即将落到卷轴上，卷轴部分展开露出"摸鱼"二字未写完，墨色 #1a1612 衬线笔触，写意国画风格，透明背景，正方形构图
```

**英文 prompt**：
```
Monochrome Chinese ink illustration, a calligraphy brush descending from upper-right with cinnabar red ink dripping onto a half-unrolled scroll showing partial "摸鱼" characters, dark ink strokes, traditional xieyi guohua style, transparent background, square composition
```

---

## 命名规约

把所有产出的 PNG 丢到这个目录：
```
design/style-mockups/apps/_assets/
├── seal-zhunzou.png
├── seal-bohui.png
├── seal-shenyou.png
├── seal-daji.png
├── seal-moyu.png
├── seal-fengtian.png
├── tier-1-dagongxinding.png   (打工新丁)
├── tier-2-huashui-xuetu.png   (划水学徒)
├── tier-3-moyu-xiushi.png     (摸鱼修士)
├── tier-4-huashui-shilang.png (划水侍郎)
├── tier-5-moyu-dajiangjun.png (摸鱼大将军)
├── tier-6-jiamei-tianzun.png  (假寐天尊)
├── score-ticket-template.png  (留空数字位)
├── face-seal.png
├── title-stamp-template.png   (留空 4 字位)
├── scroll-rod-top.png
├── scroll-rod-bot.png
├── tassel-left.png
├── tassel-right.png
├── forbidden-city-watermark.png
├── xuanzhi-bg.jpg
├── cta-shoot-stamp.png
└── loading-yubi.png
```

产出后告诉我，我把代码里对应的 CSS gradient / SVG 替换成 `<img src>`，并保证透明背景对接、尺寸 + 旋转 + 角度都对得上。

---

## 测试建议

**先做这 3 张验风格**，看一致性再批量出：
1. `seal-zhunzou.png`（最常用）
2. `tier-5-moyu-dajiangjun.png`（4 字段位印）
3. `scroll-rod-top.png`（决定整页氛围）

这三张定调了，剩下的按相同 style anchor 批量出。
