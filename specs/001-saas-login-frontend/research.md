# 技術研究：SaaS 登入頁面前端

**日期**: 2025-10-23
**功能**: SaaS 登入頁面前端 (001-saas-login-frontend)

## 研究目標

本文檔記錄 Vue 3.js 登入頁面實作的技術決策、最佳實踐研究，以及架構設計選擇的理由。

---

## 決策 1: 前端框架 - Vue 3.js with Composition API

### 選擇
**Vue 3.x** 搭配 **Composition API** 與 **TypeScript**

### 理由
1. **使用者指定**: 專案明確要求使用 Vue 3.js
2. **Composition API 優勢**:
   - 更好的邏輯重用性（composables）
   - TypeScript 支援更完善
   - 更清晰的程式碼組織
   - 符合憲法原則 I（單一職責、可維護性）
3. **效能**: Vue 3 的 Proxy-based 響應式系統效能優於 Vue 2
4. **生態系統**: 成熟的工具鏈與社群支援

### 考慮的替代方案
- **Options API**: 較傳統但邏輯重用性較差
- **其他框架** (React, Svelte): 未選擇因使用者指定 Vue 3

---

## 決策 2: 建置工具 - Vite

### 選擇
**Vite 5.x** 作為開發與建置工具

### 理由
1. **開發體驗**: 極快的冷啟動與熱模組替換 (HMR)
2. **效能目標**: 符合憲法 FCP < 1.5s 要求，Vite 提供優化的生產建置
3. **Vue 3 整合**: Vue 官方推薦，與 Vue 3 深度整合
4. **現代化**: 原生 ESM 支援，tree-shaking 優化
5. **TypeScript**: 內建 TypeScript 支援

### 考慮的替代方案
- **Webpack**: 配置複雜，開發速度較慢
- **Rollup**: 適合庫開發，但開發體驗不如 Vite

---

## 決策 3: 狀態管理 - Pinia

### 選擇
**Pinia 2.x** 作為狀態管理解決方案

### 理由
1. **Vue 3 官方推薦**: Vuex 的繼任者
2. **TypeScript 友善**: 完整的型別推斷
3. **Composition API 風格**: 與專案架構一致
4. **輕量**: 僅 1KB，符合效能預算
5. **DevTools 支援**: 優秀的除錯體驗
6. **模組化**: 每個 store 獨立，易於測試

### 使用場景
- 驗證狀態管理（token, 使用者資訊, 登入狀態）
- 全域錯誤處理
- 載入狀態追蹤

### 考慮的替代方案
- **Vuex 4**: 較舊，TypeScript 支援較弱
- **純 Composition API**: 對於單頁應用足夠，但 Pinia 提供更好的結構化

---

## 決策 4: HTTP 客戶端 - Axios

### 選擇
**Axios 1.x** 進行 API 請求

### 理由
1. **功能完整**: 請求/回應攔截器、錯誤處理、逾時控制
2. **瀏覽器相容性**: 支援舊版瀏覽器
3. **易於測試**: Mock 友善
4. **錯誤處理**: 符合 FR-007 需求（網路錯誤、逾時處理）
5. **TypeScript 支援**: 良好的型別定義

### 實作模式
```typescript
// authService.ts 範例結構
import axios from 'axios'

const apiClient = axios.create({
  baseURL: process.env.VITE_CRM_API_URL,
  timeout: 10000, // 10秒逾時（規格要求）
  headers: { 'Content-Type': 'application/json' }
})

// 請求攔截器：加入 token
// 回應攔截器：統一錯誤處理
```

### 考慮的替代方案
- **Fetch API**: 原生但錯誤處理較複雜，需額外封裝
- **ky/wretch**: 輕量但功能較少

---

## 決策 5: 表單驗證 - VeeValidate + Yup

### 選擇
**VeeValidate 4.x** 搭配 **Yup** 驗證架構

### 理由
1. **Vue 3 整合**: 原生支援 Composition API
2. **聲明式驗證**: 符合規格 FR-008（即時欄位驗證）
3. **效能**: 符合 < 100ms 驗證回應要求
4. **Yup Schema**: 可重用、可測試的驗證規則
5. **錯誤訊息**: 完整繁體中文本地化支援

### 驗證規則範例
```typescript
import * as yup from 'yup'

const loginSchema = yup.object({
  username: yup.string()
    .required('此欄位為必填')
    .min(3, '帳號至少需 3 個字元'),
  password: yup.string()
    .required('此欄位為必填')
    .min(6, '密碼長度至少需 6 個字元')
})
```

