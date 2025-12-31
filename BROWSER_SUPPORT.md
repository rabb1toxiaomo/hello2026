# 浏览器兼容性说明

## 🌐 推荐浏览器（电脑端）

**强烈推荐使用电脑端浏览器访问，以获得最佳体验：**

### 桌面端（推荐）
- ✅ **Chrome** (Windows/Mac, 最新版本) - **最佳体验，强烈推荐**
- ✅ **Firefox** (Windows/Mac, 最新版本) - 完全支持
- ✅ **Edge** (Windows/Mac, 最新版本) - 完全支持
- ✅ **Safari** (Mac, 最新版本) - 完全支持

> **注意**: 本项目针对电脑端进行了优化，建议使用电脑浏览器访问以获得完整功能体验。

## 支持的浏览器

### 桌面端
- ✅ **Chrome** (Windows/Mac) - 最新版本及最近2个主要版本
- ✅ **Firefox** (Windows/Mac) - 最新版本及最近2个主要版本
- ✅ **Safari** (Mac) - 最新版本及最近2个主要版本
- ✅ **Edge** (Windows/Mac) - 最新版本及最近2个主要版本

### 移动端
- ✅ **iOS Safari** - iOS 12+
- ✅ **Chrome Mobile** (Android) - Android 8+
- ✅ **Samsung Internet** - 最新版本
- ✅ **微信内置浏览器** - 支持

## 兼容性特性

### 自动Polyfill
项目会自动检测并加载以下polyfill（如需要）：
- **Fetch API** - 不支持时自动加载polyfill
- **Promise** - 不支持时自动加载polyfill
- **requestAnimationFrame** - 自动添加浏览器前缀版本

### CSS兼容性
- **backdrop-filter** - 自动添加 `-webkit-` 前缀，不支持时使用降级方案
- **transform** - 自动添加浏览器前缀
- **animation** - 自动添加浏览器前缀
- **CSS变量** - 使用降级方案

### 移动端优化
- **触摸事件** - 完整支持触摸操作
- **视口优化** - 防止iOS Safari自动缩放
- **性能优化** - 移动端自动减少动画和粒子数量
- **输入优化** - 防止iOS输入框自动缩放

## 已知限制

1. **IE浏览器** - 不支持（已停止维护）
2. **旧版Safari** - iOS 11及以下可能部分功能受限
3. **backdrop-filter** - 旧版浏览器使用半透明背景降级

## 测试建议

部署前建议在以下环境测试：
- Windows Chrome
- Windows Firefox
- Windows Edge
- Mac Safari
- Mac Chrome
- Mac Firefox
- iPhone Safari
- Android Chrome
- 微信内置浏览器

## 性能优化

### 桌面端
- 完整动画效果
- 100个粒子
- 200颗星星
- 60 FPS动画

### 移动端
- 简化动画效果
- 30个粒子
- 50颗星星
- 30 FPS动画（自动降级）

## 故障排查

如果遇到显示问题：

1. **清除浏览器缓存**
2. **检查浏览器版本** - 确保使用支持的版本
3. **禁用浏览器扩展** - 某些扩展可能干扰
4. **检查控制台错误** - 查看浏览器开发者工具

## 反馈

如发现浏览器兼容性问题，请提交Issue并注明：
- 浏览器名称和版本
- 操作系统
- 问题描述
- 截图（如可能）












