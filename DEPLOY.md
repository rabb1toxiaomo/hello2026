# 部署文档

本文档详细说明如何将新年祝福墙部署到云服务器。

## 前置要求

- 云服务器（推荐 Ubuntu 20.04+ 或 CentOS 7+）
- Node.js 16+ 或 Docker
- 域名（可选，推荐）
- SSH 访问权限

## 方式一：PM2 部署（推荐）

### 1. 服务器准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js (使用 NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node -v
npm -v
```

### 2. 上传项目

```bash
# 在本地打包（排除 node_modules）
tar --exclude='node_modules' --exclude='.git' -czf hello2026.tar.gz .

# 上传到服务器
scp hello2026.tar.gz user@your-server:/path/to/app/

# SSH 登录服务器
ssh user@your-server
cd /path/to/app

# 解压
tar -xzf hello2026.tar.gz
```

### 3. 安装依赖

```bash
npm install --production
```

### 4. 配置环境变量

```bash
cp .env.example .env
nano .env
```

编辑 `.env` 文件，设置：
- `DOMAIN`: 你的域名
- `BASE_URL`: 完整URL（如 https://yourdomain.com）
- `ADMIN_PASSWORD`: 修改默认管理员密码
- 其他配置根据需要调整

### 5. 部署

```bash
chmod +x deploy.sh
./deploy.sh
```

### 6. 配置 Nginx

```bash
# 复制配置模板
sudo cp nginx.conf.example /etc/nginx/sites-available/your-domain

# 编辑配置
sudo nano /etc/nginx/sites-available/your-domain
# 修改 server_name 为你的域名

# 创建软链接
sudo ln -s /etc/nginx/sites-available/your-domain /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 7. 配置 SSL（推荐）

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取证书
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 自动续期（已自动配置）
sudo certbot renew --dry-run
```

### 8. 防火墙配置

```bash
# 允许 HTTP 和 HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 如果直接访问端口（不推荐）
sudo ufw allow 8888/tcp
```

## 方式二：Docker 部署

### 1. 安装 Docker

```bash
# Ubuntu
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo apt install docker-compose -y
```

### 2. 上传项目

同上

### 3. 配置环境变量

```bash
cp .env.example .env
nano .env
```

### 4. 构建和运行

```bash
# 构建镜像
docker-compose build

# 启动容器
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 5. 配置 Nginx（同上）

## 常用命令

### PM2 管理

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs hello2026

# 重启
pm2 restart hello2026

# 停止
pm2 stop hello2026

# 查看监控
pm2 monit
```

### Docker 管理

```bash
# 查看容器
docker-compose ps

# 查看日志
docker-compose logs -f

# 重启
docker-compose restart

# 停止
docker-compose down

# 更新代码后重新部署
docker-compose up -d --build
```

## 更新部署

### PM2 方式

```bash
# 1. 备份数据库
cp wishes.db wishes.db.backup

# 2. 拉取新代码
git pull  # 或重新上传文件

# 3. 安装新依赖
npm install --production

# 4. 重启服务
pm2 restart hello2026
```

### Docker 方式

```bash
# 1. 备份数据库
docker-compose exec app cp wishes.db wishes.db.backup

# 2. 拉取新代码
git pull  # 或重新上传文件

# 3. 重新构建和启动
docker-compose up -d --build
```

## 备份和恢复

### 备份

```bash
# 备份数据库
cp wishes.db /backup/wishes-$(date +%Y%m%d).db

# 或使用定时任务
# 添加到 crontab: 0 2 * * * cp /path/to/app/wishes.db /backup/wishes-$(date +\%Y\%m\%d).db
```

### 恢复

```bash
# 停止服务
pm2 stop hello2026
# 或
docker-compose down

# 恢复数据库
cp /backup/wishes-20260101.db wishes.db

# 启动服务
pm2 start hello2026
# 或
docker-compose up -d
```

## 故障排查

### 服务无法启动

```bash
# 查看日志
pm2 logs hello2026
# 或
docker-compose logs

# 检查端口占用
sudo netstat -tlnp | grep 8888

# 检查 Node.js 版本
node -v
```

### 数据库问题

```bash
# 检查数据库文件权限
ls -la wishes.db

# 重新初始化（会丢失数据）
rm wishes.db
pm2 restart hello2026
```

### Nginx 问题

```bash
# 测试配置
sudo nginx -t

# 查看错误日志
sudo tail -f /var/log/nginx/error.log

# 重启 Nginx
sudo systemctl restart nginx
```

## 性能优化

### PM2 集群模式（多核CPU）

编辑 `ecosystem.config.js`:
```javascript
instances: 'max',  // 使用所有CPU核心
exec_mode: 'cluster'
```

### Nginx 缓存

在 nginx 配置中添加：
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=10g inactive=60m;
```

## 安全建议

1. **修改默认密码**：部署后立即修改管理员密码
2. **使用 HTTPS**：配置 SSL 证书
3. **防火墙**：只开放必要端口
4. **定期更新**：保持系统和依赖更新
5. **备份**：定期备份数据库

## 监控

### PM2 监控

```bash
# 安装监控模块
pm2 install pm2-logrotate

# 查看监控面板
pm2 monit
```

### 日志管理

```bash
# PM2 日志轮转
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 健康检查

```bash
# 手动检查
./healthcheck.sh

# 添加到crontab（每5分钟检查一次）
*/5 * * * * /path/to/app/healthcheck.sh >> /path/to/app/logs/healthcheck.log 2>&1
```

### 7×24小时运行保障

1. **PM2自动重启**：已配置自动重启策略
2. **错误处理**：全局错误捕获，避免进程退出
3. **数据库保护**：定期自动保存，原子写入防止损坏
4. **健康检查**：使用healthcheck.sh定期检查服务状态
5. **优雅关闭**：SIGTERM/SIGINT信号处理，确保数据保存
6. **内存限制**：PM2配置内存限制，超出自动重启
7. **日志轮转**：防止日志文件过大

## 支持

如有问题，请提交 Issue 或查看文档。

