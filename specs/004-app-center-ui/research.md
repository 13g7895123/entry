# Research Document: 應用程式中心 UI

**Feature**: 004-app-center-ui
**Date**: 2025-10-24
**Purpose**: 解決 Technical Context 和 Constitution Check 中的未定義項目,為 Phase 1 設計提供技術決策基礎

## Research Items

從 Constitution Check 和 Technical Context 中識別出以下需要研究的項目:

1. API 契約定義 (通知 API、使用者資訊 API)
2. 詳細測試策略 (契約測試、整合測試場景)
3. 前端效能監控方案
4. 前端記憶體預算定義

---

## R1: API 契約定義

### Decision

定義兩個主要 API 契約:
1. **通知 API** (`GET /api/v1/notifications`)
2. **使用者資訊 API** (複用現有 `GET /api/v1/auth/me` 或類似端點)

### Rationale

**通知 API 設計**:
- **端點**: `GET /api/v1/notifications`
- **查詢參數**: `?limit=5` (符合 FR-003 要求最多顯示 5 則)
- **回應格式**:
  ```typescript
  {
    notifications: [
      {
        id: string,
        title: string,
        message: string,
        createdAt: string (ISO 8601),
        isRead: boolean,
        type: 'info' | 'warning' | 'success' | 'error'
      }
    ],
    unreadCount: number,
    totalCount: number
  }
  ```
- **空狀態處理**: 當 `notifications` 為空陣列時,前端顯示「目前沒有新通知」

**使用者資訊 API**:
- **端點**: 複用現有認證系統的使用者資訊端點
- **依賴**: frontend/src/types/auth.ts 中的 `UserInfo` interface
- **已有欄位**: id, username, email, fullName, department, region, isActive, lastLoginAt
- **用途**: 導覽列顯示使用者名稱

### Alternatives Considered

**替代方案 A**: WebSocket 即時通知推送
- **優點**: 即時性高,使用者體驗更好
- **缺點**: 增加複雜度,需要 WebSocket 基礎設施,當前規格未要求即時性
- **拒絕原因**: Out of Scope (spec.md 明確列出「通知的後端邏輯和推送機制」不在範圍內)

**替代方案 B**: GraphQL 查詢
- **優點**: 靈活的查詢語法,可按需獲取欄位
- **缺點**: 專案現有技術棧使用 REST (Axios),引入 GraphQL 增加學習成本
- **拒絕原因**: 與現有架構不一致,違反簡單性原則

---

## R2: 詳細測試策略

### Decision

採用三層測試策略:
1. **契約測試** (Contract Tests) - 強制要求
2. **整合測試** (Integration Tests) - 強制要求
3. **E2E 測試** (End-to-End Tests) - 補充驗證
4. **單元測試** (Unit Tests) - 建議但非強制

### Rationale

**契約測試 (使用 MSW Mock Service Worker)**:
- **目標**: 確保前端與後端 API 契約一致
- **工具**: MSW 2.11 (專案已安裝)
- **測試範圍**:
  - `GET /api/v1/notifications` 回應格式驗證
  - `GET /api/v1/auth/me` 回應格式驗證
  - 錯誤情況處理 (401, 500)
- **執行時機**: 每次提交前,CI/CD pipeline 中
- **測試檔案**: `tests/contract/notification-api.contract.test.ts`, `tests/contract/user-api.contract.test.ts`

**整合測試 (使用 Vitest + Vue Test Utils)**:
- **目標**: 驗證所有使用者故事的完整流程
- **工具**: Vitest 1.6 + @vue/test-utils 2.4 + MSW (API mocking)
- **測試場景**:
  - **User Story 1**: 瀏覽應用程式列表
    - 測試: 登入後渲染 5 個應用程式卡片
    - 驗證: 每個卡片有名稱、圖片、正確的網格佈局
  - **User Story 2**: 導覽列互動
    - 測試: 點擊通知鈴鐺顯示面板,hover 使用者資訊顯示選單
    - 驗證: 通知面板內容正確,登出功能正常
  - **User Story 3**: 應用程式卡片互動
    - 測試: hover 卡片顯示效果,點擊卡片導覽
    - 驗證: 路由變更正確,未開發應用顯示「即將推出」
  - **User Story 4**: 頁腳資訊
    - 測試: 頁腳顯示當前年份
    - 驗證: 年份動態更新
- **執行時機**: 每次提交前,CI/CD pipeline 中

