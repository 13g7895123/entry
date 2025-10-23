# 資料模型：SaaS 登入頁面前端

**日期**: 2025-10-23
**功能**: SaaS 登入頁面前端 (001-saas-login-frontend)

## 概述

本文檔定義登入功能所需的前端資料模型，包括型別定義、驗證規則、狀態結構與資料流向。所有模型使用 TypeScript 定義，確保型別安全。

---

## 實體 1: LoginCredentials（登入憑證）

### 說明
使用者輸入的登入資訊，用於提交至 CRM API 進行身份驗證。

### 欄位定義

| 欄位名稱 | 型別 | 必填 | 說明 | 驗證規則 |
|---------|------|------|------|---------|
| `username` | `string` | 是 | 使用者帳號 | - 不可為空<br>- 最小長度 3 字元<br>- 最大長度 50 字元 |
| `password` | `string` | 是 | 使用者密碼 | - 不可為空<br>- 最小長度 6 字元<br>- 最大長度 100 字元<br>- 保留特殊字元與空白 |
| `rememberMe` | `boolean` | 否 | 是否記住登入狀態 | - 預設值: `false` |

### TypeScript 定義

```typescript
// types/auth.ts
export interface LoginCredentials {
  username: string
  password: string
  rememberMe?: boolean
}
```

### 驗證規則（Yup Schema）

```typescript
import * as yup from 'yup'

export const loginCredentialsSchema = yup.object({
  username: yup.string()
    .required('帳號為必填欄位')
    .min(3, '帳號至少需 3 個字元')
    .max(50, '帳號最多 50 個字元')
    .trim(),
  password: yup.string()
    .required('密碼為必填欄位')
    .min(6, '密碼長度至少需 6 個字元')
    .max(100, '密碼最多 100 個字元'),
  rememberMe: yup.boolean()
    .default(false)
})
```

### 使用場景
- 登入表單資料綁定
- API 請求 payload
- 表單驗證

---

## 實體 2: AuthToken（驗證 Token）

### 說明
CRM API 回傳的身份驗證憑證，用於後續 API 呼叫與登入狀態維護。

### 欄位定義

| 欄位名稱 | 型別 | 必填 | 說明 |
|---------|------|------|------|
| `accessToken` | `string` | 是 | JWT 存取 token |
| `refreshToken` | `string` | 否 | 刷新 token（若支援） |
| `expiresIn` | `number` | 是 | Token 有效期（秒） |
| `tokenType` | `string` | 是 | Token 類型（通常為 "Bearer"） |

### TypeScript 定義

```typescript
// types/auth.ts
export interface AuthToken {
  accessToken: string
  refreshToken?: string
  expiresIn: number
  tokenType: string
}
```

### 儲存策略
- **rememberMe = true**: 儲存至 `localStorage`
- **rememberMe = false**: 儲存至 `sessionStorage`
- 包含過期時間戳記以便檢查有效性

### 使用場景
- API 請求 Authorization header
- 登入狀態檢查
- Token 過期處理

---

## 實體 3: UserInfo（使用者資訊）

### 說明
驗證成功後取得的基本使用者資料，用於顯示與授權判斷。

### 欄位定義

| 欄位名稱 | 型別 | 必填 | 說明 |
|---------|------|------|------|
| `id` | `string` | 是 | 使用者唯一識別碼 |
| `username` | `string` | 是 | 使用者帳號 |
| `displayName` | `string` | 是 | 顯示名稱 |
| `email` | `string` | 否 | 電子郵件 |
| `role` | `UserRole` | 是 | 使用者角色 |
| `permissions` | `string[]` | 否 | 權限列表 |

### TypeScript 定義

```typescript
// types/auth.ts
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest'
}

export interface UserInfo {
  id: string
  username: string
  displayName: string
  email?: string
  role: UserRole
  permissions?: string[]
}
```

### 使用場景
- 會員頁面顯示使用者資訊
- 權限檢查
- 個人化體驗

---

## 實體 4: LoginFormState（登入表單狀態）

