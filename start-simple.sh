#!/bin/bash

# 简单启动脚本（不使用PM2）
# 使用方法: chmod +x start-simple.sh && ./start-simple.sh

set -e

echo "=========================================="
echo "🚀 简单启动脚本（不使用PM2）"
echo "=========================================="
echo ""

# 进入项目目录
cd "$(dirname "$0")"
PROJECT_DIR=$(pwd)
echo "📍 项目目录: $PROJECT_DIR"

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未找到Node.js，请先安装"
    exit 1
fi

echo "✅ Node.js: $(node -v)"
echo "✅ npm: $(npm -v)"

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install --production
fi

# 检查public目录
if [ ! -d "public" ]; then
    echo "❌ 未找到public目录！"
    exit 1
fi

echo "✅ public目录存在"
ls -la public/

# 停止可能运行的进程
echo "🛑 停止旧进程..."
pkill -f "node.*server.js" || true
sleep 2

# 启动服务（后台运行）
echo "✅ 启动服务..."
nohup node server.js > logs/server.log 2>&1 &
PID=$!
echo "✅ 服务已启动，PID: $PID"
echo "📝 日志文件: logs/server.log"

# 等待一下
sleep 3

# 检查服务是否运行
if ps -p $PID > /dev/null; then
    echo "✅ 服务运行正常"
    echo ""
    echo "🌐 访问地址:"
    echo "  • http://154.8.235.129:2026"
    echo "  • http://154.8.235.129 (通过Nginx)"
    echo ""
    echo "📝 查看日志: tail -f logs/server.log"
    echo "🛑 停止服务: kill $PID"
else
    echo "❌ 服务启动失败，查看日志:"
    tail -20 logs/server.log
    exit 1
fi

echo "=========================================="