**E2E 測試 (使用 Playwright)**:
- **目標**: 在真實瀏覽器環境中驗證完整使用者流程
- **工具**: Playwright 1.56
- **測試場景**:
  - 完整流程: 登入 → 應用程式中心 → 點擊應用 → 導覽
  - 響應式測試: 在不同螢幕尺寸 (1920x1080, 1366x768, 375x667) 測試佈局
  - 無障礙測試: 鍵盤導覽 (Tab, Enter),螢幕閱讀器相容性
- **執行時機**: PR 合併前,定期夜間測試

**單元測試 (建議)**:
- **目標**: 測試獨立元件和 composables 的邏輯
- **工具**: Vitest + Vue Test Utils
- **測試範圍**:
  - AppCard.vue: props 渲染,事件發射
  - NotificationPanel.vue: 空狀態顯示,項目列表渲染
  - useNotifications composable: 狀態管理邏輯
  - useApplications composable: 資料轉換邏輯
- **執行時機**: 開發過程中,可選但建議

### Alternatives Considered

**替代方案 A**: 只依賴 E2E 測試
- **優點**: 最接近真實使用者體驗
- **缺點**: 執行速度慢,除錯困難,維護成本高
- **拒絕原因**: 違反測試金字塔原則,不符合 TDD 快速反饋需求

**替代方案 B**: 使用真實後端 API 進行測試
- **優點**: 最真實的整合測試
- **缺點**: 測試環境依賴後端服務,速度慢,不穩定
- **拒絕原因**: 違反測試隔離原則,MSW mocking 提供更好的控制和速度

---

## R3: 前端效能監控方案

### Decision

採用 **Lighthouse CI** + **Web Vitals** 作為前端效能監控方案

### Rationale

**Lighthouse CI**:
- **用途**: 自動化效能預算檢查,在 CI/CD 中執行
- **指標監控**:
  - First Contentful Paint (FCP) < 1.5s
  - Time to Interactive (TTI) < 3.5s
  - Largest Contentful Paint (LCP) < 2.5s
  - Cumulative Layout Shift (CLS) < 0.1
  - Total Blocking Time (TBT) < 300ms
- **配置**: `.lighthouserc.json` 定義效能預算
- **執行時機**: PR 提交時,自動執行並報告

**Web Vitals (生產環境監控)**:
- **用途**: 在生產環境中收集真實使用者效能數據
- **實作**: 使用 `web-vitals` npm 套件
- **數據收集**: FCP, LCP, CLS, FID (First Input Delay), TTFB
- **報告方式**: 發送到 Google Analytics 或自建分析平台 (未來擴展)
- **觸發條件**: 頁面載入完成,使用者互動時

**效能預算清單**:
```javascript
{
  "ci": {
    "assert": {
      "assertions": {
        "first-contentful-paint": ["error", {"maxNumericValue": 1500}],
        "interactive": ["error", {"maxNumericValue": 3500}],
        "largest-contentful-paint": ["warn", {"maxNumericValue": 2500}],
        "cumulative-layout-shift": ["warn", {"maxNumericValue": 0.1}]
      }
    }
  }
}
```

### Alternatives Considered

**替代方案 A**: Sentry Performance Monitoring
- **優點**: 整合錯誤追蹤和效能監控,強大的可視化介面
- **缺點**: 付費服務,增加外部依賴,當前階段過於複雜
- **拒絕原因**: 違反簡單性原則,Lighthouse CI 已足夠滿足需求

**替代方案 B**: 自建效能監控系統
- **優點**: 完全客製化,無外部依賴
- **缺點**: 開發成本高,維護負擔重,不在本功能範圍內
- **拒絕原因**: 違反 Out of Scope 原則,Lighthouse CI 提供業界標準解決方案

---

## R4: 前端記憶體預算定義

### Decision

定義前端記憶體預算為:
- **初始載入**: JavaScript heap < 10MB
- **應用程式中心頁面執行時**: < 25MB
- **記憶體洩漏檢測**: 重複操作後記憶體增長 < 5MB

### Rationale

**記憶體預算計算基礎**:
1. **初始載入 (10MB)**:
   - Vue 3 runtime: ~2-3MB
   - Pinia + Vue Router: ~1MB
   - Tailwind CSS (purged): ~0.5MB
   - 應用程式程式碼 + 依賴: ~3-4MB
   - 緩衝空間: ~2-3MB
   - 總計: ~10MB 合理

