# 🚀 GitHub 发布准备清单

本文档列出了将项目发布到 GitHub 前需要完成的准备工作。

## ✅ 已完成

- [x] 创建完整的 README.md（符合 GitHub 标准，使用 localhost:2026）
- [x] 创建 CHANGELOG.md 记录版本历史
- [x] 完善 .gitignore 文件
- [x] 创建 .github 相关文件（Issue 模板、PR 模板、CI 工作流等）
- [x] 创建 .env.example 文件

## 📝 需要手动完成

### 1. 更新 package.json

在 `package.json` 中更新以下字段（替换为你的实际 GitHub 仓库信息）：

```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/rabb1toxiaomo/hello2026.git"
  },
  "bugs": {
    "url": "https://github.com/rabb1toxiaomo/hello2026/issues"
  },
  "homepage": "https://github.com/rabb1toxiaomo/hello2026#readme"
}
```

### 2. 更新 .github/FUNDING.yml

如果你有赞助渠道，更新 `.github/FUNDING.yml` 文件。

### 3. 更新 .github/CODE_OF_CONDUCT.md

更新 `.github/CODE_OF_CONDUCT.md` 中的联系邮箱。

### 4. 检查敏感信息

确保以下文件不包含敏感信息：
- [ ] `server.js` - 检查是否有硬编码的密码或密钥
- [ ] `.env` - 确保已添加到 .gitignore
- [ ] `wishes.db` - 确保已添加到 .gitignore
- [ ] 其他配置文件

### 5. 测试本地运行

在提交到 GitHub 前，确保项目可以正常运行：

```bash
# 安装依赖
npm install

# 启动服务
npm start

# 访问 http://localhost:2026 测试
```

### 6. Git 初始化（如果还没有）

```bash
# 初始化 Git 仓库
git init

# 添加所有文件
git add .

# 创建初始提交
git commit -m "Initial commit: 2026 马年祝福留言墙 v1.0.0"

# 添加远程仓库（替换为你的仓库 URL）
git remote add origin https://github.com/rabb1toxiaomo/hello2026.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

### 7. 创建 GitHub 仓库

1. 登录 GitHub
2. 点击右上角的 "+" 按钮，选择 "New repository"
3. 填写仓库信息：
   - Repository name: `hello2026`（或你喜欢的名字）
   - Description: `🐴 2026 马年祝福留言墙 - 精美的元旦/春节祝福系统`
   - 选择 Public 或 Private
   - **不要**初始化 README、.gitignore 或 LICENSE（我们已经有了）
4. 点击 "Create repository"

### 8. 设置 GitHub Pages（可选）

如果你想使用 GitHub Pages 托管静态版本：

1. 进入仓库 Settings
2. 点击左侧的 "Pages"
3. 选择 Source 为 "main" 分支
4. 保存

### 9. 添加 Topics（标签）

在 GitHub 仓库页面，点击右侧的齿轮图标，添加以下 topics：
- `new-year`
- `wishes`
- `blessing`
- `message-board`
- `2026`
- `chinese-new-year`
- `nodejs`
- `express`
- `sqlite`
- `glassmorphism`

### 10. 创建 Release（可选）

1. 进入仓库的 "Releases" 页面
2. 点击 "Create a new release"
3. 填写版本信息：
   - Tag: `v1.0.0`
   - Title: `v1.0.0 - 初始发布`
   - Description: 从 CHANGELOG.md 复制内容
4. 点击 "Publish release"

## 🔒 安全注意事项

### 生产环境部署前

1. **更改默认密码**
   - 在 `.env` 文件中设置强密码
   - 不要使用默认的 `ADMIN_PASSWORD`

2. **配置 HTTPS**
   - 使用 Nginx 反向代理
   - 配置 SSL 证书（Let's Encrypt）

3. **数据库备份**
   - 定期备份 `wishes.db` 文件
   - 考虑使用自动化备份脚本

4. **环境变量**
   - 确保 `.env` 文件不被提交到 Git
   - 在生产服务器上单独配置

## 📚 相关文档

- [README.md](README.md) - 项目说明
- [CHANGELOG.md](CHANGELOG.md) - 版本历史
- [CONTRIBUTING.md](CONTRIBUTING.md) - 贡献指南
- [SECURITY.md](SECURITY.md) - 安全政策
- [DEPLOY.md](DEPLOY.md) - 部署指南

## 🎉 完成！

完成以上步骤后，你的项目就可以在 GitHub 上发布了！

---

*最后更新: 2025-12-31*

