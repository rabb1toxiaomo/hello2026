module.exports = {
  apps: [{
    name: 'hello2026',
    script: 'server.js',
    instances: 2,  // 使用 2 个实例，充分利用双核 CPU
    exec_mode: 'cluster',  // 集群模式，提高并发能力
    watch: false,
    max_memory_restart: '800M',  // 每个实例最多 800MB，2个实例共 1.6GB，4GB 内存充足
    env: {
      NODE_ENV: 'production',
      PORT: 2026,
      HOST: '172.16.2.1'
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
    // 监听文件变化（生产环境关闭）
    ignore_watch: ['node_modules', 'logs', '*.db', '*.db-journal']
  }]
};

