// types/auth.ts
// 驗證相關型別定義

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest'
}

export interface LoginCredentials {
  username: string
  password: string
  rememberMe?: boolean
}

export interface AuthToken {
  accessToken: string
  refreshToken?: string
  expiresIn: number
  tokenType: string
}

export interface UserInfo {
  id: string
  username: string
  displayName: string
  email?: string
  role: UserRole
  permissions?: string[]
}

export interface LoginFormState {
  isLoading: boolean
  showPassword: boolean
  error: ErrorMessage | null
  fieldErrors: FieldErrors
}

export interface FieldErrors {
  username?: string
  password?: string
}

// Re-export from api.ts for convenience
export type { ErrorMessage } from './api'