2. **執行時記憶體 (25MB)**:
   - 初始載入: 10MB
   - DOM 元素 (Navbar, Footer, 5 個 AppCard): ~5MB
   - Pinia stores 狀態: ~2MB
   - 通知資料 (5 則): ~0.5MB
   - 使用者資訊: ~0.5MB
   - 圖片快取 (5 個 128x128px): ~2-3MB
   - 緩衝空間: ~5MB
   - 總計: ~25MB 合理

3. **記憶體洩漏檢測**:
   - 測試場景: 開啟/關閉通知面板 10 次,切換路由 10 次
   - 預期: 記憶體增長 < 5MB (表示無明顯洩漏)
   - 工具: Chrome DevTools Memory Profiler

**監控方法**:
- **開發階段**: 使用 Chrome DevTools Memory Profiler 手動檢查
- **CI/CD**: 使用 Lighthouse CI 的 `total-byte-weight` 指標
- **自動化**: 在 E2E 測試中加入記憶體快照比較

**記憶體優化策略**:
- 使用 Vite 的程式碼分割 (vendor, validation chunks 已配置)
- 圖片懶載入 (使用 `loading="lazy"`)
- 元件按需載入 (Vue Router lazy loading)
- 避免全域狀態過度儲存 (只保留必要資料)

### Alternatives Considered

**替代方案 A**: 無記憶體預算,只關注功能實現
- **優點**: 開發速度快,無額外監控成本
- **缺點**: 可能導致記憶體洩漏,長期執行效能下降
- **拒絕原因**: 違反 Performance Requirements 憲法原則

**替代方案 B**: 更嚴格的記憶體預算 (初始 5MB, 執行時 15MB)
- **優點**: 極致的效能優化
- **缺點**: 難以達成,限制功能擴展性,開發成本高
- **拒絕原因**: 過度優化,不符合當前功能規模需求

---

## R5: Vue 3 Composition API 最佳實踐

### Decision

遵循以下 Vue 3 Composition API 最佳實踐:
1. 使用 `<script setup>` 語法
2. 使用 Composables 抽取可重用邏輯
3. 使用 TypeScript 進行型別安全
4. 遵循單一職責原則拆分元件

### Rationale

**`<script setup>` 語法**:
- 更簡潔的程式碼,自動暴露變數到模板
- 更好的 TypeScript 推論
- 更好的執行時效能 (編譯時優化)
- 專案現有程式碼已採用此語法 (見 frontend/vite.config.ts)

**Composables 抽取邏輯**:
- `useNotifications`: 管理通知狀態、API 呼叫、面板開關
- `useApplications`: 管理應用程式列表、導覽邏輯
- 現有 `useAuth`: 複用認證狀態和使用者資訊

**元件拆分原則**:
- **容器元件** (AppCenterView): 負責數據獲取和狀態管理
- **展示元件** (AppCard, Navbar, Footer): 只負責 UI 渲染,接收 props
- **邏輯元件** (NotificationPanel, UserMenu): 包含互動邏輯但可獨立測試

### Alternatives Considered

**替代方案 A**: 使用 Options API
- **優點**: 與 Vue 2 更相似,學習曲線較低
- **缺點**: 程式碼組織較分散,TypeScript 支援較弱
- **拒絕原因**: 專案已採用 Composition API,CLAUDE.md 明確指出使用 Vue 3 Composition API

**替代方案 B**: 不使用 Composables,邏輯直接寫在元件中
- **優點**: 程式碼更集中,易於理解
- **缺點**: 可重用性差,測試困難,違反 DRY 原則
- **拒絕原因**: 違反 Code Quality & Maintainability 憲法原則

---

## R6: Tailwind CSS 響應式設計模式

### Decision

使用 Tailwind CSS 的 **Mobile-First 響應式設計** 搭配自訂斷點

### Rationale

**自訂斷點配置** (tailwind.config.js):
```javascript
module.exports = {
  theme: {
    screens: {
      'sm': '480px',  // 大型手機
      'md': '768px',  // 平板
      'lg': '1024px', // 桌面
    }
  }
}
```

**應用程式網格響應式設計**:
```html
<!-- AppGrid.vue -->
<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
  <AppCard v-for="app in applications" :key="app.id" :app="app" />
</div>
```