### 說明
登入表單的 UI 狀態，包含載入狀態、錯誤訊息、欄位值等。

### 欄位定義

| 欄位名稱 | 型別 | 必填 | 說明 |
|---------|------|------|------|
| `isLoading` | `boolean` | 是 | 是否正在提交 |
| `showPassword` | `boolean` | 是 | 是否顯示密碼明文 |
| `error` | `ErrorMessage \| null` | 是 | 錯誤訊息 |
| `fieldErrors` | `FieldErrors` | 是 | 欄位驗證錯誤 |

### TypeScript 定義

```typescript
// types/auth.ts
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
```

### 狀態轉換
1. **初始狀態**: `isLoading: false`, `error: null`
2. **提交中**: `isLoading: true`, `error: null`
3. **成功**: `isLoading: false`, 導向會員頁面
4. **失敗**: `isLoading: false`, `error: { message, type }`

---

## 實體 5: ErrorMessage（錯誤訊息）

### 說明
統一的錯誤訊息格式，用於顯示使用者友善的錯誤提示。

### 欄位定義

| 欄位名稱 | 型別 | 必填 | 說明 |
|---------|------|------|------|
| `message` | `string` | 是 | 錯誤訊息文字（繁體中文） |
| `type` | `ErrorType` | 是 | 錯誤類型 |
| `code` | `string` | 否 | 錯誤代碼（用於追蹤） |

### TypeScript 定義

```typescript
// types/api.ts
export enum ErrorType {
  NETWORK = 'network',         // 網路錯誤
  AUTHENTICATION = 'auth',     // 認證失敗
  VALIDATION = 'validation',   // 驗證錯誤
  TIMEOUT = 'timeout',         // 逾時
  SERVER = 'server',           // 伺服器錯誤
  UNKNOWN = 'unknown'          // 未知錯誤
}

export interface ErrorMessage {
  message: string
  type: ErrorType
  code?: string
}
```

### 錯誤訊息對應

| API 狀態碼/情境 | 錯誤類型 | 顯示訊息 |
|---------------|---------|---------|
| 401 | `AUTHENTICATION` | 帳號或密碼錯誤，請重新輸入 |
| 429 | `VALIDATION` | 嘗試次數過多，請稍後再試 |
| 500, 502, 503 | `SERVER` | 系統錯誤，請稍後再試 |
| Network Error | `NETWORK` | 連線失敗，請檢查網路狀態後重試 |
| Timeout | `TIMEOUT` | 請求逾時，請稍後重試 |
| Other | `UNKNOWN` | 發生未知錯誤，請稍後再試 |

---

## 實體 6: AuthState（全域驗證狀態）

### 說明
Pinia store 中的驗證狀態，管理整個應用程式的登入狀態。

### 欄位定義

| 欄位名稱 | 型別 | 必填 | 說明 |
|---------|------|------|------|
| `isAuthenticated` | `boolean` | 是 | 是否已登入 |
| `user` | `UserInfo \| null` | 是 | 當前使用者資訊 |
| `token` | `AuthToken \| null` | 是 | 當前 token |
| `loginTime` | `number \| null` | 是 | 登入時間戳記 |

### TypeScript 定義

```typescript
// stores/auth.ts
import { defineStore } from 'pinia'
import type { UserInfo, AuthToken } from '@/types/auth'

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
    isTokenValid: (state) => {
      if (!state.token || !state.loginTime) return false
      const now = Date.now()
      const expiresAt = state.loginTime + (state.token.expiresIn * 1000)
      return now < expiresAt
    }
  },

  actions: {
    setAuth(user: UserInfo, token: AuthToken) {
      this.isAuthenticated = true
      this.user = user
      this.token = token
      this.loginTime = Date.now()
    },

    clearAuth() {
      this.isAuthenticated = false
      this.user = null
      this.token = null
      this.loginTime = null
    }
  }
})
```

---

## 實體 7: ApiResponse（API 回應）

### 說明
CRM API 的標準回應格式（根據假設，實際以 API 文件為準）。

### 成功回應

