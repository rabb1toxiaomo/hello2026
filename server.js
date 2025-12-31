/**
 * 2026 马年祝福留言墙 - 服务器端
 * 
 * 项目信息:
 * - 完成时间: 2025-12-31 12:00-24:00 GMT+8
 * - 作者: @xiaomo
 * - 状态: 已完成并部署
 * 
 * @author @xiaomo
 * @date 2025-12-31
 */

const express = require('express');
const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// 安全相关模块（可选，如果未安装会降级处理）
let helmet, expressRateLimit, expressValidator;
try {
  helmet = require('helmet');
} catch (e) {
  console.warn('⚠️  helmet未安装，部分安全头将缺失');
}
try {
  expressRateLimit = require('express-rate-limit');
} catch (e) {
  console.warn('⚠️  express-rate-limit未安装，速率限制将使用简单实现');
}

// 加载环境变量（如果使用dotenv）
try {
  require('dotenv').config();
} catch (e) {
  // dotenv未安装，使用默认值
}

const app = express();
let db;

// 从环境变量读取配置，提供默认值
const DB_PATH = process.env.DB_PATH || './wishes.db';
const PORT = process.env.PORT || 2026;
const HOST = process.env.HOST || '172.16.2.1';
const NODE_ENV = process.env.NODE_ENV || 'development';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || (() => {
  console.warn('⚠️  警告：未设置ADMIN_PASSWORD环境变量，使用默认密码 admin！生产环境请务必设置！');
  return 'admin';
})();
const DOMAIN = process.env.DOMAIN || HOST;
const BASE_URL = process.env.BASE_URL || `http://${DOMAIN}:${PORT}`;

const onlineUsers = new Map();
const danmakuQueue = [];

// ========== 安全配置 ==========
// 速率限制存储（简单内存实现，生产环境建议使用Redis）
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15分钟
const RATE_LIMIT_MAX = 100; // 每个IP最多100个请求

// 简单的速率限制中间件
function rateLimitMiddleware(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  
  // 清理过期记录
  if (rateLimitStore.size > 10000) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (now - value.resetTime > RATE_LIMIT_WINDOW) {
        rateLimitStore.delete(key);
      }
    }
  }
  
  const key = `${ip}:${req.path}`;
  const record = rateLimitStore.get(key);
  
  if (!record || now - record.resetTime > RATE_LIMIT_WINDOW) {
    rateLimitStore.set(key, { count: 1, resetTime: now });
    return next();
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return res.status(429).json({ 
      error: 'Too many requests', 
      retryAfter: Math.ceil((RATE_LIMIT_WINDOW - (now - record.resetTime)) / 1000) 
    });
  }
  
  record.count++;
  next();
}

// 输入验证和清理函数
function sanitizeInput(str, maxLength = 1000) {
  if (typeof str !== 'string') return '';
  // 移除潜在的XSS攻击字符
  return str
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // 移除<和>防止HTML注入
    .trim();
}

function validateUserId(userId) {
  const id = parseInt(userId);
  return !isNaN(id) && id > 0 && id < 2147483647; // 防止整数溢出
}

function validateContent(content, maxLength = 200) {
  if (!content || typeof content !== 'string') return false;
  const cleaned = sanitizeInput(content, maxLength);
  return cleaned.length > 0 && cleaned.length <= maxLength;
}

