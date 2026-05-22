#!/bin/bash
# 停止开发服务

echo "⏹️  停止开发服务..."

# 停止后端
if pgrep -f "uvicorn app.main:app" > /dev/null; then
    pkill -f "uvicorn app.main:app"
    echo "✅ 后端服务已停止"
fi

# 停止前端
if pgrep -f "vite" > /dev/null; then
    pkill -f "vite"
    echo "✅ 前端服务已停止"
fi

echo "🎉 所有服务已停止"
