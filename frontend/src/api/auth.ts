import { apiClient } from './client'

export interface User {
  id: number
  username: string
  full_name?: string
  is_admin: boolean
  is_active: boolean
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('password', password)
    formData.append('grant_type', 'password')
    
    const response = await apiClient.post<LoginResponse>('/auth/token', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    return response.data
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me')
    return response.data
  },
}