```typescript
// types/api.ts
export interface LoginSuccessResponse {
  success: true
  data: {
    user: UserInfo
    token: AuthToken
  }
  message?: string
}
```

### 錯誤回應

```typescript
export interface LoginErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
}

export type LoginApiResponse = LoginSuccessResponse | LoginErrorResponse
```

---

## 資料流向圖

```
[使用者輸入]
     ↓
[LoginCredentials] → 表單驗證
     ↓
[API Request] → CRM API
     ↓
[LoginApiResponse]
     ↓
   成功? ─→ 否 → [ErrorMessage] → 顯示錯誤
     ↓ 是
[AuthToken + UserInfo]
     ↓
[AuthState Store] ← 儲存狀態
     ↓
[localStorage/sessionStorage] ← 持久化
     ↓
[導向會員頁面]
```

---

## 狀態轉換圖

```
[未登入]
    ↓ 使用者輸入帳密
[驗證中] (isLoading = true)
    ↓
    ├─→ [驗證成功] → [已登入] → 導向會員頁面
    │
    └─→ [驗證失敗] → [未登入] → 顯示錯誤訊息

[已登入]
    ↓
    ├─→ Token 有效 → 保持登入
    │
    └─→ Token 過期 → [未登入] → 清除 token → 導向登入頁面
```

---

## 本地儲存結構

### localStorage (rememberMe = true)

```typescript
{
  "auth_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "auth_token_expires": 1698888888888,  // timestamp
  "auth_user": "{\"id\":\"123\",\"username\":\"user\", ...}"
}
```

### sessionStorage (rememberMe = false)

```typescript
{
  "auth_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "auth_token_expires": 1698888888888
}
```

---

## 驗證規則摘要

### 即時欄位驗證（blur 事件）
- **帳號欄位**:
  - 必填
  - 長度 3-50 字元
- **密碼欄位**:
  - 必填
  - 長度 6-100 字元
  - 保留特殊字元

### 提交前驗證
- 所有欄位必填
- 所有欄位驗證規則通過
- 無驗證錯誤訊息

---

## 資料安全考量

### 敏感資料處理
1. **密碼**:
   - 從不儲存至 localStorage/sessionStorage
   - 僅在記憶體中存在提交期間
   - 提交後立即清除表單密碼欄位
2. **Token**:
   - 儲存加密 token（由後端簽發）
   - 使用 HTTPS 傳輸
   - 過期自動清除
3. **使用者資訊**:
   - 僅儲存非敏感欄位
   - 不儲存密碼、信用卡等資訊

### XSS 防護
- 所有使用者輸入經過 Vue 自動轉義
- API 回應驗證型別
- CSP (Content Security Policy) 設定

---

## 型別檔案組織

```
src/types/
├── auth.ts           # 驗證相關型別
│   ├── LoginCredentials
│   ├── AuthToken
│   ├── UserInfo
│   ├── LoginFormState
│   └── FieldErrors
├── api.ts            # API 回應型別
│   ├── LoginApiResponse
│   ├── ErrorMessage
│   └── ErrorType
└── index.ts          # 統一匯出
```

---

## 資料模型總結

| 實體 | 用途 | 儲存位置 | 生命週期 |
|------|------|---------|---------|
| `LoginCredentials` | 表單輸入 | 元件 state | 提交後清除 |
| `AuthToken` | API 認證 | localStorage/sessionStorage | 直到登出或過期 |
| `UserInfo` | 使用者資料 | Pinia store | 直到登出 |
| `LoginFormState` | UI 狀態 | 元件 state | 元件存在期間 |
| `ErrorMessage` | 錯誤顯示 | 元件 state | 使用者操作後清除 |
| `AuthState` | 全域狀態 | Pinia store | 應用程式存在期間 |

所有資料模型均符合：
- ✅ TypeScript 型別安全
- ✅ 驗證規則完整
- ✅ 安全最佳實踐
- ✅ 繁體中文錯誤訊息
- ✅ 符合規格需求（FR-001 ~ FR-013）
