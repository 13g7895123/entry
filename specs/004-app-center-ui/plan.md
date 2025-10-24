# Implementation Plan: 應用程式中心 UI

**Branch**: `004-app-center-ui` | **Date**: 2025-10-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-app-center-ui/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

建立應用程式中心的前端 UI 介面,讓已登入使用者可以瀏覽並選擇要使用的應用程式（CRM、ERP、Ecommerce、Resume、設定）。介面包含:
- 導覽列: 左側顯示「應用程式中心」,右側包含通知面板(下拉式,320-400px)和使用者資訊選單
- 內容區域: 5個應用程式卡片,響應式網格佈局(桌面每列4個,平板3個,大型手機2個,小型手機1個),每個卡片為128x128px的正方形圖示
- 頁腳: 顯示「Copyright © [當前年份]」

技術方法: 使用 Vue 3 Composition API + TypeScript + Tailwind CSS 建立響應式 SPA 頁面,整合現有的認證系統和使用者狀態管理。

## Technical Context

**Language/Version**: TypeScript 5.9 + Vue 3.5 (Composition API)
**Primary Dependencies**:
- Vue 3.5.22 (前端框架)
- Vue Router 4.6 (路由管理)
- Pinia 2.3 (狀態管理)
- Tailwind CSS 3.4 (樣式框架)
- Axios 1.12 (HTTP 客戶端,已配置認證攔截器)
- Vee-Validate 4.15 + Yup 1.7 (表單驗證,可能用於未來擴展)

**Storage**: N/A (純前端 UI,狀態存於 Pinia store 和 sessionStorage)

**Testing**:
- Vitest 1.6 (單元測試 + 整合測試)
- Playwright 1.56 (E2E 測試)
- MSW 2.11 (API mocking)
- Vue Test Utils 2.4 (元件測試工具)

**Target Platform**: 現代瀏覽器 (Chrome/Firefox/Safari/Edge 最新兩個主要版本),響應式設計支援桌面、平板、手機

**Project Type**: Web (SPA 單頁應用程式,前後端分離架構)

**Performance Goals**:
- First Contentful Paint < 1.5s
- Time to Interactive < 3.5s
- 所有互動元素響應時間 < 100ms (SC-005)
- 使用者在應用程式中心停留平均不超過 10 秒 (SC-007)

**Constraints**:
- 必須符合 WCAG 2.1 AA 級無障礙標準 (SC-006)
- 支援鍵盤導覽 (Tab、Enter)
- 響應式斷點: ≥1024px, 768-1023px, 480-767px, <480px
- 必須整合現有認證系統 (依賴 003-crm-login-integration)

**Scale/Scope**:
- 1 個主頁面 (應用程式中心)
- 1 個佔位頁面 (即將推出)
- 約 5-7 個 Vue 元件 (Navbar, NotificationPanel, UserMenu, AppCard, AppGrid, Footer, ComingSoonPage)
- 5 個應用程式卡片 (CRM, ERP, Ecommerce, Resume, 設定)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Development Gates

- [x] **使用者故事定義** (繁體中文): 已在 spec.md 定義 4 個使用者故事,包含優先級(P1-P3)和接受標準
- [x] **效能目標建立**: 已在 spec.md 定義 7 個成功標準(SC-001至SC-007),包含可測量的效能目標
- [x] **測試策略文件化**: 將在 Phase 0 research.md 中詳細定義測試策略(契約測試、整合測試、E2E 測試)
- [x] **憲法合規審查**: 本檢查即為合規審查過程

### Testing Standards (NON-NEGOTIABLE) - 初步評估

- [ ] **TDD (Test-Driven Development)**: 將在實作階段嚴格遵循 Red-Green-Refactor 循環
- [ ] **契約測試 (Contract Tests)**:
  - ✅ 必要性: 需要為通知 API、使用者資訊 API 建立契約測試
  - ⚠️ 待定義: API 契約尚未定義,將在 Phase 1 建立
- [ ] **整合測試 (Integration Tests)**:
  - ✅ 必要性: 需覆蓋所有 4 個使用者故事的完整流程
  - ⚠️ 待定義: 測試場景將在 research.md 中詳細規劃
- [ ] **單元測試 (Unit Tests)**: 建議為各 Vue 元件、Composables、工具函數建立單元測試

### User Experience Consistency

