/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用实验性的 Turbopack
  experimental: {
    turbo: {
      // Turbopack 特定配置
    },
  },

  // TypeScript 配置
  typescript: {
    ignoreBuildErrors: false,
  },

  // 环境变量配置
  env: {
    DEEPSEEK_API_KEY: process.env.deepseek_api,
  },

  // API 路由配置在 App Router 中不再需要这个配置
  // Next.js 14+ 使用 Route Handlers 替代 API Routes

  // Webpack 配置（Turbopack 备用）
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
