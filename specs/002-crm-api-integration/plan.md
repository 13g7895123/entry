# 實作計畫：CRM 認證 API 整合

**分支**：`002-crm-api-integration` | **日期**：2025-10-23 | **規格書**：[spec.md](./spec.md)
**輸入**：功能規格書來自 `/specs/002-crm-api-integration/spec.md`

**備註**：本計畫由 `/speckit.plan` 指令填寫。執行工作流程請參考 `.specify/templates/commands/plan.md`。

## 摘要

整合 CRM API 的認證功能至 SaaS 登入入口專案。使用 CodeIgniter 4 建立後端 API 層處理認證邏輯，前端 Vue 3 應用程式透過安全的權杖儲存機制（HttpOnly cookies + sessionStorage）與後端通訊。支援自動權杖更新、「記住我」功能、完整的錯誤處理與重試機制，以及關鍵事件的可觀測性日誌記錄。部署環境使用 Docker 容器化，區分 development 和 production 環境配置。

## 技術脈絡

**後端技術棧**：
- **語言/版本**：PHP 8.1+ / CodeIgniter 4.5+
- **主要相依性**：
  - CodeIgniter 4 框架（REST API、路由、中介層）
  - Firebase PHP-JWT（JWT 權杖驗證）
  - GuzzleHTTP（CRM API HTTP 客戶端）
  - PHPUnit（測試框架）
- **儲存**：不需要資料庫（無狀態認證，權杖由 CRM API 管理）
- **測試**：PHPUnit（單元測試、整合測試）

**前端技術棧**：
- **語言/版本**：TypeScript 5.x / JavaScript ES6+
- **主要相依性**：
  - Vue 3.x（Composition API）
  - Vite 5.x（建置工具）
  - Pinia 2.x（狀態管理）
  - Vue Router 4.x（路由）
  - Axios 1.x（HTTP 客戶端）
- **測試**：Vitest（單元測試）、Playwright（E2E 測試 - 僅正式環境）

**部署與基礎設施**：
- **容器化**：Docker + Docker Compose
- **環境管理**：.env 檔案（區分 .env.development 和 .env.production）
- **對外 Port 配置**：完全由 .env 控制
- **部署腳本**：Shell scripts（deploy.sh、update.sh）

**目標平台**：
- 後端：Linux server (Docker container)
- 前端：現代瀏覽器（Chrome 90+、Firefox 88+、Safari 14+、Edge 90+）

**專案類型**：Web 應用程式（前後端分離架構）

**效能目標**：
- API 回應時間：p95 < 200ms、p99 < 500ms
- 前端首次內容繪製（FCP）< 1.5 秒
- 互動時間（TTI）< 3.5 秒
- 登入流程完成時間 < 5 秒（含 CRM API 呼叫）

**限制條件**：
- HttpOnly cookies 需要後端支援（由 CI4 後端處理）
- 權杖更新必須在剩餘 5 分鐘內觸發
- API 錯誤重試最多 3 次，使用指數退避（1s、2s、4s）
- 「記住我」更新權杖有效期為 30 天
- 必須支援 CORS（前後端不同 origin）

**規模/範疇**：
- 預期使用者：初期 1,000 並行使用者，擴展至 10,000
- API 端點：4 個認證端點（login、logout、refresh、me）
- 前端頁面：3 個主要頁面（登入、儀表板、個人資料）
- 測試涵蓋率目標：後端 80%+、前端整合測試涵蓋所有使用者故事

## 憲章檢查

*閘門：必須在 Phase 0 研究前通過。Phase 1 設計後重新檢查。*

### 開發前閘門

- [x] **使用者故事已定義且有驗收標準（繁體中文）**：spec.md 已包含 3 個優先級使用者故事，每個都有 Given-When-Then 驗收場景
- [x] **效能目標已建立**：SC-001 到 SC-009 定義了 9 個可衡量的成功標準
- [x] **測試策略已記錄**：下方「測試策略」章節詳細說明
- [x] **憲章符合性審查完成**：本檢查清單