// 行业祝福库 - Z时代风格
const industryBlessings = {
  tech: [
    '2026马年，愿你的代码零bug，头发不掉，年终奖爆表！',
    '新年快乐！愿你的PR秒merge，review全是LGTM',
    '马年冲冲冲！愿你的技术栈永远最新，不被卷死',
    '2026，愿你的服务器永不宕机，监控永远绿色',
    '祝你新年不被产品经理PUA，需求不再改改改',
    '愿你的Git提交记录比你的头发还多',
    '马年快乐！愿你的debug一次成功，不用Stack Overflow',
    '2026，愿你的年终奖比代码行数还多',
    '祝你新年技术力拉满，升职加薪不是梦',
    '愿你的IDE永远不卡，插件永远兼容'
  ],
  design: [
    '2026马年，愿你的设计一稿过，甲方不再改改改',
    '新年快乐！愿你的灵感爆棚，作品出圈上热搜',
    '马年冲冲冲！愿你的配色永远高级，不再被说土',
    '2026，愿你的设计稿不再被压缩，像素永远清晰',
    '祝你新年创意无限，作品集爆满，offer随便挑',
    '愿你的素材永远不缺，版权不愁，灵感不断',
    '马年快乐！愿你的审美永远在线，不再被说low',
    '2026，愿你的设计被全网转发，点赞破万',
    '祝你新年作品出圈，甲方满意，钱包鼓鼓',
    '愿你的图层永远整齐，文件不丢，PS不崩'
  ],
  finance: [
    '2026马年，愿你的投资只涨不跌，账户余额无限',
    '新年快乐！愿你的KPI轻松达成，年终奖翻倍',
    '马年冲冲冲！愿你的基金全是红的，股票涨停',
    '2026，愿你的报表永远平衡，Excel不崩',
    '祝你新年暴富暴美，理财收益超过通胀',
    '愿你的客户永远不跑路，项目永远赚钱',
    '马年快乐！愿你的审计顺利，账目清晰',
    '2026，愿你的工资涨涨涨，副业收入翻倍',
    '祝你新年财源广进，钱包鼓鼓，生活美美',
    '愿你的投资眼光永远精准，收益永远正'
  ],
  student: [
    '2026马年，愿你的考试全过，绩点4.0，奖学金拿到手软',
    '新年快乐！愿你的论文一次过，导师永远和蔼',
    '马年冲冲冲！愿你的选课永远不被挤掉，DDL永远不赶',
    '2026，愿你的室友永远安静，WiFi永远满格',
    '祝你新年offer拿到手软，实习转正，前途光明',
    '愿你的实验数据完美，报告一次过，不再熬夜',
    '马年快乐！愿你的图书馆座位永远有，食堂永远好吃',
    '2026，愿你的社团活动顺利，校园生活精彩',
    '祝你新年学习进步，生活充实，未来可期',
    '愿你的大学生活精彩纷呈，不留遗憾'
  ],
  medical: [
    '2026马年，愿你的患者都康复，夜班不太累，工资涨涨涨',
    '新年快乐！愿你的手术都成功，医患关系和谐',
    '马年冲冲冲！愿你有时间好好休息，不再熬夜',
    '2026，愿你的值班永远平静，病历永远整齐',
    '祝你新年健康平安，救死扶伤，功德无量',
    '愿你的科研顺利，论文高产，职称晋升',
    '马年快乐！愿你的患者都理解你的辛苦，不再医闹',
    '2026，愿你的假期不被取消，生活工作平衡',
    '祝你新年工作顺利，身体健康，家庭幸福',
    '愿你的医术精进，患者满意，社会认可'
  ],
  teacher: [
    '2026马年，愿你的学生都听话，作业都交齐，成绩都优秀',
    '新年快乐！愿你的嗓子永远好，不再沙哑',
    '马年冲冲冲！愿家长群永远和谐，不再撕逼',
    '2026，愿你的课件永远不丢，U盘不坏，电脑不崩',
    '祝你新年教学顺利，学生成才，桃李满天下',
    '愿你的学生都考上理想学校，不再让你操心',
    '马年快乐！愿你的评职称顺利，工资涨涨涨',
    '2026，愿你的班级永远第一，纪律最好，成绩最优',
    '祝你新年寒暑假不被占用，生活工作平衡',
    '愿你的教育事业蒸蒸日上，学生爱戴，家长认可'
  ],
  general: [
    '2026马年，暴富暴美暴开心！搞钱搞对象都顺利！',
    '新年快乐！愿你不内卷，躺平也能赢，生活美滋滋',
    '马年冲冲冲！愿你的人生开挂，运气爆棚，好事连连',
    '2026，愿你能摸鱼也能摸到钱，工作生活两不误',
    '祝你新年快递永远不丢件，外卖永远准时，WiFi永远满格',
    '愿你的2026，抽卡必出金，游戏不卡顿，生活不emo',
    '马年快乐！愿你被爱包围，电量充足，心情永远好',
    '2026，愿你想瘦的地方瘦，想胖的地方胖，颜值永远在线',
    '祝你新年万事顺意，天天好心情，不再emo',
    '愿你的2026，既有诗和远方，也有眼前的苟且，但都美好'
  ]
};

// 12条默认祝福 - Z时代论坛风格
const defaultBlessings = [
  '2026马年冲冲冲！愿大家都能实现自己的小目标，不再被生活PUA',
  '新年快乐！愿大家的钱包都鼓鼓的，不再为钱发愁',
  '马年快乐！愿大家的感情都顺利，不再单身，不再emo',
  '2026，愿大家都能找到自己的节奏，不再内卷，不再焦虑',
  '新年快乐！愿大家的工作都顺利，不再996，不再被老板PUA',
  '马年冲冲冲！愿大家的生活都精彩，不再单调，不再无聊',
  '2026，愿大家都能做自己喜欢的事，不再被现实打败',
  '新年快乐！愿大家的梦想都能实现，不再只是想想',
  '马年快乐！愿大家的未来都光明，不再迷茫，不再彷徨',
  '2026，愿大家都能遇到对的人，不再错过，不再遗憾',
  '新年快乐！愿大家的身体都健康，不再熬夜，不再透支',
  '马年冲冲冲！愿大家的2026都精彩，不再平凡，不再普通'
];

