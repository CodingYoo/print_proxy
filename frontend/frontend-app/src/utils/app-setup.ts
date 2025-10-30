import { type App } from 'vue'
import { useMessage } from 'naive-ui'
import { setMessageInstance } from '@/api/client'
import { useAuthStore } from '@/stores/auth'

// 应用初始化设置
export const setupApp = (app: App) => {
  // 在应用挂载后设置消息实例
  app.config.globalProperties.$setupMessage = () => {
    const message = useMessage()
    setMessageInstance(message)
    return message
  }
}

// 初始化认证状态
export const initializeAuth = () => {
  const authStore = useAuthStore()
  authStore.initializeAuth()
  
  // 如果有 token，验证其有效性
  if (authStore.token) {
    authStore.validateToken().catch(() => {
      // Token 无效，清除认证信息
      authStore.logout()
    })
  }
}