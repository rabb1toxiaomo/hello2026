#!/bin/bash

# 腾讯云 Ubuntu 20.04 一键部署脚本
# 使用方法: chmod +x deploy-tencent.sh && ./deploy-tencent.sh

set -e

echo "=========================================="
echo "🚀 腾讯云 Ubuntu 20.04 一键部署脚本"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置变量
PUBLIC_IP="154.8.235.129"
APP_PORT=2026
APP_NAME="hello2026"
PROJECT_DIR=$(pwd)

echo -e "${GREEN}📍 项目目录: ${PROJECT_DIR}${NC}"
echo -e "${GREEN}🌐 公网IP: ${PUBLIC_IP}${NC}"
echo -e "${GREEN}🔌 应用端口: ${APP_PORT}${NC}"
echo ""

# 1. 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}⚠️  建议使用 sudo 运行此脚本${NC}"
    read -p "是否继续? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 2. 更新系统
echo -e "${GREEN}📦 更新系统包...${NC}"
sudo apt update && sudo apt upgrade -y

# 3. 检查并安装 Node.js
echo -e "${GREEN}📦 检查 Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}📥 安装 Node.js 18...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✅ Node.js 已安装: ${NODE_VERSION}${NC}"
fi

# 验证 Node.js 版本
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo -e "${RED}❌ Node.js 版本过低，需要 >= 16.0.0${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js: $(node -v)${NC}"
echo -e "${GREEN}✅ npm: $(npm -v)${NC}"

# 4. 安装 PM2
echo -e "${GREEN}📦 检查 PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}📥 安装 PM2...${NC}"
    sudo npm install -g pm2
else
    echo -e "${GREEN}✅ PM2 已安装: $(pm2 -v)${NC}"
fi

# 5. 安装项目依赖
echo -e "${GREEN}📦 安装项目依赖...${NC}"
cd "$PROJECT_DIR"
npm install --production

# 6. 创建日志目录
echo -e "${GREEN}📁 创建日志目录...${NC}"
mkdir -p logs

# 7. 停止旧进程
echo -e "${GREEN}🛑 停止旧进程...${NC}"
pm2 stop "$APP_NAME" 2>/dev/null || true
pm2 delete "$APP_NAME" 2>/dev/null || true

# 8. 启动应用
echo -e "${GREEN}✅ 启动应用...${NC}"
pm2 start ecosystem.config.js

# 9. 保存 PM2 配置
pm2 save

# 10. 设置 PM2 开机自启
echo -e "${GREEN}⚙️  配置 PM2 开机自启...${NC}"
STARTUP_CMD=$(pm2 startup systemd -u $USER --hp $HOME | grep -v "PM2" | grep -v "command" | grep -v "Copy/paste")
if [ ! -z "$STARTUP_CMD" ]; then
    echo -e "${YELLOW}请执行以下命令以设置开机自启:${NC}"
    echo -e "${YELLOW}$STARTUP_CMD${NC}"
fi

# 11. 安装和配置 Nginx
echo -e "${GREEN}📦 检查 Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}📥 安装 Nginx...${NC}"
    sudo apt install nginx -y
else
    echo -e "${GREEN}✅ Nginx 已安装${NC}"
fi

# 12. 配置 Nginx
echo -e "${GREEN}⚙️  配置 Nginx...${NC}"
NGINX_CONFIG="/etc/nginx/sites-available/$APP_NAME"
NGINX_ENABLED="/etc/nginx/sites-enabled/$APP_NAME"

# 创建 Nginx 配置
sudo tee "$NGINX_CONFIG" > /dev/null <<EOF
# Nginx 配置 - $APP_NAME
# 自动生成于 $(date)

