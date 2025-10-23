# 任務清單：SaaS 登入頁面前端

**輸入**: 設計文件來自 `/specs/001-saas-login-frontend/`
**前置條件**: plan.md (必需), spec.md (必需 - 使用者故事), research.md, data-model.md, contracts/

**測試**: 根據憲法第 II 條（測試標準 - 不可協商），本專案採用 TDD 方法。所有測試任務必須在實作前完成並驗證失敗。

**組織方式**: 任務依使用者故事分組，使每個故事能獨立實作與測試。

## 格式：`[ID] [P?] [Story] 描述`

- **[P]**: 可平行執行（不同檔案，無相依性）
- **[Story]**: 此任務屬於哪個使用者故事（例如 US1, US2, US3）
- 描述中包含確切的檔案路徑

## 路徑慣例

- **Web 應用程式**: `frontend/src/`, `frontend/tests/`
- 本專案使用 frontend 目錄結構

---

## Phase 1: 專案設置

**目的**: 專案初始化與基本結構建立

- [X] T001 依照 quickstart.md 使用 Vite 建立 Vue 3 + TypeScript 專案於 frontend/
- [X] T002 安裝核心依賴套件（Vue 3, Vue Router, Pinia, Axios）於 frontend/package.json
- [X] T003 [P] 安裝測試框架（Vitest, Playwright, Vue Test Utils）於 frontend/package.json
- [X] T004 [P] 安裝表單驗證套件（VeeValidate, Yup）於 frontend/package.json
- [X] T005 [P] 安裝 CSS 框架（Tailwind CSS, PostCSS）於 frontend/package.json
- [X] T006 [P] 安裝程式碼品質工具（ESLint, Prettier, Husky）於 frontend/package.json
- [X] T007 設定 Vite 配置檔 frontend/vite.config.ts
- [X] T008 [P] 設定 TypeScript 配置檔 frontend/tsconfig.json
- [X] T009 [P] 設定 Tailwind CSS frontend/tailwind.config.js
- [X] T010 [P] 設定 ESLint frontend/.eslintrc.cjs
- [X] T011 [P] 設定 Prettier frontend/.prettierrc.json
- [X] T012 建立專案目錄結構於 frontend/src/（components, composables, stores, services, utils, types, router, assets, views）
- [X] T013 建立測試目錄結構於 frontend/tests/（contract, integration, unit）
- [X] T014 建立環境變數檔案 frontend/.env.development 和 frontend/.env.example

---

## Phase 2: 基礎建設（阻塞性前置條件）

**目的**: 所有使用者故事開始前必須完成的核心基礎設施

**⚠️ 重要**: 在此階段完成前，無法開始任何使用者故事的實作

- [X] T015 建立 TypeScript 型別定義 frontend/src/types/auth.ts（LoginCredentials, AuthToken, UserInfo, LoginFormState, FieldErrors, UserRole）
- [X] T016 [P] 建立 TypeScript 型別定義 frontend/src/types/api.ts（ErrorType, ErrorMessage, LoginApiResponse）
- [X] T017 建立錯誤處理工具 frontend/src/utils/errorHandler.ts（ErrorHandler 類別，對應 API 錯誤碼至繁體中文訊息）
- [X] T018 [P] 建立表單驗證規則 frontend/src/utils/validators.ts（loginCredentialsSchema 使用 Yup）
- [X] T019 建立 Axios 實例與攔截器於 frontend/src/services/authService.ts（基礎 API 客戶端設定，包含 baseURL, timeout, 錯誤攔截器）
- [X] T020 建立 Pinia auth store 骨架於 frontend/src/stores/auth.ts（AuthState interface, 基本 state, getters, actions）
- [X] T021 [P] 建立 Vue Router 配置 frontend/src/router/index.ts（/login, /dashboard 路由，navigation guard 骨架）
- [X] T022 [P] 建立主樣式檔案 frontend/src/assets/styles/main.css（導入 Tailwind，設定繁體中文字型）
- [X] T023 設定應用程式入口 frontend/src/main.ts（整合 Pinia, Router, 導入樣式）
- [X] T024 建立根元件 frontend/src/App.vue（RouterView 與最小佈局）

**檢查點**: 基礎建設就緒 - 使用者故事實作現在可以平行開始

---

## Phase 3: 使用者故事 1 - 基本登入流程 (優先級: P1) 🎯 MVP

**目標**: 會員透過登入頁面輸入帳號密碼，系統驗證身份後導向會員專屬頁面。

**獨立測試**: 輸入有效帳號密碼，成功呼叫 CRM API 並導向會員頁面。包含成功登入、錯誤處理、網路異常處理。