async function initDatabase() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    db = new SQL.Database();
  }

  db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, nickname TEXT UNIQUE NOT NULL, password TEXT NOT NULL, gender TEXT, age INTEGER, industry TEXT, is_admin INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)');
  db.run('CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, content TEXT NOT NULL, parent_id INTEGER DEFAULT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)');
  db.run('CREATE TABLE IF NOT EXISTS blessings (id INTEGER PRIMARY KEY AUTOINCREMENT, content TEXT NOT NULL, is_system INTEGER DEFAULT 0)');
  db.run('CREATE TABLE IF NOT EXISTS stats (id INTEGER PRIMARY KEY, total_likes INTEGER DEFAULT 0, total_gifts INTEGER DEFAULT 0)');
  db.run('CREATE TABLE IF NOT EXISTS user_stats (user_id INTEGER PRIMARY KEY, likes_given INTEGER DEFAULT 0, gifts_given INTEGER DEFAULT 0, messages_sent INTEGER DEFAULT 0)');
  db.run('CREATE TABLE IF NOT EXISTS postcards (id INTEGER PRIMARY KEY AUTOINCREMENT, card_number TEXT UNIQUE NOT NULL, user_id INTEGER NOT NULL, user_nickname TEXT NOT NULL, user_industry TEXT, user_messages_count INTEGER DEFAULT 0, user_likes_count INTEGER DEFAULT 0, user_gifts_count INTEGER DEFAULT 0, interaction_duration INTEGER DEFAULT 0, user_message TEXT, website_blessing TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, timestamp_proof TEXT)');
  db.run('CREATE TABLE IF NOT EXISTS user_sessions (user_id INTEGER PRIMARY KEY, login_time INTEGER, last_active_time INTEGER)');

  if (db.exec('SELECT COUNT(*) FROM stats')[0].values[0][0] === 0) {
    db.run('INSERT INTO stats (id, total_likes, total_gifts) VALUES (1, 0, 0)');
  }

  if (db.exec(`SELECT COUNT(*) FROM users WHERE nickname = '${ADMIN_USERNAME.replace(/'/g, "''")}'`)[0].values[0][0] === 0) {
    db.run(`INSERT INTO users (nickname, password, is_admin) VALUES (?, ?, 1)`, [ADMIN_USERNAME, bcrypt.hashSync(ADMIN_PASSWORD, 10)]);
    console.log(`Admin created: ${ADMIN_USERNAME}`);
  }

  if (db.exec('SELECT COUNT(*) FROM blessings WHERE is_system = 1')[0].values[0][0] === 0) {
    defaultBlessings.forEach(b => db.run('INSERT INTO blessings (content, is_system) VALUES (?, 1)', [b]));
  }

  saveDatabase();
  console.log('DB ready');
}

function saveDatabase() {
  try {
    // 确保目录存在
    const dbDir = path.dirname(DB_PATH);
    if (dbDir !== '.' && !fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    // 保存数据库，使用原子写入避免数据损坏
    const tempPath = DB_PATH + '.tmp';
    fs.writeFileSync(tempPath, Buffer.from(db.export()));
    fs.renameSync(tempPath, DB_PATH);
  } catch (err) {
    console.error('保存数据库失败:', err);
    // 不抛出错误，避免影响服务运行
  }
}

// 定期保存数据库（每30秒）
setInterval(() => {
  if (db) {
    saveDatabase();
  }
}, 30000);

// 清理离线用户
setInterval(() => {
  const now = Date.now();
  for (const [id] of onlineUsers) {
    if (now - onlineUsers.get(id).lastSeen > 30000) onlineUsers.delete(id);
  }
}, 10000);

// 全局错误处理
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
  // 保存数据库
  if (db) {
    try {
      saveDatabase();
    } catch (e) {
      console.error('保存数据库失败:', e);
    }
  }
  // 不退出进程，保持服务运行
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  // 不退出进程，保持服务运行
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在关闭...');
  if (db) {
    saveDatabase();
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，正在关闭...');
  if (db) {
    saveDatabase();
  }
  process.exit(0);
});

// ========== 安全中间件 ==========
// Helmet安全头（如果已安装）
if (helmet) {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false, // 允许嵌入资源
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));
} else {
  // 手动设置基本安全头
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });
}

// CORS配置（支持HTTP和HTTPS）
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
    process.env.ALLOWED_ORIGINS.split(',') : 
    [`http://localhost:${PORT}`, `http://${HOST}:${PORT}`, 'http://localhost:3000'];
  
  // 开发环境允许所有源，生产环境检查白名单
  if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// 请求体解析（限制大小）
app.use(express.json({ limit: '1mb' })); // 降低到1MB，防止DoS
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 速率限制
app.use(rateLimitMiddleware);

