# Tasks: 應用程式中心 UI

**Feature**: 004-app-center-ui
**Branch**: `004-app-center-ui`
**Input**: Design documents from `/specs/004-app-center-ui/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: 本專案遵循 TDD (Test-Driven Development)，所有任務包含測試優先策略。根據專案憲法，TDD 是 NON-NEGOTIABLE 要求。

**Organization**: 任務按使用者故事分組，每個故事可獨立實作和測試。

## Format: `- [ ] [ID] [P?] [Story] Description`

- **[P]**: 可平行執行（不同檔案，無依賴）
- **[Story]**: 任務所屬使用者故事（US1, US2, US3, US4）
- 描述包含明確檔案路徑

## Path Conventions

本專案為 **Web 應用程式**（前後端分離）：
- **Frontend**: `frontend/src/`, `frontend/tests/`
- **Backend**: 依賴現有 API（003-crm-login-integration）

---

## Phase 1: Setup (專案初始化)

**Purpose**: 建立前端專案結構和基礎配置

- [X] T001 建立 frontend/src/types/application.ts 定義 Application interface
- [X] T002 建立 frontend/src/types/notification.ts 定義 Notification 和 NotificationResponse interfaces
- [X] T003 [P] 建立 frontend/src/data/applications.ts 定義靜態應用程式資料（5 個應用程式）
- [X] T004 [P] 配置 Tailwind 自訂斷點於 frontend/tailwind.config.js（sm: 480px, md: 768px, lg: 1024px）
- [X] T005 [P] 建立 frontend/src/mocks/handlers.ts 設定 MSW handlers for 通知 API
- [ ] T006 [P] 準備應用程式圖示佔位資源於 frontend/src/assets/images/app-icons/（crm.png, erp.png, ecommerce.png, resume.png, settings.png）

---

## Phase 2: Foundational (阻塞性前置作業)

**Purpose**: 核心基礎設施，所有使用者故事的前置依賴

**⚠️ CRITICAL**: 此階段完成前，任何使用者故事都無法開始

- [ ] T007 建立 frontend/src/services/notificationService.ts 實作通知 API 呼叫函數（fetchNotifications, markAsRead）
- [ ] T008 建立 frontend/src/stores/applications.ts Pinia store 管理應用程式列表狀態
- [ ] T009 建立 frontend/src/stores/notifications.ts Pinia store 管理通知狀態（notifications, unreadCount, isPanelOpen）
- [ ] T010 建立 frontend/src/composables/useApplications.ts composable 封裝應用程式邏輯
- [ ] T011 建立 frontend/src/composables/useNotifications.ts composable 封裝通知邏輯
- [ ] T012 在 frontend/src/router/index.ts 新增 /app-center 和 /coming-soon 路由（meta: { requiresAuth: true }）

**Checkpoint**: 基礎建設完成 - 使用者故事實作現可平行開始

---

## Phase 3: User Story 1 - 瀏覽應用程式列表 (Priority: P1) 🎯 MVP

**Goal**: 已登入使用者可看到所有可用應用程式（CRM、ERP、Ecommerce、Resume、設定），每個應用程式有圖示和名稱，網格佈局清晰

**Independent Test**: 使用者登入後訪問 /app-center，看到 5 個應用程式卡片以響應式網格顯示（桌面4列、平板3列、大型手機2列、小型手機1列）

### Tests for User Story 1 (TDD: RED-GREEN-REFACTOR)

> **先寫測試，確認失敗，再實作**

- [ ] T013 [P] [US1] 契約測試: frontend/tests/contract/user-api.contract.test.ts 驗證使用者 API 回應格式符合 UserInfo schema
- [ ] T014 [P] [US1] 整合測試: frontend/tests/integration/app-center.test.ts 測試應用程式列表渲染（5 個卡片、正確名稱、網格佈局）
- [ ] T015 [P] [US1] E2E 測試: frontend/tests/e2e/responsive-layout.spec.ts 測試響應式佈局（1920x1080: 4列, 768px: 3列, 480px: 2列, 375px: 1列）

**執行測試確認失敗**: `npm run test -- tests/integration/app-center.test.ts`

### Implementation for User Story 1

- [ ] T016 [P] [US1] 建立 frontend/src/components/AppCenter/AppCard.vue 元件（接收 app prop，顯示圖示+名稱，emit click 事件，支援 hover 效果，包含 aria-label）
- [ ] T017 [P] [US1] 建立 frontend/src/components/AppCenter/AppGrid.vue 元件（使用 Tailwind grid，grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4）
- [ ] T018 [US1] 建立 frontend/src/views/AppCenterView.vue 主頁面（使用 useApplicationsStore 獲取應用程式列表，渲染 AppGrid）
- [ ] T019 [US1] 在 AppCard.vue 實作圖片載入失敗 fallback（顯示應用程式首字母在彩色圓形背景，使用 fallbackColor）
- [ ] T020 [US1] 單元測試: frontend/tests/unit/components/AppCard.test.ts 測試 AppCard 元件（名稱渲染、click 事件、fallback 顯示）
- [ ] T021 [US1] 單元測試: frontend/tests/unit/composables/useApplications.test.ts 測試應用程式 composable 邏輯

**執行測試確認通過**: `npm run test`

**Checkpoint**: 使用者故事 1 應完全功能正常且可獨立測試

---

## Phase 4: User Story 2 - 導覽列互動 (Priority: P1)

**Goal**: 使用者可透過導覽列查看當前位置（應用程式中心）、查看通知、存取個人資料和登出功能

**Independent Test**: 使用者在應用程式中心頁面看到導覽列，點擊通知鈴鐺顯示下拉面板（320-400px 寬，最多 5 則通知），hover 使用者資訊顯示選單（個人資料、登出），點擊登出成功登出

### Tests for User Story 2 (TDD: RED-GREEN-REFACTOR)

- [ ] T022 [P] [US2] 契約測試: frontend/tests/contract/notification-api.contract.test.ts 驗證 GET /api/v1/notifications 回應格式符合 NotificationResponse schema
- [ ] T023 [P] [US2] 整合測試: frontend/tests/integration/app-center.test.ts (擴展) 測試導覽列互動（通知面板開啟、使用者選單顯示、登出功能）
- [ ] T024 [P] [US2] E2E 測試: frontend/tests/e2e/app-center-flow.spec.ts 測試完整流程（登入 → 應用程式中心 → 點擊通知 → 登出）

**執行測試確認失敗**: `npm run test -- tests/integration`

### Implementation for User Story 2

- [ ] T025 [P] [US2] 建立 frontend/src/components/Layout/Navbar.vue 元件（左側顯示「應用程式中心」，右側通知鈴鐺+使用者資訊）
- [ ] T026 [P] [US2] 建立 frontend/src/components/Layout/NotificationPanel.vue 元件（下拉面板，寬度 320-400px，顯示最多 5 則通知，空狀態顯示「目前沒有新通知」，底部「查看全部通知」連結）
- [ ] T027 [P] [US2] 建立 frontend/src/components/Layout/UserMenu.vue 元件（hover 顯示下拉選單，包含「個人資料」和「登出」選項）
- [ ] T028 [US2] 在 NotificationPanel.vue 實作通知載入邏輯（使用 useNotificationsStore，點擊鈴鐺時呼叫 loadNotifications）
- [ ] T029 [US2] 在 UserMenu.vue 實作登出邏輯（呼叫 useAuth composable 的 logout 方法，清除 sessionStorage，導向登入頁）
- [ ] T030 [US2] 在 Navbar.vue 整合 NotificationPanel 和 UserMenu，顯示使用者名稱（從 useAuth 獲取）
- [ ] T031 [US2] 更新 AppCenterView.vue 加入 Navbar 元件
- [ ] T032 [US2] 單元測試: frontend/tests/unit/components/Navbar.test.ts 測試 Navbar 元件渲染
- [ ] T033 [US2] 單元測試: frontend/tests/unit/components/NotificationPanel.test.ts 測試通知面板（空狀態、通知列表、點擊標記已讀）
- [ ] T034 [US2] 單元測試: frontend/tests/unit/composables/useNotifications.test.ts 測試通知 composable 邏輯

**執行測試確認通過**: `npm run test`

**Checkpoint**: 使用者故事 1 和 2 都應獨立運作正常

---

## Phase 5: User Story 3 - 應用程式卡片互動 (Priority: P2)

**Goal**: 使用者可透過滑鼠懸停和點擊與應用程式卡片互動，視覺回饋清晰，點擊後導向對應應用程式（或「即將推出」頁面）

**Independent Test**: 使用者將滑鼠移到任何應用程式卡片看到視覺回饋（陰影加深、輕微放大），點擊卡片後導向對應頁面（已開發應用）或「即將推出」頁面（未開發應用）。支援鍵盤導覽（Tab、Enter）

### Tests for User Story 3 (TDD: RED-GREEN-REFACTOR)

- [ ] T035 [P] [US3] 整合測試: frontend/tests/integration/app-card-interaction.test.ts 測試卡片點擊導覽（已開發應用 → 真實路由，未開發應用 → /coming-soon）
- [ ] T036 [P] [US3] 整合測試: frontend/tests/integration/accessibility.test.ts 測試鍵盤導覽（Tab 鍵焦點順序、Enter 鍵觸發點擊、焦點指示器顯示）
- [ ] T037 [P] [US3] E2E 測試: frontend/tests/e2e/app-center-flow.spec.ts (擴展) 測試應用程式導覽流程

**執行測試確認失敗**: `npm run test -- tests/integration/app-card-interaction.test.ts`

### Implementation for User Story 3

- [ ] T038 [US3] 在 AppCard.vue 加入 hover 效果（Tailwind: hover:shadow-lg hover:scale-105 transition-all duration-200）
- [ ] T039 [US3] 在 AppCard.vue 加入鍵盤導覽支援（tabindex="0"，focus:ring-2 focus:ring-blue-500，@keydown.enter 觸發點擊）
- [ ] T040 [US3] 建立 frontend/src/components/AppCenter/ComingSoonPage.vue 元件（顯示應用程式名稱和「即將推出」訊息，從 query param 獲取應用程式 code）
- [ ] T041 [US3] 在 AppCenterView.vue 實作卡片點擊處理（檢查 isAvailable，true → router.push(routePath)，false → router.push('/coming-soon?app=' + code)）
- [ ] T042 [US3] 在 AppCard.vue 加入防抖機制（避免快速連續點擊重複導覽，使用 ref 追蹤 isNavigating 狀態）
- [ ] T043 [US3] 單元測試: frontend/tests/unit/components/ComingSoonPage.test.ts 測試「即將推出」頁面顯示

**執行測試確認通過**: `npm run test`

**Checkpoint**: 所有使用者故事 1、2、3 都應獨立運作正常

---

## Phase 6: User Story 4 - 頁腳資訊顯示 (Priority: P3)

**Goal**: 使用者可在頁面底部看到版權資訊和當前年份

**Independent Test**: 使用者滾動到頁面底部，看到「Copyright © 2025」格式的版權資訊，年份自動更新

### Tests for User Story 4 (TDD: RED-GREEN-REFACTOR)

- [ ] T044 [P] [US4] 單元測試: frontend/tests/unit/components/Footer.test.ts 測試 Footer 元件（顯示當前年份、格式正確）

**執行測試確認失敗**: `npm run test -- tests/unit/components/Footer.test.ts`

### Implementation for User Story 4

- [ ] T045 [P] [US4] 建立 frontend/src/components/Layout/Footer.vue 元件（顯示「Copyright © ${new Date().getFullYear()}」）
- [ ] T046 [US4] 在 AppCenterView.vue 加入 Footer 元件

**執行測試確認通過**: `npm run test`

**Checkpoint**: 所有使用者故事都應獨立運作正常

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 跨多個使用者故事的改進

- [ ] T047 [P] 無障礙合規驗證: 使用 eslint-plugin-vuejs-accessibility 執行靜態分析，修復所有警告
- [ ] T048 [P] 無障礙合規驗證: 使用 Playwright + @axe-core/playwright 執行 WCAG 2.1 AA 自動化測試
- [ ] T049 [P] 效能測試: 配置 .lighthouserc.json 效能預算（FCP < 1500ms, TTI < 3500ms, LCP < 2500ms, CLS < 0.1）
- [ ] T050 [P] 效能測試: 執行 Lighthouse CI 並驗證所有指標通過
- [ ] T051 [P] 記憶體測試: 使用 Chrome DevTools Memory Profiler 驗證記憶體使用 < 25MB（執行時）
- [ ] T052 [P] E2E 測試完整覆蓋: 執行所有 Playwright 測試並確保通過率 100%
- [ ] T053 [P] 型別檢查: 執行 `npm run type-check` 確保無 TypeScript 錯誤
- [ ] T054 [P] Linting: 執行 `npm run lint` 並修復所有問題
- [ ] T055 [P] 程式碼格式化: 執行 `npm run format` 統一程式碼風格
- [ ] T056 程式碼審查: 審查所有元件程式碼，確保符合 Vue 3 Composition API 最佳實踐
- [ ] T057 文件更新: 更新 frontend/README.md 加入應用程式中心功能說明
- [ ] T058 執行 quickstart.md 驗證: 依照 quickstart.md 指南執行完整開發流程確保可行

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 無依賴 - 可立即開始
- **Foundational (Phase 2)**: 依賴 Setup 完成 - 阻塞所有使用者故事
- **User Stories (Phase 3-6)**: 全部依賴 Foundational 完成
  - User Story 1 (P1): 基礎，無依賴其他故事
  - User Story 2 (P1): 整合 User Story 1（Navbar 加入 AppCenterView），但可獨立測試
  - User Story 3 (P2): 依賴 User Story 1（AppCard 互動），但可獨立測試
  - User Story 4 (P3): 整合 User Story 1（Footer 加入 AppCenterView），但可獨立測試
- **Polish (Phase 7)**: 依賴所有使用者故事完成

### User Story Dependencies

```
Foundational (Phase 2) - MUST COMPLETE FIRST
         ↓
    ┌────┴────┬────────┬────────┐
    ↓         ↓        ↓        ↓
  US1 (P1) US2 (P1) US3 (P2) US4 (P3)
    ↓         ↓        ↓        ↓
    └────┬────┴────────┴────────┘
         ↓
   Polish (Phase 7)
