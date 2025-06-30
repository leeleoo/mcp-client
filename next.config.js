/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用实验性的 Turbopack
  experimental: {
    turbo: {
      // 基本的 Turbopack 配置
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

  // Webpack 配置（仅在 Turbopack 不可用时作为备用）
  // webpack: (config, { isServer }) => {
  //   // 仅在非 Turbopack 模式下使用
  //   if (!isServer) {
  //     config.resolve.fallback = {
  //       ...config.resolve.fallback,
  //       fs: false,
  //       net: false,
  //       tls: false,
  //     };
  //   }
  //   return config;
  // },
};

module.exports = nextConfig;
