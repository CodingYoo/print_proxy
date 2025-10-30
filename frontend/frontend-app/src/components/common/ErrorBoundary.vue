<template>
  <div v-if="hasError" class="error-boundary-container">
    <n-result
      :status="errorType"
      :title="errorTitle"
      :description="errorDescription"
      class="py-12"
    >
      <template #icon>
        <n-icon size="64" :color="iconColor">
          <component :is="errorIcon" />
        </n-icon>
      </template>
      
      <template #footer>
        <div class="space-y-4">
          <!-- 操作按钮 -->
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <n-button
              type="primary"
              @click="handleRetry"
              :loading="retrying"
            >
              <template #icon>
                <n-icon>
                  <ReloadOutlined />
                </n-icon>
              </template>
              重试
            </n-button>
            
            <n-button
              quaternary
              @click="handleGoHome"
            >
              <template #icon>
                <n-icon>
                  <HomeOutlined />
                </n-icon>
              </template>
              返回首页
            </n-button>
            
            <n-button
              v-if="showReportButton"
              quaternary
              @click="handleReportError"
            >
              <template #icon>
                <n-icon>
                  <BugOutlined />
                </n-icon>
              </template>
              报告问题
            </n-button>
          </div>
          
          <!-- 错误详情（开发环境） -->
          <div v-if="isDevelopment && errorDetails" class="mt-6">
            <n-collapse>
              <n-collapse-item title="错误详情" name="error-details">
                <n-code
                  :code="errorDetails"
                  language="javascript"
                  show-line-numbers
                  word-wrap
                />
              </n-collapse-item>
            </n-collapse>
          </div>
        </div>
      </template>
    </n-result>
  </div>
  
  <!-- 正常内容 -->
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, computed, onErrorCaptured, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { 
  NResult, 
  NButton, 
  NIcon, 
  NCollapse, 
  NCollapseItem, 
  NCode,
  useMessage 
} from 'naive-ui'
import {
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  ReloadOutlined,
  HomeOutlined,
  BugOutlined
} from '@vicons/antd'

export type ErrorType = 'error' | 'warning' | 'info' | '404' | '403' | '500'

interface Props {
  fallbackComponent?: any
  onError?: (error: Error, instance: any) => void
  showReportButton?: boolean
  autoRetry?: boolean
  retryDelay?: number
  maxRetries?: number
}

const props = withDefaults(defineProps<Props>(), {
  showReportButton: true,
  autoRetry: false,
  retryDelay: 3000,
  maxRetries: 3
})

const emit = defineEmits<{
  error: [error: Error, instance: any]
  retry: []
  report: [error: Error]
}>()

const router = useRouter()
const message = useMessage()

// 状态
const hasError = ref(false)
const currentError = ref<Error | null>(null)
const errorInfo = ref<any>(null)
const retrying = ref(false)
const retryCount = ref(0)

// 计算属性
const isDevelopment = computed(() => import.meta.env.DEV)

const errorType = computed((): ErrorType => {
  if (!currentError.value) return 'error'
  
  const message = currentError.value.message.toLowerCase()
  
  if (message.includes('404') || message.includes('not found')) {
    return '404'
  }
  if (message.includes('403') || message.includes('forbidden')) {
    return '403'
  }
  if (message.includes('500') || message.includes('server error')) {
    return '500'
  }
  if (message.includes('warning')) {
    return 'warning'
  }
  
  return 'error'
})

const errorTitle = computed(() => {
  const titles: Record<ErrorType, string> = {
    'error': '页面出现错误',
    'warning': '页面警告',
    'info': '页面信息',
    '404': '页面未找到',
    '403': '访问被拒绝',
    '500': '服务器错误'
  }
  return titles[errorType.value] || '未知错误'
})

