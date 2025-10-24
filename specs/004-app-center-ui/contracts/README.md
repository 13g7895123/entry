# API Contracts: 應用程式中心 UI

**Feature**: 004-app-center-ui
**Date**: 2025-10-24

## Overview

本目錄包含應用程式中心 UI 功能使用的所有後端 API 契約規格 (OpenAPI 3.0.3 格式)。

## API List

| API | 檔案 | 用途 | 狀態 |
|-----|------|------|------|
| 通知 API | [notifications-api.yaml](./notifications-api.yaml) | 獲取通知列表,標記已讀 | 📝 規格定義完成 |
| 使用者資訊 API | (複用現有) | 獲取當前使用者資訊 | ✅ 已存在於 003-crm-login-integration |

## 使用方式

### 1. 查看 API 規格

**方式 A: 線上查看器**
- 使用 [Swagger Editor](https://editor.swagger.io/) 貼上 YAML 內容查看互動式文件

**方式 B: 本地查看**
```bash
# 安裝 redoc-cli
npm install -g @redoc/cli

# 生成 HTML 文件
redoc-cli build contracts/notifications-api.yaml -o notifications-api.html

# 開啟瀏覽器查看
open notifications-api.html
```

### 2. 契約測試

契約測試確保前端與後端 API 規格一致。測試檔案位於 `frontend/tests/contract/`。

**執行契約測試**:
```bash
cd frontend
npm run test -- tests/contract
```

**契約測試內容**:
- 驗證 API 回應格式符合 OpenAPI schema
- 驗證必填欄位存在
- 驗證欄位型別正確
- 驗證錯誤情況處理

### 3. Mock Server (MSW)

開發階段使用 Mock Service Worker (MSW) 模擬後端 API。

**Mock 設定檔**: `frontend/src/mocks/handlers.ts`

```typescript
import { http, HttpResponse } from 'msw'
import type { NotificationResponse } from '@/types/notification'

export const handlers = [
  // GET /api/v1/notifications
  http.get('/api/v1/notifications', ({ request }) => {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '5')

    const response: NotificationResponse = {
      notifications: [
        {
          id: 'notif-001',
          title: '新訊息',
          message: '您有一則新的系統訊息',
          type: 'info',
          createdAt: new Date().toISOString(),
          isRead: false,
          link: '/messages/123'
        }
      ].slice(0, limit),
      unreadCount: 1,
      totalCount: 1
    }

    return HttpResponse.json(response)
  }),

  // POST /api/v1/notifications/:id/read
  http.post('/api/v1/notifications/:id/read', () => {
    return HttpResponse.json({
      success: true,
      message: '通知已標記為已讀'
    })
  })
]
```

## API 設計原則

### 1. RESTful 設計
- 使用標準 HTTP 方法 (GET, POST, PUT, DELETE)
- 使用名詞作為資源路徑 (`/notifications` 而非 `/getNotifications`)
- 使用 HTTP 狀態碼表示操作結果

### 2. 認證與授權
- 所有 API 需要 Bearer Token 認證 (透過 `Authorization: Bearer <token>` header)
- Token 由現有登入 API 獲得 (003-crm-login-integration)
- 前端 Axios 攔截器自動附加 Token (參見 `frontend/src/services/api.ts`)

### 3. 錯誤處理
- 使用統一的錯誤回應格式 (`Error` schema)
- 錯誤訊息使用繁體中文 (符合憲法 Documentation Language 原則)
- 提供明確的錯誤代碼 (`error` 欄位) 和使用者友善的訊息 (`message` 欄位)

### 4. 分頁與限制
- 使用 `limit` 參數限制返回數量 (預設 5,最大 50)
- 使用 `offset` 參數進行分頁 (未來擴展用)
- 回應包含 `totalCount` 讓前端知道總數

### 5. 日期時間格式
- 使用 ISO 8601 格式 (`2025-10-24T10:30:00Z`)
- 統一使用 UTC 時區,前端負責轉換為本地時間

## 契約變更流程

### 1. 提議變更
- 在 GitHub Issue 中討論 API 變更需求
- 評估對前後端的影響

### 2. 更新規格
- 更新對應的 `.yaml` 檔案
- 更新版本號 (`info.version`)
- 在 `CHANGELOG.md` 中記錄變更

### 3. 通知相關團隊
- 通知後端團隊實作變更
- 通知前端團隊調整程式碼
- 確保契約測試同步更新

### 4. 驗證變更
- 執行契約測試確保無破壞性變更
- 更新 Mock handlers
- 執行整合測試驗證前後端整合

## 相關文件

- [Data Model](../data-model.md): 前端資料模型定義
- [Research Document](../research.md): API 設計決策理由
- [OpenAPI Specification](https://spec.openapis.org/oas/v3.0.3): OpenAPI 3.0.3 規格文件

## 聯絡方式

如有 API 相關問題,請聯繫:
- **前端團隊**: (待補充)
- **後端團隊**: (待補充)
