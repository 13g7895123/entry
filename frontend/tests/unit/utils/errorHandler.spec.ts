// tests/unit/utils/errorHandler.spec.ts
// Unit 測試 - 錯誤訊息對應邏輯

import { describe, it, expect } from 'vitest'
import { ErrorHandler } from '@/utils/errorHandler'
import { ErrorType } from '@/types/api'
import type { AxiosError } from 'axios'

describe('[US1] ErrorHandler', () => {
  describe('handleApiError', () => {
    it('應處理 401 錯誤並回傳繁體中文訊息', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 401,
          data: {
            error: {
              code: 'INVALID_CREDENTIALS',
              message: '帳號或密碼錯誤'
            }
          }
        }
      } as AxiosError

      const result = ErrorHandler.handleApiError(axiosError)

      expect(result.message).toBe('帳號或密碼錯誤，請重新輸入')
      expect(result.type).toBe(ErrorType.AUTHENTICATION)
      expect(result.code).toBe('INVALID_CREDENTIALS')
    })

    it('應處理 429 錯誤（速率限制）', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 429,
          data: {
            error: {
              code: 'TOO_MANY_REQUESTS',
              message: '嘗試次數過多'
            }
          }
        }
      } as AxiosError

      const result = ErrorHandler.handleApiError(axiosError)

      expect(result.message).toBe('嘗試次數過多，請稍後再試')
      expect(result.code).toBe('TOO_MANY_REQUESTS')
    })

    it('應處理 500 伺服器錯誤', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 500,
          data: {
            error: {
              code: 'INTERNAL_SERVER_ERROR',
              message: '系統錯誤'
            }
          }
        }
      } as AxiosError

      const result = ErrorHandler.handleApiError(axiosError)

      expect(result.message).toBe('系統錯誤，請稍後再試')
      expect(result.type).toBe(ErrorType.SERVER)
      expect(result.code).toBe('INTERNAL_SERVER_ERROR')
    })

    it('應處理網路錯誤（無 response）', () => {
      const axiosError = {
        isAxiosError: true,
        response: undefined
      } as AxiosError

      const result = ErrorHandler.handleApiError(axiosError)

      expect(result.message).toBe('連線失敗，請檢查網路狀態後重試')
      expect(result.type).toBe(ErrorType.NETWORK)
      expect(result.code).toBe('NETWORK_ERROR')
    })

    it('應處理逾時錯誤', () => {
      const axiosError = {
        isAxiosError: true,
        code: 'ECONNABORTED',
        response: undefined
      } as AxiosError

      const result = ErrorHandler.handleApiError(axiosError)

      expect(result.message).toBe('請求逾時，請稍後重試')
      expect(result.type).toBe(ErrorType.TIMEOUT)
      expect(result.code).toBe('TIMEOUT')
    })

    it('應處理一般 Error 物件', () => {
      const error = new Error('自訂錯誤訊息')

      const result = ErrorHandler.handleApiError(error)

      expect(result.message).toBe('自訂錯誤訊息')
      expect(result.type).toBe(ErrorType.UNKNOWN)
    })

    it('應處理未知錯誤類型', () => {
      const error = 'string error'

      const result = ErrorHandler.handleApiError(error)

      expect(result.message).toBe('發生未知錯誤，請稍後再試')
      expect(result.type).toBe(ErrorType.UNKNOWN)
    })

    it('應從狀態碼推斷錯誤類型', () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 503,
          data: {}
        }
      } as AxiosError

      const result = ErrorHandler.handleApiError(axiosError)

      expect(result.message).toBe('系統維護中，請稍後再試')
      expect(result.type).toBe(ErrorType.SERVER)
      expect(result.code).toBe('SERVICE_UNAVAILABLE')
    })
  })
})