```

**說明**:
- US1 是 MVP 核心，優先實作
- US2 依賴 US1（加入 Navbar 到 AppCenterView），但測試可獨立
- US3 依賴 US1（AppCard 互動邏輯），但測試可獨立
- US4 依賴 US1（加入 Footer 到 AppCenterView），但測試可獨立
- 所有故事在 Foundational 完成後可平行開發（如有足夠人力）

### Within Each User Story

1. **TDD 循環**: 測試（RED）→ 實作（GREEN）→ 重構（REFACTOR）
2. **測試優先**: 契約測試、整合測試、E2E 測試必須先寫並確認失敗
3. **元件順序**: 獨立元件（AppCard, NotificationPanel 等）可平行開發
4. **整合順序**: 元件 → 頁面整合 → 單元測試
5. **故事完成**: 確認所有測試通過後再進行下一個故事

### Parallel Opportunities

#### Phase 1 (Setup) - 6 tasks, 5 parallelizable
```bash
Task: T001 types/application.ts
Task: T002 types/notification.ts
Task: T003 data/applications.ts
Task: T004 tailwind.config.js
Task: T005 mocks/handlers.ts
Task: T006 app-icons/
```

#### Phase 2 (Foundational) - 6 tasks, all sequential
- T007 → T008 → T009 → T010 → T011 → T012

#### User Story 1 - Tests (3 tasks, all parallelizable)
```bash
Task: T013 contract/user-api.contract.test.ts
Task: T014 integration/app-center.test.ts
Task: T015 e2e/responsive-layout.spec.ts
```

#### User Story 1 - Implementation (2 components parallelizable)
```bash
Task: T016 AppCard.vue
Task: T017 AppGrid.vue
```

#### User Story 2 - Tests (3 tasks, all parallelizable)
```bash
Task: T022 contract/notification-api.contract.test.ts
Task: T023 integration/app-center.test.ts (擴展)
Task: T024 e2e/app-center-flow.spec.ts
```

#### User Story 2 - Implementation (3 components parallelizable)
```bash
Task: T025 Navbar.vue
Task: T026 NotificationPanel.vue
Task: T027 UserMenu.vue
```

#### Phase 7 (Polish) - Most tasks parallelizable
```bash
Task: T047 無障礙靜態分析
Task: T048 無障礙自動化測試
Task: T049 Lighthouse 配置
Task: T050 Lighthouse CI
Task: T051 記憶體測試
Task: T052 E2E 完整測試
Task: T053 型別檢查
Task: T054 Linting
Task: T055 格式化
```

---

## Parallel Example: User Story 1

### 測試階段（所有測試一起執行）
```bash
# 同時啟動所有 User Story 1 測試
Task: "契約測試 user-api.contract.test.ts"
Task: "整合測試 app-center.test.ts"
Task: "E2E 測試 responsive-layout.spec.ts"
```

### 元件開發階段（獨立元件平行）
```bash
# 同時開發兩個獨立元件
Task: "建立 AppCard.vue 元件"
Task: "建立 AppGrid.vue 元件"
```

---

## Parallel Example: User Story 2

### 測試階段
```bash
Task: "契約測試 notification-api.contract.test.ts"
Task: "整合測試 app-center.test.ts (擴展)"
Task: "E2E 測試 app-center-flow.spec.ts"
```

### 元件開發階段
```bash
Task: "建立 Navbar.vue"
Task: "建立 NotificationPanel.vue"
Task: "建立 UserMenu.vue"
```

---

## Implementation Strategy

### MVP First (只實作 User Story 1)

1. **Phase 1: Setup** (T001-T006) → 專案結構就緒
2. **Phase 2: Foundational** (T007-T012) → 基礎建設就緒（關鍵阻塞）
3. **Phase 3: User Story 1** (T013-T021) → 應用程式列表功能
4. **STOP and VALIDATE**: 測試 User Story 1 獨立運作
   - 執行所有測試: `npm run test`
   - 手動測試: 登入 → 訪問 /app-center → 看到 5 個應用程式卡片
   - 響應式測試: 調整瀏覽器寬度確認網格變化
5. **Deploy/Demo MVP**: 如果 User Story 1 運作正常，可先部署展示

**MVP 價值**: 使用者可以看到所有可用應用程式，這是應用程式中心的核心功能。

### Incremental Delivery (逐步交付)

1. **Foundation** (Phase 1-2): 完成基礎建設 → 準備就緒
2. **Increment 1** (Phase 3): User Story 1 → 測試獨立運作 → Deploy/Demo (MVP!)
3. **Increment 2** (Phase 4): User Story 2 → 測試獨立運作 → Deploy/Demo
4. **Increment 3** (Phase 5): User Story 3 → 測試獨立運作 → Deploy/Demo
5. **Increment 4** (Phase 6): User Story 4 → 測試獨立運作 → Deploy/Demo
6. **Final Polish** (Phase 7): 效能優化、無障礙合規 → Production Ready

**優點**: 每個 increment 都增加價值，不會破壞先前功能。

### Parallel Team Strategy (多人協作)

如果有多位開發者:

1. **一起完成**: Phase 1 (Setup) + Phase 2 (Foundational)
2. **Phase 2 完成後平行分工**:
   - **Developer A**: User Story 1 (T013-T021) - MVP 核心
   - **Developer B**: User Story 2 (T022-T034) - 導覽列
   - **Developer C**: User Story 3 (T035-T043) - 卡片互動
   - **Developer D**: User Story 4 (T044-T046) - 頁腳
3. **各自完成並獨立測試**: 每個開發者確保自己的故事通過所有測試
4. **整合**: 合併所有分支，執行完整測試套件
5. **Polish**: 團隊一起完成 Phase 7

---

## Implementation Notes

### TDD 工作流程 (每個任務)

1. **RED**: 撰寫測試，執行測試，確認失敗
   ```bash
   # 範例: User Story 1
   npm run test -- tests/integration/app-center.test.ts
   # 預期: FAIL - AppCenterView 尚未建立
   ```

2. **GREEN**: 實作最小程式碼讓測試通過
   ```bash
   # 建立元件
   touch src/views/AppCenterView.vue
   # 實作基本功能
   # 再次執行測試
   npm run test -- tests/integration/app-center.test.ts
   # 預期: PASS
   ```

3. **REFACTOR**: 改進程式碼品質（保持測試通過）
   ```bash
   # 重構: 加入樣式、優化邏輯、加入註解
   # 確認測試仍通過
   npm run test
   ```

### Commit 策略

- 每完成一個任務或邏輯群組就 commit
- Commit message 格式: `[TaskID] [Story] Description`
  - 範例: `[T016] [US1] 建立 AppCard 元件`
  - 範例: `[T038] [US3] 加入 AppCard hover 效果`

### Checkpoint 驗證

在每個使用者故事的 Checkpoint:
1. 執行該故事的所有測試: `npm run test -- tests/integration/`
2. 手動測試該故事的功能
3. 確認響應式設計正常
4. 確認無障礙功能正常（鍵盤導覽、螢幕閱讀器）
5. 如果一切正常，繼續下一個故事或 Deploy

### 避免事項

- ❌ 模糊任務描述（每個任務必須有明確檔案路徑）
- ❌ 同檔案衝突（多個開發者修改同一檔案時要協調）
- ❌ 跨故事依賴破壞獨立性（每個故事應可獨立測試）
- ❌ 實作前不寫測試（違反 TDD 原則）
- ❌ 測試失敗時繼續實作（必須先讓測試通過）

---

## Task Summary

| Phase | Task Count | Parallelizable | Description |
|-------|-----------|----------------|-------------|
| Phase 1: Setup | 6 | 5 | 專案初始化和配置 |
| Phase 2: Foundational | 6 | 0 | 核心基礎設施（阻塞） |
| Phase 3: US1 (P1) | 9 | 5 | 瀏覽應用程式列表（MVP） |
| Phase 4: US2 (P1) | 13 | 6 | 導覽列互動 |
| Phase 5: US3 (P2) | 9 | 4 | 應用程式卡片互動 |
| Phase 6: US4 (P3) | 3 | 2 | 頁腳資訊顯示 |
| Phase 7: Polish | 12 | 9 | 效能優化和品質提升 |
| **Total** | **58** | **31** | **全功能完整實作** |

### Suggested MVP Scope

**最小可行產品 (MVP)**: Phase 1 + Phase 2 + Phase 3 (User Story 1)
- **任務數**: 21 tasks
- **預估時間**: 2-3 天（單人）
- **價值**: 使用者可看到所有可用應用程式，響應式網格佈局

### Full Feature Scope

**完整功能**: All Phases (1-7)
- **任務數**: 58 tasks
- **預估時間**: 1-2 週（單人），4-5 天（4 人平行協作）
- **價值**: 完整應用程式中心，包含導覽、通知、互動、無障礙、效能優化

---

## Format Validation

✅ **所有任務遵循檢查清單格式**:
- ✅ 每個任務以 `- [ ]` 開頭（Markdown checkbox）
- ✅ 每個任務有唯一 Task ID（T001-T058）
- ✅ 可平行任務標記 [P]
- ✅ 使用者故事任務標記 [Story] 標籤（US1, US2, US3, US4）
- ✅ 每個任務描述包含明確檔案路徑
- ✅ 任務按執行順序排列
- ✅ 依賴關係清楚標示

**Independent Test Criteria**:
- ✅ **User Story 1**: 登入後訪問 /app-center 看到 5 個應用程式卡片，響應式網格正確
- ✅ **User Story 2**: 點擊通知鈴鐺顯示面板，hover 使用者資訊顯示選單，登出功能正常
- ✅ **User Story 3**: 卡片 hover 效果正常，點擊導覽正確（已開發/未開發），鍵盤導覽支援
- ✅ **User Story 4**: 頁面底部顯示正確年份的版權資訊

---

**Tasks 生成完成! 🎯**
