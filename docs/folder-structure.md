# 工作文件夹结构规划

## 设计原则

1. **前后端分离**：支持并行开发，减少冲突
2. **模块化**：按功能模块组织，方便分工
3. **快速定位**：目录结构清晰，新人能快速找到文件
4. **灵活适配**：支持多种技术栈选择

## 推荐结构（前后端分离）

```
.
├── README.md                    # 项目总览
├── CLAUDE.md                   # AI开发指南
├── .gitignore                  # Git忽略规则
├── docs/                       # 文档目录
│   ├── collaboration.md        # 协作模式指南
│   ├── folder-structure.md     # 本文件
│   ├── api-contract.md         # API接口契约（重要！）
│   ├── decisions/              # 决策记录
│   ├── devlog/                 # 开发日志
│   └── meetings/               # 会议纪要
│
├── design/                     # 设计资源
│   ├── wireframes/            # 线框图（Figma导出/手绘照片）
│   ├── mockups/               # 视觉稿
│   ├── poster/                # 游园会海报
│   └── assets/                # 设计素材（图标、插图）
│
├── src/                        # 源代码（核心）
│   ├── frontend/              # 前端代码
│   │   ├── public/            # 静态资源
│   │   │   ├── index.html
│   │   │   └── favicon.ico
│   │   ├── src/
│   │   │   ├── pages/         # 页面组件
│   │   │   │   ├── Home.jsx
│   │   │   │   ├── Upload.jsx
│   │   │   │   └── Result.jsx
│   │   │   ├── components/    # 可复用组件
│   │   │   │   ├── VideoPlayer.jsx
│   │   │   │   ├── ImageUploader.jsx
│   │   │   │   └── LoadingSpinner.jsx
│   │   │   ├── hooks/         # 自定义Hooks
│   │   │   │   └── useVideoAnalysis.js
│   │   │   ├── services/      # API调用封装
│   │   │   │   └── api.js
│   │   │   ├── utils/         # 工具函数
│   │   │   │   └── format.js
│   │   │   ├── styles/        # 样式文件
│   │   │   │   └── global.css
│   │   │   ├── App.jsx        # 根组件
│   │   │   └── main.jsx       # 入口文件
│   │   ├── package.json
│   │   ├── vite.config.js     # Vite配置
│   │   └── .env.example       # 环境变量示例
│   │
│   ├── backend/               # 后端代码
│   │   ├── app/
│   │   │   ├── main.py        # 入口文件（FastAPI）
│   │   │   ├── routes/        # 路由（按功能模块）
│   │   │   │   ├── video.py   # 视频相关API
│   │   │   │   ├── image.py   # 图片相关API
│   │   │   │   └── ai.py      # AI能力API
│   │   │   ├── services/      # 业务逻辑
│   │   │   │   ├── video_service.py
│   │   │   │   └── ai_service.py
│   │   │   ├── models/        # 数据模型
│   │   │   │   └── schemas.py
│   │   │   ├── utils/         # 工具函数
│   │   │   │   └── file_handler.py
│   │   │   └── config.py      # 配置管理
│   │   ├── tests/             # 测试（可选）
│   │   ├── requirements.txt   # Python依赖
│   │   └── .env.example       # 环境变量示例
│   │
│   ├── ai/                    # AI集成模块（独立）
│   │   ├── prompts/           # AI提示词模板
│   │   │   ├── video_analysis.txt
│   │   │   └── image_recognition.txt
│   │   ├── adapters/          # AI服务适配器
│   │   │   ├── openai_adapter.py
│   │   │   ├── claude_adapter.py
│   │   │   └── base_adapter.py
│   │   ├── processors/        # 数据预处理
│   │   │   ├── video_processor.py
│   │   │   └── image_processor.py
│   │   ├── config.py          # AI配置
│   │   └── README.md          # AI模块使用说明
│   │
│   └── shared/                # 前后端共享代码
│       ├── types/             # TypeScript类型定义
│       │   └── api.d.ts
│       └── constants/         # 常量定义
│           └── config.js
│
├── data/                       # 数据目录
│   ├── samples/               # 测试样本（图片、视频）
│   ├── mock/                  # Mock数据
│   │   └── api-responses.json
│   └── uploads/               # 用户上传文件（临时）
│
├── scripts/                    # 脚本工具
│   ├── setup.sh               # 环境初始化脚本
│   ├── dev.sh                 # 开发启动脚本
│   └── deploy.sh              # 部署脚本
│
└── assets/                     # 静态资源（全局）
    ├── images/                # 图片资源
    ├── videos/                # 视频资源
    └── fonts/                 # 字体文件
```

## 备选结构（全栈单体）

适用于小团队或使用 Next.js 等全栈框架：

```
src/
├── app/                        # Next.js App Router
│   ├── page.jsx               # 首页
│   ├── upload/
│   │   └── page.jsx
│   ├── api/                   # API路由
│   │   ├── video/
│   │   │   └── route.js
│   │   └── ai/
│   │       └── route.js
│   └── layout.jsx
├── components/                 # 组件
├── lib/                       # 工具库
│   ├── ai/                    # AI集成
│   └── utils/
└── public/                    # 静态资源
```

