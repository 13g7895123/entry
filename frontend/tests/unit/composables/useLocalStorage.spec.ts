// tests/unit/composables/useLocalStorage.spec.ts
// Unit 測試 - useLocalStorage composable

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useLocalStorage } from '@/composables/useLocalStorage'
import type { AuthToken } from '@/types/auth'

describe('[US2] useLocalStorage', () => {
  const { saveToken, getToken, getTokenExpiry, isTokenExpired, clearToken } = useLocalStorage()

  const mockToken: AuthToken = {
    accessToken: 'mock_access_token',
    refreshToken: 'mock_refresh_token',
    expiresIn: 3600,
    tokenType: 'Bearer'
  }

  beforeEach(() => {
    // 清除所有儲存
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    // 清除所有儲存
    localStorage.clear()
    sessionStorage.clear()
  })

  describe('saveToken', () => {
    it('應在 rememberMe 為 true 時將 token 儲存至 localStorage', () => {
      saveToken(mockToken, true)

      expect(localStorage.getItem('auth_token')).toBe(mockToken.accessToken)
      expect(localStorage.getItem('auth_token_expires')).toBeTruthy()
      expect(localStorage.getItem('auth_refresh_token')).toBe(mockToken.refreshToken)

      // 驗證 sessionStorage 為空
      expect(sessionStorage.getItem('auth_token')).toBeNull()
    })

    it('應在 rememberMe 為 false 時將 token 儲存至 sessionStorage', () => {
      saveToken(mockToken, false)

      expect(sessionStorage.getItem('auth_token')).toBe(mockToken.accessToken)
      expect(sessionStorage.getItem('auth_token_expires')).toBeTruthy()
      expect(sessionStorage.getItem('auth_refresh_token')).toBe(mockToken.refreshToken)

      // 驗證 localStorage 為空
      expect(localStorage.getItem('auth_token')).toBeNull()
    })

    it('應正確計算並儲存過期時間', () => {
      const beforeSave = Date.now()
      saveToken(mockToken, true)
      const afterSave = Date.now()

      const expiresStr = localStorage.getItem('auth_token_expires')
      expect(expiresStr).toBeTruthy()

      if (expiresStr) {
        const expires = parseInt(expiresStr, 10)
        const expectedMin = beforeSave + mockToken.expiresIn * 1000
        const expectedMax = afterSave + mockToken.expiresIn * 1000

        expect(expires).toBeGreaterThanOrEqual(expectedMin)
        expect(expires).toBeLessThanOrEqual(expectedMax)
      }
    })
  })

  describe('getToken', () => {
    it('應從 localStorage 取得 token', () => {
      localStorage.setItem('auth_token', 'test_token')

      const token = getToken()
      expect(token).toBe('test_token')
    })

    it('應從 sessionStorage 取得 token', () => {
      sessionStorage.setItem('auth_token', 'test_token')

      const token = getToken()
      expect(token).toBe('test_token')
    })

    it('應優先從 localStorage 取得 token', () => {
      localStorage.setItem('auth_token', 'local_token')
      sessionStorage.setItem('auth_token', 'session_token')

      const token = getToken()
      expect(token).toBe('local_token')
    })

    it('應在沒有 token 時回傳 null', () => {
      const token = getToken()
      expect(token).toBeNull()
    })
  })

  describe('getTokenExpiry', () => {
    it('應從 localStorage 取得過期時間', () => {
      const expires = Date.now() + 3600000
      localStorage.setItem('auth_token_expires', expires.toString())

      const result = getTokenExpiry()
      expect(result).toBe(expires)
    })

    it('應從 sessionStorage 取得過期時間', () => {
      const expires = Date.now() + 3600000
      sessionStorage.setItem('auth_token_expires', expires.toString())

      const result = getTokenExpiry()
      expect(result).toBe(expires)
    })

    it('應在沒有過期時間時回傳 null', () => {
      const result = getTokenExpiry()
      expect(result).toBeNull()
    })
  })

  describe('isTokenExpired', () => {
    it('應在 token 未過期時回傳 false', () => {
      const expires = Date.now() + 3600000 // 1小時後
      localStorage.setItem('auth_token_expires', expires.toString())

      expect(isTokenExpired()).toBe(false)
    })

    it('應在 token 已過期時回傳 true', () => {
      const expires = Date.now() - 1000 // 1秒前
      localStorage.setItem('auth_token_expires', expires.toString())

      expect(isTokenExpired()).toBe(true)
    })

    it('應在沒有過期時間時回傳 true', () => {
      expect(isTokenExpired()).toBe(true)
    })
  })

  describe('clearToken', () => {
    it('應清除 localStorage 中的所有 token 資料', () => {
      localStorage.setItem('auth_token', 'test_token')
      localStorage.setItem('auth_token_expires', '123456')
      localStorage.setItem('auth_refresh_token', 'refresh_token')

      clearToken()

      expect(localStorage.getItem('auth_token')).toBeNull()
      expect(localStorage.getItem('auth_token_expires')).toBeNull()
      expect(localStorage.getItem('auth_refresh_token')).toBeNull()
    })

    it('應清除 sessionStorage 中的所有 token 資料', () => {
      sessionStorage.setItem('auth_token', 'test_token')
      sessionStorage.setItem('auth_token_expires', '123456')
      sessionStorage.setItem('auth_refresh_token', 'refresh_token')

      clearToken()

      expect(sessionStorage.getItem('auth_token')).toBeNull()
      expect(sessionStorage.getItem('auth_token_expires')).toBeNull()
      expect(sessionStorage.getItem('auth_refresh_token')).toBeNull()
    })

    it('應同時清除 localStorage 和 sessionStorage', () => {
      localStorage.setItem('auth_token', 'local_token')
      sessionStorage.setItem('auth_token', 'session_token')

      clearToken()

      expect(localStorage.getItem('auth_token')).toBeNull()
      expect(sessionStorage.getItem('auth_token')).toBeNull()
    })
  })
})
