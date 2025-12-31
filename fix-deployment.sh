#!/bin/bash

# 修复部署问题脚本
# 解决白屏/UI消失问题

set -e

echo "=========================================="
echo "🔧 修复部署问题"
echo "=========================================="
echo ""

PROJECT_DIR=$(pwd)
echo "📍 项目目录: $PROJECT_DIR"

# 1. 检查public目录
echo "1️⃣  检查public目录..."
if [ ! -d "public" ]; then
    echo "❌ public目录不存在！"
    exit 1
fi

echo "✅ public目录存在"
echo "📁 public目录内容:"
ls -la public/

# 2. 检查静态文件
echo ""
echo "2️⃣  检查静态文件..."
if [ ! -f "public/index.html" ]; then
    echo "❌ public/index.html 不存在！"
    exit 1
fi
if [ ! -f "public/app.js" ]; then
    echo "❌ public/app.js 不存在！"
    exit 1
fi
if [ ! -f "public/style.css" ]; then
    echo "❌ public/style.css 不存在！"
    exit 1
fi
echo "✅ 所有静态文件存在"

# 3. 停止PM2进程
echo ""
echo "3️⃣  停止PM2进程..."
pm2 stop hello2026 2>/dev/null || true
pm2 delete hello2026 2>/dev/null || true

# 4. 检查server.js中的静态文件路径
echo ""
echo "4️⃣  检查server.js配置..."
if grep -q "express.static('public')" server.js; then
    echo "⚠️  发现相对路径，需要修复为绝对路径"
    # 这里需要手动修复，或者使用sed
    echo "请确保server.js中使用: express.static(path.join(__dirname, 'public'))"
fi

# 5. 测试直接启动
echo ""
echo "5️⃣  测试直接启动服务..."
cd "$PROJECT_DIR"
node server.js &
TEST_PID=$!
sleep 3

# 测试访问
if curl -s http://localhost:2026 > /dev/null; then
    echo "✅ 服务可以访问"
    # 测试静态文件
    if curl -s http://localhost:2026/style.css > /dev/null; then
        echo "✅ 静态文件可以访问"
    else
        echo "❌ 静态文件无法访问！"
    fi
    if curl -s http://localhost:2026/app.js > /dev/null; then
        echo "✅ JS文件可以访问"
    else
        echo "❌ JS文件无法访问！"
    fi
else
    echo "❌ 服务无法访问"
fi

# 停止测试进程
kill $TEST_PID 2>/dev/null || true

# 6. 检查Nginx配置
echo ""
echo "6️⃣  检查Nginx配置..."
if [ -f "/etc/nginx/sites-available/hello2026" ]; then
    echo "✅ Nginx配置存在"
    echo "检查配置内容:"
    grep -A 5 "location /" /etc/nginx/sites-available/hello2026 || true
else
    echo "⚠️  Nginx配置不存在"
fi

# 7. 提供修复建议
echo ""
echo "=========================================="
echo "📋 修复建议:"
echo "=========================================="
echo ""
echo "如果UI是白屏，可能的原因："
echo ""
echo "1. 静态文件路径问题"
echo "   确保server.js中使用绝对路径:"
echo "   app.use(express.static(path.join(__dirname, 'public')));"
echo ""
echo "2. PM2工作目录问题"
echo "   在ecosystem.config.js中添加:"
echo "   cwd: __dirname,"
echo ""
echo "3. 直接测试（不使用PM2）:"
echo "   cd $PROJECT_DIR"
echo "   node server.js"
echo "   然后访问: http://154.8.235.129:2026"
echo ""
echo "4. 检查浏览器控制台错误:"
echo "   按F12打开开发者工具，查看Console和Network标签"
echo ""
echo "5. 检查服务器日志:"
echo "   pm2 logs hello2026"
echo "   或"
echo "   tail -f logs/server.log"
echo ""
echo "=========================================="

