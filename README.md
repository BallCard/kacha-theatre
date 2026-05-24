# 抖音 AI 创变者计划 2026 · 杭州站 · 咔嚓剧场

> 队长：波尔卡德
> 团队：4 人
> 比赛时间：2026.05.23 09:00 - 2026.05.24 18:30
> 开发时长：25 小时
> **赛道：赛道四 · 视觉搜索**
> **作品：咔嚓剧场（Part 1 摸鱼主题运势卡片 + Part 2 古风互动剧情，MVP v2.1）**

## 项目状态

**当前阶段**：MVP v2.1 设计定稿（Part 1 + Part 2），Part 1 已部分开工

- [x] 文档系统搭建
- [x] Git 初始化
- [x] 赛道选择 → **赛道四**
- [x] 创意确定 → **咔嚓剧场**（首期主题：摸鱼 / 古代批阅氛围）
- [x] MVP v2 范围锁定（Part 1 运势卡片）
- [x] **MVP v2.1 范围扩展（Part 2 互动剧情增量）**
- [x] 对标新需求文档（[ADR-005](./docs/decisions/005-咔嚓剧场对标新需求文档.md)）
- [x] 技术栈选择 → **主前端 kacha.html · bugatti 米白朱砂风 · Part 1+Part 2 一体八屏**（[ADR-008](./docs/decisions/008-kacha-取代-guofeng-为主前端.md)）；旧 guofeng 古风原型保留兜底（[ADR-006](./docs/decisions/006-古风原型转主线前端.md)），src/frontend (React) 作 Part 2 v2 二号实现；本地 Node 服务器 (主 `gemini-2.5-flash-nothinking`，兜底 `gpt-4.1-mini`) + 局域网展示，弃 Vercel
- [x] Part 1 设计文档定稿（[part1-design.md](./docs/superpowers/specs/2026-05-23-kacha-juchang-part1-design.md)）
- [x] Part 2 设计文档定稿（[part2-design.md](./docs/superpowers/specs/2026-05-23-kacha-juchang-part2-design.md)）
- [x] 素材生图 prompt 就绪（[sticker-prompts.md](./design/sticker-prompts.md)）
- [x] 前端生成 prompt 就绪（[frontend-gemini-prompt.md](./design/frontend-gemini-prompt.md)）
- [ ] 25 张贴纸资源生成
- [ ] 前端工程脚手架（Part 1 已交付 Gemini）
- [ ] 后端 /analyze 接口（Part 1）
- [ ] 后端 /plot/next + /plot/ending 接口（Part 2）
- [ ] Prompt 工程调试
- [ ] 联调 + 兜底素材
- [ ] 演示物料

## 作品速览

**一句话**：上传一张办公室日常照，Part 1 用古代批阅口吻打"摸鱼分"（0-100）、起段位称号、写运势奏折并出可分享卡片；用户在贴纸库里二创出海报后点「召见御史·演今日剧」进入 Part 2 — 同一张照片承接 5 节点互动剧情，6 种结局之一收尾，导出一张连环画长图。

### Part 1 · 运势卡片（< 60s）

上传 → AI 审阅（VLM 单次调用）→ 出卡片（朱红印章 + 等级徽章 + 大字称号 + 奏折批文 + **AI 自动叠 1-2 个相关贴纸**）→ 用户二创（拖更多贴纸 / 加文字 / 切称号 / 删改 AI 默认贴纸）→ 导出竖版长图

**段位系统**：6 档（打工新丁 / 划水学徒 / 摸鱼修士 / 划水侍郎 / 摸鱼大将军 / **假寐天尊**），各档独立配色 + 印章样式，假寐天尊带七彩光晕。
**签型系统**：5 档（下下签 / 下签 / 中签 / 上签 / 上上签），由摸鱼分按段映射。

### Part 2 · 互动剧情（< 90s）

奏折页点 CTA → 5 节点剧情（辰/午前/未/申/酉）→ 每节点 3 选项（顺应天命 / 逆天而行 / 中立观望）→ 宜忌真生效（今日宜对应选项稳过，今日忌对应选项必翻车）→ 6 结局之一 → 御史房裁决书 + 连环画长图导出。**叙事承接 Part 1 上传的同一张照片场景；文风维持古风一致**（与 Part 1 视觉语言统一，[ADR-005](./docs/decisions/005-咔嚓剧场对标新需求文档.md) 已明确否决"现代口语化"方向）。

**6 种结局**：天降祥瑞 / 御史降罚 / 逆天改命 / 贵人相助 / 天命应验 / 哭笑不得

**详见**：[Part 1 设计](./docs/superpowers/specs/2026-05-23-kacha-juchang-part1-design.md) | [Part 2 设计](./docs/superpowers/specs/2026-05-23-kacha-juchang-part2-design.md)

## 快速导航

### 核心文档
- **[Part 1 设计文档](./docs/superpowers/specs/2026-05-23-kacha-juchang-part1-design.md)** — 运势卡片完整设计（14 章）
- **[Part 2 设计文档](./docs/superpowers/specs/2026-05-23-kacha-juchang-part2-design.md)** — 5 节点互动剧情完整设计（11 章）
- **[CLAUDE.md](./CLAUDE.md)** — 项目身份、表述规范、文档更新规则
- **[团队信息](./docs/team.md)** — 成员分工
- **[API契约](./docs/api-contract.md)** — 前后端接口（Part 1 /analyze + Part 2 /plot/next、/plot/ending）