const errorDescription = computed(() => {
  const descriptions: Record<ErrorType, string> = {
    'error': '页面加载时发生了意外错误，请尝试刷新页面或联系管理员',
    'warning': '页面加载时出现警告，可能影响部分功能',
    'info': '页面加载完成，但有一些信息需要注意',
    '404': '您访问的页面不存在，可能已被删除或移动',
    '403': '您没有权限访问此页面，请联系管理员',
    '500': '服务器内部错误，请稍后重试或联系管理员'
  }
  
  const defaultDesc = descriptions[errorType.value] || '发生了未知错误'
  
  // 如果有自定义错误消息，显示它
  if (currentError.value && currentError.value.message) {
    return `${defaultDesc}\n\n错误信息：${currentError.value.message}`
  }
  
  return defaultDesc
})

const errorIcon = computed(() => {
  const icons: Record<ErrorType, any> = {
    'error': CloseCircleOutlined,
    'warning': WarningOutlined,
    'info': ExclamationCircleOutlined,
    '404': ExclamationCircleOutlined,
    '403': WarningOutlined,
    '500': CloseCircleOutlined
  }
  return icons[errorType.value] || CloseCircleOutlined
})

const iconColor = computed(() => {
  const colors: Record<ErrorType, string> = {
    'error': '#ff4d4f',
    'warning': '#faad14',
    'info': '#1890ff',
    '404': '#1890ff',
    '403': '#faad14',
    '500': '#ff4d4f'
  }
  return colors[errorType.value] || '#ff4d4f'
})

const errorDetails = computed(() => {
  if (!currentError.value) return ''
  
  const details = []
  details.push(`错误类型: ${currentError.value.name}`)
  details.push(`错误消息: ${currentError.value.message}`)
  
  if (currentError.value.stack) {
    details.push(`错误堆栈:\n${currentError.value.stack}`)
  }
  
  if (errorInfo.value) {
    details.push(`组件信息: ${JSON.stringify(errorInfo.value, null, 2)}`)
  }
  
  return details.join('\n\n')
})

// 错误捕获
onErrorCaptured((error: Error, instance: any, info: string) => {
  console.error('ErrorBoundary caught an error:', error, instance, info)
  
  hasError.value = true
  currentError.value = error
  errorInfo.value = { instance, info }
  
  // 触发回调
  if (props.onError) {
    props.onError(error, instance)
  }
  
  emit('error', error, instance)
  
  // 自动重试
  if (props.autoRetry && retryCount.value < props.maxRetries) {
    setTimeout(() => {
      handleRetry()
    }, props.retryDelay)
  }
  
  return false // 阻止错误继续传播
})

// 方法
const handleRetry = async () => {
  retrying.value = true
  retryCount.value++
  
  try {
    // 等待一小段时间
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 重置错误状态
    hasError.value = false
    currentError.value = null
    errorInfo.value = null
    
    // 强制重新渲染
    await nextTick()
    
    message.success('页面已重新加载')
    emit('retry')
  } catch (error) {
    console.error('Retry failed:', error)
    message.error('重试失败，请手动刷新页面')
  } finally {
    retrying.value = false
  }
}

const handleGoHome = () => {
  router.push({ name: 'dashboard' })
}

const handleReportError = () => {
  if (currentError.value) {
    emit('report', currentError.value)
    
    // 这里可以集成错误报告服务
    // 比如发送到 Sentry、LogRocket 等
    console.log('Reporting error:', {
      error: currentError.value,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    })
    
    message.success('错误报告已发送，感谢您的反馈')
  }
}

// 重置错误状态的方法（供外部调用）
const resetError = () => {
  hasError.value = false
  currentError.value = null
  errorInfo.value = null
  retryCount.value = 0
}

// 暴露方法
defineExpose({
  resetError,
  retry: handleRetry
})
</script>

<style scoped>
.error-boundary-container {
  @apply min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900;
}

:deep(.n-result) {
  @apply max-w-2xl mx-auto;
}

:deep(.n-result .n-result__content) {
  @apply text-left;
}

:deep(.n-code) {
  @apply max-h-64 overflow-auto;
}
</style>