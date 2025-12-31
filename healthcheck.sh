#!/bin/bash

# 健康检查脚本
# 用于监控服务状态，可以配合cron使用

PORT=${PORT:-8888}
HEALTH_URL="http://localhost:${PORT}/health"

response=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" --max-time 5)

if [ "$response" = "200" ]; then
    echo "✅ 服务健康"
    exit 0
else
    echo "❌ 服务不健康 (HTTP $response)"
    # 如果使用PM2，可以尝试重启
    if command -v pm2 &> /dev/null; then
        echo "🔄 尝试重启服务..."
        pm2 restart hello2026
    fi
    exit 1
fi