### 預合併閘門

- [ ] **所有測試通過（合約、整合、單元）**：待實作後驗證
- [ ] **程式碼審查由至少一位團隊成員批准**：PR 流程執行
- [ ] **效能預算達標或明確豁免並說明理由**：待效能測試驗證
- [ ] **文件已更新（API 文件、使用者指南、ADR）繁體中文**：本計畫及相關文件使用繁體中文
- [ ] **無障礙標準已驗證**：前端元件符合 WCAG 2.1 AA
- [ ] **無新增技術債務或已追蹤**：透過程式碼審查確認
- [ ] **語言符合性已驗證（面向使用者內容為繁體中文）**：UI 字串、錯誤訊息、文件均為繁體中文

### 生產前閘門

- [ ] **所有使用者故事已獨立測試並驗證**：E2E 測試涵蓋 P1-P3 故事
- [ ] **高流量功能的負載測試已完成**：模擬 100+ 並行登入
- [ ] **監控和告警已配置**：日誌記錄系統（FR-018）
- [ ] **回滾計畫已記錄**：Docker 版本控制與快速回退
- [ ] **面向使用者文字已驗證為繁體中文**：最終 UI 審查

### 憲章原則對齊

**I. 程式碼品質與可維護性**：
- 使用成熟框架（CI4、Vue 3）確保程式碼結構清晰
- 單一職責：認證邏輯集中於後端服務層，前端專注於狀態管理與 UI
- 複雜度管理：權杖更新邏輯、重試機制需在 Phase 0 研究最佳實踐

**II. 測試標準（不可協商）**：
- **合約測試**：後端 API 端點（OpenAPI 規格驗證）
- **整合測試**：前後端整合（E2E 測試）、CRM API 整合（模擬）
- **單元測試**：後端服務邏輯、前端狀態管理

**III. 使用者體驗一致性**：
- 設計系統：Tailwind CSS + 自訂元件庫（已存在於 frontend/）
- 無障礙：WCAG 2.1 AA（表單、錯誤訊息、鍵盤導航）
- 錯誤處理：使用者友善訊息（FR-011），繁體中文
- 回饋機制：載入狀態、成功/失敗通知

**IV. 效能需求**：
- 效能預算已定義（Technical Context）
- 監控：FR-018 要求記錄關鍵事件
- 優化：權杖在記憶體中快取、最小化 API 呼叫（FR-005）

**V. 文件語言**：
- ✅ 本計畫使用繁體中文
- ✅ 規格書使用繁體中文
- ✅ API 文件將使用繁體中文
- ✅ UI 字串、錯誤訊息使用繁體中文
- 程式碼註解：業務邏輯使用繁體中文，技術/框架註解可使用英文

## 專案結構

### 文件（本功能）

```text
specs/002-crm-api-integration/
├── plan.md              # 本檔案（/speckit.plan 指令輸出）
├── research.md          # Phase 0 輸出（/speckit.plan 指令）
├── data-model.md        # Phase 1 輸出（/speckit.plan 指令）
├── quickstart.md        # Phase 1 輸出（/speckit.plan 指令）
├── contracts/           # Phase 1 輸出（/speckit.plan 指令）
│   ├── backend-api.yaml # 後端 REST API OpenAPI 規格
│   └── crm-api.yaml     # CRM API 整合合約（參考 docs/openapi.yaml）
└── tasks.md             # Phase 2 輸出（/speckit.tasks 指令 - 非本指令建立）
```

### 原始碼（repository root）

