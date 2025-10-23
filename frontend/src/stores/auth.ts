// stores/auth.ts
// Pinia 驗證狀態管理

import { defineStore } from 'pinia'
import type { UserInfo, AuthToken, LoginCredentials } from '@/types/auth'
import { AuthService } from '@/services/authService'
import { useLocalStorage } from '@/composables/useLocalStorage'

export interface AuthState {
  isAuthenticated: boolean
  user: UserInfo | null
  token: AuthToken | null
  loginTime: number | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    isAuthenticated: false,
    user: null,
    token: null,
    loginTime: null
  }),

  getters: {
    /**
     * 檢查 token 是否仍然有效
     */
    isTokenValid: (state): boolean => {
      if (!state.token || !state.loginTime) return false
      const now = Date.now()
      const expiresAt = state.loginTime + state.token.expiresIn * 1000
      return now < expiresAt
    }
  },

  actions: {
    /**
     * 設定驗證狀態
     */
    setAuth(user: UserInfo, token: AuthToken) {
      this.isAuthenticated = true
      this.user = user
      this.token = token
      this.loginTime = Date.now()
    },

    /**
     * 清除驗證狀態
     */
    clearAuth() {
      this.isAuthenticated = false
      this.user = null
      this.token = null
      this.loginTime = null
    },

    /**
     * 登入方法
     */
    async login(credentials: LoginCredentials) {
      const response = await AuthService.login(credentials)

      if (response.success) {
        this.setAuth(response.data.user, response.data.token)
        return response
      }

      throw new Error('Login failed')
    },

    /**
     * 檢查登入狀態
     * 頁面載入時檢查 localStorage/sessionStorage token，若有效則自動登入
     */
    async checkAuth() {
      const { getToken, getTokenExpiry, isTokenExpired, clearToken } = useLocalStorage()

      // 檢查是否有 token
      const token = getToken()
      if (!token) {
        this.clearAuth()
        return
      }

      // 檢查 token 是否過期
      if (isTokenExpired()) {
        this.clearAuth()
        clearToken()
        return
      }

      // 驗證 token 有效性
      try {
        const response = await AuthService.verify()

        if (response.success) {
          // 重建驗證狀態
          const expiry = getTokenExpiry()
          if (expiry) {
            const expiresIn = Math.floor((expiry - Date.now()) / 1000)
            this.setAuth(response.data.user, {
              accessToken: token,
              expiresIn,
              tokenType: 'Bearer'
            })
          }
        }
      } catch (error) {
        // Token 無效或過期，清除狀態
        this.clearAuth()
        clearToken()
      }
    }
  }
})
