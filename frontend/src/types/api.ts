// types/api.ts
// API 回應型別定義

import type { UserInfo, AuthToken } from './auth'

export enum ErrorType {
  NETWORK = 'network',
  AUTHENTICATION = 'auth',
  VALIDATION = 'validation',
  TIMEOUT = 'timeout',
  SERVER = 'server',
  UNKNOWN = 'unknown'
}

export interface ErrorMessage {
  message: string
  type: ErrorType
  code?: string
}

// API 回應型別
export interface LoginSuccessResponse {
  success: true
  data: {
    user: UserInfo
    token: AuthToken
  }
  message?: string
}

export interface LoginErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export type LoginApiResponse = LoginSuccessResponse | LoginErrorResponse

export interface VerifySuccessResponse {
  success: true
  data: {
    user: UserInfo
  }
  message?: string
}

export interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}