```text
# Web 應用程式結構（前後端分離）

backend/                          # CodeIgniter 4 後端
├── app/
│   ├── Config/
│   │   ├── Routes.php           # API 路由定義
│   │   ├── CRM.php              # CRM API 配置
│   │   └── Cors.php             # CORS 配置
│   ├── Controllers/
│   │   └── Auth/
│   │       ├── LoginController.php
│   │       ├── LogoutController.php
│   │       ├── RefreshController.php
│   │       └── MeController.php
│   ├── Services/
│   │   ├── CRMAuthService.php   # CRM API 整合服務
│   │   ├── TokenService.php     # 權杖驗證與管理
│   │   └── LoggingService.php   # 認證事件日誌
│   ├── Middleware/
│   │   └── AuthMiddleware.php   # 認證中介層
│   └── Libraries/
│       └── RetryClient.php      # HTTP 重試邏輯（指數退避）
├── tests/
│   ├── contract/                # API 合約測試
│   │   └── AuthContractTest.php
│   ├── integration/             # 整合測試
│   │   ├── CRMAuthIntegrationTest.php
│   │   └── TokenRefreshTest.php
│   └── unit/                    # 單元測試
│       ├── TokenServiceTest.php
│       └── RetryClientTest.php
├── .env.development             # 開發環境配置
├── .env.production              # 正式環境配置（範本）
└── composer.json

frontend/                         # Vue 3 前端（已存在）
├── src/
│   ├── stores/
│   │   └── auth.ts              # Pinia 認證狀態管理（強化）
│   ├── services/
│   │   ├── api.ts               # Axios 實例配置
│   │   └── authService.ts       # 認證 API 服務
│   ├── router/
│   │   └── index.ts             # 路由守衛（強化）
│   ├── views/
│   │   ├── LoginPage.vue        # 已存在，強化
│   │   └── DashboardPage.vue    # 已存在
│   ├── components/
│   │   └── LoginForm.vue        # 已存在，強化
│   └── composables/
│       ├── useAuth.ts           # 認證組合式函式
│       └── useTokenRefresh.ts   # 權杖更新邏輯
├── tests/
│   └── integration/             # 整合測試（正式環境）
│       ├── login.spec.ts
│       ├── tokenRefresh.spec.ts
│       └── logout.spec.ts
├── .env.development
└── .env.production

deploy/                           # 部署配置（新增）
├── docker-compose.development.yml
├── docker-compose.production.yml
├── backend.Dockerfile
├── frontend.Dockerfile
├── nginx.conf                    # Nginx 反向代理配置
├── .env.development.template     # 環境變數範本
├── .env.production.template
├── scripts/
│   ├── deploy.sh                # 初始部署腳本
│   ├── update.sh                # 更新部署腳本
│   └── health-check.sh          # 健康檢查腳本
└── README.md                     # 部署說明文件（繁體中文）
```

**結構決策**：
- **前後端分離**：前端為 SPA（Vue 3），後端為 RESTful API（CI4），透過 Nginx 反向代理統一對外
- **後端目錄**：遵循 CodeIgniter 4 MVC 架構，Services 層處理業務邏輯
- **前端強化**：在現有 Vue 3 專案基礎上強化認證相關功能
- **部署集中化**：所有 Docker 相關檔案集中於 `deploy/` 資料夾，便於管理
- **環境區隔**：透過不同的 docker-compose 檔案和 .env 檔案區分環境

## 測試策略

### 後端測試（必須）

**合約測試**（必須，TDD）：
- **目標**：驗證後端 API 符合 OpenAPI 規格
- **涵蓋範圍**：
  - `/api/auth/login` - POST 登入
  - `/api/auth/logout` - POST 登出
  - `/api/auth/refresh` - POST 更新權杖
  - `/api/auth/me` - GET 使用者資訊
- **工具**：PHPUnit + OpenAPI Validator
- **執行時機**：每次 PR、CI/CD pipeline

**整合測試**（必須）：
- **目標**：驗證後端與 CRM API 整合
- **涵蓋範圍**：
  - CRM API 呼叫成功場景
  - CRM API 失敗與重試邏輯
  - 權杖驗證與更新流程
  - CORS 跨域處理
- **模擬**：使用 WireMock 或 CI4 內建 Mock 模擬 CRM API
- **執行時機**：每次 PR、CI/CD pipeline

