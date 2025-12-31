module.exports = {
  apps: [{
    name: 'hello2026',
    script: 'server.js',
    cwd: __dirname,  // 明确指定工作目录，确保能找到public文件夹
    instances: 1,  // 先改为1个实例，避免静态文件路径问题
    exec_mode: 'fork',  // 改为fork模式，更稳定
    watch: false,
    max_memory_restart: '800M',  // 每个实例最多 800MB
    env: {
      NODE_ENV: 'production',
      PORT: 2026,
      HOST: '0.0.0.0',  // 监听所有网络接口，允许公网访问
      DOMAIN: '154.8.235.129',
      BASE_URL: 'http://154.8.235.129:2026'
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 50,  // 增加重启次数
    min_uptime: '10s',
    restart_delay: 4000,
    // 健康检查
    health_check_grace_period: 3000,
    // 自动重启策略
    exp_backoff_restart_delay: 100,
    // 定时重启：每3小时重启一次，防止502错误
    // cron_restart: '0 */3 * * *' 表示每3小时的第0分钟重启（即0点、3点、6点、9点...）
    cron_restart: '0 */3 * * *',
    // 监听文件变化（生产环境关闭）
    ignore_watch: ['node_modules', 'logs', '*.db', '*.db-journal']
  }]
};

