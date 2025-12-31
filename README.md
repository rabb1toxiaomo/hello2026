# 🐴 2026 马年祝福留言墙

<div align="center">

一个精美的元旦/春节祝福留言系统，支持实时留言、弹幕、抽奖、排行榜等功能。采用玻璃态UI设计，包含多种炫酷动画效果。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)
![Status](https://img.shields.io/badge/status-production-brightgreen.svg)

[功能特色](#-功能特色) • [快速开始](#-快速开始) • [使用说明](#-使用说明) • [技术栈](#-技术栈) • [部署指南](#-部署指南)

</div>

---

## 📅 项目信息

- **完成时间**: 2025年12月31日 12:00-24:00 (GMT+8)
- **作者**: [@rabb1toxiaomo](https://github.com/rabb1toxiaomo)
- **状态**: ✅ 已完成并部署
- **版本**: v1.0.0

---

## ✨ 功能特色

### 🎨 视觉设计
- **玻璃态UI** - 毛玻璃效果、渐变背景、流畅动画
- **响应式设计** - 完美适配手机、平板、电脑
- **炫酷动画** - 粒子系统、鼠标跟随、3D卡片、霓虹灯、彩虹文字等

### 💬 留言功能
- **双模式留言墙** - 弹幕墙模式和气泡模式可切换
- **实时互动** - 点赞、送礼物（🎆烟花 🧧红包 🐴小马 🧨春联）
- **回复功能** - 可以回复别人的祝福
- **管理功能** - 用户可以编辑/删除自己的祝福

### 🎊 特色功能
- **祝福语轮播** - 根据行业自动推荐个性化祝福，定时切换
- **幸运抽奖** - 转盘抽取祝福，行业相关，有普通/稀有/传说三种品质
- **活跃排行榜** - 展示最活跃的用户
- **数据概览** - 完整的用户活跃度统计
- **倒计时** - 实时显示距离春节的时间（到春节结束）
- **弹幕系统** - 模拟假留言从右向左飞过
- **背景音乐** - 不同行业不同音乐，自动循环播放
- **明信片生成** - 生成专属新年明信片，可下载保存

### 🎆 动画特效
- **背景动画** - 雪花飘落、烟花绽放、粒子系统、星空背景
- **互动特效** - 点击点赞触发爱心特效，送礼物触发对应动画
- **鼠标跟随** - 鼠标跟随的马特效
- **烟花系统** - 点击一次触发10个烟花，带音效

---

## 🌐 浏览器要求

### 推荐浏览器（电脑端）

**强烈推荐使用电脑端浏览器访问，以获得最佳体验：**

- ✅ **Chrome** (最新版本) - 最佳体验
- ✅ **Firefox** (最新版本) - 完全支持
- ✅ **Edge** (最新版本) - 完全支持
- ✅ **Safari** (Mac, 最新版本) - 完全支持

### 移动端支持

移动端浏览器也可使用，但部分特效可能简化：
- ✅ iOS Safari (iOS 12+)
- ✅ Chrome Mobile (Android 8+)
- ✅ 微信内置浏览器

> **注意**: 本项目针对电脑端进行了优化，建议使用电脑浏览器访问以获得完整功能体验。

---

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 7.0.0

### 本地开发

1. **克隆项目**
```bash
git clone https://github.com/rabb1toxiaomo/hello2026.git
cd hello2026
```

2. **安装依赖**
```bash
npm install
```

3. **启动服务**
```bash
npm start
```

服务将在 `http://localhost:2026` 启动

4. **访问应用**
打开浏览器访问 `http://localhost:2026`

### 使用 Docker

```bash
# 构建镜像
docker build -t hello2026 .

# 运行容器
docker-compose up -d
```

---

## 📝 使用说明

### 注册/登录
- 首次使用需要注册账号（完全匿名，可随意填写）
- 输入昵称、密码、性别、年龄、行业/专业
- 昵称会显示在祝福中
- **用户信息永久保存在服务器数据库中**

### 发送祝福
1. 在输入框写下你的新年祝福
2. 点击发送按钮
3. 祝福会显示在留言墙上

### 互动功能
- **点赞** ❤️ - 点击点赞按钮，触发爱心特效
- **送礼物** 🎁 - 点击礼物按钮（烟花、红包、小马、春联）
- **抽奖** 🎰 - 点击抽奖按钮获取随机祝福（行业相关）
- **排行榜** 🏆 - 查看最活跃的用户
- **数据概览** 📊 - 查看完整的统计数据
- **切换模式** 📋 - 顶部导航栏可切换弹幕墙/气泡模式

### 管理祝福
- 可以编辑自己的祝福
- 可以删除自己的祝福
- 可以回复别人的祝福

### 其他功能
- **生成明信片** 🎴 - 生成专属新年明信片，可下载保存
- **分享** 📤 - 点击分享按钮，自动复制网址

---

## 🎯 技术栈

### 后端
- **Node.js** - 运行环境
- **Express** - Web框架
- **SQL.js** - SQLite数据库（内存数据库）
- **bcryptjs** - 密码加密

### 前端
- **原生 JavaScript** - 无框架依赖
- **Canvas API** - 绘制明信片和特效
- **CSS3** - Glassmorphism、3D Transforms、Animations
- **HTML5** - 语义化标签

### 部署
- **PM2** - 进程管理（已配置定时重启：每3小时）
- **Docker** - 容器化部署
- **Nginx** - 反向代理（可选）

---

## 📦 项目结构

```
hello2026/
├── server.js              # 后端服务器
├── package.json           # 项目配置
├── ecosystem.config.js    # PM2配置
├── Dockerfile             # Docker镜像配置
├── docker-compose.yml     # Docker Compose配置
├── deploy.sh              # 部署脚本
├── nginx.conf.example     # Nginx配置示例
├── .gitignore            # Git忽略文件
├── LICENSE                # MIT许可证
├── README.md              # 项目说明
├── GITHUB.md              # GitHub部署指南
├── CHANGELOG.md           # 版本历史
├── wishes.db             # SQLite 数据库文件（自动生成）
└── public/               # 前端静态文件
    ├── index.html        # 主页面
    ├── app.js           # 前端逻辑
    └── style.css        # 样式文件
```

---

## 🔧 环境变量配置

创建 `.env` 文件（可选，不创建则使用默认值）：

```env
# 服务器配置
PORT=2026
HOST=localhost
NODE_ENV=development

# 数据库配置
DB_PATH=./wishes.db

# 域名配置
DOMAIN=localhost
BASE_URL=http://localhost:2026

# Admin账号配置
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin
```

---

## 🚀 部署指南

详细的部署说明请查看：
- [GITHUB.md](GITHUB.md) - GitHub 部署指南
- [DEPLOY.md](DEPLOY.md) - 详细部署文档

### 快速部署（从 GitHub）

```bash
# 克隆项目
git clone https://github.com/rabb1toxiaomo/hello2026.git
cd hello2026

# 安装依赖
npm install --production

# 使用 PM2 启动
npm run pm2:start

# 或使用 Docker
docker-compose up -d
```

---

## 🎨 自定义

### 修改祝福语
编辑 `server.js` 中的 `industryBlessings` 对象

### 修改默认祝福
编辑 `server.js` 中的 `defaultBlessings` 数组

### 修改端口
设置环境变量 `PORT` 或修改 `server.js` 中的默认值

---

## 🔒 安全特性

- ✅ SQL注入防护
- ✅ XSS防护
- ✅ 速率限制（15分钟内最多100个请求）
- ✅ 输入验证
- ✅ CORS配置
- ✅ 安全HTTP头（如果安装了helmet）
- ✅ 密码加密（bcrypt）

---

## 📄 许可证

本项目采用 [MIT License](LICENSE) 许可证。

---

## 👤 作者

**@rabb1toxiaomo**

- GitHub: [@rabb1toxiaomo](https://github.com/rabb1toxiaomo)
- 项目仓库: [https://github.com/rabb1toxiaomo/hello2026](https://github.com/rabb1toxiaomo/hello2026)
- 项目完成时间: 2025年12月31日 12:00-24:00 (GMT+8)

---

## 🙏 致谢

感谢所有使用和贡献本项目的朋友们！

---

## 📝 更新日志

详细的版本更新记录请查看 [CHANGELOG.md](CHANGELOG.md)

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给个 Star！**

Made with ❤️ by @xiaomo

</div>
