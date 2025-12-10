/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT,
    GOOGLE_CLOUD_LOCATION: process.env.GOOGLE_CLOUD_LOCATION,
    GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY,
    VERTEX_AI_DATASTORE: process.env.VERTEX_AI_DATASTORE,
    VERTEX_AI_PROJECT_ID: process.env.VERTEX_AI_PROJECT_ID,
    VERTEX_AI_LOCATION: process.env.VERTEX_AI_LOCATION,
    // GitHub App Environment Variables
    GITHUB_OWNER: process.env.GITHUB_OWNER,
    GITHUB_REPO: process.env.GITHUB_REPO,
    GITHUB_APP_ID: process.env.GITHUB_APP_ID,
    GITHUB_APP_PRIVATE_KEY: process.env.GITHUB_APP_PRIVATE_KEY,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        port: "",
        pathname: "/media-topfinanzas-com/**",
      },
    ],
  },
};

module.exports = nextConfig;