**單元測試**（建議）：
- **目標**：驗證服務層邏輯
- **涵蓋範圍**：
  - TokenService：權杖解析、驗證、過期檢查
  - RetryClient：指數退避重試邏輯
  - LoggingService：事件記錄格式與敏感資料過濾
- **工具**：PHPUnit
- **涵蓋率目標**：80%+

### 前端測試

**整合測試**（僅正式環境，必須）：
- **目標**：E2E 驗證前後端整合與使用者故事
- **涵蓋範圍**：
  - P1：基本登入認證（spec.md 使用者故事 1 的所有場景）
  - P2：權杖生命週期管理（spec.md 使用者故事 2 的所有場景）
  - P3：使用者檔案與會話資訊（spec.md 使用者故事 3 的所有場景）
- **工具**：Playwright
- **執行時機**：正式環境部署前、定期回歸測試

**單元測試**（開發環境不寫）：
- **豁免理由**：前端單元測試成本高、維護難度大，E2E 測試已涵蓋關鍵流程
- **例外**：如果 composables 邏輯複雜（如 useTokenRefresh），可選擇性編寫單元測試

### 測試環境配置

| 環境 | 後端合約測試 | 後端整合測試 | 後端單元測試 | 前端整合測試 |
|------|-------------|-------------|-------------|-------------|
| Development | ✅ | ✅ | ✅ | ❌ |
| Production | ✅ | ✅ | ✅ | ✅ |

## Phase 0：大綱與研究

### 待研究項目

從技術脈絡中提取的未知項目：

1. **CodeIgniter 4 JWT 整合最佳實踐**
   - 研究：CI4 中如何處理 JWT 驗證（中介層設計）
   - 研究：HttpOnly cookie 設定與讀取（CI4 Response/Request）
   - 決策：是否使用 `firebase/php-jwt` 或其他函式庫

2. **HTTP 重試與指數退避實作**
   - 研究：PHP/Guzzle 重試機制最佳實踐
   - 研究：指數退避演算法實作（1s、2s、4s）
   - 決策：是否使用 Guzzle middleware 或自訂 RetryClient

3. **CORS 配置策略**
   - 研究：CI4 CORS 處理（filter vs middleware）
   - 研究：前後端不同 origin 下的 cookie 傳遞（SameSite、Secure 屬性）
   - 決策：Nginx 層面處理 vs CI4 層面處理

4. **Docker 多環境部署策略**
   - 研究：Docker Compose 環境變數最佳實踐（.env 管理）
   - 研究：前後端容器化最佳實踐（multi-stage build）
   - 研究：Nginx 反向代理配置（前端靜態檔案 + 後端 API）
   - 決策：是否使用 Docker secrets 管理敏感配置

5. **Vue 3 + Pinia 權杖更新機制**
   - 研究：Vue 3 Composition API 中自動權杖更新實作
   - 研究：Axios interceptor 與 Pinia store 整合
   - 決策：使用 composable 或 Axios interceptor

6. **日誌記錄與可觀測性**
   - 研究：CI4 日誌最佳實踐（Monolog 配置）
   - 研究：敏感資料過濾策略（密碼、權杖遮罩）
   - 決策：日誌格式（JSON vs plain text）、日誌等級策略

### 研究任務分派

Phase 0 將使用 Task agents 執行以下研究任務，結果整合至 `research.md`：

1. **Task Agent 1**：CodeIgniter 4 JWT + HttpOnly Cookies 整合
2. **Task Agent 2**：PHP Guzzle 重試機制與指數退避
3. **Task Agent 3**：CI4 CORS 配置與跨域 Cookie 處理
4. **Task Agent 4**：Docker Compose 多環境部署最佳實踐
5. **Task Agent 5**：Vue 3 自動權杖更新機制（Axios + Pinia）
6. **Task Agent 6**：CodeIgniter 4 日誌記錄與敏感資料過濾

**輸出**：`research.md` 包含所有決策、理由、捨棄的替代方案

## Phase 1：設計與合約

*前置條件：`research.md` 完成*

### 資料模型（data-model.md）

從功能規格書提取實體，定義資料結構：

