module.exports = {
  apps: [
    {
      name: "emailgenius-broadcasts-generator",
      script: "npm",
      args: "start",
      cwd: "/opt/emailgenius-broadcasts-generator",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        GOOGLE_CLOUD_PROJECT: "absolute-brook-452020-d5",
        GOOGLE_CLOUD_LOCATION: "us-central1",
        GOOGLE_APPLICATION_CREDENTIALS:
          "/opt/emailgenius/credentials/service-account.json",
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
        GOOGLE_CLOUD_PROJECT: "absolute-brook-452020-d5",
        GOOGLE_CLOUD_LOCATION: "us-central1",
        GOOGLE_APPLICATION_CREDENTIALS:
          "/opt/emailgenius/credentials/service-account.json",
      },
      error_file: "/var/log/pm2/emailgenius-error.log",
      out_file: "/var/log/pm2/emailgenius-out.log",
      log_file: "/var/log/pm2/emailgenius-combined.log",
      time: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      min_uptime: "10s",
      max_restarts: 5,
      restart_delay: 4000,
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 8000,
    },
  ],

  deploy: {
    production: {
      user: "ubuntu",
      host: "your-server-ip",
      ref: "origin/main",
      repo: "https://github.com/your-username/emailgenius-broadcasts-generator.git",
      path: "/opt/emailgenius-broadcasts-generator",
      "pre-deploy-local": "",
      "post-deploy":
        "npm install && npm run build && pm2 reload ecosystem.config.js --env production",
      "pre-setup": "",
    },
  },
};
