// tests/contract/crm-auth.spec.ts
// Contract 測試 - CRM API 整合測試

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { AuthService } from '@/services/authService'
import type { LoginCredentials } from '@/types/auth'

// Mock handlers for CRM API
const handlers = [
  // 成功登入
  http.post('http://localhost:3000/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as LoginCredentials

    if (body.username === 'user@example.com' && body.password === 'ValidPassword123') {
      return HttpResponse.json({
        success: true,
        data: {
          user: {
            id: 'usr_1234567890',
            username: 'user@example.com',
            displayName: '張三',
            email: 'user@example.com',
            role: 'user',
            permissions: ['read:profile', 'write:profile']
          },
          token: {
            accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            refreshToken: 'refresh_token_example',
            expiresIn: 3600,
            tokenType: 'Bearer'
          }
        },
        message: '登入成功'
      })
    }

    // 401 錯誤 - 帳號或密碼錯誤
    return HttpResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: '帳號或密碼錯誤'
        }
      },
      { status: 401 }
    )
  }),

  // 驗證 Token
  http.get('http://localhost:3000/api/auth/verify', ({ request }) => {
    const authHeader = request.headers.get('Authorization')

    // Token 有效
    if (authHeader === 'Bearer valid_token') {
      return HttpResponse.json({
        success: true,
        data: {
          user: {
            id: 'usr_1234567890',
            username: 'user@example.com',
            displayName: '張三',
            email: 'user@example.com',
            role: 'user'
          }
        },
        message: 'Token 有效'
      })
    }

    // Token 過期
    if (authHeader === 'Bearer expired_token') {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Token 已過期，請重新登入'
          }
        },
        { status: 401 }
      )
    }

    // Token 無效
    return HttpResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Token 無效'
        }
      },
      { status: 401 }
    )
  })
]

const server = setupServer(...handlers)

describe('[US1] CRM Auth API Contract Tests', () => {
  beforeAll(() => server.listen())
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  describe('POST /auth/login', () => {
    it('應成功登入並回傳使用者資料與 token', async () => {
      const credentials: LoginCredentials = {
        username: 'user@example.com',
        password: 'ValidPassword123',
        rememberMe: false
      }

      const response = await AuthService.login(credentials)

      expect(response.success).toBe(true)
      if (response.success) {
        expect(response.data.user).toBeDefined()
        expect(response.data.user.id).toBe('usr_1234567890')
        expect(response.data.user.username).toBe('user@example.com')
        expect(response.data.user.displayName).toBe('張三')
        expect(response.data.user.role).toBe('user')

        expect(response.data.token).toBeDefined()
        expect(response.data.token.accessToken).toBeTruthy()
        expect(response.data.token.expiresIn).toBe(3600)
        expect(response.data.token.tokenType).toBe('Bearer')
      }
    })

    it('應在帳號或密碼錯誤時回傳 401 錯誤', async () => {
      const credentials: LoginCredentials = {
        username: 'user@example.com',
        password: 'WrongPassword',
        rememberMe: false
      }

      try {
        await AuthService.login(credentials)
        expect.fail('應該拋出錯誤')
      } catch (error: any) {
        expect(error.message).toBe('帳號或密碼錯誤，請重新輸入')
        expect(error.type).toBe('auth')
        expect(error.code).toBe('INVALID_CREDENTIALS')
      }
    })

    it('應處理網路錯誤', async () => {
      // 模擬網路錯誤
      server.use(
        http.post('http://localhost:3000/api/auth/login', () => {
          return HttpResponse.error()
        })
      )

      const credentials: LoginCredentials = {
        username: 'user@example.com',
        password: 'ValidPassword123',
        rememberMe: false
      }

      try {
        await AuthService.login(credentials)
        expect.fail('應該拋出錯誤')
      } catch (error: any) {
        expect(error.type).toBe('network')
        expect(error.message).toContain('連線失敗')
      }
    })

    it('應處理逾時錯誤', async () => {
      // 模擬逾時
      server.use(
        http.post('http://localhost:3000/api/auth/login', async () => {
          await new Promise((resolve) => setTimeout(resolve, 11000))
          return HttpResponse.json({ success: true })
        })
      )

      const credentials: LoginCredentials = {
        username: 'user@example.com',
        password: 'ValidPassword123',
        rememberMe: false
      }

      try {
        await AuthService.login(credentials)
        expect.fail('應該拋出錯誤')
      } catch (error: any) {
        expect(error.type).toBe('timeout')
        expect(error.message).toContain('逾時')
      }
    })
  })

  describe('[US2] GET /auth/verify', () => {
    beforeEach(() => {
      // 清除之前的 token
      localStorage.clear()
      sessionStorage.clear()
    })

    it('應在 token 有效時回傳使用者資料', async () => {
      // 設定有效 token
      localStorage.setItem('auth_token', 'valid_token')

      try {
        const response = await AuthService.verify()

        expect(response.success).toBe(true)
        if (response.success) {
          expect(response.data.user).toBeDefined()
          expect(response.data.user.id).toBe('usr_1234567890')
          expect(response.data.user.username).toBe('user@example.com')
          expect(response.data.user.displayName).toBe('張三')
        }
      } finally {
        localStorage.clear()
      }
    })

    it('應在 token 過期時回傳錯誤', async () => {
      // 設定過期 token
      localStorage.setItem('auth_token', 'expired_token')

      try {
        await AuthService.verify()
        expect.fail('應該拋出錯誤')
      } catch (error: any) {
        expect(error.message).toBe('Token 已過期，請重新登入')
        expect(error.code).toBe('TOKEN_EXPIRED')
      } finally {
        localStorage.clear()
      }
    })

    it('應在 token 無效時回傳錯誤', async () => {
      // 設定無效 token
      localStorage.setItem('auth_token', 'invalid_token')

      try {
        await AuthService.verify()
        expect.fail('應該拋出錯誤')
      } catch (error: any) {
        expect(error.message).toContain('Token')
        expect(error.type).toBe('auth')
      } finally {
        localStorage.clear()
      }
    })
  })
})