// 静态文件服务（使用绝对路径，确保能找到文件）
app.use(express.static(path.join(__dirname, 'public')));

// 请求日志和安全监控
app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const logMsg = `${new Date().toISOString()} [${ip}] ${req.method} ${req.path}`;
  
  if (NODE_ENV === 'development') {
    console.log(logMsg);
  }
  
  // 生产环境记录可疑请求
  if (NODE_ENV === 'production') {
    // 检测可疑路径
    const suspiciousPatterns = ['/admin', '/.env', '/config', '/wp-admin', '/phpmyadmin'];
    if (suspiciousPatterns.some(pattern => req.path.toLowerCase().includes(pattern))) {
      console.warn(`⚠️  可疑请求: ${logMsg}`);
    }
  }
  
  next();
});

// 错误处理和日志
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 健康检查接口
app.get('/health', (req, res) => {
  try {
    // 检查数据库连接
    if (!db) {
      return res.status(503).json({ status: 'unhealthy', reason: 'database not initialized' });
    }
    
    // 简单查询测试
    db.exec('SELECT 1');
    
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      onlineUsers: onlineUsers.size
    });
  } catch (err) {
    res.status(503).json({ status: 'unhealthy', error: err.message });
  }
});

app.post('/api/register', (req, res) => {
  const { nickname, password, gender, age, industry } = req.body;
  if (!nickname || !password) return res.status(400).json({ error: 'Required' });
  
  // 输入验证和清理
  const cleanNickname = sanitizeInput(nickname, 50);
  if (!cleanNickname || cleanNickname.length < 1) {
    return res.status(400).json({ error: 'Invalid nickname' });
  }
  if (cleanNickname.length > 50) {
    return res.status(400).json({ error: 'Nickname too long' });
  }
  if (password.length < 3 || password.length > 100) {
    return res.status(400).json({ error: 'Password length invalid' });
  }
  
  // 验证行业参数
  const validIndustries = ['tech', 'design', 'finance', 'student', 'medical', 'teacher', 'general'];
  const cleanIndustry = validIndustries.includes(industry) ? industry : 'general';
  
  // 验证年龄
  let cleanAge = null;
  if (age !== undefined && age !== null) {
    const ageNum = parseInt(age);
    if (!isNaN(ageNum) && ageNum > 0 && ageNum <= 120) {
      cleanAge = ageNum;
    }
  }
  
  try {
    // 使用参数化查询防止SQL注入
    const stmt = db.prepare('SELECT COUNT(*) FROM users WHERE nickname = ?');
    stmt.bind([cleanNickname]);
    let exists = false;
    if (stmt.step()) {
      exists = stmt.get()[0] > 0;
    }
    stmt.free();
    
    if (exists) {
      return res.status(400).json({ error: 'Nickname taken' });
    }
    
    // 插入用户（使用清理后的数据）
    db.run('INSERT INTO users (nickname, password, gender, age, industry) VALUES (?, ?, ?, ?, ?)', 
      [cleanNickname, bcrypt.hashSync(password, 10), gender || null, cleanAge, cleanIndustry]);
    const userId = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
    db.run('INSERT INTO user_stats (user_id) VALUES (?)', [userId]);
    
    // 异步保存，不阻塞响应
    setImmediate(() => saveDatabase());
    console.log('User registered:', cleanNickname, 'ID:', userId);
    res.json({ success: true, userId, nickname: cleanNickname, industry: cleanIndustry });
  } catch (err) {
    console.error('Register error:', err);
    res.status(400).json({ error: err.message?.includes('UNIQUE') ? 'Nickname taken' : 'Failed' });
  }
});

app.post('/api/login', (req, res) => {
  const { nickname, password } = req.body;
  if (!nickname || !password) {
    return res.status(400).json({ error: 'Required' });
  }
  
  // 输入清理
  const cleanNickname = sanitizeInput(nickname, 50);
  if (!cleanNickname) {
    return res.status(400).json({ error: 'Invalid input' });
  }
  
  try {
    const stmt = db.prepare('SELECT * FROM users WHERE nickname = ?');
    stmt.bind([cleanNickname]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      if (bcrypt.compareSync(password, row.password)) {
        stmt.free();
        
        // 记录登录时间
        const now = Date.now();
        db.run('INSERT OR REPLACE INTO user_sessions (user_id, login_time, last_active_time) VALUES (?, ?, ?)', [row.id, now, now]);
        
        return res.json({ success: true, userId: row.id, nickname: row.nickname, industry: row.industry, isAdmin: row.is_admin === 1 });
      }
    }
    stmt.free();
    res.status(401).json({ error: 'Invalid' });
  } catch (err) {
    res.status(401).json({ error: 'Failed' });
  }
});

