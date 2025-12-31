#!/bin/bash

# 创建发布压缩包的脚本
# 用法: ./create-release.sh [版本号]
# 例如: ./create-release.sh v1.0.0

set -e

VERSION=${1:-v1.0.0}
PROJECT_NAME="hello2026"
RELEASE_DIR="release"
ARCHIVE_NAME="${PROJECT_NAME}-${VERSION}"

echo "📦 开始创建发布包: ${ARCHIVE_NAME}"
echo ""

# 创建临时目录
TEMP_DIR=$(mktemp -d)
echo "📁 临时目录: ${TEMP_DIR}"

# 复制项目文件（排除不需要的文件）
echo "📋 复制项目文件..."
rsync -av \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='.gitignore' \
  --exclude='*.db' \
  --exclude='*.db-journal' \
  --exclude='.env' \
  --exclude='.env.local' \
  --exclude='.env.production' \
  --exclude='logs' \
  --exclude='*.log' \
  --exclude='.DS_Store' \
  --exclude='Thumbs.db' \
  --exclude='.vscode' \
  --exclude='.idea' \
  --exclude='*.swp' \
  --exclude='*.swo' \
  --exclude='*~' \
  --exclude='tmp' \
  --exclude='temp' \
  --exclude='*.tmp' \
  --exclude='coverage' \
  --exclude='.nyc_output' \
  --exclude='dist' \
  --exclude='build' \
  ./ "${TEMP_DIR}/${ARCHIVE_NAME}/"

# 创建发布目录
mkdir -p "${RELEASE_DIR}"

# 创建 ZIP 压缩包
echo ""
echo "📦 创建 ZIP 压缩包..."
cd "${TEMP_DIR}"
zip -r -q "${ARCHIVE_NAME}.zip" "${ARCHIVE_NAME}/"
cd - > /dev/null
mv "${TEMP_DIR}/${ARCHIVE_NAME}.zip" "${RELEASE_DIR}/"

# 检查是否有 7z 命令
if command -v 7z &> /dev/null; then
  echo "📦 创建 7Z 压缩包..."
  cd "${TEMP_DIR}"
  7z a -t7z -mx=9 "${ARCHIVE_NAME}.7z" "${ARCHIVE_NAME}/" > /dev/null
  cd - > /dev/null
  mv "${TEMP_DIR}/${ARCHIVE_NAME}.7z" "${RELEASE_DIR}/"
else
  echo "⚠️  未找到 7z 命令，跳过 7Z 压缩包创建"
  echo "   安装方法:"
  echo "   - macOS: brew install p7zip"
  echo "   - Linux: sudo apt-get install p7zip-full"
  echo "   - Windows: 下载 7-Zip"
fi

# 计算校验和
echo ""
echo "🔐 计算校验和..."

cd "${RELEASE_DIR}"

# MD5
if command -v md5sum &> /dev/null; then
  md5sum "${ARCHIVE_NAME}.zip" > "${ARCHIVE_NAME}.zip.md5"
  if [ -f "${ARCHIVE_NAME}.7z" ]; then
    md5sum "${ARCHIVE_NAME}.7z" > "${ARCHIVE_NAME}.7z.md5"
  fi
elif command -v md5 &> /dev/null; then
  md5 -q "${ARCHIVE_NAME}.zip" > "${ARCHIVE_NAME}.zip.md5"
  if [ -f "${ARCHIVE_NAME}.7z" ]; then
    md5 -q "${ARCHIVE_NAME}.7z" > "${ARCHIVE_NAME}.7z.md5"
  fi
fi

# SHA-256
if command -v sha256sum &> /dev/null; then
  sha256sum "${ARCHIVE_NAME}.zip" > "${ARCHIVE_NAME}.zip.sha256"
  if [ -f "${ARCHIVE_NAME}.7z" ]; then
    sha256sum "${ARCHIVE_NAME}.7z" > "${ARCHIVE_NAME}.7z.sha256"
  fi
elif command -v shasum &> /dev/null; then
  shasum -a 256 "${ARCHIVE_NAME}.zip" > "${ARCHIVE_NAME}.zip.sha256"
  if [ -f "${ARCHIVE_NAME}.7z" ]; then
    shasum -a 256 "${ARCHIVE_NAME}.7z" > "${ARCHIVE_NAME}.7z.sha256"
  fi
fi

cd - > /dev/null

# 清理临时目录
rm -rf "${TEMP_DIR}"

# 显示结果
echo ""
echo "✅ 发布包创建完成！"
echo ""
echo "📁 文件位置: ${RELEASE_DIR}/"
echo ""
echo "📦 压缩包:"
ls -lh "${RELEASE_DIR}/${ARCHIVE_NAME}".* 2>/dev/null | grep -E '\.(zip|7z)$' | awk '{print "   " $9 " (" $5 ")"}'
echo ""
echo "🔐 校验和文件:"
ls -lh "${RELEASE_DIR}/${ARCHIVE_NAME}".* 2>/dev/null | grep -E '\.(md5|sha256)$' | awk '{print "   " $9}'
echo ""

# 显示校验和内容
echo "📋 校验和内容:"
echo ""
if [ -f "${RELEASE_DIR}/${ARCHIVE_NAME}.zip.md5" ]; then
  echo "ZIP MD5:"
  cat "${RELEASE_DIR}/${ARCHIVE_NAME}.zip.md5"
  echo ""
fi

if [ -f "${RELEASE_DIR}/${ARCHIVE_NAME}.zip.sha256" ]; then
  echo "ZIP SHA-256:"
  cat "${RELEASE_DIR}/${ARCHIVE_NAME}.zip.sha256"
  echo ""
fi

if [ -f "${RELEASE_DIR}/${ARCHIVE_NAME}.7z.md5" ]; then
  echo "7Z MD5:"
  cat "${RELEASE_DIR}/${ARCHIVE_NAME}.7z.md5"
  echo ""
fi

if [ -f "${RELEASE_DIR}/${ARCHIVE_NAME}.7z.sha256" ]; then
  echo "7Z SHA-256:"
  cat "${RELEASE_DIR}/${ARCHIVE_NAME}.7z.sha256"
  echo ""
fi

echo "✨ 完成！"

