# 安全配置指南

## 🔒 部署前安全检查清单

### 1. 环境变量配置

**⚠️ 重要：生产环境必须设置以下环境变量！**

创建 `.env` 文件（不要提交到Git）：

```bash
# 服务器配置
NODE_ENV=production
PORT=2026
HOST=172.16.2.1
DOMAIN=172.16.2.1
BASE_URL=http://172.16.2.1:2026

# 管理员账号（必须修改！）
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_strong_password_here

# 数据库路径
DB_PATH=./wishes.db

# CORS允许的域名（多个用逗号分隔，HTTP即可）
ALLOWED_ORIGINS=http://172.16.2.1:2026,http://localhost:2026
```

### 2. 安装安全依赖（推荐）

```bash
npm install helmet express-rate-limit
```

这些包会提供额外的安全保护：
- `helmet`: 设置安全HTTP头
- `express-rate-limit`: 更强大的速率限制

### 3. 服务器安全配置

#### 3.1 使用反向代理（Nginx，可选）

**注意：如果不使用Nginx，可以直接访问 `http://172.16.2.1:2026`**

如果使用Nginx反向代理，配置如下：

```nginx
server {
    listen 80;
    server_name 172.16.2.1;  # 或你的域名
    
    # 安全头（HTTP也可以设置）
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # 限制请求大小
    client_max_body_size 1M;
    
    location / {
        proxy_pass http://localhost:2026;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# ========== HTTPS配置（可选，如果以后想使用） ==========
# Let's Encrypt 提供免费SSL证书，但如果你不想使用，可以跳过这部分
# 
# 如果以后想使用HTTPS，可以：
# 1. 安装 certbot: sudo apt install certbot python3-certbot-nginx
# 2. 运行: sudo certbot --nginx -d yourdomain.com
# 3. 取消注释下面的HTTPS配置
#
# server {
#     listen 443 ssl http2;
#     server_name yourdomain.com;
#     
#     ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
#     
#     # 其他配置同上
# }
```

#### 3.2 防火墙配置

```bash
# 只开放必要端口
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 2026/tcp  # 应用端口（直接访问）
# 如果使用Nginx反向代理，还需要：
sudo ufw allow 80/tcp    # HTTP（Nginx）
# sudo ufw allow 443/tcp   # HTTPS（如果使用SSL，可选）
sudo ufw enable
```

#### 3.3 使用PM2进程管理

```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # 设置开机自启
```

### 4. 数据库安全

- 定期备份数据库文件
- 设置适当的文件权限：
  ```bash
  chmod 600 wishes.db
  chown youruser:youruser wishes.db
  ```

### 5. 日志和监控

- 定期检查服务器日志
- 监控异常请求
- 设置告警（如使用PM2 Plus或其他监控工具）

### 6. 定期更新

```bash
# 更新npm包
npm audit
npm audit fix

# 更新系统
sudo apt update && sudo apt upgrade
```

## 🛡️ 已实现的安全措施

### ✅ SQL注入防护
- 所有数据库查询使用参数化查询
- 输入验证和类型检查

### ✅ XSS防护
- 输入清理和HTML转义
- Content Security Policy (CSP)

### ✅ 速率限制
- 每个IP每15分钟最多100个请求
- 防止暴力破解和DoS攻击

### ✅ 输入验证
- 所有用户输入都经过验证和清理
- 长度限制和类型检查

### ✅ 安全HTTP头
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Referrer-Policy

### ✅ CORS配置
- 限制允许的源
- 生产环境严格配置

### ✅ 错误处理
- 不暴露敏感信息
- 统一错误响应

## ⚠️ 安全注意事项

1. **永远不要**在生产环境使用默认密码
2. **永远不要**将 `.env` 文件提交到Git
3. **定期更新**依赖包
4. **定期备份**数据库
5. **监控日志**，及时发现异常
6. **HTTPS（可选）**：如果以后需要，Let's Encrypt提供免费SSL证书，但HTTP也可以正常使用

## 🚨 如果发现安全漏洞

1. 立即更改所有密码
2. 检查日志文件
3. 更新所有依赖
4. 考虑重置数据库（如果有必要）

## 📞 安全联系方式

如果发现安全漏洞，请通过安全渠道报告。

