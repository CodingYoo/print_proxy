import axios, { type AxiosRequestConfig, type AxiosResponse, type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useMessage } from 'naive-ui'
import type { ApiError } from '@/types/common'

// 创建消息实例（用于错误提示）
let message: ReturnType<typeof useMessage> | null = null

// 设置消息实例（在应用初始化时调用）
export const setMessageInstance = (messageInstance: ReturnType<typeof useMessage>) => {
  message = messageInstance
}

// 请求配置接口
export interface RequestConfig extends InternalAxiosRequestConfig {
  skipAuth?: boolean
  skipErrorHandler?: boolean
  showLoading?: boolean
  metadata?: {
    startTime: number
  }
}

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 30000, // 增加超时时间到30秒
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求计数器（用于loading状态）
let requestCount = 0
const pendingRequests = new Map<string, AbortController>()

// 生成请求唯一标识
const generateRequestKey = (config: AxiosRequestConfig): string => {
  return `${config.method?.toUpperCase()}_${config.url}_${JSON.stringify(config.params || {})}`
}

// 请求拦截器
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 生成请求唯一标识
    const requestKey = generateRequestKey(config)
    
    // 取消重复请求
    if (pendingRequests.has(requestKey)) {
      const controller = pendingRequests.get(requestKey)
      controller?.abort('Duplicate request cancelled')
    }
    
    // 创建新的 AbortController
    const controller = new AbortController()
    config.signal = controller.signal
    pendingRequests.set(requestKey, controller)
    
    // 添加请求计数
    requestCount++
    
    // 添加认证 token
    if (!(config as any).skipAuth) {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    
    // 添加请求 ID（用于追踪）
    config.headers['X-Request-ID'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // 添加时间戳
    ;(config as any).metadata = {
      startTime: Date.now()
    }
    
    // 开发环境下打印请求信息
    if (import.meta.env.DEV) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
        headers: config.headers
      })
    }
    
    return config
  },
  (error: AxiosError) => {
    requestCount = Math.max(0, requestCount - 1)
    console.error('Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // 移除请求计数
    requestCount = Math.max(0, requestCount - 1)
    
    // 移除待处理请求
    const requestKey = generateRequestKey(response.config)
    pendingRequests.delete(requestKey)
    
    // 计算请求耗时
    const duration = Date.now() - ((response.config as any).metadata?.startTime || 0)
    
    // 开发环境下打印响应信息
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        duration: `${duration}ms`,
        data: response.data
      })
    }
    
    return response
  },
  async (error: AxiosError<ApiError>) => {
    // 移除请求计数
    requestCount = Math.max(0, requestCount - 1)
    
    // 移除待处理请求
    if (error.config) {
      const requestKey = generateRequestKey(error.config)
      pendingRequests.delete(requestKey)
    }
    
    // 如果是取消的请求，直接返回
    if (axios.isCancel(error)) {
      return Promise.reject(error)
    }
    
    // 计算请求耗时
    const duration = (error.config as any)?.metadata?.startTime 
      ? Date.now() - (error.config as any).metadata.startTime 
      : 0
    
    // 开发环境下打印错误信息
    if (import.meta.env.DEV) {
      console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
        status: error.response?.status,
        duration: `${duration}ms`,
        error: error.response?.data || error.message
      })
    }
    
    // 跳过错误处理的请求
    if ((error.config as RequestConfig)?.skipErrorHandler) {
      return Promise.reject(error)
    }
    
    // 处理不同类型的错误
    const status = error.response?.status
    const errorData = error.response?.data
    
    switch (status) {
      case 401:
        // 未授权 - 清除认证信息并重定向到登录页
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_info')
        localStorage.removeItem('remember_me')
        sessionStorage.removeItem('auth_token')
        sessionStorage.removeItem('user_info')
        
        // 避免在登录页面重复重定向
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        
        message?.error('登录已过期，请重新登录')
        break
        
      case 403:
        // 禁止访问
        message?.error('没有权限访问该资源')
        break
        
      case 404:
        // 资源不存在
        message?.error('请求的资源不存在')
        break
        
      case 422:
        // 验证错误
        const validationMessage = errorData?.detail || '请求参数验证失败'
        message?.error(validationMessage)
        break
        
      case 429:
        // 请求过于频繁
        message?.error('请求过于频繁，请稍后再试')
        break
        
      case 500:
        // 服务器内部错误
        message?.error('服务器内部错误，请稍后再试')
        break
        
      case 502:
      case 503:
      case 504:
        // 服务不可用
        message?.error('服务暂时不可用，请稍后再试')
        break
        
      default:
        // 网络错误或其他错误
        if (!error.response) {
          message?.error('网络连接失败，请检查网络设置')
        } else {
          const errorMessage = errorData?.detail || error.message || '请求失败'
          message?.error(errorMessage)
        }
    }
    
    return Promise.reject(error)
  }
)

// 获取当前请求数量
export const getRequestCount = () => requestCount

// 取消所有待处理的请求
export const cancelAllRequests = () => {
  pendingRequests.forEach((controller, key) => {
    controller.abort('All requests cancelled')
  })
  pendingRequests.clear()
  requestCount = 0
}

// 取消特定请求
export const cancelRequest = (config: AxiosRequestConfig) => {
  const requestKey = generateRequestKey(config)
  const controller = pendingRequests.get(requestKey)
  if (controller) {
    controller.abort('Request cancelled')
    pendingRequests.delete(requestKey)
  }
}

export default apiClient