**Mobile-First 策略**:
- 預設樣式為最小螢幕 (<480px),每列 1 個
- 使用 `sm:` 修飾符定義 ≥480px 樣式,每列 2 個
- 使用 `md:` 修飾符定義 ≥768px 樣式,每列 3 個
- 使用 `lg:` 修飾符定義 ≥1024px 樣式,每列 4 個

**通知面板響應式設計**:
```html
<!-- NotificationPanel.vue -->
<div class="w-80 max-w-[calc(100vw-2rem)] ...">
  <!-- 桌面: 320px, 手機: 視窗寬度 - 2rem 邊距 -->
</div>
```

### Alternatives Considered

**替代方案 A**: Desktop-First 設計
- **優點**: 傳統網站開發習慣
- **缺點**: 手機優先已成為業界標準,Tailwind 預設為 Mobile-First
- **拒絕原因**: 違反 Tailwind 最佳實踐,增加程式碼複雜度

**替代方案 B**: 使用 CSS Media Queries 而非 Tailwind
- **優點**: 更精細的控制
- **缺點**: 程式碼分散在多個檔案,維護困難,不符合專案使用 Tailwind 的選擇
- **拒絕原因**: 與專案技術棧不一致

---

## R7: 無障礙 (Accessibility) 實作策略

### Decision

實作 WCAG 2.1 AA 級無障礙標準,重點關注:
1. 鍵盤導覽
2. ARIA 屬性
3. 語義化 HTML
4. 顏色對比度

### Rationale

**鍵盤導覽實作**:
- 所有互動元素必須可透過 Tab 鍵導覽
- 焦點指示器必須清晰可見 (使用 Tailwind `focus:ring-2 focus:ring-blue-500`)
- 焦點順序符合邏輯 (上到下,左到右)
- 支援 Enter/Space 觸發點擊事件

**ARIA 屬性**:
```html
<!-- AppCard.vue -->
<button
  role="button"
  :aria-label="`開啟 ${app.name} 應用程式`"
  tabindex="0"
>
  ...
</button>

<!-- NotificationPanel.vue -->
<div
  role="region"
  aria-label="通知面板"
  :aria-live="isOpen ? 'polite' : 'off'"
>
  ...
</div>
```

**語義化 HTML**:
- 使用 `<nav>` 包裹導覽列
- 使用 `<main>` 包裹主要內容
- 使用 `<footer>` 包裹頁腳
- 使用 `<button>` 而非 `<div>` 做為可點擊元素

**顏色對比度**:
- 文字與背景對比度 ≥ 4.5:1 (AA 級要求)
- 使用 Tailwind 的 `text-gray-900` + `bg-white` 組合 (對比度 ~21:1)
- 通知鈴鐺圖示使用 `text-gray-600` (對比度 ~7:1)

**自動化測試**:
- 使用 `eslint-plugin-vuejs-accessibility` (專案已安裝) 進行靜態分析
- 使用 Playwright 的 `@axe-core/playwright` 進行執行時無障礙測試
- 測試檔案: `tests/integration/accessibility.test.ts`

### Alternatives Considered

**替代方案 A**: 只達成 WCAG 2.1 A 級標準
- **優點**: 實作成本較低
- **缺點**: 不符合規格 SC-006 明確要求的 AA 級標準
- **拒絕原因**: 違反規格要求

**替代方案 B**: 追求 AAA 級標準
- **優點**: 最高無障礙標準
- **缺點**: 實作成本極高,部分要求不切實際 (如對比度 7:1)
- **拒絕原因**: 過度要求,AA 級已足夠滿足需求

---

## Summary

所有研究項目已完成,關鍵決策總結:

| 項目 | 決策 | 狀態 |
|------|------|------|
| API 契約 | REST API (通知 + 使用者資訊) | ✅ 完成 |
| 測試策略 | 契約 + 整合 + E2E (TDD) | ✅ 完成 |
| 效能監控 | Lighthouse CI + Web Vitals | ✅ 完成 |
| 記憶體預算 | 初始 10MB, 執行時 25MB | ✅ 完成 |
| 開發模式 | Vue 3 Composition API + TypeScript | ✅ 完成 |
| 響應式設計 | Tailwind Mobile-First | ✅ 完成 |
| 無障礙標準 | WCAG 2.1 AA (鍵盤 + ARIA) | ✅ 完成 |

**下一步**: 進入 Phase 1,生成 data-model.md 和 API contracts。
