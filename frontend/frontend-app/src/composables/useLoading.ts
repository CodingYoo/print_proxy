/**
 * 加载状态管理 Composable
 * 提供全局和局部加载状态管理
 */

import { ref, computed } from 'vue'
import { useLoadingBar, useMessage } from 'naive-ui'

// 全局加载状态
const globalLoadingCount = ref(0)
const loadingTasks = ref<Map<string, boolean>>(new Map())

export function useLoading() {
  const loadingBar = useLoadingBar()
  const message = useMessage()

  // 全局加载状态
  const isGlobalLoading = computed(() => globalLoadingCount.value > 0)

  /**
   * 开始全局加载
   */
  const startGlobalLoading = () => {
    globalLoadingCount.value++
    if (globalLoadingCount.value === 1) {
      loadingBar?.start()
    }
  }

  /**
   * 结束全局加载
   */
  const finishGlobalLoading = () => {
    if (globalLoadingCount.value > 0) {
      globalLoadingCount.value--
      if (globalLoadingCount.value === 0) {
        loadingBar?.finish()
      }
    }
  }

  /**
   * 加载失败
   */
  const errorGlobalLoading = () => {
    globalLoadingCount.value = 0
    loadingBar?.error()
  }

  /**
   * 局部加载状态管理
   */
  const createLoadingState = (initialValue = false) => {
    const loading = ref(initialValue)

    const startLoading = () => {
      loading.value = true
    }

    const stopLoading = () => {
      loading.value = false
    }

    const toggleLoading = () => {
      loading.value = !loading.value
    }

    return {
      loading,
      startLoading,
      stopLoading,
      toggleLoading
    }
  }

  /**
   * 任务加载状态管理
   * @param taskId 任务唯一标识
   */
  const startTaskLoading = (taskId: string) => {
    loadingTasks.value.set(taskId, true)
  }

  const finishTaskLoading = (taskId: string) => {
    loadingTasks.value.delete(taskId)
  }

  const isTaskLoading = (taskId: string) => {
    return loadingTasks.value.has(taskId)
  }

  /**
   * 包装异步函数，自动管理加载状态
   * @param fn 异步函数
   * @param options 配置选项
   */
  const withLoading = async <T>(
    fn: () => Promise<T>,
    options?: {
      global?: boolean
      taskId?: string
      errorMessage?: string
      successMessage?: string
    }
  ): Promise<T> => {
    const { global = false, taskId, errorMessage, successMessage } = options || {}

    try {
      if (global) {
        startGlobalLoading()
      }
      if (taskId) {
        startTaskLoading(taskId)
      }

      const result = await fn()

      if (successMessage) {
        message.success(successMessage)
      }

      return result
    } catch (error) {
      if (global) {
        errorGlobalLoading()
      }
      if (errorMessage) {
        message.error(errorMessage)
      }
      throw error
    } finally {
      if (global) {
        finishGlobalLoading()
      }
      if (taskId) {
        finishTaskLoading(taskId)
      }
    }
  }

  /**
   * 延迟加载（防止闪烁）
   * @param fn 异步函数
   * @param minDelay 最小延迟时间（毫秒）
   */
  const withMinDelay = async <T>(fn: () => Promise<T>, minDelay = 300): Promise<T> => {
    const startTime = Date.now()
    const result = await fn()
    const elapsed = Date.now() - startTime

    if (elapsed < minDelay) {
      await new Promise((resolve) => setTimeout(resolve, minDelay - elapsed))
    }

    return result
  }

  /**
   * 批量加载管理
   */
  const batchLoading = () => {
    const tasks = new Map<string, Promise<any>>()

    const addTask = <T>(taskId: string, task: Promise<T>) => {
      startTaskLoading(taskId)
      tasks.set(taskId, task)

      task
        .finally(() => {
          finishTaskLoading(taskId)
          tasks.delete(taskId)
        })
        .catch(() => {
          // 错误已在外部处理
        })

      return task
    }

    const waitAll = async () => {
      await Promise.all(Array.from(tasks.values()))
    }

    const cancelAll = () => {
      tasks.clear()
      loadingTasks.value.clear()
    }

    return {
      addTask,
      waitAll,
      cancelAll,
      tasks: computed(() => Array.from(tasks.keys()))
    }
  }

  return {
    // 全局加载
    isGlobalLoading,
    startGlobalLoading,
    finishGlobalLoading,
    errorGlobalLoading,

    // 局部加载
    createLoadingState,

    // 任务加载
    startTaskLoading,
    finishTaskLoading,
    isTaskLoading,

    // 工具函数
    withLoading,
    withMinDelay,
    batchLoading
  }
}

/**
 * 页面加载状态 Hook
 * 用于页面级别的加载状态管理
 */
export function usePageLoading() {
  const { loading, startLoading, stopLoading } = useLoading().createLoadingState()

  return {
    pageLoading: loading,
    startPageLoading: startLoading,
    stopPageLoading: stopLoading
  }
}