- [x] **設計系統**: 將使用 Tailwind CSS 作為統一設計系統,確保視覺一致性
- [x] **無障礙標準**: spec.md SC-006 明確要求符合 WCAG 2.1 AA 級,FR-014 要求鍵盤導覽支援
- [x] **錯誤處理**: 規格中定義圖片載入失敗顯示 fallback (FR-015),空通知顯示訊息 (FR-003)
- [x] **回應回饋**: SC-005 要求所有互動元素響應 < 100ms,懸停效果 (FR-009)
- [x] **跨平台一致性**: 響應式設計確保桌面/平板/手機體驗一致 (FR-012)
- [x] **使用者故事驗證**: 4 個使用者故事均可獨立測試,優先級明確

### Performance Requirements

- [x] **效能預算**: 已在 Technical Context 定義 FCP < 1.5s, TTI < 3.5s, 互動響應 < 100ms
- [x] **強制指標**:
  - ✅ API endpoints: 本功能為前端 UI,依賴現有 API (通知、使用者資訊)
  - ✅ Page load: FCP < 1.5s, TTI < 3.5s (符合憲法要求)
  - ⚠️ Memory footprint: 待在 research.md 中定義前端記憶體預算
- [ ] **效能測試**: 將在 Phase 1 規劃 Lighthouse 自動化測試和載入測試
- [ ] **監控與告警**: 待在 research.md 中定義前端效能監控方案 (NEEDS CLARIFICATION)
- [x] **優化追蹤**: Vite 配置已包含程式碼分割 (vendor, validation chunks)

### Documentation Language (Traditional Chinese)