### 考慮的替代方案
- **手動驗證**: 難以維護，測試困難
- **Vuelidate**: 較舊，Vue 3 支援有限
- **Zod**: 優秀但與 VeeValidate 整合較少

---

## 決策 6: 測試策略

### 選擇
- **Unit Testing**: Vitest + Vue Test Utils
- **Integration Testing**: Playwright
- **Contract Testing**: MSW (Mock Service Worker)

### 理由

#### Vitest
1. **Vite 原生**: 與建置工具一致，配置簡單
2. **速度**: 比 Jest 快 10-20 倍
3. **API 相容**: Jest-like API，學習曲線低
4. **Vue 3 支援**: Vue Test Utils 完美整合

#### Playwright
1. **跨瀏覽器**: 支援 Chrome, Firefox, Safari
2. **可靠性**: 自動等待機制，減少 flaky tests
3. **符合規格**: 可測試完整使用者故事（P1, P2, P3）
4. **DevTools**: 強大的除錯工具

#### MSW (Mock Service Worker)
1. **Contract Testing**: 模擬 CRM API 回應
2. **開發體驗**: 可用於開發環境
3. **網路層級 Mock**: 不需修改應用程式碼

### 測試覆蓋目標
- **Unit Tests**: 80%+ 程式碼覆蓋率
- **Integration Tests**: 所有使用者故事（3 個）
- **Contract Tests**: CRM API 登入端點

---

## 決策 7: CSS/樣式解決方案

### 選擇
**Tailwind CSS 3.x** + **PostCSS**

### 理由
1. **快速開發**: Utility-first 加速 UI 實作
2. **效能**: PurgeCSS 自動移除未使用樣式
3. **響應式**: 符合 SC-007（320px-1024px+ 支援）
4. **設計系統**: 易於建立一致的設計 token
5. **無障礙**: 提供無障礙相關 utility classes
6. **Bundle 大小**: 生產環境僅包含使用的 CSS（通常 < 10KB）

### 配置重點
- 自訂設計 token（顏色、間距、字型）
- 繁體中文字型支援
- Dark mode 準備（未來功能）

### 考慮的替代方案
- **CSS Modules**: 需更多手動樣式撰寫
- **Styled Components**: Vue 生態系統支援較少
- **Pure CSS**: 開發速度慢，難以維護

---

## 決策 8: 路由管理 - Vue Router

### 選擇
**Vue Router 4.x**

### 理由
1. **Vue 3 官方**: 完全支援 Composition API
2. **Navigation Guards**: 實作登入狀態檢查（FR-009）
3. **路由懶載入**: 優化效能
4. **TypeScript 支援**: 完整型別定義

### 路由結構
```typescript
const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginPage.vue')
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/DashboardPage.vue'),
    meta: { requiresAuth: true }
  }
]
```

---

## 決策 9: Token 儲存策略

### 選擇
**localStorage** 搭配安全最佳實踐

### 理由
1. **需求匹配**: 規格要求「記住我」功能（FR-002, P2）
2. **持久性**: 關閉瀏覽器後仍保持（localStorage）
3. **Session 模式**: 未勾選「記住我」使用 sessionStorage
4. **XSS 防護**:
   - HttpOnly Cookie 由後端設定（建議）
   - 前端 token 僅用於 API 請求
   - 實作 CSP (Content Security Policy)

### 安全考量
```typescript
// Token 管理範例
class TokenManager {
  set(token: string, remember: boolean) {
    const storage = remember ? localStorage : sessionStorage
    storage.setItem('auth_token', token)
  }

  get(): string | null {
    return localStorage.getItem('auth_token')
      || sessionStorage.getItem('auth_token')
  }

  clear() {
    localStorage.removeItem('auth_token')
    sessionStorage.removeItem('auth_token')
  }
}
```

### 考慮的替代方案
- **純 HttpOnly Cookie**: 無法實作前端 token 檢查邏輯
- **IndexedDB**: 過於複雜，不適合簡單 token 儲存

---

## 決策 10: 無障礙實踐

### 選擇
整合多種工具確保 WCAG 2.1 AA 合規（FR-013）

### 工具與策略
1. **vue-axe**: 開發時即時無障礙檢查
2. **eslint-plugin-vuejs-accessibility**: 靜態程式碼檢查
3. **Lighthouse CI**: 自動化無障礙評分
4. **手動測試**: 鍵盤導航、螢幕閱讀器測試

