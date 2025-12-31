#!/usr/bin/env node
/**
 * 安全配置检查脚本
 * 部署前运行: node check-security.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 安全检查开始...\n');

let hasErrors = false;
let hasWarnings = false;

// 检查环境变量
console.log('1. 检查环境变量配置...');
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  
  if (envContent.includes('ADMIN_PASSWORD=admin') && envContent.includes('NODE_ENV=production')) {
    console.log('   ⚠️  警告: 生产环境使用默认密码 admin，建议修改为强密码！');
    hasWarnings = true;
  } else if (envContent.includes('ADMIN_PASSWORD=')) {
    console.log('   ❌ 错误: 未修改默认管理员密码！');
    hasErrors = true;
  } else if (envContent.includes('ADMIN_PASSWORD=')) {
    console.log('   ✅ 管理员密码已配置');
  } else {
    console.log('   ⚠️  警告: 未找到ADMIN_PASSWORD配置');
    hasWarnings = true;
  }
  
  if (!envContent.includes('NODE_ENV=production')) {
    console.log('   ⚠️  警告: NODE_ENV未设置为production');
    hasWarnings = true;
  } else {
    console.log('   ✅ NODE_ENV已设置为production');
  }
} else {
  console.log('   ⚠️  警告: 未找到.env文件');
  hasWarnings = true;
}

// 检查依赖
console.log('\n2. 检查安全依赖...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const optionalDeps = packageJson.optionalDependencies || {};

if (optionalDeps.helmet) {
  try {
    require.resolve('helmet');
    console.log('   ✅ helmet已安装');
  } catch (e) {
    console.log('   ⚠️  警告: helmet在package.json中但未安装，运行: npm install');
    hasWarnings = true;
  }
} else {
  console.log('   ⚠️  建议: 安装helmet以获得更好的安全保护: npm install helmet');
  hasWarnings = true;
}

if (optionalDeps['express-rate-limit']) {
  try {
    require.resolve('express-rate-limit');
    console.log('   ✅ express-rate-limit已安装');
  } catch (e) {
    console.log('   ⚠️  警告: express-rate-limit在package.json中但未安装，运行: npm install');
    hasWarnings = true;
  }
} else {
  console.log('   ⚠️  建议: 安装express-rate-limit以获得更好的速率限制: npm install express-rate-limit');
  hasWarnings = true;
}

// 检查数据库文件权限
console.log('\n3. 检查数据库文件...');
if (fs.existsSync('wishes.db')) {
  const stats = fs.statSync('wishes.db');
  const mode = (stats.mode & parseInt('777', 8)).toString(8);
  if (mode === '600' || mode === '644') {
    console.log('   ✅ 数据库文件权限正常');
  } else {
    console.log(`   ⚠️  警告: 数据库文件权限为${mode}，建议设置为600`);
    hasWarnings = true;
  }
} else {
  console.log('   ℹ️  数据库文件不存在（首次运行正常）');
}

// 检查敏感文件
console.log('\n4. 检查敏感文件...');
const sensitiveFiles = ['.env', 'wishes.db'];
sensitiveFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const gitignore = fs.existsSync('.gitignore') ? fs.readFileSync('.gitignore', 'utf8') : '';
    if (!gitignore.includes(file)) {
      console.log(`   ⚠️  警告: ${file} 未在.gitignore中，可能被提交到Git！`);
      hasWarnings = true;
    } else {
      console.log(`   ✅ ${file} 已在.gitignore中`);
    }
  }
});

// 检查代码中的硬编码密码
console.log('\n5. 检查代码中的安全问题...');
const serverCode = fs.readFileSync('server.js', 'utf8');
if (serverCode.includes("ADMIN_PASSWORD || 'CC!E!nfr4'")) {
  console.log('   ✅ 代码已使用环境变量，未硬编码密码');
} else if (serverCode.includes("'admin'") && serverCode.includes('ADMIN_PASSWORD')) {
  console.log('   ⚠️  警告: 代码中可能包含硬编码密码');
  hasWarnings = true;
}

// 总结
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ 发现错误！请修复后再部署。');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  发现警告，建议修复后再部署。');
  process.exit(0);
} else {
  console.log('✅ 安全检查通过！可以安全部署。');
  process.exit(0);
}

