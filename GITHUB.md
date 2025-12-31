# GitHub 部署指南

本文档提供从 GitHub 仓库部署 hello2026 项目的完整指南。

## 📦 仓库信息

- **仓库地址**: https://github.com/rabb1toxiaomo/hello2026
- **作者**: @rabb1toxiaomo
- **许可证**: MIT License
- **版本**: v1.0.0

---

## 🚀 快速部署

### 方式一：从 GitHub 克隆并部署（推荐）

#### 1. 克隆仓库

```bash
# 克隆项目
git clone https://github.com/rabb1toxiaomo/hello2026.git
cd hello2026

# 或使用 SSH（如果已配置）
git clone git@github.com:rabb1toxiaomo/hello2026.git
cd hello2026
```

#### 2. 安装依赖

```bash
npm install
```

#### 3. 配置环境变量（可选）

创建 `.env` 文件（如果需要自定义配置）：

```bash
# 复制示例文件（如果有）
cp .env.example .env

# 编辑配置
nano .env
```

基本配置项：
```env
PORT=2026
HOST=0.0.0.0
NODE_ENV=production
DOMAIN=your-domain.com
BASE_URL=http://your-domain.com:2026
```

#### 4. 启动服务

**开发模式：**
```bash
npm start
# 或
npm run dev
```

**生产模式（使用 PM2）：**
```bash
# 启动 PM2
npm run pm2:start

# 查看状态
npm run pm2:logs

# 重启服务
npm run pm2:restart
```

#### 5. 访问应用

打开浏览器访问：`http://localhost:2026`

---

### 方式二：Docker 部署

#### 1. 克隆仓库

```bash
git clone https://github.com/rabb1toxiaomo/hello2026.git
cd hello2026
```

#### 2. 构建和运行

```bash
# 构建镜像
npm run docker:build
# 或
docker-compose build

# 启动容器
npm run docker:up
# 或
docker-compose up -d

# 查看日志
npm run docker:logs
# 或
docker-compose logs -f
```

---

## 📋 部署检查清单

部署前请确认：

- [ ] Node.js >= 16.0.0 已安装
- [ ] npm >= 7.0.0 已安装
- [ ] 已克隆 GitHub 仓库
- [ ] 已安装项目依赖（`npm install`）
- [ ] 端口 2026 未被占用
- [ ] 防火墙已开放端口（如需要）
- [ ] 已配置环境变量（如需要）

---

## 🔧 服务器部署步骤

### 在 Linux 服务器上部署

#### 1. SSH 登录服务器

```bash
ssh user@your-server-ip
```

#### 2. 安装 Node.js（如果未安装）

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 验证安装
node -v
npm -v
```

#### 3. 安装 Git（如果未安装）

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install git -y

# CentOS/RHEL
sudo yum install git -y
```

#### 4. 克隆项目

```bash
# 创建应用目录
mkdir -p /opt/apps
cd /opt/apps

# 克隆仓库
git clone https://github.com/rabb1toxiaomo/hello2026.git
cd hello2026
```

#### 5. 安装依赖

```bash
npm install --production
```

#### 6. 配置 PM2

```bash
# 全局安装 PM2
sudo npm install -g pm2

# 启动服务
pm2 start ecosystem.config.js

# 保存 PM2 配置（开机自启）
pm2 save
pm2 startup
```

#### 7. 配置 Nginx 反向代理（可选）

```bash
# 安装 Nginx
sudo apt install nginx -y  # Ubuntu/Debian
# 或
sudo yum install nginx -y  # CentOS/RHEL

# 复制配置模板
sudo cp nginx.conf.example /etc/nginx/sites-available/hello2026
sudo nano /etc/nginx/sites-available/hello2026

# 创建软链接
sudo ln -s /etc/nginx/sites-available/hello2026 /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

#### 8. 配置防火墙

```bash
# Ubuntu (UFW)
sudo ufw allow 2026/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-port=2026/tcp
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

---

## 🔄 更新部署

### 从 GitHub 更新代码

```bash
# 进入项目目录
cd /path/to/hello2026

# 拉取最新代码
git pull origin main

# 安装新依赖（如果有）
npm install --production

# 重启服务
pm2 restart hello2026

# 查看日志确认
pm2 logs hello2026
```

### Docker 方式更新

```bash
cd /path/to/hello2026

# 拉取最新代码
git pull origin main

# 重新构建和启动
docker-compose up -d --build

# 查看日志
docker-compose logs -f
```

---

## 📝 常用命令

### Git 相关

```bash
# 查看状态
git status

# 查看日志
git log

# 拉取更新
git pull

# 查看远程仓库
git remote -v
```

### PM2 管理

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs hello2026

# 重启服务
pm2 restart hello2026

# 停止服务
pm2 stop hello2026

# 删除服务
pm2 delete hello2026

# 监控面板
pm2 monit

# 查看详细信息
pm2 show hello2026
```

### Docker 管理

```bash
# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f hello2026

# 重启容器
docker-compose restart

# 停止容器
docker-compose down

# 停止并删除数据卷
docker-compose down -v
```

---

## 🐛 故障排查

### Git 相关问题

**问题：克隆失败**
```bash
# 检查网络连接
ping github.com

# 使用 HTTPS 替代 SSH
git clone https://github.com/rabb1toxiaomo/hello2026.git
```

**问题：权限错误**
```bash
# 检查 Git 配置
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 部署相关问题

**问题：端口被占用**
```bash
# 查找占用端口的进程
sudo lsof -i :2026
# 或
sudo netstat -tlnp | grep 2026

# 杀死进程
sudo kill -9 <PID>
```

**问题：依赖安装失败**
```bash
# 清除 npm 缓存
npm cache clean --force

# 删除 node_modules 重新安装
rm -rf node_modules package-lock.json
npm install
```

**问题：PM2 服务无法启动**
```bash
# 查看详细错误
pm2 logs hello2026 --err

# 检查配置文件
cat ecosystem.config.js

# 手动启动测试
node server.js
```

---

## 🔒 安全建议

1. **使用 HTTPS**：配置 SSL 证书（推荐使用 Let's Encrypt）
2. **修改默认端口**：如需要，修改 `ecosystem.config.js` 中的端口配置
3. **定期更新**：定期执行 `git pull` 获取最新代码和安全更新
4. **备份数据库**：定期备份 `wishes.db` 文件
5. **监控日志**：定期查看 PM2 日志，及时发现问题

---

## 📚 相关文档

- [README.md](README.md) - 项目说明和功能介绍
- [DEPLOY.md](DEPLOY.md) - 详细部署文档
- [CHANGELOG.md](CHANGELOG.md) - 版本更新日志
- [PROJECT_INFO.md](PROJECT_INFO.md) - 项目信息

---

## 💡 提示

- 首次部署建议先在测试环境验证
- 生产环境建议使用 PM2 或 Docker 部署
- 定期备份数据库文件（`wishes.db`）
- 建议配置 Nginx 反向代理和 SSL 证书
- PM2 已配置定时重启（每3小时），无需手动重启

---

## 📞 支持

如有问题，请提交 Issue：
- GitHub Issues: https://github.com/rabb1toxiaomo/hello2026/issues

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给个 Star！**

Made with ❤️ by @xiaomo

</div>

