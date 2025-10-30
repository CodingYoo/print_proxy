/**
 * 部署配置
 * 用于不同部署场景的配置管理
 */

export default {
  /**
   * 开发环境配置
   */
  development: {
    apiBaseUrl: 'http://localhost:8000',
    publicPath: '/',
    outputDir: 'dist',
  },

  /**
   * 生产环境配置
   */
  production: {
    apiBaseUrl: '/api',
    publicPath: '/',
    outputDir: 'dist',
  },

  /**
   * 测试环境配置
   */
  staging: {
    apiBaseUrl: 'https://staging-api.example.com',
    publicPath: '/',
    outputDir: 'dist',
  },

  /**
   * 缓存策略配置
   */
  cache: {
    // 静态资源缓存时间 (秒)
    staticAssets: 31536000, // 1 年
    // HTML 文件缓存策略
    html: 'no-cache',
    // 图片缓存时间
    images: 31536000, // 1 年
    // 字体缓存时间
    fonts: 31536000, // 1 年
  },

  /**
   * 压缩配置
   */
  compression: {
    // 启用 gzip 压缩
    gzip: true,
    // 启用 brotli 压缩
    brotli: true,
    // 压缩阈值 (字节)
    threshold: 10240, // 10KB
  },

  /**
   * 性能预算
   */
  performanceBudget: {
    // 最大包大小 (KB)
    maxBundleSize: 500,
    // 最大初始加载大小 (KB)
    maxInitialSize: 200,
    // 最大单个 chunk 大小 (KB)
    maxChunkSize: 100,
  },
}
