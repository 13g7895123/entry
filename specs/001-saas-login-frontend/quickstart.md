# 快速開始：SaaS 登入頁面前端

**日期**: 2025-10-23
**功能**: SaaS 登入頁面前端 (001-saas-login-frontend)
**技術棧**: Vue 3 + TypeScript + Vite + Pinia

## 概述

本指南協助開發者快速建立 Vue 3 登入頁面開發環境，並提供實作步驟與最佳實踐。

---

## 前置需求

### 必要環境
- **Node.js**: 18.x 或以上
- **npm**: 9.x 或以上（或 pnpm 8.x / yarn 3.x）
- **Git**: 最新穩定版本

### 推薦工具
- **VS Code**: 搭配以下擴充套件
  - Volar（Vue Language Features）
  - TypeScript Vue Plugin (Volar)
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense

### 檢查環境

```bash
# 檢查 Node.js 版本
node --version  # 應顯示 v18.x 或以上

# 檢查 npm 版本
npm --version   # 應顯示 9.x 或以上
```

---

## 專案初始化

### 步驟 1: 建立 Vue 3 + TypeScript 專案

```bash
# 進入專案根目錄
cd /home/jarvis/project/idea/as/entry

# 使用 Vite 建立 frontend 專案
npm create vite@latest frontend -- --template vue-ts

# 進入 frontend 目錄
cd frontend
```

### 步驟 2: 安裝核心依賴

```bash
# 安裝核心依賴
npm install vue@^3.4.0 \
  vue-router@^4.2.0 \
  pinia@^2.1.0 \
  axios@^1.6.0

# 安裝開發依賴
npm install -D \
  @vitejs/plugin-vue@^5.0.0 \
  typescript@^5.3.0 \
  vite@^5.0.0
```

### 步驟 3: 安裝測試框架

```bash
# Vitest (單元測試)
npm install -D vitest@^1.0.0 \
  @vue/test-utils@^2.4.0 \
  jsdom@^23.0.0 \
  @vitest/ui@^1.0.0

# Playwright (整合測試)
npm install -D @playwright/test@^1.40.0

# 初始化 Playwright
npx playwright install
```

### 步驟 4: 安裝表單驗證

```bash
# VeeValidate + Yup
npm install vee-validate@^4.12.0 yup@^1.3.0
```

### 步驟 5: 安裝 CSS 框架

```bash
# Tailwind CSS
npm install -D tailwindcss@^3.4.0 \
  postcss@^8.4.0 \
  autoprefixer@^10.4.0

# 初始化 Tailwind
npx tailwindcss init -p
```

### 步驟 6: 安裝程式碼品質工具

```bash
# ESLint + Prettier
npm install -D \
  eslint@^8.55.0 \
  @typescript-eslint/parser@^6.15.0 \
  @typescript-eslint/eslint-plugin@^6.15.0 \
  eslint-plugin-vue@^9.19.0 \
  prettier@^3.1.0 \
  eslint-config-prettier@^9.1.0 \
  eslint-plugin-vuejs-accessibility@^2.2.0

# Husky (Git hooks)
npm install -D husky@^8.0.0 lint-staged@^15.2.0

# 初始化 Husky
npx husky install
```

---

## 專案結構建立

### 建立目錄結構

```bash
# 在 frontend/src 目錄下建立結構
cd frontend/src

mkdir -p components composables stores services utils types router assets/styles views

# 在 frontend 根目錄建立測試目錄
cd ..
mkdir -p tests/{contract,integration,unit/{components,composables,utils}}
```

### 目錄說明

```
frontend/
├── src/
│   ├── components/      # 可重用 Vue 元件
│   ├── composables/     # Composition API 邏輯
│   ├── stores/          # Pinia 狀態管理
│   ├── services/        # API 服務層
│   ├── utils/           # 工具函式
│   ├── types/           # TypeScript 型別
│   ├── router/          # Vue Router 設定
│   ├── assets/styles/   # 樣式檔案
│   └── views/           # 頁面元件
└── tests/
    ├── contract/        # Contract 測試
    ├── integration/     # Integration 測試
    └── unit/            # Unit 測試
```

