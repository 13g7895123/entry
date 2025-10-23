// stores/auth.ts
// Pinia 驗證狀態管理

import { defineStore } from 'pinia'
import type { UserInfo, AuthToken, LoginCredentials } from '@/types/auth'
import { AuthService } from '@/services/authService'

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
     * 檢查登入狀態 (骨架 - 將在 US2 實作)
     */
    async checkAuth() {
      // 將在 T048 實作
      console.log('checkAuth called - to be implemented in US2')
    }
  }
})