## 关键文件说明

### 1. API契约文档（必须）

**文件**：`docs/api-contract.md`

**作用**：前后端开发的"宪法"，定义所有接口

**内容示例**：
```markdown
## POST /api/video/analyze

**请求**：
- Content-Type: multipart/form-data
- Body: { video: File }

**响应**：
- 200: { id: string, status: "processing", result: null }
- 400: { error: string }

**Mock数据**：见 data/mock/video-analyze.json
```

### 2. 环境变量示例

**文件**：`.env.example`

**作用**：记录需要的环境变量，不包含真实密钥

**内容示例**：
```env
# AI API
OPENAI_API_KEY=sk-xxx
CLAUDE_API_KEY=sk-ant-xxx

# 后端配置
PORT=3000
DATABASE_URL=sqlite:///./dev.db

# 前端配置
VITE_API_BASE_URL=http://localhost:3000
```

### 3. 快速启动脚本

**文件**：`scripts/dev.sh`

**作用**：一键启动开发环境

**内容示例**：
```bash
#!/bin/bash
# 启动后端
cd src/backend && python -m uvicorn app.main:app --reload &

# 启动前端
cd src/frontend && npm run dev &

echo "🚀 开发环境已启动"
echo "前端: http://localhost:5173"
echo "后端: http://localhost:8000"
```

## 分工映射

### 前端开发者
**主要工作区**：
- `src/frontend/src/pages/` - 页面开发
- `src/frontend/src/components/` - 组件开发
- `design/` - 参考设计稿

**需要关注**：
- `docs/api-contract.md` - API接口定义
- `src/frontend/src/services/api.js` - API调用封装

### 后端开发者
**主要工作区**：
- `src/backend/app/routes/` - 路由开发
- `src/backend/app/services/` - 业务逻辑

**需要关注**：
- `docs/api-contract.md` - API接口定义
- `src/ai/` - AI模块接口

### AI集成者
**主要工作区**：
- `src/ai/adapters/` - AI服务封装
- `src/ai/prompts/` - 提示词优化
- `src/ai/processors/` - 数据预处理

**需要关注**：
- `docs/api-contract.md` - 对外提供的AI能力接口
- `data/samples/` - 测试数据

### 设计师
**主要工作区**：
- `design/wireframes/` - 线框图
- `design/mockups/` - 视觉稿
- `design/poster/` - 游园会海报

**需要关注**：
- `src/frontend/src/styles/` - 样式实现
- `assets/` - 设计素材导出

## 文件命名规范

### 组件文件
- React: `PascalCase.jsx` (如 `VideoPlayer.jsx`)
- Vue: `kebab-case.vue` (如 `video-player.vue`)

### 工具函数
- `camelCase.js` (如 `formatTime.js`)

### 样式文件
- `kebab-case.css` (如 `video-player.css`)
- 或 `ComponentName.module.css` (CSS Modules)

### Python文件
- `snake_case.py` (如 `video_service.py`)

### 常量文件
- `UPPER_SNAKE_CASE.js` (如 `API_ENDPOINTS.js`)
- 或 `constants.js` (内部用大写)

## 初始化检查清单

创建项目结构后，确保：

- [ ] `.gitignore` 包含：`node_modules/`, `__pycache__/`, `.env`, `data/uploads/`
- [ ] `README.md` 包含快速启动指南
- [ ] `docs/api-contract.md` 已创建并定义核心接口
- [ ] `.env.example` 已创建
- [ ] `scripts/dev.sh` 可执行（`chmod +x scripts/dev.sh`）
- [ ] `data/samples/` 包含测试数据
- [ ] 每个主要目录有 `README.md` 说明用途

## 技术栈对应调整

### 如果选择 React + FastAPI
- 使用上述推荐结构
- 前端用 Vite 构建
- 后端用 FastAPI

### 如果选择 Next.js
- 使用备选结构（全栈单体）
- API路由在 `app/api/`
- 前后端共用一个 `package.json`

### 如果选择 Vue + Express
- `src/frontend/` 改为 Vue 3 + Vite
- `src/backend/` 改为 Express.js
- 其他结构保持不变

## 常见问题

**Q: 前后端要分开两个Git仓库吗？**
A: 不需要。单仓库（Monorepo）更适合黑客松，方便协作和部署。

**Q: AI模块为什么要独立出来？**
A: 
1. AI集成者可以独立工作，不影响前后端
2. 方便切换不同的AI服务（OpenAI/Claude/本地模型）
3. 提示词和配置集中管理

**Q: shared/ 目录是必须的吗？**
A: 不是必须，但如果前后端都用 TypeScript/JavaScript，共享类型定义可以减少错误。

**Q: 要不要写测试？**
A: 25小时内优先保证功能完成，测试可选。如果有时间，写几个关键流程的集成测试。

---

**下一步**：根据明天确定的技术栈，初始化对应的项目结构。
