# Data Model: 應用程式中心 UI

**Feature**: 004-app-center-ui
**Date**: 2025-10-24
**Purpose**: 定義前端資料模型、狀態管理結構和資料流

## Overview

本功能為純前端 UI 實作,資料模型主要包含:
1. **應用程式 (Application)**: 應用程式中心顯示的應用程式卡片資料
2. **通知 (Notification)**: 通知面板顯示的通知訊息
3. **使用者 (User)**: 導覽列顯示的當前登入使用者資訊

資料來源分為兩類:
- **靜態資料**: 應用程式列表 (前端硬編碼)
- **動態資料**: 通知、使用者資訊 (從後端 API 獲取)

---

## Entity: Application (應用程式)

### Description

代表應用程式中心顯示的可用應用程式。本階段為靜態資料,未來可擴展為從後端 API 獲取。

### TypeScript Interface

```typescript
// frontend/src/types/application.ts

export interface Application {
  /** 唯一識別碼 */
  id: string

  /** 應用程式名稱 (繁體中文) */
  name: string

  /** 應用程式英文代碼 (用於路由和圖示檔名) */
  code: 'crm' | 'erp' | 'ecommerce' | 'resume' | 'settings'

  /** 圖示路徑 (相對於 assets/images/app-icons/) */
  iconPath: string

  /** 點擊後導向的路由路徑 */
  routePath: string

  /** 應用程式是否已開發完成 */
  isAvailable: boolean

  /** 顯示順序 (用於排序) */
  order: number

  /** 應用程式描述 (可選,未來擴展用) */
  description?: string

  /** Fallback 顏色 (圖片載入失敗時的背景色) */
  fallbackColor: string
}
```

### Data Source

**靜態資料** (前端定義):
```typescript
// frontend/src/data/applications.ts

export const APPLICATIONS: Application[] = [
  {
    id: 'app-crm',
    name: 'CRM',
    code: 'crm',
    iconPath: '/app-icons/crm.png',
    routePath: '/crm',
    isAvailable: false,  // 未開發,導向 /coming-soon
    order: 1,
    description: '客戶關係管理系統',
    fallbackColor: '#3B82F6'  // blue-500
  },
  {
    id: 'app-erp',
    name: 'ERP',
    code: 'erp',
    iconPath: '/app-icons/erp.png',
    routePath: '/erp',
    isAvailable: false,
    order: 2,
    description: '企業資源規劃系統',
    fallbackColor: '#10B981'  // green-500
  },
  {
    id: 'app-ecommerce',
    name: 'Ecommerce',
    code: 'ecommerce',
    iconPath: '/app-icons/ecommerce.png',
    routePath: '/ecommerce',
    isAvailable: false,
    order: 3,
    description: '電子商務平台',
    fallbackColor: '#F59E0B'  // amber-500
  },
  {
    id: 'app-resume',
    name: 'Resume',
    code: 'resume',
    iconPath: '/app-icons/resume.png',
    routePath: '/resume',
    isAvailable: false,
    order: 4,
    description: '履歷管理系統',
    fallbackColor: '#8B5CF6'  // violet-500
  },
  {
    id: 'app-settings',
    name: '設定',
    code: 'settings',
    iconPath: '/app-icons/settings.png',
    routePath: '/settings',
    isAvailable: true,  // 設定頁面可用
    order: 5,
    description: '系統設定',
    fallbackColor: '#6B7280'  // gray-500
  }
]
```

### Validation Rules

- `id`: 必須唯一,不可為空
- `name`: 必須為繁體中文,長度 1-20 字元
- `code`: 必須為小寫英文,符合路由命名規範
- `iconPath`: 必須為有效的圖片路徑
- `routePath`: 必須以 `/` 開頭
- `order`: 必須為正整數,用於排序顯示

### State Transitions

應用程式資料為靜態,無狀態轉換。未來如需支援動態新增應用程式,可擴展以下狀態:
- `draft`: 草稿 (尚未發布)
- `active`: 啟用 (使用者可見)
- `deprecated`: 已棄用 (不再顯示)

---

## Entity: Notification (通知)

### Description

代表通知面板顯示的通知訊息,從後端 API 獲取。

### TypeScript Interface