**核心實體**：
1. **User**（使用者）- 來自 CRM API
   - 欄位：id, username, email, full_name, department, region, is_active, last_login_at
   - 來源：CRM API `/auth/login` 和 `/auth/me` 回應
   - 驗證：is_active 必須為 true

2. **AuthToken**（認證權杖）- 後端管理
   - 欄位：access_token (string), token_type (string), expires_in (int), issued_at (timestamp)
   - 儲存：前端 sessionStorage（短期）或記憶體
   - 驗證：JWT 簽章驗證、過期時間檢查

3. **RefreshToken**（更新權杖）- 後端管理
   - 欄位：refresh_token (string), expires_at (timestamp), remember_me (boolean)
   - 儲存：HttpOnly cookie（後端設定）
   - 生命週期：remember_me=true 時 30 天，否則會話 cookie

4. **AuthSession**（認證會話）- 前端狀態
   - 欄位：user (User), isAuthenticated (boolean), lastRefresh (timestamp)
   - 儲存：Pinia store（記憶體）
   - 狀態轉換：未認證 → 已認證 → 已登出

**狀態轉換圖**（AuthSession）：
```
[未認證] --登入成功--> [已認證]
[已認證] --權杖過期且更新成功--> [已認證]
[已認證] --權杖過期且更新失敗--> [未認證]
[已認證] --使用者登出--> [未認證]
```

### API 合約（contracts/）

**後端 API 合約**（`backend-api.yaml`）：

基於功能需求生成 OpenAPI 3.0 規格：

- **POST /api/auth/login**（FR-001）
  - Request: `{ username: string, password: string, remember_me?: boolean }`
  - Response 200: `{ access_token, refresh_token, token_type, expires_in, user }`
  - Response 401: `{ error: string, message: string }`

- **POST /api/auth/logout**（FR-006）
  - Headers: `Authorization: Bearer {access_token}`
  - Response 200: `{ message: string }`
  - Side effect: 清除 refresh_token cookie

- **POST /api/auth/refresh**（FR-004）
  - Cookies: `refresh_token`
  - Response 200: `{ access_token, token_type, expires_in }`
  - Response 401: `{ error: string, message: string }`

- **GET /api/auth/me**（FR-009）
  - Headers: `Authorization: Bearer {access_token}`
  - Response 200: `{ user: User }`
  - Response 401: `{ error: string, message: string }`

**CRM API 整合合約**（`crm-api.yaml`）：
- 參考 `docs/openapi.yaml`
- 記錄預期請求/回應格式
- 記錄錯誤場景（401、5xx、網路錯誤）

### 快速入門（quickstart.md）

**內容**：
1. **環境需求**：Docker、Docker Compose、Node.js（本地開發）、PHP 8.1+（本地開發）
2. **本地開發設定**：
   - 克隆專案
   - 複製 `.env.development.template` 為 `.env.development`
   - 執行 `docker-compose -f deploy/docker-compose.development.yml up`
   - 存取 `http://localhost:{PORT}`（PORT 由 .env 定義）
3. **測試執行**：
   - 後端：`docker exec backend-container composer test`
   - 前端：`docker exec frontend-container npm run test:e2e`（僅正式環境）
4. **常見問題**：CORS 錯誤、Cookie 無法設定、權杖更新失敗

### Agent Context 更新

執行 `.specify/scripts/bash/update-agent-context.sh claude`：
- 更新 `.specify/memory/CLAUDE.md`
- 新增技術：CodeIgniter 4、Docker Compose、Nginx
- 保留手動新增內容（標記之間）

## 複雜度追蹤

> **僅在憲章檢查有需要說明的違規時填寫**

| 違規 | 為何需要 | 捨棄的更簡單替代方案原因 |
|------|---------|------------------------|
| 無 | - | - |

**說明**：本專案遵循憲章所有原則，無需複雜度豁免。

---

**Phase 0 與 Phase 1 完成後，本計畫文件狀態將更新為「設計完成」，準備進入 Phase 2（任務分解）。**
