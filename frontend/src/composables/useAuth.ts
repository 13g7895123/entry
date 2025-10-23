// composables/useAuth.ts
// 整合 auth store 與 localStorage，提供登入函式與錯誤處理

import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useLocalStorage } from './useLocalStorage'
import { useRouter } from 'vue-router'
import type { LoginCredentials } from '@/types/auth'
import type { ErrorMessage } from '@/types/api'
import { ErrorHandler } from '@/utils/errorHandler'

export function useAuth() {
  const authStore = useAuthStore()
  const { saveToken, clearToken } = useLocalStorage()
  const router = useRouter()

  const isLoading = ref(false)
  const error = ref<ErrorMessage | null>(null)

  /**
   * 登入函式
   */
  const login = async (credentials: LoginCredentials) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await authStore.login(credentials)

      if (response.success) {
        // 儲存 token
        saveToken(response.data.token, credentials.rememberMe || false)

        // 導向會員頁面
        await router.push('/dashboard')

        return response
      }
    } catch (err: unknown) {
      // 處理錯誤
      const errorMessage = ErrorHandler.handleApiError(err)
      error.value = errorMessage
      throw errorMessage
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 登出函式
   */
  const logout = async () => {
    authStore.clearAuth()
    clearToken()
    await router.push('/login')
  }

  return {
    login,
    logout,
    isLoading,
    error,
    isAuthenticated: () => authStore.isAuthenticated,
    user: () => authStore.user
  }
}
