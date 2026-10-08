# 咔嚓剧场原版

- 先读 `../../README.md`：已归档展示；原版与协作版独立，保留来源，不自动重启扩展。
- 主线为 `design/style-mockups/apps/kacha.html`，保持米白朱砂风与 Part 1/2 一体八屏。
- `design/style-mockups/apps/guofeng.html` 留作视觉对照与兜底，`src/frontend/` 留作 Part 2 第二实现。
- 功能、接口、设计、Bug、提交与文档明确标注 Part 1 或 Part 2。
- 品牌统一为「咔嚓剧场」；新增内容不使用「摸鱼御史」作品牌。
- Part 1 为摸鱼主题、古代批阅氛围的运势卡片与用户二创导出；扩主题需记录决策。
- Part 2 承接同一照片与 Part 1 卡片数据，不增加独立另传卡片入口。
- 保持 Part 2 的 5 节点、每节点 3 选项、6 类结局和宜忌概率规则。
- 不识别人脸身份；保留 `?mock=1` / `?offline=1` 演示兜底，不伪装在线结果。
- 需求偏离以 `docs/decisions/005-咔嚓剧场对标新需求文档.md` 为准。
- 主线依据 `docs/decisions/008-kacha-取代-guofeng-为主前端.md`。
- 设计以 `docs/superpowers/specs/` 为准；赛事材料在 `docs/requirements/`，旧日程非待办。
- 重大决策更新 `docs/decisions/` 并写理由；接口变化同步 `docs/api-contract.md`。
- 关键交付或状态变化更新 README；按需要写开发日志，普通实现与小修复不强制写文档。
- 提交格式为 `[模块] 简短描述`；Git 远端和分支以当前仓库为准，不沿用旧比赛仓库。
- 在集合仓库根目录验证 `npm run verify:original`；两版本都改动时运行 `npm run verify`。
- 凭据通过 `.env.example` 配置，不纳入源码；发布、推送另按本次授权处理。