app.post('/api/heartbeat', (req, res) => {
  const { odId, nickname } = req.body;
  if (odId) onlineUsers.set(odId, { nickname: nickname || 'Guest', lastSeen: Date.now() });
  res.json({ success: true });
});

app.get('/api/overview', (req, res) => {
  try {
    const users = db.exec('SELECT COUNT(*) FROM users')[0]?.values[0][0] || 0;
    const msgs = db.exec('SELECT COUNT(*) FROM messages')[0]?.values[0][0] || 0;
    const stats = db.exec('SELECT total_likes, total_gifts FROM stats WHERE id = 1')[0]?.values[0] || [0, 0];
    res.json({ onlineCount: onlineUsers.size, totalUsers: users, totalMessages: msgs, totalLikes: stats[0], totalGifts: stats[1] });
  } catch (err) {
    res.json({ onlineCount: 0, totalUsers: 0, totalMessages: 0, totalLikes: 0, totalGifts: 0 });
  }
});

app.get('/api/leaderboard', (req, res) => {
  try {
    const result = db.exec('SELECT u.nickname, us.messages_sent, us.likes_given, us.gifts_given, (us.messages_sent * 10 + us.likes_given + us.gifts_given * 5) as score FROM user_stats us JOIN users u ON us.user_id = u.id ORDER BY score DESC LIMIT 10');
    res.json(result.length > 0 ? result[0].values.map(r => ({ nickname: r[0], messages: r[1], likes: r[2], gifts: r[3], score: r[4] })) : []);
  } catch (err) { res.json([]); }
});

