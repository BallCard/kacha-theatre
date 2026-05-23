# 抖音 AI 创变者计划 2026 · 杭州站 · 摸鱼御史

> 队长：波尔卡德
> 团队：4 人
> 比赛时间：2026.05.23 09:00 - 2026.05.24 18:30
> 开发时长：25 小时
> **赛道：赛道四 · 视觉搜索**
> **作品：摸鱼御史（MVP v2）**

## 项目状态

**当前阶段**：MVP 设计定稿，准备进入开发

- [x] 文档系统搭建
- [x] Git 初始化
- [x] 赛道选择 → **赛道四**
- [x] 创意确定 → **摸鱼御史**
- [x] MVP 范围锁定 → 单图体验（连载叙事降级至 P2）
- [x] 技术栈选择 → Vue 3 + Konva.js / Node BFF / 豆包 vision-pro
- [x] 设计文档定稿（[2026-05-23-摸鱼御史-design.md](./docs/superpowers/specs/2026-05-23-摸鱼御史-design.md)）
- [x] 素材生图 prompt 就绪（[sticker-prompts.md](./design/sticker-prompts.md)）
- [x] 前端生成 prompt 就绪（[frontend-gemini-prompt.md](./design/frontend-gemini-prompt.md)）
- [ ] 25 张贴纸资源生成（提示词已就绪，用户在跑）
- [ ] 前端工程脚手架（已交付 prompt 给 Gemini）
- [ ] 后端 /analyze 接口
- [ ] Prompt 工程调试
- [ ] 联调 + 兜底素材
- [ ] 演示物料

## 作品速览

**一句话**：上传一张办公室日常照（摸鱼 / 出丑 / 沙雕瞬间），AI 用搞怪御史调性打摸鱼分（0-100）、起段位称号、写运势奏折；用户在自带贴纸库里拖拖拽拽做二创，导出一张带"段位徽章"的海报到朋友圈。

**核心闭环（< 60s）**：上传 → AI 审阅（VLM 单次调用）→ 出海报（朱红印章 + 等级徽章 + 大字称号 + 奏折）→ 修图二创（拖贴纸 / 加文字 / 切称号）→ 导出竖版长图

**段位系统**：6 档（打工新丁 / 划水学徒 / 摸鱼修士 / 划水侍郎 / 摸鱼大将军 / **假寐天尊**），各档独立配色 + 印章样式，假寐天尊带七彩光晕，是 demo 现场视觉爆点。

**详见**：[设计文档](./docs/superpowers/specs/2026-05-23-摸鱼御史-design.md)

## 快速导航

### 核心文档
- **[设计文档](./docs/superpowers/specs/2026-05-23-摸鱼御史-design.md)** — MVP v2 完整设计（14 章）
- **[CLAUDE.md](./CLAUDE.md)** — 比赛背景、评审标准、文档更新规则
- **[团队信息](./docs/team.md)** — 成员分工
- **[API契约](./docs/api-contract.md)** — 前后端接口

### 设计资源
- **[贴纸生图 prompt](./design/sticker-prompts.md)** — 25 张资产的提示词
- **[前端 Gemini prompt](./design/frontend-gemini-prompt.md)** — 喂给 Gemini 一键产出工程脚手架
- **[提案 pitch](./design/pitch.html)** — 队内对齐用
- **[方案展示](./design/方案展示.html)** — 演示版

### 决策与记录
- **[ADR-001 赛道选择](./docs/decisions/001-赛道选择.md)** — ✅ 已决（赛道四）
- **[ADR-002 技术栈](./docs/decisions/002-技术栈选择.md)** — ✅ 已决
- **[ADR-003 MVP 范围](./docs/decisions/003-MVP-范围.md)** — ✅ 已决（连载叙事降级至 P2）
- **[开发日志](./docs/devlog/)** — 每 4-6 小时更新

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

**最后更新**：2026-05-23（MVP v2 设计定稿）
**下次更新**：前端脚手架到位 / 后端接口跑通 / 联调通过
