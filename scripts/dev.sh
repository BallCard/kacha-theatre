#!/bin/bash
# 开发环境启动脚本

echo "🚀 启动开发环境..."

# 检查是否在项目根目录
if [ ! -f "README.md" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo "⚠️  未找到 .env 文件，使用 .env.example 创建一个"
    cp .env.example .env
    echo "📝 请编辑 .env 文件填写真实配置"
    exit 1
fi

# 启动后端（如果存在）
if [ -f "src/backend/app/main.py" ]; then
    echo "🔧 启动后端服务..."
    cd src/backend
    if [ -f "requirements.txt" ]; then
        # 检查虚拟环境
        if [ ! -d "venv" ]; then
            echo "📦 创建虚拟环境..."
            python -m venv venv
            source venv/bin/activate
            pip install -r requirements.txt
        else
            source venv/bin/activate
        fi
    fi
    python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    cd ../..
    echo "✅ 后端服务已启动 (PID: $BACKEND_PID)"
    echo "   访问: http://localhost:8000"
fi

# 启动前端（如果存在）
if [ -f "src/frontend/package.json" ]; then
    echo "🎨 启动前端服务..."
    cd src/frontend
    if [ ! -d "node_modules" ]; then
        echo "📦 安装依赖..."
        npm install
    fi
    npm run dev &
    FRONTEND_PID=$!
    cd ../..
    echo "✅ 前端服务已启动 (PID: $FRONTEND_PID)"
    echo "   访问: http://localhost:3000"
fi

echo ""
echo "🎉 开发环境启动完成！"
echo ""
echo "📋 服务列表："
[ ! -z "$BACKEND_PID" ] && echo "  - 后端: http://localhost:8000 (PID: $BACKEND_PID)"
[ ! -z "$FRONTEND_PID" ] && echo "  - 前端: http://localhost:3000 (PID: $FRONTEND_PID)"
echo ""
echo "⏹️  停止服务: Ctrl+C 或运行 scripts/stop.sh"
echo ""

# 等待用户中断
wait
