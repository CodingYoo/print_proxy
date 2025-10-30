/**
 * 全局错误处理工具
 * 统一处理应用中的各类错误
 */

import type { MessageApi } from 'naive-ui'
import { AxiosError } from 'axios'

export interface ErrorHandlerOptions {
  showMessage?: boolean
  logToConsole?: boolean
  reportToServer?: boolean
  customMessage?: string
}

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class NetworkError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'NETWORK_ERROR', 0, details)
    this.name = 'NetworkError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = '认证失败，请重新登录') {
    super(message, 'AUTH_ERROR', 401)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = '您没有权限执行此操作') {
    super(message, 'PERMISSION_ERROR', 403)
    this.name = 'AuthorizationError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public fields?: Record<string, string[]>) {
    super(message, 'VALIDATION_ERROR', 422, fields)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = '请求的资源不存在') {
    super(message, 'NOT_FOUND', 404)
    this.name = 'NotFoundError'
  }
}

export class ServerError extends AppError {
  constructor(message: string = '服务器错误，请稍后重试') {
    super(message, 'SERVER_ERROR', 500)
    this.name = 'ServerError'
  }
}

/**
 * 错误处理器类
 */
export class ErrorHandler {
  private messageApi: MessageApi | null = null
  private errorLog: Array<{ error: Error; timestamp: Date }> = []
  private maxLogSize = 100

  setMessageApi(api: MessageApi) {
    this.messageApi = api
  }

  /**
   * 处理错误
   */
  handle(error: unknown, options: ErrorHandlerOptions = {}): void {
    const {
      showMessage = true,
      logToConsole = true,
      reportToServer = false,
      customMessage
    } = options

    const processedError = this.processError(error)

    // 记录错误
    this.logError(processedError)

    // 控制台输出
    if (logToConsole) {
      console.error('[Error Handler]', processedError)
    }

    // 显示用户消息
    if (showMessage && this.messageApi) {
      const message = customMessage || this.getErrorMessage(processedError)
      this.showErrorMessage(processedError, message)
    }

    // 上报到服务器
    if (reportToServer) {
      this.reportError(processedError)
    }
  }

  /**
   * 处理错误对象
   */
  private processError(error: unknown): AppError {
    // 已经是 AppError
    if (error instanceof AppError) {
      return error
    }

    // Axios 错误
    if (error instanceof AxiosError) {
      return this.handleAxiosError(error)
    }

    // 标准 Error
    if (error instanceof Error) {
      return new AppError(error.message, 'UNKNOWN_ERROR')
    }

    // 其他类型
    return new AppError(String(error), 'UNKNOWN_ERROR')
  }

  /**
   * 处理 Axios 错误
   */
  private handleAxiosError(error: AxiosError): AppError {
    const response = error.response

    if (!response) {
      // 网络错误
      return new NetworkError('网络连接失败，请检查您的网络设置', error)
    }

    const { status, data } = response
    const message = (data as any)?.message || (data as any)?.detail || error.message

    switch (status) {
      case 400:
        return new ValidationError(message || '请求参数错误', (data as any)?.errors)
      case 401:
        return new AuthenticationError(message)
      case 403:
        return new AuthorizationError(message)
      case 404:
        return new NotFoundError(message)
      case 422:
        return new ValidationError(message || '数据验证失败', (data as any)?.errors)
      case 500:
      case 502:
      case 503:
      case 504:
        return new ServerError(message)
      default:
        return new AppError(message, 'HTTP_ERROR', status, data)
    }
  }

  /**
   * 获取错误消息
   */
  private getErrorMessage(error: AppError): string {
    // 特殊错误类型的默认消息
    if (error instanceof NetworkError) {
      return '网络连接失败，请检查您的网络设置'
    }
    if (error instanceof AuthenticationError) {
      return '认证失败，请重新登录'
    }
    if (error instanceof AuthorizationError) {
      return '您没有权限执行此操作'
    }
    if (error instanceof ValidationError) {
      return error.message || '数据验证失败'
    }
    if (error instanceof NotFoundError) {
      return '请求的资源不存在'
    }
    if (error instanceof ServerError) {
      return '服务器错误，请稍后重试'
    }

    return error.message || '操作失败，请重试'
  }

  /**
   * 显示错误消息
   */
  private showErrorMessage(error: AppError, message: string): void {
    if (!this.messageApi) return

    const duration = this.getMessageDuration(error)

    if (error instanceof ValidationError && error.fields) {
      // 验证错误显示详细信息
      const fieldErrors = Object.entries(error.fields)
        .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
        .join('\n')
      this.messageApi.error(`${message}\n${fieldErrors}`, { duration })
    } else if (error instanceof NetworkError) {
      this.messageApi.error(message, {
        duration,
        closable: true
      })
    } else if (error instanceof ServerError) {
      this.messageApi.error(message, {
        duration,
        closable: true
      })
    } else {
      this.messageApi.error(message, { duration })
    }
  }

  /**
   * 获取消息显示时长
   */
  private getMessageDuration(error: AppError): number {
    if (error instanceof NetworkError || error instanceof ServerError) {
      return 5000 // 网络和服务器错误显示更长时间
    }
    return 3000
  }

  /**
   * 记录错误
   */
  private logError(error: AppError): void {
    this.errorLog.push({
      error,
      timestamp: new Date()
    })

    // 限制日志大小
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift()
    }
  }

  /**
   * 上报错误到服务器
   */
  private async reportError(error: AppError): Promise<void> {
    try {
      // 这里可以实现错误上报逻辑
      // await axios.post('/api/errors/report', {
      //   message: error.message,
      //   code: error.code,
      //   statusCode: error.statusCode,
      //   details: error.details,
      //   stack: error.stack,
      //   timestamp: new Date().toISOString(),
      //   userAgent: navigator.userAgent,
      //   url: window.location.href
      // })
      console.log('[Error Reporter] Error reported:', error)
    } catch (reportError) {
      console.error('[Error Reporter] Failed to report error:', reportError)
    }
  }

  /**
   * 获取错误日志
   */
  getErrorLog() {
    return [...this.errorLog]
  }

  /**
   * 清除错误日志
   */
  clearErrorLog() {
    this.errorLog = []
  }
}

// 全局错误处理器实例
export const globalErrorHandler = new ErrorHandler()

/**
 * 设置全局错误处理
 */
export function setupGlobalErrorHandler(messageApi: MessageApi) {
  globalErrorHandler.setMessageApi(messageApi)

  // 捕获未处理的 Promise 拒绝
  window.addEventListener('unhandledrejection', (event) => {
    event.preventDefault()
    globalErrorHandler.handle(event.reason, {
      showMessage: true,
      logToConsole: true,
      reportToServer: true
    })
  })

  // 捕获全局错误
  window.addEventListener('error', (event) => {
    event.preventDefault()
    globalErrorHandler.handle(event.error, {
      showMessage: true,
      logToConsole: true,
      reportToServer: true
    })
  })
}
