# 抖音 AI 创变者计划 2026 · 杭州站 · 摸鱼御史

> 队长：波尔卡德
> 团队：4 人
> 比赛时间：2026.05.23 09:00 - 2026.05.24 18:30
> 开发时长：25 小时
> **赛道：赛道四 · 视觉搜索**
> **作品：摸鱼御史（MVP v2.1 — Part 1 单图体验 + Part 2 互动剧情）**

## 项目状态

**当前阶段**：MVP v2.1 设计定稿（Part 1 + Part 2），Part 1 已部分开工

- [x] 文档系统搭建
- [x] Git 初始化
- [x] 赛道选择 → **赛道四**
- [x] 创意确定 → **摸鱼御史**
- [x] MVP v2 范围锁定（Part 1 单图体验）
- [x] **MVP v2.1 范围扩展（Part 2 互动剧情增量）**
- [x] 技术栈选择 → Vue 3 + Konva.js / Node BFF / 豆包 vision-pro + 文本 LLM
- [x] Part 1 设计文档定稿（[摸鱼御史-design.md](./docs/superpowers/specs/2026-05-23-摸鱼御史-design.md)）
- [x] Part 2 设计文档定稿（[摸鱼御史-part2-剧情游戏.md](./docs/superpowers/specs/2026-05-23-摸鱼御史-part2-剧情游戏.md)）
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

**一句话**：上传一张办公室日常照，AI 用搞怪御史调性打摸鱼分（0-100）、起段位称号、写运势奏折；用户先在贴纸库里二创出海报，再点「召见御史·演今日剧」进入 5 节点互动剧情，6 种结局之一收尾，最后导出一张连环画长图。

### Part 1 · 单图体验（< 60s）

上传 → AI 审阅（VLM 单次调用）→ 出海报（朱红印章 + 等级徽章 + 大字称号 + 奏折）→ 修图二创（拖贴纸 / 加文字 / 切称号）→ 导出竖版长图

**段位系统**：6 档（打工新丁 / 划水学徒 / 摸鱼修士 / 划水侍郎 / 摸鱼大将军 / **假寐天尊**），各档独立配色 + 印章样式，假寐天尊带七彩光晕。

### Part 2 · 互动剧情（< 90s）

奏折页点 CTA → 5 节点剧情（辰/午前/未/申/酉）→ 每节点 3 选项（顺应天命 / 逆天而行 / 中立观望）→ 宜忌真生效（今日宜对应选项稳过，今日忌对应选项必翻车）→ 6 结局之一 → 御史房裁决书 + 连环画长图导出

**6 种结局**：天降祥瑞 / 御史降罚 / 逆天改命 / 贵人相助 / 天命应验 / 哭笑不得

**详见**：[Part 1 设计](./docs/superpowers/specs/2026-05-23-摸鱼御史-design.md) | [Part 2 设计](./docs/superpowers/specs/2026-05-23-摸鱼御史-part2-剧情游戏.md)

## 快速导航

### 核心文档
- **[Part 1 设计文档](./docs/superpowers/specs/2026-05-23-摸鱼御史-design.md)** — 单图体验完整设计（14 章）
- **[Part 2 设计文档](./docs/superpowers/specs/2026-05-23-摸鱼御史-part2-剧情游戏.md)** — 5 节点互动剧情完整设计（11 章）
- **[CLAUDE.md](./CLAUDE.md)** — 比赛背景、评审标准、文档更新规则
- **[团队信息](./docs/team.md)** — 成员分工
- **[API契约](./docs/api-contract.md)** — 前后端接口（含 /plot/next、/plot/ending）

### 设计资源
- **[贴纸生图 prompt](./design/sticker-prompts.md)** — 25 张资产的提示词
- **[前端 Gemini prompt](./design/frontend-gemini-prompt.md)** — 喂给 Gemini 一键产出工程脚手架
- **[提案 pitch](./design/pitch.html)** — 队内对齐用
- **[方案展示](./design/方案展示.html)** — 演示版

### 决策与记录
- **[ADR-001 赛道选择](./docs/decisions/001-赛道选择.md)** — ✅ 已决（赛道四）
- **[ADR-002 技术栈](./docs/decisions/002-技术栈选择.md)** — ✅ 已决
- **[ADR-003 MVP 范围](./docs/decisions/003-MVP-范围.md)** — ✅ 已决（Part 1 单图体验）
- **[ADR-004 Part 2 增量](./docs/decisions/004-Part2-剧情游戏增量.md)** — ✅ 已决（5 节点互动剧情）
- **[开发日志](./docs/devlog/)** — 每 4-6 小时更新
- **[队友需求归档](./docs/requirements/)** — 咔嚓剧场需求文档原稿

## 技术栈

| 层 | 选型 | 理由 |
|---|---|---|
| 前端框架 | Vue 3 + Vite + TypeScript | 开发快、组件清晰 |
| 样式 | TailwindCSS（不用 UI 库） | 小程序简洁风、零包袱 |
| Canvas | Konva.js | 拖拽 / 缩放 / 旋转手势封装好 |
| 导出 | html-to-image | 转 PNG 长图 |
| 后端 | Node.js BFF（Express / Vercel Serverless） | 只做 /analyze 代理 |
| VLM | 豆包 vision-pro（备选 GPT-4o） | 中文调性 + 字节生态 + JSON 稳定 |
| 部署 | Vercel | push 即部署 |
| 兜底 | `?offline=1` 走纯前端预录 JSON | 现场断网 / VLM 抽风保命 |

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
- **AI 是编剧不是辅助**：VLM 一次往返同时输出评分、段位、3 个候选称号、玄学奏折
- **用户做二创**：AI 不自动盖贴纸，所有视觉元素由用户从工具栏拖入
- **不识别人脸身份**：主角由用户上传动作隐式声明，规避隐私雷区
- **演示前必须有 offline fallback**

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
│   │   └── 2026-05-23-摸鱼御史-design.md  # MVP v2 设计文档（权威）
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
