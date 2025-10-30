/**
 * 用户反馈 Composable
 * 提供统一的用户操作反馈机制
 */

import { useMessage, useNotification, useDialog } from 'naive-ui'

export interface FeedbackOptions {
  duration?: number
  closable?: boolean
  keepAliveOnHover?: boolean
}

export interface ConfirmOptions {
  title?: string
  content?: string
  positiveText?: string
  negativeText?: string
  type?: 'info' | 'success' | 'warning' | 'error'
}

export function useFeedback() {
  const message = useMessage()
  const notification = useNotification()
  const dialog = useDialog()

  /**
   * 成功消息
   */
  const success = (content: string, options?: FeedbackOptions) => {
    message.success(content, {
      duration: options?.duration || 3000,
      closable: options?.closable,
      keepAliveOnHover: options?.keepAliveOnHover
    })
  }

  /**
   * 错误消息
   */
  const error = (content: string, options?: FeedbackOptions) => {
    message.error(content, {
      duration: options?.duration || 3000,
      closable: options?.closable,
      keepAliveOnHover: options?.keepAliveOnHover
    })
  }

  /**
   * 警告消息
   */
  const warning = (content: string, options?: FeedbackOptions) => {
    message.warning(content, {
      duration: options?.duration || 3000,
      closable: options?.closable,
      keepAliveOnHover: options?.keepAliveOnHover
    })
  }

  /**
   * 信息消息
   */
  const info = (content: string, options?: FeedbackOptions) => {
    message.info(content, {
      duration: options?.duration || 3000,
      closable: options?.closable,
      keepAliveOnHover: options?.keepAliveOnHover
    })
  }

  /**
   * 加载消息
   */
  const loading = (content: string, options?: FeedbackOptions) => {
    return message.loading(content, {
      duration: options?.duration || 0, // 0 表示不自动关闭
      closable: options?.closable
    })
  }

  /**
   * 成功通知
   */
  const notifySuccess = (title: string, content?: string, options?: FeedbackOptions) => {
    notification.success({
      title,
      content,
      duration: options?.duration || 4500,
      keepAliveOnHover: options?.keepAliveOnHover ?? true
    })
  }

  /**
   * 错误通知
   */
  const notifyError = (title: string, content?: string, options?: FeedbackOptions) => {
    notification.error({
      title,
      content,
      duration: options?.duration || 4500,
      keepAliveOnHover: options?.keepAliveOnHover ?? true
    })
  }

  /**
   * 警告通知
   */
  const notifyWarning = (title: string, content?: string, options?: FeedbackOptions) => {
    notification.warning({
      title,
      content,
      duration: options?.duration || 4500,
      keepAliveOnHover: options?.keepAliveOnHover ?? true
    })
  }

  /**
   * 信息通知
   */
  const notifyInfo = (title: string, content?: string, options?: FeedbackOptions) => {
    notification.info({
      title,
      content,
      duration: options?.duration || 4500,
      keepAliveOnHover: options?.keepAliveOnHover ?? true
    })
  }

  /**
   * 确认对话框
   */
  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      const d = dialog[options.type || 'warning']({
        title: options.title || '确认操作',
        content: options.content || '确定要执行此操作吗？',
        positiveText: options.positiveText || '确定',
        negativeText: options.negativeText || '取消',
        onPositiveClick: () => {
          resolve(true)
        },
        onNegativeClick: () => {
          resolve(false)
        },
        onClose: () => {
          resolve(false)
        }
      })
    })
  }

  /**
   * 操作成功反馈（带自动跳转）
   */
  const successWithAction = (
    content: string,
    action: () => void,
    delay = 1500
  ) => {
    success(content)
    setTimeout(action, delay)
  }

  /**
   * 操作进度反馈
   */
  const progressFeedback = (
    startMessage: string,
    successMessage: string,
    errorMessage: string
  ) => {
    const loadingMsg = loading(startMessage)

    return {
      success: () => {
        loadingMsg.destroy()
        success(successMessage)
      },
      error: (err?: string) => {
        loadingMsg.destroy()
        error(err || errorMessage)
      },
      destroy: () => {
        loadingMsg.destroy()
      }
    }
  }

  /**
   * 批量操作反馈
   */
  const batchFeedback = (
    total: number,
    successCount: number,
    failCount: number
  ) => {
    if (failCount === 0) {
      success(`成功处理 ${successCount} 项`)
    } else if (successCount === 0) {
      error(`处理失败 ${failCount} 项`)
    } else {
      warning(`成功 ${successCount} 项，失败 ${failCount} 项`)
    }
  }

  /**
   * 复制成功反馈
   */
  const copySuccess = (content = '已复制到剪贴板') => {
    success(content, { duration: 2000 })
  }

  /**
   * 保存成功反馈
   */
  const saveSuccess = (content = '保存成功') => {
    success(content)
  }

  /**
   * 删除确认
   */
  const confirmDelete = async (itemName?: string): Promise<boolean> => {
    return confirm({
      type: 'warning',
      title: '确认删除',
      content: itemName ? `确定要删除 "${itemName}" 吗？此操作不可恢复。` : '确定要删除吗？此操作不可恢复。',
      positiveText: '删除',
      negativeText: '取消'
    })
  }

  /**
   * 取消确认
   */
  const confirmCancel = async (): Promise<boolean> => {
    return confirm({
      type: 'warning',
      title: '确认取消',
      content: '确定要取消当前操作吗？未保存的更改将丢失。',
      positiveText: '确定',
      negativeText: '继续编辑'
    })
  }

  return {
    // 消息
    success,
    error,
    warning,
    info,
    loading,

    // 通知
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,

    // 对话框
    confirm,
    confirmDelete,
    confirmCancel,

    // 特殊反馈
    successWithAction,
    progressFeedback,
    batchFeedback,
    copySuccess,
    saveSuccess
  }
}
