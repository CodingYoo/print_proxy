import { create } from 'zustand'
import { User, authApi } from '@/api'
import { setToken, clearToken, getToken } from '@/api/client'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string, remember: boolean) => Promise<void>
  logout: () => void
  fetchUser: () => Promise<void>
  checkAuth: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (username: string, password: string, remember: boolean) => {
    const response = await authApi.login(username, password)
    setToken(response.access_token, remember)
    localStorage.setItem('pps_username', username)
    set({ isAuthenticated: true })
    await get().fetchUser()
  },

  logout: () => {
    clearToken()
    set({ user: null, isAuthenticated: false })
  },

  fetchUser: async () => {
    set({ isLoading: true })
    try {
      const user = await authApi.getCurrentUser()
      set({ user, isAuthenticated: true })
    } catch {
      set({ user: null, isAuthenticated: false })
    } finally {
      set({ isLoading: false })
    }
  },

  checkAuth: () => {
    return !!getToken()
  },
}))