- [x] **功能規格 (spec.md)**: 已使用繁體中文撰寫
- [x] **實作計畫 (plan.md)**: 本文件使用繁體中文
- [x] **使用者導向文件**: UI 文字、錯誤訊息均使用繁體中文 (Assumption #8)
- [x] **API 文件**: 將在 Phase 1 contracts/ 中以繁體中文撰寫
- [x] **Release Notes**: 未來發布說明將使用繁體中文
- [x] **程式碼註解**: 業務邏輯註解優先使用繁體中文,技術性註解可使用英文

### Pre-Merge Gates (預先規劃)

- [ ] 所有測試通過 (契約、整合、單元)
- [ ] 至少一位團隊成員 code review 核准
- [ ] 效能預算達成或明確豁免
- [ ] 文件更新 (API docs, user guides) 使用繁體中文
- [ ] 無障礙標準驗證 (WCAG 2.1 AA)
- [ ] 無新增未追蹤的技術債務
- [ ] 語言合規驗證 (使用者導向內容為繁體中文)

### 初步評估結果

**狀態**: ✅ **通過 Pre-Development Gates** (有條件)

**待解決項目** (將在 Phase 0 Research 中處理):
1. API 契約定義 (通知 API、使用者資訊 API)
2. 詳細測試策略 (契約測試、整合測試場景)
3. 前端效能監控方案
4. 前端記憶體預算定義

**無憲法違規**: 本功能符合所有核心原則要求。

---

### Phase 1 後重新評估

**狀態**: ✅ **完全通過所有 Pre-Development Gates**

**已解決項目** (Phase 0 & Phase 1):
1. ✅ API 契約定義: 已在 `contracts/notifications-api.yaml` 定義通知 API OpenAPI 規格
2. ✅ 詳細測試策略: 已在 `research.md` 定義契約測試、整合測試、E2E 測試策略
3. ✅ 前端效能監控: 已選擇 Lighthouse CI + Web Vitals 方案
4. ✅ 前端記憶體預算: 已定義初始 10MB, 執行時 25MB 的預算
5. ✅ 資料模型: 已在 `data-model.md` 定義所有實體和狀態管理結構
6. ✅ 開發指南: 已在 `quickstart.md` 提供完整的開發環境設置和工作流程

**Testing Standards 更新**:
- ✅ **契約測試**: 已定義 OpenAPI 規格,測試將使用 MSW 驗證
- ✅ **整合測試**: 已規劃 4 個使用者故事的完整測試場景
- ✅ **E2E 測試**: 已規劃 Playwright 測試範圍 (完整流程、響應式、無障礙)
- ✅ **單元測試**: 已在 quickstart.md 提供 TDD 範例

**Performance Requirements 更新**:
- ✅ **效能預算**: FCP < 1.5s, TTI < 3.5s, 互動響應 < 100ms
- ✅ **效能測試**: Lighthouse CI 配置已定義
- ✅ **監控方案**: Lighthouse CI + Web Vitals
- ✅ **記憶體預算**: 初始 10MB, 執行時 25MB

**Documentation Language 確認**:
- ✅ **所有文件**: spec.md, plan.md, research.md, data-model.md, contracts/README.md, quickstart.md 均使用繁體中文
- ✅ **API 文件**: OpenAPI YAML 中的描述、錯誤訊息均使用繁體中文
- ✅ **註解**: 程式碼範例中的業務邏輯註解使用繁體中文

**結論**: ✅ **功能已完全符合所有憲法要求,可進入 Phase 2 (任務生成)**

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── components/
│   │   ├── AppCenter/
│   │   │   ├── AppCard.vue           # 應用程式卡片元件
│   │   │   ├── AppGrid.vue           # 應用程式網格容器
│   │   │   └── ComingSoonPage.vue    # 即將推出佔位頁面
│   │   ├── Layout/
│   │   │   ├── Navbar.vue            # 導覽列元件
│   │   │   ├── NotificationPanel.vue # 通知下拉面板
│   │   │   ├── UserMenu.vue          # 使用者選單
│   │   │   └── Footer.vue            # 頁腳元件
│   │   └── Common/
│   │       └── (可能的共用元件,如 Avatar, Dropdown 等)
│   ├── views/
│   │   └── AppCenterView.vue         # 應用程式中心主頁面
│   ├── composables/
│   │   ├── useAuth.ts                # 現有的認證 composable
│   │   ├── useNotifications.ts       # 新增: 通知管理 composable
│   │   └── useApplications.ts        # 新增: 應用程式資料 composable
│   ├── stores/
│   │   ├── auth.ts                   # 現有的認證 store
│   │   ├── notifications.ts          # 新增: 通知 store (Pinia)
│   │   └── applications.ts           # 新增: 應用程式 store (Pinia)
│   ├── services/
│   │   ├── api.ts                    # 現有的 Axios 實例
│   │   ├── authService.ts            # 現有的認證服務
│   │   ├── notificationService.ts    # 新增: 通知 API 服務
│   │   └── applicationService.ts     # 新增: 應用程式 API 服務 (如需要)
│   ├── router/
│   │   └── index.ts                  # 新增 /app-center 和 /coming-soon 路由
│   ├── types/
│   │   ├── auth.ts                   # 現有的認證型別
│   │   ├── notification.ts           # 新增: 通知型別定義
│   │   └── application.ts            # 新增: 應用程式型別定義
│   ├── assets/
│   │   └── images/
│   │       └── app-icons/            # 應用程式圖示 (128x128px)
│   │           ├── crm.png
│   │           ├── erp.png
│   │           ├── ecommerce.png
│   │           ├── resume.png
│   │           └── settings.png
│   └── utils/
│       └── (現有工具函數,可能需要新增圖片載入處理)
│
└── tests/
    ├── contract/
    │   ├── notification-api.contract.test.ts  # 通知 API 契約測試
    │   └── user-api.contract.test.ts          # 使用者 API 契約測試
    ├── integration/
    │   ├── app-center.test.ts                 # User Story 1 + 2 整合測試
    │   ├── app-card-interaction.test.ts       # User Story 3 整合測試
    │   └── accessibility.test.ts              # WCAG 2.1 AA 合規測試
    ├── e2e/
    │   ├── app-center-flow.spec.ts            # Playwright E2E 測試
    │   └── responsive-layout.spec.ts          # 響應式佈局 E2E 測試
    └── unit/
        ├── components/
        │   ├── AppCard.test.ts
        │   ├── Navbar.test.ts
        │   ├── NotificationPanel.test.ts
        │   └── UserMenu.test.ts
        └── composables/
            ├── useNotifications.test.ts
            └── useApplications.test.ts
```

**Structure Decision**:

本專案採用 **Web 應用程式架構** (前後端分離),所有前端程式碼位於 `frontend/` 目錄。

**關鍵設計決策**:
1. **元件組織**: 按功能領域分組 (AppCenter/, Layout/, Common/),提高可維護性
2. **狀態管理**: 使用 Pinia stores 管理通知和應用程式狀態,與現有 auth store 一致
3. **Composables**: 抽取可重用邏輯到 composables,遵循 Vue 3 Composition API 最佳實踐
4. **測試結構**: 明確分離契約/整合/E2E/單元測試,符合 TDD 要求
5. **型別安全**: TypeScript 型別定義集中在 types/ 目錄,確保型別一致性
6. **資產管理**: 應用程式圖示集中管理,方便未來擴展和替換

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**無違規項目需要追蹤**。本功能設計符合所有憲法原則,無需特殊豁免。
