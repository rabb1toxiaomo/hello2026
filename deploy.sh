#!/bin/bash

# 部署脚本
# 使用方法: ./deploy.sh

set -e

echo "🚀 开始部署新年祝福墙..."

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未找到Node.js，请先安装Node.js"
    exit 1
fi

# 检查PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 安装PM2..."
    npm install -g pm2
fi

# 安装依赖
echo "📦 安装依赖..."
npm install --production

# 创建日志目录
mkdir -p logs

# 停止旧进程
echo "🛑 停止旧进程..."
pm2 stop hello2026 2>/dev/null || true
pm2 delete hello2026 2>/dev/null || true

# 启动应用
echo "✅ 启动应用..."
pm2 start ecosystem.config.js

# 保存PM2配置
pm2 save

# 设置开机自启
pm2 startup

echo "🎉 部署完成！"
echo "📊 查看状态: pm2 status"
echo "📝 查看日志: pm2 logs hello2026"
echo "🔄 重启应用: pm2 restart hello2026"