# HTTP 配置 (端口 80)
server {
    listen 80;
    listen [::]:80;
    server_name $PUBLIC_IP;

    # 日志
    access_log /var/log/nginx/${APP_NAME}-access.log;
    error_log /var/log/nginx/${APP_NAME}-error.log;

    # 代理到应用
    location / {
        proxy_pass http://localhost:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 静态文件缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:${APP_PORT};
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

# 创建软链接
sudo ln -sf "$NGINX_CONFIG" "$NGINX_ENABLED"

# 删除默认配置（可选）
if [ -f /etc/nginx/sites-enabled/default ]; then
    echo -e "${YELLOW}🗑️  删除默认 Nginx 配置...${NC}"
    sudo rm /etc/nginx/sites-enabled/default
fi

# 测试 Nginx 配置
echo -e "${GREEN}🧪 测试 Nginx 配置...${NC}"
if sudo nginx -t; then
    echo -e "${GREEN}✅ Nginx 配置正确${NC}"
else
    echo -e "${RED}❌ Nginx 配置错误${NC}"
    exit 1
fi

# 重启 Nginx
echo -e "${GREEN}🔄 重启 Nginx...${NC}"
sudo systemctl restart nginx
sudo systemctl enable nginx

# 13. 配置防火墙 (UFW)
echo -e "${GREEN}🔥 配置防火墙...${NC}"
if command -v ufw &> /dev/null; then
    # 允许 SSH（重要！）
    sudo ufw allow 22/tcp
    
    # 允许 HTTP 和 HTTPS
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    
    # 允许应用端口
    sudo ufw allow ${APP_PORT}/tcp
    
    # 启用防火墙（如果未启用）
    echo "y" | sudo ufw enable 2>/dev/null || true
    
    echo -e "${GREEN}✅ 防火墙配置完成${NC}"
    sudo ufw status
else
    echo -e "${YELLOW}⚠️  UFW 未安装，跳过防火墙配置${NC}"
    echo -e "${YELLOW}⚠️  请在腾讯云控制台配置安全组规则${NC}"
fi

# 14. 检查服务状态
echo ""
echo -e "${GREEN}📊 检查服务状态...${NC}"
echo ""
echo "=== PM2 状态 ==="
pm2 status

echo ""
echo "=== Nginx 状态 ==="
sudo systemctl status nginx --no-pager -l

echo ""
echo "=== 端口监听 ==="
sudo netstat -tlnp | grep -E "(${APP_PORT}|80|443)" || ss -tlnp | grep -E "(${APP_PORT}|80|443)"

# 15. 测试应用
echo ""
echo -e "${GREEN}🧪 测试应用...${NC}"
sleep 2
if curl -s http://localhost:${APP_PORT}/health > /dev/null; then
    echo -e "${GREEN}✅ 应用运行正常${NC}"
else
    echo -e "${YELLOW}⚠️  应用可能还在启动中，请稍后检查${NC}"
fi

# 16. 显示访问信息
echo ""
echo "=========================================="
echo -e "${GREEN}🎉 部署完成！${NC}"
echo "=========================================="
echo ""
echo -e "${GREEN}📱 访问地址:${NC}"
echo -e "  • HTTP (端口80):  ${GREEN}http://${PUBLIC_IP}${NC}"
echo -e "  • 直接访问:       ${GREEN}http://${PUBLIC_IP}:${APP_PORT}${NC}"
echo ""
echo -e "${GREEN}📝 常用命令:${NC}"
echo -e "  • 查看应用状态:   ${YELLOW}pm2 status${NC}"
echo -e "  • 查看应用日志:   ${YELLOW}pm2 logs ${APP_NAME}${NC}"
echo -e "  • 重启应用:       ${YELLOW}pm2 restart ${APP_NAME}${NC}"
echo -e "  • 查看 Nginx 日志: ${YELLOW}sudo tail -f /var/log/nginx/${APP_NAME}-access.log${NC}"
echo ""
echo -e "${YELLOW}⚠️  重要提醒:${NC}"
echo -e "  1. 请在腾讯云控制台配置安全组规则，开放以下端口:"
echo -e "     • 22 (SSH)"
echo -e "     • 80 (HTTP)"
echo -e "     • 443 (HTTPS)"
echo -e "     • ${APP_PORT} (应用端口)"
echo ""
echo -e "  2. 默认管理员账号: admin / admin"
echo -e "     建议修改环境变量 ADMIN_PASSWORD 更改密码"
echo ""
echo -e "  3. 如需配置 HTTPS，运行:"
echo -e "     ${YELLOW}sudo apt install certbot python3-certbot-nginx -y${NC}"
echo -e "     ${YELLOW}sudo certbot --nginx -d yourdomain.com${NC}"
echo ""
echo "=========================================="


