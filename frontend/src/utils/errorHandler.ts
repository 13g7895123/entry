// utils/errorHandler.ts
// 錯誤處理工具 - 對應 API 錯誤碼至繁體中文訊息

import { ErrorType, type ErrorMessage } from '@/types/api'
import type { AxiosError } from 'axios'

// 錯誤代碼訊息對應
const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: '帳號或密碼錯誤，請重新輸入',
  TOO_MANY_REQUESTS: '嘗試次數過多，請稍後再試',
  INTERNAL_SERVER_ERROR: '系統錯誤，請稍後再試',
  SERVICE_UNAVAILABLE: '系統維護中，請稍後再試',
  NETWORK_ERROR: '連線失敗，請檢查網路狀態後重試',
  TIMEOUT: '請求逾時，請稍後重試',
  INVALID_REQUEST: '請求格式錯誤',
  TOKEN_EXPIRED: 'Token 已過期，請重新登入',
  INVALID_TOKEN: 'Token 無效'
}

export class ErrorHandler {
  /**
   * 處理 API 錯誤回應
   */
  static handleApiError(error: unknown): ErrorMessage {
    // Axios 錯誤
    if (this.isAxiosError(error)) {
      return this.handleAxiosError(error)
    }

    // 一般錯誤
    if (error instanceof Error) {
      return {
        message: error.message || '發生未知錯誤，請稍後再試',
        type: ErrorType.UNKNOWN
      }
    }

    // 未知錯誤
    return {
      message: '發生未知錯誤，請稍後再試',
      type: ErrorType.UNKNOWN
    }
  }

  /**
   * 處理 Axios 錯誤
   */
  private static handleAxiosError(error: AxiosError): ErrorMessage {
    // 網路錯誤
    if (!error.response) {
      return {
        message: ERROR_MESSAGES.NETWORK_ERROR,
        type: ErrorType.NETWORK,
        code: 'NETWORK_ERROR'
      }
    }

    // 逾時錯誤
    if (error.code === 'ECONNABORTED') {
      return {
        message: ERROR_MESSAGES.TIMEOUT,
        type: ErrorType.TIMEOUT,
        code: 'TIMEOUT'
      }
    }

    // HTTP 錯誤回應
    const { status, data } = error.response
    const errorData = data as { error?: { code?: string; message?: string } }

    // 根據錯誤代碼取得訊息
    const errorCode = errorData?.error?.code || this.getErrorCodeFromStatus(status)
    const errorMessage = ERROR_MESSAGES[errorCode] || errorData?.error?.message || '系統錯誤，請稍後再試'

    return {
      message: errorMessage,
      type: this.getErrorType(status),
      code: errorCode
    }
  }

  /**
   * 根據 HTTP 狀態碼取得錯誤代碼
   */
  private static getErrorCodeFromStatus(status: number): string {
    switch (status) {
      case 401:
        return 'INVALID_CREDENTIALS'
      case 429:
        return 'TOO_MANY_REQUESTS'
      case 500:
      case 502:
        return 'INTERNAL_SERVER_ERROR'
      case 503:
        return 'SERVICE_UNAVAILABLE'
      default:
        return 'UNKNOWN'
    }
  }

  /**
   * 根據 HTTP 狀態碼取得錯誤類型
   */
  private static getErrorType(status: number): ErrorType {
    if (status === 401 || status === 403) {
      return ErrorType.AUTHENTICATION
    }
    if (status === 400 || status === 422) {
      return ErrorType.VALIDATION
    }
    if (status >= 500) {
      return ErrorType.SERVER
    }
    return ErrorType.UNKNOWN
  }

  /**
   * 型別守衛：檢查是否為 Axios 錯誤
   */
  private static isAxiosError(error: unknown): error is AxiosError {
    return (error as AxiosError).isAxiosError === true
  }
}
