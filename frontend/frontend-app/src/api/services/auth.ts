import apiClient from '@/api/client'
import type { User, LoginCredentials } from '@/stores/auth'

// 认证相关 API 服务
export const authApi = {
  // 用户登录 - 使用 OAuth2 表单格式
  login: (credentials: LoginCredentials) => {
    const formData = new URLSearchParams()
    formData.append('username', credentials.username)
    formData.append('password', credentials.password)
    
    return apiClient.post('/auth/token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
  },

  // 用户登出
  logout: () => {
    return apiClient.post('/auth/logout')
  },

  // 刷新 token
  refreshToken: () => {
    return apiClient.post('/auth/refresh')
  },

  // 获取当前用户信息
  getCurrentUser: () => {
    return apiClient.get('/auth/me')
  },

  // 验证 token
  validateToken: () => {
    return apiClient.get('/auth/validate')
  },

  // 修改密码
  changePassword: (data: {
    currentPassword: string
    newPassword: string
    confirmPassword: string
  }) => {
    return apiClient.post('/auth/change-password', data)
  },

  // 重置密码请求
  requestPasswordReset: (email: string) => {
    return apiClient.post('/auth/reset-password-request', { email })
  },

  // 重置密码确认
  resetPassword: (data: {
    token: string
    newPassword: string
    confirmPassword: string
  }) => {
    return apiClient.post('/auth/reset-password', data)
  }
}