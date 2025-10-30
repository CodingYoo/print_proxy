/**
 * 重试机制工具
 * 提供网络请求和操作的自动重试功能
 */

export interface RetryOptions {
  maxAttempts?: number
  delay?: number
  backoff?: 'linear' | 'exponential'
  maxDelay?: number
  shouldRetry?: (error: any, attempt: number) => boolean
  onRetry?: (error: any, attempt: number) => void
}

export class RetryError extends Error {
  constructor(
    message: string,
    public attempts: number,
    public lastError: Error
  ) {
    super(message)
    this.name = 'RetryError'
  }
}

/**
 * 重试函数
 * @param fn 要执行的异步函数
 * @param options 重试选项
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = 'exponential',
    maxDelay = 10000,
    shouldRetry = defaultShouldRetry,
    onRetry
  } = options

  let lastError: Error
  let attempt = 0

  while (attempt < maxAttempts) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      attempt++

      // 检查是否应该重试
      if (attempt >= maxAttempts || !shouldRetry(error, attempt)) {
        throw new RetryError(
          `操作失败，已重试 ${attempt} 次`,
          attempt,
          lastError
        )
      }

      // 计算延迟时间
      const currentDelay = calculateDelay(delay, attempt, backoff, maxDelay)

      // 触发重试回调
      onRetry?.(error, attempt)

      // 等待后重试
      await sleep(currentDelay)
    }
  }

  throw new RetryError(
    `操作失败，已重试 ${attempt} 次`,
    attempt,
    lastError!
  )
}

/**
 * 默认的重试判断逻辑
 */
function defaultShouldRetry(error: any, attempt: number): boolean {
  // 网络错误应该重试
  if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND') {
    return true
  }

  // HTTP 状态码判断
  if (error.response) {
    const status = error.response.status
    // 5xx 服务器错误应该重试
    if (status >= 500 && status < 600) {
      return true
    }
    // 429 请求过多应该重试
    if (status === 429) {
      return true
    }
    // 408 请求超时应该重试
    if (status === 408) {
      return true
    }
  }

  // 其他错误不重试
  return false
}

/**
 * 计算延迟时间
 */
function calculateDelay(
  baseDelay: number,
  attempt: number,
  backoff: 'linear' | 'exponential',
  maxDelay: number
): number {
  let delay: number

  if (backoff === 'exponential') {
    // 指数退避：delay * 2^(attempt-1)
    delay = baseDelay * Math.pow(2, attempt - 1)
  } else {
    // 线性退避：delay * attempt
    delay = baseDelay * attempt
  }

  // 添加随机抖动（±20%）
  const jitter = delay * 0.2 * (Math.random() * 2 - 1)
  delay += jitter

  // 限制最大延迟
  return Math.min(delay, maxDelay)
}

/**
 * 睡眠函数
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 创建可重试的函数
 */
export function createRetryable<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {}
): T {
  return ((...args: any[]) => {
    return retry(() => fn(...args), options)
  }) as T
}

/**
 * 重试管理器
 */
export class RetryManager {
  private retryingTasks = new Map<string, AbortController>()

  /**
   * 执行可重试的任务
   */
  async execute<T>(
    taskId: string,
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    // 如果任务已在重试中，取消之前的重试
    this.cancel(taskId)

    // 创建新的 AbortController
    const controller = new AbortController()
    this.retryingTasks.set(taskId, controller)

    try {
      const result = await retry(fn, {
        ...options,
        shouldRetry: (error, attempt) => {
          // 检查是否被取消
          if (controller.signal.aborted) {
            return false
          }
          // 使用自定义或默认的重试逻辑
          return options.shouldRetry
            ? options.shouldRetry(error, attempt)
            : defaultShouldRetry(error, attempt)
        }
      })

      this.retryingTasks.delete(taskId)
      return result
    } catch (error) {
      this.retryingTasks.delete(taskId)
      throw error
    }
  }

  /**
   * 取消重试任务
   */
  cancel(taskId: string): void {
    const controller = this.retryingTasks.get(taskId)
    if (controller) {
      controller.abort()
      this.retryingTasks.delete(taskId)
    }
  }

  /**
   * 取消所有重试任务
   */
  cancelAll(): void {
    this.retryingTasks.forEach((controller) => controller.abort())
    this.retryingTasks.clear()
  }

  /**
   * 检查任务是否在重试中
   */
  isRetrying(taskId: string): boolean {
    return this.retryingTasks.has(taskId)
  }

  /**
   * 获取正在重试的任务列表
   */
  getRetryingTasks(): string[] {
    return Array.from(this.retryingTasks.keys())
  }
}

// 全局重试管理器实例
export const globalRetryManager = new RetryManager()
