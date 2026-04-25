module.exports = {
  apps: [
    {
      name: 'aguiatech',
      script: 'bun',
      args: 'run start',
      cwd: '/opt/aguiatech',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        DATABASE_URL: 'file:/opt/aguiatech/db/custom.db',
      },
      // Limites de recursos para VPS 8GB
      max_memory_restart: '500M',
      // Restart automático em caso de crash
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      // Watch para desenvolvimento (desativado em prod)
      watch: false,
      // Logs
      error_file: '/opt/aguiatech/logs/error.log',
      out_file: '/opt/aguiatech/logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 30000,
      shutdown_with_message: true,
    },
  ],
}
