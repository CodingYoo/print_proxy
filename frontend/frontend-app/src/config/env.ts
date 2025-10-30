/**
 * 环境配置管理
 * 提供类型安全的环境变量访问和验证
 */

/**
 * 应用配置接口
 */
export interface AppConfig {
  /** API 基础 URL */
  apiBaseUrl: string
  /** 应用标题 */
  appTitle: string
  /** 应用版本 */
  version: string
  /** 构建时间 */
  buildTime: string
  /** 是否为生产环境 */
  isProduction: boolean
  /** 是否为开发环境 */
  isDevelopment: boolean
}

/**
 * 验证必需的环境变量
 */
function validateEnv(): void {
  const required = ['VITE_API_BASE_URL', 'VITE_APP_TITLE']
  const missing = required.filter((key) => !import.meta.env[key])

  if (missing.length > 0) {
    throw new Error(
      `缺少必需的环境变量: ${missing.join(', ')}\n` +
        '请检查 .env 文件配置'
    )
  }
}

/**
 * 获取应用配置
 * @returns 应用配置对象
 */
export function getAppConfig(): AppConfig {
  // 验证环境变量
  validateEnv()

  const mode = import.meta.env.MODE

  return {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
    appTitle: import.meta.env.VITE_APP_TITLE,
    version: __APP_VERSION__,
    buildTime: __BUILD_TIME__,
    isProduction: mode === 'production',
    isDevelopment: mode === 'development',
  }
}

/**
 * 应用配置单例
 */
export const appConfig = getAppConfig()

/**
 * 打印配置信息到控制台 (仅开发环境)
 */
export function logConfig(): void {
  if (appConfig.isDevelopment) {
    console.group('🔧 应用配置')
    console.log('环境:', import.meta.env.MODE)
    console.log('API URL:', appConfig.apiBaseUrl)
    console.log('应用标题:', appConfig.appTitle)
    console.log('版本:', appConfig.version)
    console.log('构建时间:', appConfig.buildTime)
    console.groupEnd()
  }
}

/**
 * 获取完整的 API URL
 * @param path API 路径
 * @returns 完整的 API URL
 */
export function getApiUrl(path: string): string {
  const baseUrl = appConfig.apiBaseUrl.replace(/\/$/, '')
  const apiPath = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${apiPath}`
}