### 實作重點
- 語義化 HTML 標籤
- ARIA labels（繁體中文）
- 鍵盤導航支援（FR-011）
- 焦點管理
- 適當的顏色對比度
- 表單標籤與錯誤關聯

---

## 決策 11: 錯誤處理架構

### 選擇
集中式錯誤處理 + 使用者友善訊息

### 實作策略
```typescript
// errorHandler.ts
export class ErrorHandler {
  static handle(error: ApiError): UserMessage {
    // 網路錯誤
    if (error.code === 'NETWORK_ERROR') {
      return { text: '連線失敗，請檢查網路狀態後重試', type: 'error' }
    }

    // API 錯誤
    if (error.status === 401) {
      return { text: '帳號或密碼錯誤，請重新輸入', type: 'error' }
    }

    // 逾時錯誤
    if (error.code === 'TIMEOUT') {
      return { text: '請求逾時，請稍後重試', type: 'error' }
    }

    // 預設錯誤
    return { text: '系統錯誤，請稍後再試', type: 'error' }
  }
}
```

### 符合規格
- FR-006: 友善錯誤訊息，不洩漏敏感資訊
- FR-007: 處理網路錯誤、逾時、API 錯誤
- FR-012: 使用繁體中文

---

## 決策 12: 效能優化策略

### Bundle 大小優化
1. **Code Splitting**: 路由級別懶載入
2. **Tree Shaking**: Vite 自動處理
3. **依賴分析**: 使用 vite-bundle-visualizer
4. **目標**: 初始 bundle < 200KB (gzipped)

### 載入效能
1. **Preload Critical Assets**: 字型、CSS
2. **圖片優化**: WebP 格式，懶載入
3. **CDN**: 靜態資源使用 CDN
4. **Service Worker**: PWA 準備（未來功能）

### 執行效能
1. **Computed Properties**: 避免不必要的重新計算
2. **Virtual Scrolling**: 若未來有長列表
3. **Debounce**: 表單驗證使用 debounce（100ms）

---

## 環境變數管理

### 選擇
使用 Vite 的 `.env` 檔案

### 配置範例
```bash
# .env.development
VITE_CRM_API_URL=http://localhost:3000/api
VITE_APP_TITLE=SaaS 登入系統

# .env.production
VITE_CRM_API_URL=https://api.example.com
VITE_APP_TITLE=SaaS 登入系統
```

### 安全考量
- 敏感資訊不放入前端環境變數
- API endpoint 可公開（受後端保護）
- 使用 `.env.local` 存放開發者本地設定（不納入版控）

---

## 開發工具鏈

### 選擇的工具
1. **ESLint**: 程式碼品質檢查
2. **Prettier**: 程式碼格式化
3. **Husky**: Git hooks 管理
4. **lint-staged**: 僅檢查暫存檔案
5. **Commitlint**: Commit 訊息規範

### 配置目標
- 符合憲法原則 I（程式碼品質）
- 自動化程式碼檢查
- 強制測試執行（pre-commit）

---

## 瀏覽器支援矩陣

### 目標瀏覽器
| 瀏覽器 | 最低版本 | 理由 |
|--------|---------|------|
| Chrome | 90+ | ES6+ 支援，市占率高 |
| Firefox | 88+ | ES6+ 支援 |
| Safari | 14+ | iOS 14+ 對應 |
| Edge | 90+ | Chromium-based |

### 不支援
- IE 11（已停止支援）
- Chrome < 90, Firefox < 88

### Polyfills
- 不需要額外 polyfills（現代瀏覽器原生支援）

---

## 部署策略考量

### 建議方案（不在本功能範圍，供參考）
1. **靜態檔案託管**: Netlify, Vercel, Cloudflare Pages
2. **CI/CD**: GitHub Actions 自動建置與部署
3. **環境分離**: dev, staging, production
4. **快取策略**:
   - HTML: no-cache
   - JS/CSS: 長期快取 (hash-based)

---

## 研究結論

所有技術決策均符合以下標準：
- ✅ 憲法原則 I-V 完全合規
- ✅ 效能預算達成 (FCP < 1.5s, TTI < 3.5s)
- ✅ 測試策略完整（TDD, Contract, Integration, Unit）
- ✅ 無障礙 WCAG 2.1 AA 標準
- ✅ 繁體中文使用者介面
- ✅ 安全最佳實踐

**下一步**: 進入 Phase 1 設計階段，生成資料模型與 API 契約。