app.post('/api/like', (req, res) => {
  const { userId } = req.body;
  if (userId && !validateUserId(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  try {
    db.run('UPDATE stats SET total_likes = total_likes + 1 WHERE id = 1');
    if (userId) db.run('UPDATE user_stats SET likes_given = likes_given + 1 WHERE user_id = ?', [userId]);
    saveDatabase();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/gift', (req, res) => {
  const { userId } = req.body;
  if (userId && !validateUserId(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  try {
    db.run('UPDATE stats SET total_gifts = total_gifts + 1 WHERE id = 1');
    if (userId) db.run('UPDATE user_stats SET gifts_given = gifts_given + 1 WHERE user_id = ?', [userId]);
    saveDatabase();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/blessings', (req, res) => {
  const nickname = sanitizeInput(req.query.nickname || 'Friend', 50);
  const industry = req.query.industry || 'general';
  const validIndustries = ['tech', 'design', 'finance', 'student', 'medical', 'teacher', 'general'];
  const cleanIndustry = validIndustries.includes(industry) ? industry : 'general';
  const list = industryBlessings[cleanIndustry] || industryBlessings.general;
  const mixed = [...list, ...industryBlessings.general].sort(() => Math.random() - 0.5).slice(0, 6);
  res.json(mixed.map(b => 'Dear ' + nickname + ', ' + b));
});

app.get('/api/lucky-wheel', (req, res) => {
  const industry = req.query.industry || 'general';
  const validIndustries = ['tech', 'design', 'finance', 'student', 'medical', 'teacher', 'general'];
  const cleanIndustry = validIndustries.includes(industry) ? industry : 'general';
  const list = industryBlessings[industry] || industryBlessings.general;
  
  // 行业相关祝福权重更高
  const industryWeight = [...list, ...list, ...list]; // 行业祝福出现概率更高
  const all = [...industryWeight, ...industryBlessings.general];
  
  const blessing = all[Math.floor(Math.random() * all.length)];
  
  // 根据是否在行业列表中来决定稀有度
  const isIndustrySpecific = list.includes(blessing);
  let rarity = 'common';
  const rand = Math.random();
  
  if (isIndustrySpecific) {
    // 行业祝福更容易出稀有
    if (rand < 0.1) rarity = 'legendary';
    else if (rand < 0.4) rarity = 'rare';
  } else {
    // 通用祝福
    if (rand < 0.05) rarity = 'legendary';
    else if (rand < 0.2) rarity = 'rare';
  }
  
  res.json({ blessing, rarity, industry: cleanIndustry });
});

app.get('/api/industry-blessings', (req, res) => {
  const industry = req.query.industry || 'general';
  const nickname = sanitizeInput(req.query.nickname || 'Friend', 50);
  const validIndustries = ['tech', 'design', 'finance', 'student', 'medical', 'teacher', 'general'];
  const cleanIndustry = validIndustries.includes(industry) ? industry : 'general';
  const list = industryBlessings[cleanIndustry] || industryBlessings.general;
  res.json(list.map(b => 'Dear ' + nickname + ', ' + b));
});

app.post('/api/messages', (req, res) => {
  const { userId, content, parentId } = req.body;
  if (!userId || !content) return res.status(400).json({ error: 'Required fields missing' });
  
  // 输入验证
  if (!validateUserId(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  if (!validateContent(content, 200)) {
    return res.status(400).json({ error: 'Invalid content' });
  }
  
  const cleanContent = sanitizeInput(content, 200);
  const cleanParentId = parentId ? (validateUserId(parentId) ? parentId : null) : null;
  
  try {
    db.run('INSERT INTO messages (user_id, content, parent_id) VALUES (?, ?, ?)', [userId, cleanContent, cleanParentId]);
    const msgId = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
    
    // 只有主消息才加入祝福库和弹幕
    if (!cleanParentId) {
      db.run('INSERT INTO blessings (content, is_system) VALUES (?, 0)', [cleanContent]);
      db.run('UPDATE user_stats SET messages_sent = messages_sent + 1 WHERE user_id = ?', [userId]);
      // 使用参数化查询防止SQL注入
      const userStmt = db.prepare('SELECT nickname FROM users WHERE id = ?');
      userStmt.bind([userId]);
      let nickname = 'Anon';
      if (userStmt.step()) {
        nickname = userStmt.get()[0] || 'Anon';
      }
      userStmt.free();
      danmakuQueue.push({ content: cleanContent, nickname, time: Date.now() });
      if (danmakuQueue.length > 50) danmakuQueue.shift();
    }
    
    saveDatabase();
    res.json({ success: true, messageId: msgId });
  } catch (err) { 
    console.error('Message error:', err);
    res.status(500).json({ error: 'Failed' }); 
  }
});

app.get('/api/messages', (req, res) => {
  // 获取主消息和回复
  const result = db.exec(`
    SELECT m.id, m.content, m.created_at, m.parent_id, m.user_id, u.nickname 
    FROM messages m 
    JOIN users u ON m.user_id = u.id 
    ORDER BY m.created_at DESC 
    LIMIT 200
  `);
  
  const messages = result.length > 0 ? result[0].values.map(r => ({ 
    id: r[0], 
    content: r[1], 
    created_at: r[2], 
    parent_id: r[3], 
    user_id: r[4], 
    nickname: r[5] 
  })) : [];
  
  // 获取回复
  const replyResult = db.exec(`
    SELECT m.id, m.content, m.created_at, m.parent_id, m.user_id, u.nickname 
    FROM messages m 
    JOIN users u ON m.user_id = u.id 
    WHERE m.parent_id IS NOT NULL
    ORDER BY m.created_at ASC
  `);
  
  const replies = replyResult.length > 0 ? replyResult[0].values.map(r => ({ 
    id: r[0], 
    content: r[1], 
    created_at: r[2], 
    parent_id: r[3], 
    user_id: r[4], 
    nickname: r[5] 
  })) : [];
  
  // 将回复附加到主消息
  const messagesWithReplies = messages.map(msg => {
    if (!msg.parent_id) {
      msg.replies = replies.filter(r => r.parent_id === msg.id);
    }
    return msg;
  }).filter(msg => !msg.parent_id); // 只返回主消息
  
  res.json(messagesWithReplies);
});

app.put('/api/messages/:id', (req, res) => {
  const { id } = req.params;
  const { userId, content } = req.body;
  
  // 输入验证
  if (!validateUserId(id) || !validateUserId(userId)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }
  if (!validateContent(content, 200)) {
    return res.status(400).json({ error: 'Invalid content' });
  }
  
  const cleanContent = sanitizeInput(content, 200);
  
  try {
    // 使用参数化查询防止SQL注入
    const checkStmt = db.prepare('SELECT user_id FROM messages WHERE id = ?');
    checkStmt.bind([id]);
    let isOwner = false;
    if (checkStmt.step()) {
      isOwner = checkStmt.get()[0] === userId;
    }
    checkStmt.free();
    
    if (!isOwner) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    db.run('UPDATE messages SET content = ? WHERE id = ?', [cleanContent, id]);
    saveDatabase();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.delete('/api/messages/:id', (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  
  // 输入验证
  if (!validateUserId(id) || !validateUserId(userId)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }
  
  try {
    // 使用参数化查询防止SQL注入
    const checkStmt = db.prepare('SELECT user_id FROM messages WHERE id = ?');
    checkStmt.bind([id]);
    let isOwner = false;
    if (checkStmt.step()) {
      isOwner = checkStmt.get()[0] === userId;
    }
    checkStmt.free();
    
    if (!isOwner) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    db.run('DELETE FROM messages WHERE id = ? OR parent_id = ?', [id, id]);
    saveDatabase();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/danmaku', (req, res) => {
  const since = parseInt(req.query.since) || 0;
  // 验证时间戳范围（防止整数溢出）
  const validSince = isNaN(since) || since < 0 || since > Date.now() ? 0 : since;
  res.json(danmakuQueue.filter(d => d.time > validSince));
});

app.get('/api/countdown', (req, res) => {
  // 2026年春节：2月17日 00:00:00 GMT+8
  // 春节结束（正月十五）：3月3日 23:59:59 GMT+8
  const target = new Date('2026-02-17T00:00:00+08:00');
  const end = new Date('2026-03-03T23:59:59+08:00');
  const now = new Date();
  
  // 如果现在在春节期间，显示到结束的倒计时
  // 如果现在在春节前，显示到开始的倒计时
  // 如果现在在春节后，显示已结束
  let displayTarget = target;
  let status = 'before';
  
  if (now >= target && now <= end) {
    displayTarget = end;
    status = 'during';
  } else if (now > end) {
    status = 'ended';
  }
  
  res.json({ 
    target: target.toISOString(), 
    end: end.toISOString(),
    displayTarget: displayTarget.toISOString(),
    status,
    year: 2026, 
    zodiac: 'Horse' 
  });
});

// 详细的Overview接口
app.get('/api/overview/detailed', (req, res) => {
  try {
    const users = db.exec('SELECT COUNT(*) FROM users')[0]?.values[0][0] || 0;
    const msgs = db.exec('SELECT COUNT(*) FROM messages')[0]?.values[0][0] || 0;
    const replies = db.exec('SELECT COUNT(*) FROM messages WHERE parent_id IS NOT NULL')[0]?.values[0][0] || 0;
    const stats = db.exec('SELECT total_likes, total_gifts FROM stats WHERE id = 1')[0]?.values[0] || [0, 0];
    
    // 按行业统计
    const industryStats = db.exec(`
      SELECT industry, COUNT(*) as count 
      FROM users 
      WHERE industry IS NOT NULL 
      GROUP BY industry
    `);
    
    const industryData = industryStats.length > 0 ? 
      industryStats[0].values.map(r => ({ industry: r[0], count: r[1] })) : [];
    
    // 今日活跃用户（使用参数化查询）
    const today = new Date().toISOString().split('T')[0];
    const todayStmt = db.prepare('SELECT COUNT(DISTINCT user_id) FROM messages WHERE DATE(created_at) = ?');
    todayStmt.bind([today]);
    let todayActive = 0;
    if (todayStmt.step()) {
      todayActive = todayStmt.get()[0] || 0;
    }
    todayStmt.free();
    
    res.json({ 
      onlineCount: onlineUsers.size, 
      totalUsers: users, 
      totalMessages: msgs,
      totalReplies: replies,
      totalLikes: stats[0], 
      totalGifts: stats[1],
      todayActive,
      industryStats: industryData
    });
  } catch (err) {
    console.error('Overview error:', err);
    res.json({ onlineCount: 0, totalUsers: 0, totalMessages: 0, totalReplies: 0, totalLikes: 0, totalGifts: 0, todayActive: 0, industryStats: [] });
  }
});

// ========== 明信片相关API ==========

// 生成唯一明信片编号
function generateCardNumber() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `PC${timestamp}${random}`;
}

// 获取用户交互时长（秒）
function getUserInteractionDuration(userId) {
  try {
    const stmt = db.prepare('SELECT login_time, last_active_time FROM user_sessions WHERE user_id = ?');
    stmt.bind([userId]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      const loginTime = row.login_time || Date.now();
      const lastActive = row.last_active_time || Date.now();
      const duration = Math.floor((lastActive - loginTime) / 1000); // 转换为秒
      stmt.free();
      return Math.max(0, duration);
    }
    stmt.free();
  } catch (err) {
    console.error('Get interaction duration error:', err);
  }
  return 0;
}

// 格式化时长（给普通用户看）
function formatDuration(seconds) {
  if (seconds < 60) {
    return `${seconds}秒`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}分钟`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (minutes > 0) {
      return `${hours}小时${minutes}分钟`;
    }
    return `${hours}小时`;
  }
}

// 生成明信片数据
app.post('/api/postcard/generate', (req, res) => {
  const { userId, userMessage } = req.body;
  
  if (!validateUserId(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  
  try {
    // 获取用户信息
    const userStmt = db.prepare('SELECT nickname, industry FROM users WHERE id = ?');
    userStmt.bind([userId]);
    let userInfo = null;
    if (userStmt.step()) {
      userInfo = userStmt.getAsObject();
    }
    userStmt.free();
    
    if (!userInfo) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // 获取用户统计数据
    const statsStmt = db.prepare('SELECT messages_sent, likes_given, gifts_given FROM user_stats WHERE user_id = ?');
    statsStmt.bind([userId]);
    let stats = { messages_sent: 0, likes_given: 0, gifts_given: 0 };
    if (statsStmt.step()) {
      stats = statsStmt.getAsObject();
    }
    statsStmt.free();
    
    // 获取交互时长
    const duration = getUserInteractionDuration(userId);
    
    // 生成祝福语
    const industry = userInfo.industry || 'general';
    const blessings = industryBlessings[industry] || industryBlessings.general;
    const websiteBlessing = blessings[Math.floor(Math.random() * blessings.length)];
    
    // 生成唯一编号
    let cardNumber;
    let attempts = 0;
    do {
      cardNumber = generateCardNumber();
      const checkStmt = db.prepare('SELECT COUNT(*) FROM postcards WHERE card_number = ?');
      checkStmt.bind([cardNumber]);
      let exists = false;
      if (checkStmt.step()) {
        exists = checkStmt.get()[0] > 0;
      }
      checkStmt.free();
      if (!exists) break;
      attempts++;
      if (attempts > 10) {
        // 如果10次都重复，添加更多随机数
        cardNumber = generateCardNumber() + Math.random().toString(36).substr(2, 5).toUpperCase();
        break;
      }
    } while (true);
    
    // 生成时间戳证明
    const timestampProof = new Date().toISOString();
    
    // 清理用户消息
    const cleanUserMessage = userMessage ? sanitizeInput(userMessage, 200) : '';
    
    // 保存明信片记录
    db.run('INSERT INTO postcards (card_number, user_id, user_nickname, user_industry, user_messages_count, user_likes_count, user_gifts_count, interaction_duration, user_message, website_blessing, timestamp_proof) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [cardNumber, userId, userInfo.nickname, industry, stats.messages_sent || 0, stats.likes_given || 0, stats.gifts_given || 0, duration, cleanUserMessage, websiteBlessing, timestampProof]);
    
    // 异步保存数据库
    setImmediate(() => saveDatabase());
    
    // 返回明信片数据
    res.json({
      success: true,
      cardNumber,
      userInfo: {
        nickname: userInfo.nickname,
        industry: industry
      },
      stats: {
        messagesCount: stats.messages_sent || 0,
        likesCount: stats.likes_given || 0,
        giftsCount: stats.gifts_given || 0,
        interactionDuration: duration,
        interactionDurationFormatted: formatDuration(duration)
      },
      userMessage: cleanUserMessage,
      websiteBlessing,
      timestampProof,
      createdAt: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
    });
  } catch (err) {
    console.error('Generate postcard error:', err);
    res.status(500).json({ error: 'Failed to generate postcard' });
  }
});

// 查询明信片（通过编号）
app.get('/api/postcard/:cardNumber', (req, res) => {
  const { cardNumber } = req.params;
  
  try {
    const stmt = db.prepare('SELECT * FROM postcards WHERE card_number = ?');
    stmt.bind([cardNumber]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      res.json({
        success: true,
        cardNumber: row.card_number,
        userInfo: {
          nickname: row.user_nickname,
          industry: row.user_industry
        },
        stats: {
          messagesCount: row.user_messages_count,
          likesCount: row.user_likes_count,
          giftsCount: row.user_gifts_count,
          interactionDuration: row.interaction_duration,
          interactionDurationFormatted: formatDuration(row.interaction_duration)
        },
        userMessage: row.user_message,
        websiteBlessing: row.website_blessing,
        timestampProof: row.timestamp_proof,
        createdAt: new Date(row.created_at).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
      });
    } else {
      stmt.free();
      res.status(404).json({ error: 'Postcard not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to query postcard' });
  }
});

// 启动服务器
initDatabase().then(() => {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(50));
    console.log('🎉 新年祝福墙服务器启动成功！');
    console.log('='.repeat(50));
    console.log(`📍 本地访问: http://localhost:${PORT}`);
    if (NODE_ENV === 'production') {
      console.log(`🌐 公网访问: ${BASE_URL}`);
    }
    console.log(`👤 管理员账号: ${ADMIN_USERNAME}`);
    console.log(`🔧 环境: ${NODE_ENV}`);
    console.log(`💾 数据库路径: ${DB_PATH}`);
    console.log(`⏰ 启动时间: ${new Date().toISOString()}`);
    console.log('='.repeat(50));
  });
  
  // 服务器错误处理
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ 端口 ${PORT} 已被占用`);
      process.exit(1);
    } else {
      console.error('❌ 服务器错误:', err);
    }
  });
  
  // 设置超时
  server.timeout = 120000; // 2分钟
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
  
}).catch(err => {
  console.error('❌ 数据库初始化失败:', err);
  // 生产环境不立即退出，尝试恢复
  if (NODE_ENV === 'production') {
    console.error('⚠️  生产环境：尝试5秒后重新初始化...');
    setTimeout(() => {
      initDatabase().catch(e => {
        console.error('❌ 重试失败，退出:', e);
        process.exit(1);
      });
    }, 5000);
  } else {
    process.exit(1);
  }
});
