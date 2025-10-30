import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import apiClient from '@/api/client'

// 定义用户接口
export interface User {
  id: string
  username: string
  email?: string
  role?: string
  createdAt?: string
}

// 定义登录凭据接口
export interface LoginCredentials {
  username: string
  password: string
  remember?: boolean
}

// 定义认证状态 store
export const useAuthStore = defineStore('auth', () => {
  // 状态
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const isAuthenticated = computed(() => !!token.value)

  // 初始化用户信息
  const initializeAuth = () => {
    const storedUser = localStorage.getItem('user_info')
    if (storedUser && token.value) {
      try {
        user.value = JSON.parse(storedUser)
      } catch (e) {
        console.error('Failed to parse stored user info:', e)
        logout()
      }
    }
  }

  // 登录操作
  const login = async (credentials: LoginCredentials) => {
    loading.value = true
    error.value = null

    try {
      const response = await apiClient.post('/auth/login', credentials)
      const { access_token, user: userData } = response.data

      // 存储 token 和用户信息
      token.value = access_token
      user.value = userData
      localStorage.setItem('auth_token', access_token)
      localStorage.setItem('user_info', JSON.stringify(userData))

      return userData
    } catch (err: any) {
      error.value = err.response?.data?.detail || '登录失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 登出操作
  const logout = () => {
    token.value = null
    user.value = null
    error.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_info')
  }

  // 刷新 token
  const refreshToken = async () => {
    if (!token.value) return

    try {
      const response = await apiClient.post('/auth/refresh')
      const { access_token } = response.data
      
      token.value = access_token
      localStorage.setItem('auth_token', access_token)
      
      return access_token
    } catch (err) {
      console.error('Token refresh failed:', err)
      logout()
      throw err
    }
  }

  // 获取当前用户信息
  const getCurrentUser = async () => {
    if (!token.value) {
      throw new Error('No authentication token')
    }

    try {
      const response = await apiClient.get('/auth/me')
      user.value = response.data
      localStorage.setItem('user_info', JSON.stringify(response.data))
      return response.data
    } catch (err) {
      console.error('Failed to get current user:', err)
      throw err
    }
  }

  // 验证 token 有效性
  const validateToken = async () => {
    if (!token.value) return false

    try {
      await getCurrentUser()
      return true
    } catch (err) {
      logout()
      return false
    }
  }

  return {
    // 状态
    token,
    user,
    loading,
    error,
    // 计算属性
    isAuthenticated,
    // 方法
    initializeAuth,
    login,
    logout,
    refreshToken,
    getCurrentUser,
    validateToken
  }
})