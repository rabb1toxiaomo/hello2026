# 快速开始指南

## 🚀 5分钟快速部署

### 本地测试

```bash
# 1. 安装依赖
npm install

# 2. 启动服务
npm start

# 3. 访问
打开浏览器访问 http://localhost:8888
```

### 部署到云服务器

#### 最简单的方式（PM2）

```bash
# 1. 上传项目到服务器
scp -r . user@server:/path/to/app

# 2. SSH登录服务器
ssh user@server
cd /path/to/app

# 3. 安装依赖
npm install --production

# 4. 配置环境变量（可选）
cp .env.example .env
nano .env  # 修改域名等配置

# 5. 一键部署
chmod +x deploy.sh
./deploy.sh

# 6. 配置Nginx（如果有域名）
sudo cp nginx.conf.example /etc/nginx/sites-available/your-domain
sudo nano /etc/nginx/sites-available/your-domain  # 修改域名
sudo ln -s /etc/nginx/sites-available/your-domain /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 7. 配置SSL（推荐）
sudo certbot --nginx -d yourdomain.com
```

#### Docker方式

```bash
# 1. 上传项目

# 2. 配置环境变量
cp .env.example .env
nano .env

# 3. 启动
docker-compose up -d

# 4. 配置Nginx（同上）
```

## 📝 首次使用

1. 访问网站
2. 注册账号（昵称、密码、行业等）
3. 开始发送祝福！

## 🔧 重要配置

部署前请修改：

1. **管理员密码**：在 `.env` 文件中修改 `ADMIN_PASSWORD`
2. **域名**：在 `.env` 文件中设置 `DOMAIN` 和 `BASE_URL`
3. **端口**：如需修改端口，更改 `PORT` 环境变量

## 📚 更多信息

- 详细部署文档：查看 [DEPLOY.md](DEPLOY.md)
- 完整功能说明：查看 [README.md](README.md)
- 贡献指南：查看 [CONTRIBUTING.md](CONTRIBUTING.md)

## ❓ 遇到问题？

1. 查看 [DEPLOY.md](DEPLOY.md) 中的故障排查部分
2. 查看项目文档或联系作者




