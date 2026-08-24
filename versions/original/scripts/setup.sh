# 快速启动脚本

echo "🚀 初始化开发环境..."

# 检查是否在项目根目录
if [ ! -f "README.md" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

# 创建必要的目录
echo "📁 创建目录结构..."
mkdir -p src/frontend/public
mkdir -p src/frontend/src/{pages,components,hooks,services,utils,styles}
mkdir -p src/backend/app/{routes,services,models,utils}
mkdir -p src/ai/{prompts,adapters,processors}
mkdir -p src/shared/{types,constants}
mkdir -p data/{samples,mock,uploads}
mkdir -p design/{wireframes,mockups,poster,assets}
mkdir -p scripts

echo "✅ 目录结构创建完成"

# 创建 .gitignore
echo "📝 创建 .gitignore..."
cat > .gitignore << 'EOF'
# 依赖
node_modules/
__pycache__/
*.pyc
.Python
venv/
env/

# 环境变量
.env
.env.local

# 构建产物
dist/
build/
*.egg-info/

# IDE
.vscode/
.idea/
*.swp
*.swo

# 系统文件
.DS_Store
Thumbs.db

# 上传文件
data/uploads/*
!data/uploads/.gitkeep

# 日志
*.log
logs/

# 临时文件
*.tmp
.cache/
EOF

echo "✅ .gitignore 创建完成"

# 创建占位文件
echo "📝 创建占位文件..."
touch data/uploads/.gitkeep
touch data/samples/.gitkeep
touch design/wireframes/.gitkeep
touch design/mockups/.gitkeep
touch design/poster/.gitkeep

echo "✅ 占位文件创建完成"

# 创建环境变量示例文件
echo "📝 创建环境变量示例..."
cat > .env.example << 'EOF'
# AI API Keys
OPENAI_API_KEY=sk-xxx
CLAUDE_API_KEY=sk-ant-xxx

# 后端配置
PORT=8000
HOST=0.0.0.0
DEBUG=true

# 前端配置（Vite）
VITE_API_BASE_URL=http://localhost:8000/api

# 文件上传
MAX_UPLOAD_SIZE=104857600
UPLOAD_DIR=./data/uploads
EOF

echo "✅ 环境变量示例创建完成"

echo ""
echo "🎉 项目结构初始化完成！"
echo ""
echo "📋 下一步："
echo "1. 复制 .env.example 为 .env 并填写真实配置"
echo "2. 根据技术栈选择，初始化前后端项目"
echo "3. 查看 docs/folder-structure.md 了解目录说明"
echo "4. 查看 docs/collaboration.md 了解协作流程"
echo ""
