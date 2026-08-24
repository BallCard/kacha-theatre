# ADR-008 · kacha.html 取代 guofeng.html 为主前端

> 日期：2026-05-24
> 状态：✅ 已决
> 决策者：波尔卡德（队长）
> 关联：[ADR-006 · 古风原型转主线前端](./006-古风原型转主线前端.md)（被本 ADR 部分推翻）·
> [ADR-007 · Part 2 v2 重做与示例缓存](./007-Part2-v2重做与示例缓存.md)

## 背景

ADR-006 把 Part 1 主前端从 `src/frontend/` (React) 切到 `design/style-mockups/apps/guofeng.html`，理由是古风视觉气质比"现代 SaaS + 红章"更贴合「咔嚓剧场 · 古代批阅」主题。

5.24 上午继续调 guofeng 时遇到两个具体问题：

1. **首屏元素过密**：竖排标题 + bento 三卡 + 朱印 CTA + 双副按钮 + 卷轴/流苏/角云装饰，812 高度内勉强塞下，但视觉信息过载，"古风"做得有点"庙堂大殿"，离"作品级精致"差一截。
2. **Part 2 没有原生承载**：ADR-007 把 Part 2 v2（1+3+9+27 节点树、主题×画风、入梦/分镜/终幕）落在 `src/frontend/` React 上，但演示如果 Part 1 跑 guofeng、Part 2 跳到 React，体验割裂、URL 跳转、视觉风格不一致，演示流不顺。

期间用 `design/style-mockups/03-bugatti-mobile.html`（结果页 mockup）做了色系实验：从纯黑奢华改成**宣纸米白 #f4ecd8 + 墨黑 #1a1410 + 朱砂红 #b8252a 点睛**，参照美术馆图录的留白克制感。视觉测试通过——比 guofeng 暖红泛滥更轻，比 React 现代风更"古"。

## 决策

**Part 1 + Part 2 演示主前端切换到 `design/style-mockups/apps/kacha.html`**（单 HTML 文件，复用 `_shared/*` JS 模块和 `_assets/*` PNG）。

### 八屏全在一个手机壳里

| # | screen id | 内容 |
|---|---|---|
| 1 | `screen-home` | Brand + 大字标题 + 收件须知卡 + 拍/相册/Demo 三 CTA |
| 2 | `screen-loading` | Part 1 御史批阅，3 帧国画 loading（复用 guofeng 的 scroll/yubi/stamp） |
| 3 | `screen-edit` | 二创工作台：summary 三栏 + stage + 印玺/御批/封号 drawer |
| 4 | `screen-poster` | bugatti 模板渲染的长图（meta/headline/批文卡/stats/宜忌账册/封号印） |
| 5 | `screen-story-intake` | Part 2 入梦：复用 Part 1 上传图 + 主角名 + 主题 5 选 + 画风 3 选 |
| 6 | `screen-story-loading` | Part 2 梦境生成，3 帧白描线稿 loading（新生：`kacha-loading-p2-{1,2,3}.png`） |
| 7 | `screen-story-node` | 分镜配图 + 旁白 + 角色台词 + ABC 三选项 |
| 8 | `screen-story-ending` | 终幕大字 + 朱条裁决卡 + 主角胜负 + 重玩/连环画/回奏折 |

### `guofeng.html` 处理

- **保留**可跑状态。作为风格演化对照、回退兜底。新功能不再往 guofeng 上叠。
- 不删，不重命名。`design/style-mockups/03-bugatti-mobile.html` 同样保留为结果页 mockup 参照。

### `src/frontend/` (React Part 2 v2) 处理

- **保留**可跑状态。是 ADR-007 决策的产物，跑同一后端 `/api/plot/v2/node`，可作为 Part 2 的二号实现。
- kacha.html 的 Part 2 直接 fetch 同一后端，与 React 版本前端**对等**，不互相依赖。
- 后端代码与缓存全部复用，无须分叉。

## 为什么换 kacha

| 维度 | kacha.html | guofeng.html | src/frontend (React) |
|---|---|---|---|
| 视觉气质 | ✅ 宣纸米白 + 墨黑 + 朱砂，美术馆图录调 | ⚠️ 暖黄红 + 卷轴流苏，"大殿"重 | ❌ 现代 SaaS + 偶尔红章 |
| Part 1 闭环 | ✅ 上传→评分→二创→长图 | ✅ 同 | ✅ 同 |
| Part 2 闭环 | ✅ 同前端同视觉跑 4 层节点 + 终幕 + 连环画 | ❌ 无 | ✅ 跑得通但视觉割裂 |
| 演示连贯 | ✅ 单页内 8 屏切换，无路由跳转 | ⚠️ Part 2 要跳走 | ⚠️ 与 Part 1 视觉割裂 |
| 维护成本 | 低（单 HTML，~1700 行，无构建） | 低 | 中（React 工程） |
| 资源复用 | ✅ 全部 `_assets/*.png` 和 `_shared/*.js` | ✅ 同 | ⚠️ 内嵌 SVG 为主 |

**关键决定性因素**：演示连贯性。25 小时盘子里只剩半天，演示流必须能从拍照到入梦看终幕一气呵成，不切窗口不切风格。

## 后端契约（kacha 已对接）

| Endpoint | 方法 | 用途 |
|---|---|---|
| `/api/health` | GET | 健康检查 |
| `/api/analyze` | POST | Part 1：图 → 评分/段位/签型/宜忌/批文/封号候选 |
| `/api/plot/v2/node` | POST | Part 2：pathKey ∈ {root, A, A.B, A.B.C} → 节点旁白+图+选项或终幕 |
| `/cache/*` | GET | 节点图静态资源 |

`design/style-mockups/apps/dev-server.mjs` 已配置 `/api/*` 和 `/cache/*` 都反代到 `:3001`。

## 回退路径

- **kacha 出问题** → URL 改为 `/guofeng.html`，Part 2 跳 `src/frontend` 的 `:5173/play`
- **后端挂** → `?mock=1` 进 demo 模式（`_shared/api.js` 内置），Part 2 节点无 demo 兜底，会卡 loading

## 状态变更

- ADR-006 状态由"✅ 已决"改为"⚠️ 已被 ADR-008 部分推翻"（guofeng 仍保留作为兜底，但不再是主线）
- 本 ADR 不影响 ADR-002（技术栈）、ADR-005（品牌迁移）、ADR-007（Part 2 v2）
