# 實作計畫：SaaS 登入頁面前端

**Branch**: `001-saas-login-frontend` | **Date**: 2025-10-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-saas-login-frontend/spec.md`

## 摘要

本功能為 SaaS 系統的登入頁面前端實作，提供會員身份驗證入口。使用者透過輸入帳號密碼，系統呼叫 CRM API 進行驗證，成功後導向會員頁面。採用 Vue 3.js 框架開發，確保現代化的使用者體驗、完整的表單驗證、錯誤處理機制，並符合無障礙標準與響應式設計要求。

## 技術背景

**Language/Version**: JavaScript (ES6+) / TypeScript 5.x
**Primary Dependencies**: Vue 3.x (Composition API), Vite 5.x, Pinia 2.x (狀態管理), Vue Router 4.x, Axios 1.x (HTTP 客戶端)
**Storage**: localStorage (token 儲存) / sessionStorage (session 管理)
**Testing**: Vitest (單元測試), Playwright (整合測試), Vue Test Utils (元件測試)
**Target Platform**: 現代瀏覽器 (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
**Project Type**: Web 應用程式 (前後端分離)
**Performance Goals**: FCP < 1.5s, TTI < 3.5s, 表單驗證回應 < 100ms
**Constraints**: API 回應時間 < 2s (p99), 支援行動裝置 (320px+), WCAG 2.1 AA 合規
**Scale/Scope**: 單一登入頁面，預期同時在線使用者數百至數千人

## 憲法檢查

*GATE: 必須在 Phase 0 研究前通過。Phase 1 設計後重新檢查。*

### I. 程式碼品質與可維護性
- ✅ **通過**: Vue 3 Composition API 促進單一職責原則
- ✅ **通過**: TypeScript 提供型別安全和自我文件化
- ✅ **通過**: ESLint + Prettier 確保程式碼風格一致性
- ⚠️ **注意**: 複雜度需在 research.md 中評估狀態管理方案

### II. 測試標準 (不可協商)
- ✅ **通過**: 採用 TDD 方法，測試先行
- ✅ **通過**: Contract 測試：CRM API 整合測試
- ✅ **通過**: Integration 測試：使用者故事端到端測試
- ✅ **通過**: Unit 測試：表單驗證邏輯、狀態管理

### III. 使用者體驗一致性
- ✅ **通過**: 遵循統一設計系統（需在 research.md 確認設計系統選擇）
- ✅ **通過**: WCAG 2.1 AA 無障礙標準合規
- ✅ **通過**: 繁體中文使用者介面
- ✅ **通過**: 即時回饋與錯誤處理
- ✅ **通過**: 響應式設計支援行動與桌面裝置

### IV. 效能需求
- ✅ **通過**: FCP < 1.5s, TTI < 3.5s 符合憲法標準
- ✅ **通過**: 表單驗證 < 100ms 回應時間
- ✅ **通過**: Vite 提供優化的建置與開發體驗
- ⚠️ **注意**: 需在 research.md 中評估 bundle 大小優化策略

### V. 文件語言
- ✅ **通過**: 規格與計畫使用繁體中文撰寫
- ✅ **通過**: 使用者介面文字使用繁體中文
- ✅ **通過**: API 文件將以繁體中文提供

**憲法檢查結果**: ✅ **通過** - 無違規項目，可進入 Phase 0 研究階段

## 專案結構

### 文件結構 (此功能)

```text
specs/001-saas-login-frontend/
├── plan.md              # 本檔案 (/speckit.plan 指令輸出)
├── research.md          # Phase 0 輸出 (技術研究與決策)
├── data-model.md        # Phase 1 輸出 (資料模型定義)
├── quickstart.md        # Phase 1 輸出 (快速開始指南)
├── contracts/           # Phase 1 輸出 (API 契約)
│   └── crm-auth-api.yaml
├── checklists/          # 規格檢查清單
│   └── requirements.md
└── tasks.md             # Phase 2 輸出 (/speckit.tasks 指令 - 本指令不會建立)
```

### 原始碼結構 (repository root)

```text
frontend/
├── src/
│   ├── components/          # Vue 元件
│   │   ├── LoginForm.vue   # 登入表單元件
│   │   ├── FormInput.vue   # 可重用輸入框元件
│   │   ├── Button.vue      # 可重用按鈕元件
│   │   └── Alert.vue       # 錯誤/成功訊息元件
│   ├── composables/         # Composition API 可重用邏輯
│   │   ├── useAuth.ts      # 驗證邏輯
│   │   ├── useForm.ts      # 表單驗證邏輯
│   │   └── useLocalStorage.ts  # 本地儲存管理
│   ├── stores/              # Pinia 狀態管理
│   │   └── auth.ts         # 驗證狀態 store
│   ├── services/            # API 服務層
│   │   └── authService.ts  # CRM API 整合
│   ├── utils/               # 工具函式
│   │   ├── validators.ts   # 表單驗證規則
│   │   └── errorHandler.ts # 錯誤處理工具
│   ├── types/               # TypeScript 型別定義
│   │   ├── auth.ts         # 驗證相關型別
│   │   └── api.ts          # API 回應型別
│   ├── router/              # Vue Router 設定
│   │   └── index.ts        # 路由設定
│   ├── assets/              # 靜態資源
│   │   └── styles/         # 樣式檔案
│   ├── views/               # 頁面元件
│   │   └── LoginPage.vue   # 登入頁面
│   ├── App.vue              # 根元件
│   └── main.ts              # 應用程式入口
├── tests/
│   ├── contract/            # Contract 測試
│   │   └── crm-auth.spec.ts
│   ├── integration/         # Integration 測試
│   │   ├── login-flow.spec.ts
│   │   ├── remember-me.spec.ts
│   │   └── form-validation.spec.ts
│   └── unit/                # Unit 測試
│       ├── components/
│       ├── composables/
│       └── utils/
├── public/                  # 公開靜態檔案
├── vite.config.ts          # Vite 設定
├── tsconfig.json           # TypeScript 設定
├── package.json            # 專案依賴
└── .env.example            # 環境變數範例
```

**結構決策**: 採用 Web 應用程式結構 (Option 2 變體)，由於此功能僅涵蓋前端登入頁面，後端 CRM API 為已存在的獨立服務，因此僅需開發 `frontend/` 目錄下的登入相關功能。結構遵循 Vue 3 最佳實踐，使用 Composition API 和 TypeScript 確保可維護性。

## 複雜度追蹤

> **僅在憲法檢查有需要說明的違規時填寫**

目前無違規項目需要說明。
