// composables/useLocalStorage.ts
// 管理 localStorage/sessionStorage token 儲存

import type { AuthToken } from '@/types/auth'

export function useLocalStorage() {
  /**
   * 儲存 token
   * @param token - 要儲存的 token
   * @param rememberMe - 是否記住登入（true: localStorage, false: sessionStorage）
   */
  const saveToken = (token: AuthToken, rememberMe: boolean = false) => {
    const storage = rememberMe ? localStorage : sessionStorage
    const expiresAt = Date.now() + token.expiresIn * 1000

    storage.setItem('auth_token', token.accessToken)
    storage.setItem('auth_token_expires', expiresAt.toString())

    if (token.refreshToken) {
      storage.setItem('auth_refresh_token', token.refreshToken)
    }
  }

  /**
   * 取得 token
   */
  const getToken = (): string | null => {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
  }

  /**
   * 取得 token 過期時間
   */
  const getTokenExpiry = (): number | null => {
    const expires =
      localStorage.getItem('auth_token_expires') ||
      sessionStorage.getItem('auth_token_expires')

    return expires ? parseInt(expires, 10) : null
  }

  /**
   * 檢查 token 是否過期
   */
  const isTokenExpired = (): boolean => {
    const expiry = getTokenExpiry()
    if (!expiry) return true

    return Date.now() > expiry
  }

  /**
   * 清除 token
   */
  const clearToken = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_token_expires')
    localStorage.removeItem('auth_refresh_token')

    sessionStorage.removeItem('auth_token')
    sessionStorage.removeItem('auth_token_expires')
    sessionStorage.removeItem('auth_refresh_token')
  }

  return {
    saveToken,
    getToken,
    getTokenExpiry,
    isTokenExpired,
    clearToken
  }
}