### 设计资源
- **[贴纸生图 prompt](./design/sticker-prompts.md)** — 25 张资产的提示词
- **[前端 Gemini prompt](./design/frontend-gemini-prompt.md)** — 喂给 Gemini 一键产出工程脚手架
- **[提案 pitch](./design/pitch.html)** — 队内对齐用
- **[方案展示](./design/方案展示.html)** — 演示版

### 决策与记录
- **[ADR-001 赛道选择](./docs/decisions/001-赛道选择.md)** — ✅ 已决（赛道四）
- **[ADR-002 技术栈](./docs/decisions/002-技术栈选择.md)** — ✅ 已决
- **[ADR-003 MVP 范围](./docs/decisions/003-MVP-范围.md)** — ✅ 已决（Part 1 运势卡片）
- **[ADR-004 Part 2 增量](./docs/decisions/004-Part2-剧情游戏增量.md)** — ✅ 已决（Part 2 5 节点互动剧情）
- **[ADR-005 对标新需求文档](./docs/decisions/005-咔嚓剧场对标新需求文档.md)** — ✅ 已决（品牌改名 + 4 条偏离点）
- **[开发日志](./docs/devlog/)** — 每 4-6 小时更新
- **[需求归档](./docs/requirements/)** — 咔嚓剧场需求文档与剧情向技术设计文档原稿

## 技术栈

| 层 | 选型 | 理由 |
|---|---|---|
| **Part 1 主线前端** | 古风原型 `design/style-mockups/apps/guofeng.html`（原生 HTML + JS + 小型 sticker-engine） | 视觉真"古代批阅"——卷轴杆 + 朱红印章 + 紫禁城水印 + 楷体批文（[ADR-006](./docs/decisions/006-古风原型转主线前端.md)） |
| **Part 2 前端** | React 19 + Vite + TypeScript（`src/frontend/`） | 5 节点剧情 + 配图 + 长图导出已在 React 版实现，不切 |
| 样式 | TailwindCSS（Part 2）/ 原生 CSS（Part 1 guofeng） | 简洁风、零包袱 |
| Canvas | Konva.js（Part 2）/ 自研 sticker-engine（Part 1） | 拖拽 / 缩放 / 旋转手势 |
| 导出 | html-to-image | 转 PNG 长图 |
| 后端 | 本地 Node HTTP 服务器 `server/local-server.ts`（`npm run dev`，端口 :3001） | 已弃 Vercel，本地跑 + 局域网展示 |
| VLM | OpenAI 兼容中转 · 主 `gemini-2.5-flash-nothinking` · 兜底 `gpt-4.1-mini` | 中转网关统一接入,模型可热切,JSON 稳定 |
| 部署 | 本地 + 局域网（展示时直接放局域网 URL） | 不依赖云部署，赛场断网也能演 |
| 兜底 | `?mock=1` / `?offline=1` 走纯前端预录 JSON | 现场断网 / VLM 抽风保命 |

## 关键时间节点

| 时间 | 事项 |
|---|---|
| 5.23 11:00 | 开发启动 |
| 5.23 22:30 | **硬性截止**：游园会海报 |
| 5.24 01:00 | **死线**：主闭环必须能跑通（含离线兜底） |
| 5.24 12:00 | **硬性截止**：作品提交 |
| 5.24 14:00-17:00 | 游园会现场试玩 |
| 5.24 17:00-18:30 | 闭幕式 |

## 开发原则

- **80 分能演示 > 95 分半成品**
- **AI 是编剧不是辅助**：Part 1 VLM 一次往返同时输出评分、段位、签型、3 个候选称号、玄学奏折；Part 2 5 节点 + 6 结局规则引擎
- **用户做二创（AI 先垫底）**：Part 1 AI 先按识别到的姿态/物品自动盖 1-2 个相关贴纸作为初始构图，用户在此基础上从工具栏继续拖贴纸 / 加文字 / 切称号 / 删改 AI 自动盖的贴纸
- **不识别人脸身份**：主角由用户上传动作隐式声明，规避隐私雷区
- **演示前必须有 offline fallback**
- **表述规范**：所有讨论/文档/commit 必须 Part 1 / Part 2 明确分述（见 [CLAUDE.md](./CLAUDE.md)）

## 目录结构

```
.
├── README.md                          # 本文件
├── CLAUDE.md                          # 比赛背景 + 文档更新规则
├── design/
│   ├── pitch.html                     # 队内提案
│   ├── 方案展示.html
│   ├── sticker-prompts.md             # 25 张生图 prompt
│   ├── frontend-gemini-prompt.md      # Gemini 前端生成 prompt
│   ├── mockups/ wireframes/ poster/
├── docs/
│   ├── superpowers/specs/
│   │   ├── 2026-05-23-kacha-juchang-part1-design.md  # Part 1 设计文档（权威）
│   │   └── 2026-05-23-kacha-juchang-part2-design.md  # Part 2 设计文档（权威）
│   ├── decisions/                     # ADR
│   ├── devlog/                        # 开发日志
│   ├── meetings/                      # 会议记录
│   ├── api-contract.md
│   ├── team.md
│   └── retrospective.md
├── src/                               # 源码（Gemini 产出）
├── scripts/                           # 开发脚本
└── assets/
    ├── stickers/                      # 25 张贴纸 PNG（用户生图后放这里）
    └── demo/                          # 3 张兜底样例图 + JSON
```

---

**最后更新**：2026-05-23（MVP v2.1 — 新增 Part 2 互动剧情增量）
**下次更新**：5.23 晨会全员对齐 / 前端 Part 2 路由搭起 / 后端 /plot/* 接口跑通