### 測試 - 使用者故事 1（TDD：必須先寫且失敗）

> **重要**: 依照 TDD 原則，這些測試必須先寫並驗證失敗，然後才能進行實作

- [X] T025 [P] [US1] 建立 Contract 測試 frontend/tests/contract/crm-auth.spec.ts（測試 /auth/login 端點 - 成功登入、401 錯誤、網路錯誤、逾時，使用 MSW mock）
- [X] T026 [P] [US1] 建立 Integration 測試 frontend/tests/integration/login-flow.spec.ts（完整登入流程 E2E 測試：輸入帳密 → API 呼叫 → 導向，使用 Playwright）
- [X] T027 [P] [US1] 建立 Unit 測試 frontend/tests/unit/utils/errorHandler.spec.ts（測試錯誤訊息對應邏輯）

### 實作 - 使用者故事 1

- [X] T028 [P] [US1] 實作 authService login 方法於 frontend/src/services/authService.ts（呼叫 POST /auth/login，處理成功與錯誤回應）
- [X] T029 [P] [US1] 實作 auth store actions 於 frontend/src/stores/auth.ts（setAuth, clearAuth, login 方法整合 authService）
- [X] T030 [P] [US1] 建立 useLocalStorage composable frontend/src/composables/useLocalStorage.ts（管理 localStorage/sessionStorage token 儲存）
- [X] T031 [US1] 實作 useAuth composable frontend/src/composables/useAuth.ts（整合 auth store 與 localStorage，login 函式，錯誤處理）
- [X] T032 [P] [US1] 建立 Alert 元件 frontend/src/components/Alert.vue（顯示錯誤/成功訊息，支援不同類型與自動關閉）
- [X] T033 [P] [US1] 建立 Button 元件 frontend/src/components/Button.vue（可重用按鈕，支援 loading 狀態與 disabled）
- [X] T034 [P] [US1] 建立 FormInput 元件 frontend/src/components/FormInput.vue（可重用輸入框，支援錯誤訊息顯示與無障礙 label）
- [X] T035 [US1] 建立 LoginForm 元件 frontend/src/components/LoginForm.vue（整合 FormInput, Button, Alert，綁定表單資料，呼叫 useAuth login）
- [X] T036 [US1] 建立 LoginPage 視圖 frontend/src/views/LoginPage.vue（使用 LoginForm 元件，處理頁面佈局與響應式設計）
- [X] T037 [US1] 建立簡易 DashboardPage 視圖 frontend/src/views/DashboardPage.vue（顯示登入成功訊息與使用者資訊，用於驗證導向）
- [X] T038 [US1] 更新 router navigation guard frontend/src/router/index.ts（檢查登入狀態，未登入導向 /login，已登入訪問 /login 導向 /dashboard）
- [X] T039 [US1] 在 LoginForm 新增載入狀態處理（登入中按鈕 disabled 並顯示載入動畫）
- [X] T040 [US1] 在 LoginForm 新增錯誤處理（網路錯誤、API 逾時、401 錯誤，顯示繁體中文訊息）

**檢查點**: 此時使用者故事 1 應完全可運作且可獨立測試

---

## Phase 4: 使用者故事 2 - 登入狀態記憶 (優先級: P2)

**目標**: 會員成功登入後，在一定期間內關閉或重新開啟瀏覽器時，系統應保持登入狀態。

**獨立測試**: 成功登入後關閉瀏覽器，再次開啟時驗證是否仍保持登入狀態，提供持續性登入體驗。

### 測試 - 使用者故事 2（TDD：必須先寫且失敗）

- [ ] T041 [P] [US2] 建立 Contract 測試 frontend/tests/contract/crm-auth.spec.ts 新增 /auth/verify 端點測試（token 有效、token 過期、token 無效）
- [ ] T042 [P] [US2] 建立 Integration 測試 frontend/tests/integration/remember-me.spec.ts（記住我流程：勾選 → 登入 → 關閉瀏覽器 → 重開 → 自動登入；未勾選 → 登出）
- [ ] T043 [P] [US2] 建立 Unit 測試 frontend/tests/unit/composables/useLocalStorage.spec.ts（測試 token 儲存、讀取、清除、過期檢查）

### 實作 - 使用者故事 2