---

## 設定檔配置

### 1. Vite 設定 (`vite.config.ts`)

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_CRM_API_URL || 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    target: 'esnext',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'vue-router', 'pinia'],
          'validation': ['vee-validate', 'yup']
        }
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  }
})
```

### 2. TypeScript 設定 (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Path mapping */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 3. Tailwind CSS 設定 (`tailwind.config.js`)

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          // ... 自訂顏色
        }
      },
      fontFamily: {
        sans: ['Noto Sans TC', 'sans-serif'], // 繁體中文字型
      }
    },
  },
  plugins: [],
}
```

### 4. ESLint 設定 (`.eslintrc.cjs`)

```javascript
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:vue/vue3-recommended',
    'plugin:vuejs-accessibility/recommended',
    'prettier'
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    ecmaVersion: 'latest',
    parser: '@typescript-eslint/parser',
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint', 'vue', 'vuejs-accessibility'],
  rules: {
    'vue/multi-word-component-names': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
  }
}
```

### 5. Prettier 設定 (`.prettierrc.json`)

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "none",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "endOfLine": "lf"
}
```

### 6. 環境變數 (`.env.development`)

```bash
# CRM API URL
VITE_CRM_API_URL=http://localhost:3000/api

# 應用程式標題
VITE_APP_TITLE=SaaS 登入系統

# 開發模式
VITE_DEV_MODE=true
```

### 7. 環境變數範例 (`.env.example`)

```bash
# 複製此檔案為 .env.local 並填入實際值

# CRM API URL
VITE_CRM_API_URL=http://localhost:3000/api

# 應用程式標題
VITE_APP_TITLE=SaaS 登入系統
```

### 8. Git Hooks 設定

```bash
# 建立 pre-commit hook
npx husky add .husky/pre-commit "npx lint-staged"

# 建立 commit-msg hook
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'
```

### 9. lint-staged 設定 (`package.json`)

```json
{
  "lint-staged": {
    "*.{js,ts,vue}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{css,scss}": [
      "prettier --write"
    ]
  }
}
```

---

## 核心檔案建立

### 1. Tailwind CSS 導入 (`src/assets/styles/main.css`)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 繁體中文字型 */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap');

@layer base {
  html {
    font-family: 'Noto Sans TC', sans-serif;
  }
}
```

### 2. 主應用程式入口 (`src/main.ts`)

```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './assets/styles/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.mount('#app')
```

### 3. Vue Router 設定 (`src/router/index.ts`)

```typescript
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginPage.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardPage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/',
      redirect: '/login'
    }
  ]
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  if (requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
```

### 4. 根元件 (`src/App.vue`)

```vue
<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// 應用程式載入時檢查登入狀態
onMounted(() => {
  authStore.checkAuth()
})
</script>
```

---

## NPM 腳本設定

在 `package.json` 新增以下腳本：

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "lint": "eslint . --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts --fix",
    "format": "prettier --write src/",
    "type-check": "vue-tsc --noEmit"
  }
}
```

---

## 啟動開發環境

### 1. 安裝依賴

```bash
cd frontend
npm install
```

### 2. 啟動開發伺服器

```bash
npm run dev
```

應該會看到：

```
  VITE v5.0.0  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

### 3. 開啟瀏覽器

訪問 `http://localhost:5173/login`

---

## 驗證安裝

### 檢查 TypeScript

```bash
npm run type-check
```

### 執行 Lint

```bash
npm run lint
```

### 執行測試

```bash
# 單元測試
npm run test

# 整合測試
npm run test:e2e
```

---

## 下一步：實作流程

### 階段 1: 建立型別定義
1. 建立 `src/types/auth.ts` - 驗證相關型別
2. 建立 `src/types/api.ts` - API 回應型別

參考：`data-model.md`

### 階段 2: 實作 API 服務層
1. 建立 `src/services/authService.ts` - CRM API 整合
2. 設定 Axios interceptors

參考：`contracts/crm-auth-api.yaml`

