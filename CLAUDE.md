# CLAUDE.md

本仓库的 AI 协作约定。固定资料请走下方路由表，不在本文展开。

## 项目身份

**摸鱼御史** · 赛道四（视觉搜索）· 黑客松 25h 极限开发。当前阶段、作品形态、进度看 [README.md](./README.md)。

## 文档路由

| 想找什么 | 看哪份 |
|---|---|
| 项目状态、作品速览、技术栈一句话 | [README.md](./README.md) |
| 赛题介绍 / 评审标准 / 时间表 / 交付物 / 赛事建议 | [docs/requirements/赛题与评审标准.md](./docs/requirements/赛题与评审标准.md) |
| 已落地决策（赛道、技术栈、MVP 范围、Part2 增量） | [docs/decisions/](./docs/decisions/) |
| Part 1 / Part 2 设计稿 | [docs/superpowers/specs/](./docs/superpowers/specs/) |
| API 契约 | [docs/api-contract.md](./docs/api-contract.md) |
| 团队分工 / 协作规范 | [docs/team.md](./docs/team.md) · [docs/collaboration.md](./docs/collaboration.md) |
| 开发日志 | [docs/devlog/](./docs/devlog/) |
| 设计资源（贴纸 prompt、海报、线框） | [design/](./design/) |
| 文档系统总览 | [docs/GUIDE.md](./docs/GUIDE.md) |

## 文档更新职责（AI 主动）

主动识别关键节点并更新对应文档，不等用户明确要求。

| 事件 | 更新位置 |
|---|---|
| 重大决策（功能取舍、技术换型、方向调整） | 新建 `docs/decisions/00x-*.md` + 当日 devlog |
| 完成核心功能 / 解决重大技术难题 / 集成测试通过 | 当日 `docs/devlog/YYYY-MM-DD-时段.md` |
| API 新增或变更 | `docs/api-contract.md`（更新后口头提醒用户） |
| 海报、作品提交、项目状态变化 | `README.md` 状态区 |
| 比赛结束 | `docs/retrospective.md` |

**更新原则**：① 主动识别 ② 及时（事后立刻写，不补） ③ 简洁，不写流水账 ④ 用表/列表 ⑤ 决策必含「为什么」 ⑥ 更新完简短告知用户。

**不需要更新**：纯代码实现、临时调试、普通 commit、小 bug 修复。

## Git 协作

- 远程：https://github.com/BallCard/dy-creator-hackathon-2026（私有）
- 分支：`main`（稳定可演示，队长合并）/ `dev`（日常集成）/ `feature/*`（个人）
- 命名：`feature/功能名` 或 `fix/问题描述`
- 提交：`[模块] 简短描述`
- 流程：feature → PR/直合 dev → 稳定后入 main