```typescript
// frontend/src/types/notification.ts

export type NotificationType = 'info' | 'warning' | 'success' | 'error'

export interface Notification {
  /** 通知唯一識別碼 */
  id: string

  /** 通知標題 */
  title: string

  /** 通知訊息內容 */
  message: string

  /** 通知類型 (決定圖示和顏色) */
  type: NotificationType

  /** 建立時間 (ISO 8601 格式) */
  createdAt: string

  /** 是否已讀 */
  isRead: boolean

  /** 可選的連結 (點擊通知導向的路徑) */
  link?: string

  /** 可選的元數據 (未來擴展用) */
  metadata?: Record<string, any>
}

export interface NotificationResponse {
  /** 通知列表 */
  notifications: Notification[]

  /** 未讀通知數量 */
  unreadCount: number

  /** 總通知數量 */
  totalCount: number
}
```

### Data Source

**動態資料** (後端 API):
- **端點**: `GET /api/v1/notifications?limit=5`
- **回應格式**: `NotificationResponse`
- **更新頻率**: 使用者手動點擊通知鈴鐺時獲取 (本階段不支援即時推送)

### Validation Rules

- `id`: 必須唯一,由後端生成
- `title`: 必須為繁體中文,長度 1-100 字元
- `message`: 必須為繁體中文,長度 1-500 字元
- `type`: 必須為 `'info' | 'warning' | 'success' | 'error'` 之一
- `createdAt`: 必須為有效的 ISO 8601 日期時間字串
- `isRead`: 必須為布林值
- `link`: 如果提供,必須為有效的路由路徑

### State Transitions

```
[新通知] → (使用者點擊) → [已讀通知] → (時間過期或使用者刪除) → [已移除]
   ↓                          ↓
isRead: false              isRead: true
```

**狀態轉換觸發**:
- `isRead: false → true`: 使用者點擊通知項目
- 未來可擴展: 標記全部已讀、刪除通知等功能

---

## Entity: User (使用者)

### Description

代表當前登入的使用者資訊,顯示在導覽列。複用現有認證系統的 `UserInfo` interface。

### TypeScript Interface

```typescript
// frontend/src/types/auth.ts (現有)

export interface UserInfo {
  /** 使用者 ID */
  id: number

  /** 使用者名稱 */
  username: string

  /** 電子郵件 */
  email: string

  /** 全名 (可選) */
  fullName?: string | null

  /** 部門 (可選) */
  department?: string | null

  /** 地區 (可選) */
  region?: string | null

  /** 帳號是否啟用 */
  isActive: boolean

  /** 最後登入時間 (可選) */
  lastLoginAt?: string | null
}
```

### Data Source

**動態資料** (現有認證系統):
- **端點**: `GET /api/v1/auth/me` (或類似端點)
- **來源**: 現有的 `useAuth` composable 和 auth store
- **更新頻率**: 登入時獲取,存儲在 Pinia store 中

### Validation Rules

- `id`: 必須為正整數
- `username`: 必須不為空,長度 3-50 字元
- `email`: 必須符合電子郵件格式
- `isActive`: 必須為 `true` (未啟用使用者無法登入)

### State Transitions

使用者資料由現有認證系統管理,本功能只讀取不修改。

---

## State Management (Pinia Stores)

### Applications Store

```typescript
// frontend/src/stores/applications.ts

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Application } from '@/types/application'
import { APPLICATIONS } from '@/data/applications'

export const useApplicationsStore = defineStore('applications', () => {
  // State
  const applications = ref<Application[]>(APPLICATIONS)

  // Getters
  const sortedApplications = computed(() =>
    [...applications.value].sort((a, b) => a.order - b.order)
  )

  const availableApplications = computed(() =>
    applications.value.filter(app => app.isAvailable)
  )

  const unavailableApplications = computed(() =>
    applications.value.filter(app => !app.isAvailable)
  )

  // Actions
  function getApplicationByCode(code: string): Application | undefined {
    return applications.value.find(app => app.code === code)
  }

  return {
    applications,
    sortedApplications,
    availableApplications,
    unavailableApplications,
    getApplicationByCode
  }
})
```

### Notifications Store