- [ ] T044 [US2] 在 LoginForm 元件新增「記住我」勾選框（rememberMe checkbox，預設 false）
- [ ] T045 [US2] 在 useAuth composable 擴充 login 函式處理 rememberMe 參數（true 用 localStorage, false 用 sessionStorage）
- [ ] T046 [US2] 在 useLocalStorage composable 實作 token 儲存邏輯（依 rememberMe 選擇儲存位置，包含過期時間戳記）
- [ ] T047 [US2] 實作 authService verify 方法 frontend/src/services/authService.ts（呼叫 GET /auth/verify，驗證 token 有效性）
- [ ] T048 [US2] 在 auth store 新增 checkAuth action（頁面載入時檢查 localStorage/sessionStorage token，若有效則自動登入）
- [ ] T049 [US2] 在 auth store 新增 isTokenValid getter（檢查 token 是否過期，計算 loginTime + expiresIn）
- [ ] T050 [US2] 在 App.vue onMounted 呼叫 checkAuth（應用程式啟動時自動檢查登入狀態）
- [ ] T051 [US2] 在 router navigation guard 新增 token 檢查邏輯（訪問需登入頁面時，檢查 token 有效性，無效則清除並導向登入頁）
- [ ] T052 [US2] 在 LoginPage 新增進入頁面時 token 檢查（若已登入則直接導向 dashboard）

**檢查點**: 此時使用者故事 1 和 2 都能獨立運作

---

## Phase 5: 使用者故事 3 - 表單驗證與即時回饋 (優先級: P3)

**目標**: 使用者在填寫登入表單時，系統應提供即時的欄位驗證回饋，協助使用者正確填寫資料。

**獨立測試**: 在表單欄位輸入無效資料（如空白、格式錯誤）並觀察即時驗證訊息，提供更好的表單填寫體驗。

### 測試 - 使用者故事 3（TDD：必須先寫且失敗）

- [ ] T053 [P] [US3] 建立 Integration 測試 frontend/tests/integration/form-validation.spec.ts（測試即時驗證：空白欄位、密碼長度不足、修正錯誤後按鈕啟用）
- [ ] T054 [P] [US3] 建立 Unit 測試 frontend/tests/unit/utils/validators.spec.ts（測試 Yup schema 驗證規則）
- [ ] T055 [P] [US3] 建立 Unit 測試 frontend/tests/unit/composables/useForm.spec.ts（測試表單驗證 composable 邏輯）

### 實作 - 使用者故事 3

- [ ] T056 [US3] 建立 useForm composable frontend/src/composables/useForm.ts（整合 VeeValidate，提供欄位驗證、錯誤訊息、提交檢查）
- [ ] T057 [US3] 在 FormInput 元件整合即時驗證（blur 事件觸發驗證，顯示錯誤訊息，樣式變化）
- [ ] T058 [US3] 在 LoginForm 整合 useForm composable（綁定 VeeValidate，使用 loginCredentialsSchema）
- [ ] T059 [US3] 在 LoginForm 新增帳號欄位驗證回饋（必填檢查、長度 3-50 字元、blur 時顯示錯誤）
- [ ] T060 [US3] 在 LoginForm 新增密碼欄位驗證回饋（必填檢查、長度 6-100 字元、blur 時顯示錯誤）
- [ ] T061 [US3] 在 LoginForm 新增提交前驗證（所有欄位通過驗證才啟用登入按鈕）
- [ ] T062 [US3] 在 FormInput 新增密碼顯示/隱藏切換功能（eye icon 按鈕，切換 type="password" / type="text"）
- [ ] T063 [US3] 在 LoginForm 新增鍵盤操作支援（Enter 鍵提交表單，Tab 鍵正確導航）
- [ ] T064 [US3] 在 LoginForm 新增無障礙屬性（aria-label, aria-describedby, role，確保螢幕閱讀器可讀取錯誤訊息）

**檢查點**: 所有使用者故事現在都能獨立運作

---

## Phase 6: 優化與跨功能關注

**目的**: 影響多個使用者故事的改進

- [ ] T065 [P] 建立 MSW handlers frontend/src/mocks/handlers.ts（模擬 CRM API 用於開發與測試）
- [ ] T066 [P] 新增 Tailwind 自訂設計 token 於 frontend/tailwind.config.js（顏色、間距、繁體中文字型）
- [ ] T067 [P] 建立可重用樣式 utility classes 於 frontend/src/assets/styles/main.css
- [ ] T068 優化響應式設計（測試 320px-428px 行動裝置與 1024px+ 桌面裝置）
- [ ] T069 [P] 新增 Unit 測試 frontend/tests/unit/components/LoginForm.spec.ts（元件單元測試）
- [ ] T070 [P] 新增 Unit 測試 frontend/tests/unit/components/FormInput.spec.ts（元件單元測試）
- [ ] T071 [P] 新增 Unit 測試 frontend/tests/unit/stores/auth.spec.ts（Pinia store 測試）
- [ ] T072 執行無障礙檢查（使用 Lighthouse CI, eslint-plugin-vuejs-accessibility）
- [ ] T073 執行效能測試（驗證 FCP < 1.5s, TTI < 3.5s）
- [ ] T074 執行跨瀏覽器測試（Chrome, Firefox, Safari, Edge）
- [ ] T075 程式碼重構與優化（移除重複程式碼，改善可讀性）
- [ ] T076 [P] 撰寫程式碼註解（繁體中文為主，技術細節可用英文）
- [ ] T077 執行 quickstart.md 驗證（確保設置指南正確無誤）
- [ ] T078 執行完整測試套件（npm run test && npm run test:e2e）