### 階段 3: 實作狀態管理
1. 建立 `src/stores/auth.ts` - 驗證 Pinia store
2. 實作 token 管理邏輯

參考：`data-model.md` 實體 6

### 階段 4: 實作 Composables
1. 建立 `src/composables/useAuth.ts` - 驗證邏輯
2. 建立 `src/composables/useForm.ts` - 表單驗證
3. 建立 `src/composables/useLocalStorage.ts` - 本地儲存

### 階段 5: 建立 UI 元件
1. 建立 `src/components/FormInput.vue` - 輸入框元件
2. 建立 `src/components/Button.vue` - 按鈕元件
3. 建立 `src/components/Alert.vue` - 訊息提示元件
4. 建立 `src/components/LoginForm.vue` - 登入表單

### 階段 6: 建立頁面
1. 建立 `src/views/LoginPage.vue` - 登入頁面
2. 建立 `src/views/DashboardPage.vue` - 會員頁面（簡單版）

### 階段 7: 撰寫測試
1. 單元測試：表單驗證、Composables
2. Contract 測試：CRM API Mock
3. Integration 測試：完整登入流程

參考：`spec.md` 使用者故事

---

## 常見問題

### Q: CRM API 尚未就緒怎麼辦？

**A**: 使用 MSW (Mock Service Worker) 模擬 API

```bash
npm install -D msw@^2.0.0

# 初始化 MSW
npx msw init public/
```

建立 Mock handlers:

```typescript
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.post('/api/auth/login', () => {
    return HttpResponse.json({
      success: true,
      data: {
        user: { id: '1', username: 'test', displayName: '測試使用者', role: 'user' },
        token: { accessToken: 'mock_token', expiresIn: 3600, tokenType: 'Bearer' }
      }
    })
  })
]
```

### Q: 如何除錯 Pinia store？

**A**: 使用 Vue DevTools

1. 安裝 Vue DevTools 瀏覽器擴充套件
2. 開啟開發者工具 → Vue 分頁
3. 查看 Pinia 狀態與時光旅行除錯

### Q: TypeScript 型別錯誤太多怎麼辦？

**A**: 逐步遷移

1. 先設定 `"strict": false`
2. 逐個檔案修正型別
3. 最後啟用 strict 模式

---

## 資源連結

### 官方文件
- [Vue 3 文件](https://vuejs.org/)
- [Vite 文件](https://vitejs.dev/)
- [Pinia 文件](https://pinia.vuejs.org/)
- [Vue Router 文件](https://router.vuejs.org/)
- [VeeValidate 文件](https://vee-validate.logaretm.com/)
- [Tailwind CSS 文件](https://tailwindcss.com/)

### 測試
- [Vitest 文件](https://vitest.dev/)
- [Playwright 文件](https://playwright.dev/)
- [Vue Test Utils 文件](https://test-utils.vuejs.org/)

### 程式碼品質
- [ESLint 規則](https://eslint.org/docs/rules/)
- [TypeScript 文件](https://www.typescriptlang.org/)

---

## 檢查清單

在開始實作前，確認以下項目：

- [ ] Node.js 18.x+ 已安裝
- [ ] 所有依賴套件已安裝（`npm install` 無錯誤）
- [ ] 開發伺服器可正常啟動（`npm run dev`）
- [ ] TypeScript 檢查通過（`npm run type-check`）
- [ ] ESLint 檢查通過（`npm run lint`）
- [ ] 專案結構已建立（`src/` 目錄結構完整）
- [ ] 環境變數已設定（`.env.development` 已建立）
- [ ] Git hooks 已設定（Husky）
- [ ] VS Code 擴充套件已安裝（Volar, ESLint, Prettier）
- [ ] 已閱讀 `spec.md`, `data-model.md`, `research.md`

---

## 支援與協助

如遇到問題：
1. 查看 `research.md` 中的技術決策
2. 參考 `data-model.md` 中的型別定義
3. 檢查 `contracts/crm-auth-api.yaml` API 規格
4. 查閱官方文件
5. 檢查 console 與網路請求錯誤訊息

**下一步**: 執行 `/speckit.tasks` 生成詳細的實作任務清單。