```typescript
// frontend/src/stores/notifications.ts

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Notification } from '@/types/notification'
import { fetchNotifications, markAsRead } from '@/services/notificationService'

export const useNotificationsStore = defineStore('notifications', () => {
  // State
  const notifications = ref<Notification[]>([])
  const unreadCount = ref<number>(0)
  const totalCount = ref<number>(0)
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)
  const isPanelOpen = ref<boolean>(false)

  // Getters
  const recentNotifications = computed(() =>
    notifications.value.slice(0, 5)
  )

  const hasUnread = computed(() => unreadCount.value > 0)

  // Actions
  async function loadNotifications() {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetchNotifications(5)
      notifications.value = response.notifications
      unreadCount.value = response.unreadCount
      totalCount.value = response.totalCount
    } catch (err) {
      error.value = '載入通知失敗'
      console.error('Failed to load notifications:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function markNotificationAsRead(notificationId: string) {
    try {
      await markAsRead(notificationId)

      const notification = notifications.value.find(n => n.id === notificationId)
      if (notification && !notification.isRead) {
        notification.isRead = true
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  function togglePanel() {
    isPanelOpen.value = !isPanelOpen.value

    // 開啟面板時載入通知
    if (isPanelOpen.value && notifications.value.length === 0) {
      loadNotifications()
    }
  }

  function closePanel() {
    isPanelOpen.value = false
  }

  return {
    notifications,
    unreadCount,
    totalCount,
    isLoading,
    error,
    isPanelOpen,
    recentNotifications,
    hasUnread,
    loadNotifications,
    markNotificationAsRead,
    togglePanel,
    closePanel
  }
})
```

---

## Data Flow

### 1. 應用程式中心頁面載入流程

```
使用者訪問 /app-center
    ↓
AppCenterView 元件掛載
    ↓
useApplicationsStore.sortedApplications (靜態資料,立即可用)
    ↓
useAuth composable 獲取使用者資訊 (從現有 auth store)
    ↓
渲染 Navbar (顯示使用者名稱) + AppGrid (顯示 5 個應用程式卡片) + Footer
```

### 2. 通知面板互動流程

```
使用者點擊通知鈴鐺
    ↓
useNotificationsStore.togglePanel()
    ↓
isPanelOpen = true → 觸發 loadNotifications()
    ↓
fetchNotifications(5) → GET /api/v1/notifications?limit=5
    ↓
更新 notifications, unreadCount, totalCount
    ↓
NotificationPanel 元件渲染通知列表或空狀態
    ↓
(可選) 使用者點擊通知項目 → markNotificationAsRead()
```

### 3. 應用程式卡片點擊流程

```
使用者點擊 AppCard
    ↓
檢查 application.isAvailable
    ↓
是 → router.push(application.routePath)  // 導向真實頁面
    ↓
否 → router.push('/coming-soon?app=' + application.code)  // 導向佔位頁面
    ↓
ComingSoonPage 顯示「[應用程式名稱] 即將推出」
```

---

## Relationships

```
┌─────────────┐
│    User     │ (1) ─────────> 顯示在 Navbar
└─────────────┘

┌─────────────┐
│Application  │ (5) ─────────> 顯示在 AppGrid
└─────────────┘

┌─────────────┐
│Notification │ (0-5) ───────> 顯示在 NotificationPanel
└─────────────┘
```

**關係說明**:
- 每個使用者看到相同的 5 個應用程式 (本階段無權限控制)
- 每個使用者有自己的通知列表 (0-5 則最新通知)
- 使用者資訊、通知、應用程式之間無直接關聯

---

## Persistence

### Session Storage (通過 Axios 攔截器)
- `access_token`: 存取權杖 (用於 API 認證)

### Pinia Stores (記憶體,無持久化)
- `applications`: 應用程式列表 (靜態資料,每次載入相同)
- `notifications`: 通知列表 (動態資料,每次開啟面板重新獲取)
- `auth`: 使用者資訊 (登入時獲取,登出時清除)

**設計理由**:
- 通知資料為即時資訊,不適合快取 (避免顯示過期通知)
- 應用程式列表為靜態資料,未來如需快取可使用 localStorage
- 使用者資訊已由現有 auth store 管理,不重複實作

---

## Summary

| Entity | Type | Source | Storage | Validation |
|--------|------|--------|---------|------------|
| Application | 靜態 | frontend/src/data/applications.ts | Pinia Store | 名稱、路徑、順序 |
| Notification | 動態 | GET /api/v1/notifications | Pinia Store | 標題、內容、類型 |
| User | 動態 | GET /api/v1/auth/me | auth Store (現有) | 使用者名稱、信箱 |

**下一步**: 生成 API contracts (OpenAPI 規格)
