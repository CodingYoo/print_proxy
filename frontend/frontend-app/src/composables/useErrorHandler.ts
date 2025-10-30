/**
 * 错误处理 Composable
 * 提供组件级别的错误处理功能
 */

import { ref } from 'vue'
import { useMessage } from 'naive-ui'
import { globalErrorHandler, type ErrorHandlerOptions } from '@/utils/error-handler'

export function useErrorHandler() {
  const message = useMessage()
  const lastError = ref<Error | null>(null)
  const errorCount = ref(0)

  /**
   * 处理错误
   */
  const handleError = (error: unknown, options?: ErrorHandlerOptions) => {
    lastError.value = error instanceof Error ? error : new Error(String(error))
    errorCount.value++
    globalErrorHandler.handle(error, options)
  }

  /**
   * 清除错误状态
   */
  const clearError = () => {
    lastError.value = null
  }

  /**
   * 包装异步函数，自动处理错误
   */
  const withErrorHandling = async <T>(
    fn: () => Promise<T>,
    options?: ErrorHandlerOptions
  ): Promise<T | null> => {
    try {
      return await fn()
    } catch (error) {
      handleError(error, options)
      return null
    }
  }

  /**
   * 显示成功消息
   */
  const showSuccess = (msg: string, duration = 3000) => {
    message.success(msg, { duration })
  }

  /**
   * 显示警告消息
   */
  const showWarning = (msg: string, duration = 3000) => {
    message.warning(msg, { duration })
  }

  /**
   * 显示信息消息
   */
  const showInfo = (msg: string, duration = 3000) => {
    message.info(msg, { duration })
  }

  /**
   * 显示错误消息
   */
  const showError = (msg: string, duration = 3000) => {
    message.error(msg, { duration })
  }

  return {
    lastError,
    errorCount,
    handleError,
    clearError,
    withErrorHandling,
    showSuccess,
    showWarning,
    showInfo,
    showError
  }
}
