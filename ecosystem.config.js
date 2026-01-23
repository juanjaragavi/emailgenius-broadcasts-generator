module.exports = {
  apps: [
    {
      name: "emailgenius-broadcasts-generator",
      script: "npm",
      args: "start",
      cwd: "/var/www/html/emailgenius-broadcasts-generator",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3020,

        // Google / Vertex AI
        GOOGLE_CLOUD_PROJECT: "absolute-brook-452020-d5",
        GOOGLE_CLOUD_LOCATION: "us-central1",
        GOOGLE_SERVICE_ACCOUNT_EMAIL:
          "sheets-service-account@absolute-brook-452020-d5.iam.gserviceaccount.com",
        GOOGLE_PRIVATE_KEY:
          "-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDbTvwo+VETRWO5\\npay4rZxmAAZS7Ww94B3+S9MDMnAv4B+uQYh1nwNoMmCWfblMxPnkl+SOSwVKObLC\\nIKVNvWqaG/VYPEQlJDAZA0k/RnVvY/6IGWC1dNrM+c4zvwGLcZQC9CarerqqnwPS\\ndeVPtYxVkAT206HquswoeLvmri3M4by2wWs/h/mCKnR1BaKR5q5EymCBZgXXsm5S\\nSH22FOatbkZFCnhPN+J2bQcHRhUeSAYJQ2SWdcvu3dcbhw8Q2G5t+Sg+RzHndILr\\nkZtV65Ix5JqgixoRoMHavkBbW7JTwJBdq9yrf1gV6FBqOMqQkoNx6C5RE4uIK3fa\\nx9qWqfS7AgMBAAECggEADARE7t3SYnLv5vE8CJaCtlgUAKE/yBgqrI9tDYTK/uSR\\n99Nhbch7wE7aWgSjjaBRbQQhouZbcNi+gcKWLC9P0wfrJp2OwlY8SHKUpeHvd14M\\nSVrSoL65anfZo544sHJVwN+t6sF7zvONmw+YtAhnmxycGQY5ngoEO8d5zEcI/Wvb\\nCb+Wi0sXOnDBWjiyXqfutpcMaAE2gBck5t76enYW068vrX5tqhVaOyPzD40U2Pvp\\npLmccUU2H0++6lzRmYmG3c1ioxN1Y3WBw1emHZfk7ruupc/7hFMBhn5GEfPFoWHv\\nntWUuYKxm9XiE74DFAA6J17vhPPJ1y8VDu0jUptH8QKBgQD+k6v9TjFQBGcp/nkQ\\n86nzl4L4hZ6wXaRRK95qutQIK/uTATBFKoTra3lPiSoq/1kGaDmB60NRCq8RLyxm\\nCUC/6Aez9Lq1K/3kpPfiDf1/310M4V4VV/G2mxwzkawIp2QnkwCKlP224DuVjvuw\\nN9TTgzl9ZDM7D3mZT4YEDm+MyQKBgQDciNcaCyvZ7h2zVNNjZcEokVm6UaNeOUdJ\\n2O5u/BGDMz4iW0yJXfF2nZTQ+n+w8S7UPVukcQy9cDRRSUNZ8cTZs3qnp24VuZ4G\\ngvQDwtUC81B9viIENFXfJ/qxl7k+zK+akWjW0ndtRfcFBiYEmjvt+5RSZ1RRHXMw\\nT+4yp/rrYwKBgQC5MT3NcGNpHTrbDraNgWQhwxdQqQtuq0BMmEgdhjmWlEBXiWbO\\n+gZlp/JAzLxzOPxPL+SdwUJgIxCFxLZcp+CFekqYO7DS+OSivutgc+L0cc2kABJM\\nHoTE3QNf9FmclgDC1SpwpcAHmAlgW/p2D7dwAqcAs7KdBT3lLDeGneXCGQKBgGBq\\nQwBT2fwRKlL4xuIx3lzKDxxyDKZpDE2w1a0X7uAZSxTiLXfw5lwhUKp8mc7V4s9P\\nc/1Un2lC4NyY1yU/mfxDh2A8xtggqoHWRrBOQapkjdAri9uitdg2NlfmKUrXWf6N\\ni/Q/V48ig3hi08Q3WfQVhSbxnd9IrM92YoErB3xZAoGBALWIz9n5Y0Ac0PEjW2Kr\\n7FYPnH3FpbA9mbKIvFtq90ATTFG4N9UQLEfWnUQQpjpRWhSRLhmr/T+fv78ex2jI\\nkzV7K5q9z18dolbRbBXjGOeSBk/005pYv65c3KA+Q9idOseNwPWqRWdo8cbDNxAR\\nekMQCv3cMi2QUiBJ2CmDu4cW\\n-----END PRIVATE KEY-----\\n",
        VERTEX_AI_DATASTORE:
          "projects/absolute-brook-452020-d5/locations/global/collections/default_collection/dataStores/ejemplos-y-plantillas-folder-august-2025_1753117635099",
        VERTEX_AI_PROJECT_ID: "absolute-brook-452020-d5",
        VERTEX_AI_LOCATION: "global",

        // GitHub App (EmailGenius Upload Bot)
        GITHUB_OWNER: "juanjaragavi",
        GITHUB_REPO: "emailgenius-winner-broadcasts-subjects",
        GITHUB_APP_ID: 1821194,
        GITHUB_APP_PRIVATE_KEY:
          "-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEAq+i+3g1uxVc8CcndyE0l4lDS6DEl/mSCpY9xZx0fh3EXXKXy\nNhAEi2KmWvbglV8833UvcLGCxQ85gPiNzU4C1Ndza/uXYo6MdYbgOcVNTiWNfmqa\nzOyEYJw+vQnlWIhPKwqbp1CvclIabIXo+V1yCWDzwjaxPisEaIp436l4HshxnaAx\n/BJaimGVKHBCk5udv+YoNgPTZwQSVJKELjBY8GFgnpwg1b7qgt/jvz78e2y2RqJ4\nADFw/Ii9mzMoNL6ynPHVYa1iLZnQnpVHl/STZVA3v8TEvnsovLZ3hUirQtEio1Qu\niDdD9RDS8+xGmfXvQxwJJAk2Lx2G0HlAu1D/fQIDAQABAoIBAHKIIznvuyAxCWgA\nHQnJFHden9VggU6mikBhfA1V4t6q4wSv7tpD+7Mdq3WpS2FZTUYXXd739QbzKL2b\nW2YwFkTVsil8OpTIIh5fGN6EbAenj0htH+ttnJh9IHNzt2AvmIc1jxR+9hT1THOH\nF/ujXUmQVXbMV3Py1wILV5Kz5rqies9EqF1O3wKAoPAgNvxJ4EZmNlZIaguEmBKK\n272r+cyI9ytdL45Lp7aK2Y4qhqL+Yn2uWJ7KcbH90HB4yOtkWcDyWr5DCLB0BVOm\njq1HFqglfa0Ovgk96/l/ZxtemUip5sAz0lazQ22/cXD+rFBaoewgJu+tqHLzUVP2\nL7u0YUUCgYEA3dlTNB8PesbnFubqeZyLgK1H3Rr08wPxPc/IQm3rZlLDPVP1w53C\nSCVGzfa3OM7HDbWBBQSOvzP5QYHkfXE8Nk04UbZvaiJJBq8xgZcnNlnJNUMNV2Qa\nXDfQTScDbn35BhQPFImREiYl0Zkqn70y19bAwS0NrwHmIiYUEtVu0WMCgYEAxl9h\n7k8KgYYkF5a/XyImzmfz5WDTDzLDikeM7uKKbaxM3w+YQg1caGDmxrsw+ubSDomP\n93JnWe8qepQhveTYfAi72AL9hyvJfNTiJn+xSRdwuCPXZGTzE2hC9QD2DXPHsUa4\n+3fq80LC+hTrqLWFT35PFGTgc5ihJ+Sf2N3DMZ8CgYEAyaIVomC8o/2V2VXlNMTY\ncgqML2Spzxn9MA3i2KWo9yYvt1TRIYsIIqRmtxoOqz4c4tPdwN7Ekvm9CRHyxySc\n8km672Gd39vrfXzLxRnJlPeEDbm0rYIZB0nfM9BKqSkrpZ+jmSnzRYiQhPDuMaM3\nS78vECRPtIlITi9HvVppTzsCgYEAsQk+5Oc1gRKt8z9d2xEngN3VFMisk8vCJw5k\nAG29DNPQZuIMCCbUaXLRglpdBA4rOT4bdcJr6h8/0dWRp18stMU2nzlL+e5iCz4R\n9jnPhmOc/Tk/aSGOratG1lDdRnQlq1hqjkIfNKpIR9eT2STmrGMVQCYnCgMVD/1B\nitGe+hECgYARjucIx86N7Z6TAbhcGpKpwGMdPZoE9Bpoel84MrcAAi6iRdP34xPH\nWfWVwrKsGVpxIPTUCk18iaGlXNOAyrpTJ0LNoT+0eNymQcND+AD/D08hSzSIcm+v\nKCbESsBaAJ8aAqqILv3UUQW7lb6wFWEHNJjt3h91VNs79bKu6fGM0Q==\n-----END RSA PRIVATE KEY-----",
        GITHUB_TOKEN: "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",
        SUPERMEMORY_API_KEY:
          "sm_xbEChqoeQzCd4ygHEKpxpf_VGjUxOZJEoCRIHCTJiYEBOGkueVBPLNbcAurZixNBNveFrOGENpRJCvKNHrEDdzc",
        // Database Configuration
        DB_HOST: "34.16.99.221",
        DB_PORT: "5432",
        DB_NAME: "emailgenius",
        DB_USER: "postgres",
        DB_PASSWORD: "Leyton@19564984",
        DB_CONNECTION_NAME:
          "absolute-brook-452020-d5:us-central1:emailgenius-broadcasts-db",
        DATABASE_URL:
          "postgresql://postgres:Leyton@19564984@34.16.99.221:5432/emailgenius?schema=public",
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3020,

        // Google / Vertex AI
        GOOGLE_CLOUD_PROJECT: "absolute-brook-452020-d5",
        GOOGLE_CLOUD_LOCATION: "us-central1",
        GOOGLE_SERVICE_ACCOUNT_EMAIL:
          "sheets-service-account@absolute-brook-452020-d5.iam.gserviceaccount.com",
        GOOGLE_PRIVATE_KEY:
          "-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDbTvwo+VETRWO5\\npay4rZxmAAZS7Ww94B3+S9MDMnAv4B+uQYh1nwNoMmCWfblMxPnkl+SOSwVKObLC\\nIKVNvWqaG/VYPEQlJDAZA0k/RnVvY/6IGWC1dNrM+c4zvwGLcZQC9CarerqqnwPS\\ndeVPtYxVkAT206HquswoeLvmri3M4by2wWs/h/mCKnR1BaKR5q5EymCBZgXXsm5S\\nSH22FOatbkZFCnhPN+J2bQcHRhUeSAYJQ2SWdcvu3dcbhw8Q2G5t+Sg+RzHndILr\\nkZtV65Ix5JqgixoRoMHavkBbW7JTwJBdq9yrf1gV6FBqOMqQkoNx6C5RE4uIK3fa\\nx9qWqfS7AgMBAAECggEADARE7t3SYnLv5vE8CJaCtlgUAKE/yBgqrI9tDYTK/uSR\\n99Nhbch7wE7aWgSjjaBRbQQhouZbcNi+gcKWLC9P0wfrJp2OwlY8SHKUpeHvd14M\\nSVrSoL65anfZo544sHJVwN+t6sF7zvONmw+YtAhnmxycGQY5ngoEO8d5zEcI/Wvb\\nCb+Wi0sXOnDBWjiyXqfutpcMaAE2gBck5t76enYW068vrX5tqhVaOyPzD40U2Pvp\\npLmccUU2H0++6lzRmYmG3c1ioxN1Y3WBw1emHZfk7ruupc/7hFMBhn5GEfPFoWHv\\nntWUuYKxm9XiE74DFAA6J17vhPPJ1y8VDu0jUptH8QKBgQD+k6v9TjFQBGcp/nkQ\\n86nzl4L4hZ6wXaRRK95qutQIK/uTATBFKoTra3lPiSoq/1kGaDmB60NRCq8RLyxm\\nCUC/6Aez9Lq1K/3kpPfiDf1/310M4V4VV/G2mxwzkawIp2QnkwCKlP224DuVjvuw\\nN9TTgzl9ZDM7D3mZT4YEDm+MyQKBgQDciNcaCyvZ7h2zVNNjZcEokVm6UaNeOUdJ\\n2O5u/BGDMz4iW0yJXfF2nZTQ+n+w8S7UPVukcQy9cDRRSUNZ8cTZs3qnp24VuZ4G\\ngvQDwtUC81B9viIENFXfJ/qxl7k+zK+akWjW0ndtRfcFBiYEmjvt+5RSZ1RRHXMw\\nT+4yp/rrYwKBgQC5MT3NcGNpHTrbDraNgWQhwxdQqQtuq0BMmEgdhjmWlEBXiWbO\\n+gZlp/JAzLxzOPxPL+SdwUJgIxCFxLZcp+CFekqYO7DS+OSivutgc+L0cc2kABJM\\nHoTE3QNf9FmclgDC1SpwpcAHmAlgW/p2D7dwAqcAs7KdBT3lLDeGneXCGQKBgGBq\\nQwBT2fwRKlL4xuIx3lzKDxxyDKZpDE2w1a0X7uAZSxTiLXfw5lwhUKp8mc7V4s9P\\nc/1Un2lC4NyY1yU/mfxDh2A8xtggqoHWRrBOQapkjdAri9uitdg2NlfmKUrXWf6N\\ni/Q/V48ig3hi08Q3WfQVhSbxnd9IrM92YoErB3xZAoGBALWIz9n5Y0Ac0PEjW2Kr\\n7FYPnH3FpbA9mbKIvFtq90ATTFG4N9UQLEfWnUQQpjpRWhSRLhmr/T+fv78ex2jI\\nkzV7K5q9z18dolbRbBXjGOeSBk/005pYv65c3KA+Q9idOseNwPWqRWdo8cbDNxAR\\nekMQCv3cMi2QUiBJ2CmDu4cW\\n-----END PRIVATE KEY-----\\n",
        VERTEX_AI_DATASTORE:
          "projects/absolute-brook-452020-d5/locations/global/collections/default_collection/dataStores/ejemplos-y-plantillas-folder-august-2025_1753117635099",
        VERTEX_AI_PROJECT_ID: "absolute-brook-452020-d5",
        VERTEX_AI_LOCATION: "global",

        // GitHub App (EmailGenius Upload Bot)
        GITHUB_OWNER: "juanjaragavi",
        GITHUB_REPO: "emailgenius-winner-broadcasts-subjects",
        GITHUB_APP_ID: 1821194,
        GITHUB_APP_PRIVATE_KEY:
          "-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEAq+i+3g1uxVc8CcndyE0l4lDS6DEl/mSCpY9xZx0fh3EXXKXy\nNhAEi2KmWvbglV8833UvcLGCxQ85gPiNzU4C1Ndza/uXYo6MdYbgOcVNTiWNfmqa\nzOyEYJw+vQnlWIhPKwqbp1CvclIabIXo+V1yCWDzwjaxPisEaIp436l4HshxnaAx\n/BJaimGVKHBCk5udv+YoNgPTZwQSVJKELjBY8GFgnpwg1b7qgt/jvz78e2y2RqJ4\nADFw/Ii9mzMoNL6ynPHVYa1iLZnQnpVHl/STZVA3v8TEvnsovLZ3hUirQtEio1Qu\niDdD9RDS8+xGmfXvQxwJJAk2Lx2G0HlAu1D/fQIDAQABAoIBAHKIIznvuyAxCWgA\nHQnJFHden9VggU6mikBhfA1V4t6q4wSv7tpD+7Mdq3WpS2FZTUYXXd739QbzKL2b\nW2YwFkTVsil8OpTIIh5fGN6EbAenj0htH+ttnJh9IHNzt2AvmIc1jxR+9hT1THOH\nF/ujXUmQVXbMV3Py1wILV5Kz5rqies9EqF1O3wKAoPAgNvxJ4EZmNlZIaguEmBKK\n272r+cyI9ytdL45Lp7aK2Y4qhqL+Yn2uWJ7KcbH90HB4yOtkWcDyWr5DCLB0BVOm\njq1HFqglfa0Ovgk96/l/ZxtemUip5sAz0lazQ22/cXD+rFBaoewgJu+tqHLzUVP2\nL7u0YUUCgYEA3dlTNB8PesbnFubqeZyLgK1H3Rr08wPxPc/IQm3rZlLDPVP1w53C\nSCVGzfa3OM7HDbWBBQSOvzP5QYHkfXE8Nk04UbZvaiJJBq8xgZcnNlnJNUMNV2Qa\nXDfQTScDbn35BhQPFImREiYl0Zkqn70y19bAwS0NrwHmIiYUEtVu0WMCgYEAxl9h\n7k8KgYYkF5a/XyImzmfz5WDTDzLDikeM7uKKbaxM3w+YQg1caGDmxrsw+ubSDomP\n93JnWe8qepQhveTYfAi72AL9hyvJfNTiJn+xSRdwuCPXZGTzE2hC9QD2DXPHsUa4\n+3fq80LC+hTrqLWFT35PFGTgc5ihJ+Sf2N3DMZ8CgYEAyaIVomC8o/2V2VXlNMTY\ncgqML2Spzxn9MA3i2KWo9yYvt1TRIYsIIqRmtxoOqz4c4tPdwN7Ekvm9CRHyxySc\n8km672Gd39vrfXzLxRnJlPeEDbm0rYIZB0nfM9BKqSkrpZ+jmSnzRYiQhPDuMaM3\nS78vECRPtIlITi9HvVppTzsCgYEAsQk+5Oc1gRKt8z9d2xEngN3VFMisk8vCJw5k\nAG29DNPQZuIMCCbUaXLRglpdBA4rOT4bdcJr6h8/0dWRp18stMU2nzlL+e5iCz4R\n9jnPhmOc/Tk/aSGOratG1lDdRnQlq1hqjkIfNKpIR9eT2STmrGMVQCYnCgMVD/1B\nitGe+hECgYARjucIx86N7Z6TAbhcGpKpwGMdPZoE9Bpoel84MrcAAi6iRdP34xPH\nWfWVwrKsGVpxIPTUCk18iaGlXNOAyrpTJ0LNoT+0eNymQcND+AD/D08hSzSIcm+v\nKCbESsBaAJ8aAqqILv3UUQW7lb6wFWEHNJjt3h91VNs79bKu6fGM0Q==\n-----END RSA PRIVATE KEY-----",
        GITHUB_TOKEN: "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",
        SUPERMEMORY_API_KEY:
          "sm_xbEChqoeQzCd4ygHEKpxpf_VGjUxOZJEoCRIHCTJiYEBOGkueVBPLNbcAurZixNBNveFrOGENpRJCvKNHrEDdzc",
        // Database Configuration
        DB_HOST: "34.16.99.221",
        DB_PORT: "5432",
        DB_NAME: "emailgenius",
        DB_USER: "postgres",
        DB_PASSWORD: "Leyton@19564984",
        DB_CONNECTION_NAME:
          "absolute-brook-452020-d5:us-central1:emailgenius-broadcasts-db",
        DATABASE_URL:
          "postgresql://postgres:Leyton@19564984@34.16.99.221:5432/emailgenius?schema=public",
      },
      error_file: "/var/log/pm2/emailgenius-broadcasts-error.log",
      out_file: "/var/log/pm2/emailgenius-broadcasts-out.log",
      log_file: "/var/log/pm2/emailgenius-broadcasts-combined.log",
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
      user: "www-data",
      host: "localhost",
      ref: "origin/main",
      repo: "https://github.com/juanjaragavi/emailgenius-broadcasts-generator.git",
      path: "/var/www/html/emailgenius-broadcasts-generator",
      "pre-deploy-local": "",
      "post-deploy":
        "npm install && npm run build && pm2 reload ecosystem.config.js --env production",
      "pre-setup": "",
    },
  },
};
