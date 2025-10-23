// services/authService.ts
// CRM API 整合 - 身份驗證服務

import axios, { type AxiosInstance } from 'axios'
import type { LoginCredentials } from '@/types/auth'
import type { LoginApiResponse, VerifySuccessResponse } from '@/types/api'
import { ErrorHandler } from '@/utils/errorHandler'

// Axios 實例設定
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_CRM_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 請求攔截器
apiClient.interceptors.request.use(
  (config) => {
    // 從 localStorage 或 sessionStorage 取得 token
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 回應攔截器
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 使用 ErrorHandler 處理錯誤
    const errorMessage = ErrorHandler.handleApiError(error)
    return Promise.reject(errorMessage)
  }
)

// AuthService 類別
export class AuthService {
  /**
   * 使用者登入
   */
  static async login(credentials: LoginCredentials): Promise<LoginApiResponse> {
    try {
      const response = await apiClient.post<LoginApiResponse>('/auth/login', credentials)
      return response.data
    } catch (error) {
      throw error
    }
  }

  /**
   * 驗證 Token 有效性
   */
  static async verify(): Promise<VerifySuccessResponse> {
    try {
      const response = await apiClient.get<VerifySuccessResponse>('/auth/verify')
      return response.data
    } catch (error) {
      throw error
    }
  }
}

export default AuthService