---

## 相依性與執行順序

### Phase 相依性

- **Setup (Phase 1)**: 無相依性 - 可立即開始
- **Foundational (Phase 2)**: 相依 Setup 完成 - **阻塞所有使用者故事**
- **User Stories (Phase 3+)**: 都相依 Foundational phase 完成
  - 使用者故事可以平行進行（若有人力）
  - 或依優先級順序執行（P1 → P2 → P3）
- **Polish (Phase 6)**: 相依所有想要的使用者故事完成

### 使用者故事相依性

- **使用者故事 1 (P1)**: Foundational 完成後可開始 - 無其他故事相依性
- **使用者故事 2 (P2)**: Foundational 完成後可開始 - 與 US1 整合但可獨立測試
- **使用者故事 3 (P3)**: Foundational 完成後可開始 - 與 US1 整合但可獨立測試

### 每個使用者故事內部

- 測試（若包含）必須先寫並驗證失敗，然後才能實作
- Models 在 services 之前
- Services 在端點/元件之前
- 核心實作在整合之前
- 故事完成後才進入下一個優先級

### 平行機會

- 所有標記 [P] 的 Setup 任務可平行執行
- 所有標記 [P] 的 Foundational 任務可平行執行（在 Phase 2 內）
- Foundational phase 完成後，所有使用者故事可平行開始（若團隊容量允許）
- 每個使用者故事的標記 [P] 測試可平行執行
- 每個使用者故事的標記 [P] 元件可平行執行
- 不同使用者故事可由不同團隊成員平行處理

---

## 平行範例：使用者故事 1

```bash
# 同時啟動使用者故事 1 的所有測試：
Task: "建立 Contract 測試 frontend/tests/contract/crm-auth.spec.ts"
Task: "建立 Integration 測試 frontend/tests/integration/login-flow.spec.ts"
Task: "建立 Unit 測試 frontend/tests/unit/utils/errorHandler.spec.ts"

# 同時啟動使用者故事 1 的所有可平行元件：
Task: "實作 authService login 方法於 frontend/src/services/authService.ts"
Task: "實作 auth store actions 於 frontend/src/stores/auth.ts"
Task: "建立 useLocalStorage composable frontend/src/composables/useLocalStorage.ts"
Task: "建立 Alert 元件 frontend/src/components/Alert.vue"
Task: "建立 Button 元件 frontend/src/components/Button.vue"
Task: "建立 FormInput 元件 frontend/src/components/FormInput.vue"
```

---

## 實作策略

### MVP First（僅使用者故事 1）

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational（重要 - 阻塞所有故事）
3. 完成 Phase 3: 使用者故事 1
4. **停止並驗證**: 獨立測試使用者故事 1
5. 若準備好則部署/展示

### 漸進式交付

1. 完成 Setup + Foundational → 基礎就緒
2. 新增使用者故事 1 → 獨立測試 → 部署/展示（MVP！）
3. 新增使用者故事 2 → 獨立測試 → 部署/展示
4. 新增使用者故事 3 → 獨立測試 → 部署/展示
5. 每個故事新增價值而不破壞先前故事

### 平行團隊策略

若有多位開發者：

1. 團隊一起完成 Setup + Foundational
2. Foundational 完成後：
   - Developer A: 使用者故事 1
   - Developer B: 使用者故事 2
   - Developer C: 使用者故事 3
3. 故事獨立完成並整合

---

## 備註

- [P] 任務 = 不同檔案，無相依性
- [Story] 標籤將任務對應至特定使用者故事以便追蹤
- 每個使用者故事應可獨立完成與測試
- 實作前驗證測試失敗
- 每個任務或邏輯群組後 commit
- 在任何檢查點停止以獨立驗證故事
- 避免：模糊任務、相同檔案衝突、破壞獨立性的跨故事相依性
