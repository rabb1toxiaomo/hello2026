# HTTP部署指南（无需SSL证书）

本指南说明如何在不使用SSL证书的情况下部署应用。

## 🚀 快速开始

### 方式一：直接访问（最简单）

1. **启动服务器**
```bash
npm start
```

2. **访问应用**
- 本地：`http://localhost:2026`
- 局域网：`http://172.16.2.1:2026`

就这么简单！无需配置Nginx或SSL证书。

### 方式二：使用PM2（推荐生产环境）

```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs hello2026

# 设置开机自启
pm2 startup
pm2 save
```

### 方式三：使用Nginx反向代理（可选）

如果你有域名或想通过80端口访问，可以使用Nginx：

```bash
# 1. 安装Nginx
sudo apt install nginx

# 2. 复制配置文件
sudo cp nginx.conf.example /etc/nginx/sites-available/hello2026

# 3. 编辑配置（修改server_name为你的IP或域名）
sudo nano /etc/nginx/sites-available/hello2026

# 4. 创建软链接
sudo ln -s /etc/nginx/sites-available/hello2026 /etc/nginx/sites-enabled/

# 5. 测试配置
sudo nginx -t

# 6. 重启Nginx
sudo systemctl restart nginx
```

## 🔧 环境变量配置

创建 `.env` 文件：

```bash
NODE_ENV=production
PORT=2026
HOST=172.16.2.1
DOMAIN=172.16.2.1
BASE_URL=http://172.16.2.1:2026
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_strong_password_here
ALLOWED_ORIGINS=http://172.16.2.1:2026,http://localhost:2026
```

## 🔥 防火墙配置

```bash
# 允许应用端口
sudo ufw allow 2026/tcp

# 如果使用Nginx，还需要
sudo ufw allow 80/tcp

# 启用防火墙
sudo ufw enable
```

## ✅ 验证部署

访问 `http://172.16.2.1:2026`，应该能看到登录页面。

## 📝 关于HTTPS（可选）

**重要提示**：Let's Encrypt 提供**完全免费**的SSL证书，但如果你不想使用，完全可以跳过。

- ✅ HTTP完全可以正常使用
- ✅ 局域网内使用HTTP很常见
- ✅ 不需要配置SSL证书
- ✅ 不需要域名

如果以后想使用HTTPS（比如公网部署），可以：
1. 安装 certbot: `sudo apt install certbot python3-certbot-nginx`
2. 运行: `sudo certbot --nginx -d yourdomain.com`
3. 完全免费，自动续期

## 🛡️ 安全建议

即使不使用HTTPS，也要注意：

1. ✅ **修改默认密码**：必须修改 `ADMIN_PASSWORD`
2. ✅ **使用防火墙**：只开放必要端口
3. ✅ **定期更新**：保持系统和依赖更新
4. ✅ **备份数据库**：定期备份 `wishes.db`
5. ✅ **监控日志**：查看 `pm2 logs` 或服务器日志

## 🎯 局域网部署优势

- ✅ 无需域名
- ✅ 无需SSL证书
- ✅ 配置简单
- ✅ 访问速度快
- ✅ 适合内网使用

## ❓ 常见问题

**Q: 其他设备无法访问？**
A: 检查防火墙是否开放了2026端口，确保服务器IP是172.16.2.1

**Q: 如何查看日志？**
A: 使用PM2: `pm2 logs hello2026`，或直接运行: `npm start` 查看控制台输出

**Q: 如何重启服务？**
A: PM2: `pm2 restart hello2026`，或直接: `npm start`

**Q: 数据库在哪里？**
A: 项目根目录的 `wishes.db` 文件，记得定期备份！

