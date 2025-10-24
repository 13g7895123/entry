# Quick Start Guide: 應用程式中心 UI

**Feature**: 004-app-center-ui
**Branch**: `004-app-center-ui`
**Date**: 2025-10-24

## 快速開始

本指南協助開發者快速設置開發環境並開始實作應用程式中心 UI 功能。

---

## Prerequisites (前置條件)

### 必要條件

- **Node.js**: v18.0.0 或更新版本
- **npm**: v9.0.0 或更新版本
- **Git**: 用於版本控制
- **VS Code**: 建議使用的 IDE (搭配以下擴充套件)
  - Vue - Official (Vue Language Features)
  - TypeScript Vue Plugin (Volar)
  - Tailwind CSS IntelliSense
  - ESLint
  - Prettier

### 已完成的依賴功能

- ✅ **003-crm-login-integration**: 登入功能和認證系統 (必須)
  - 提供 `useAuth` composable
  - 提供 auth store (Pinia)
  - 提供 Axios 攔截器自動附加 access token

---

## Setup (環境設置)

### 1. Clone Repository & Checkout Branch

```bash
# Clone 專案
git clone <repository-url>
cd entry

# Checkout 功能分支
git checkout 004-app-center-ui

# 確認分支正確
git branch
# 應該看到 * 004-app-center-ui
```

### 2. Install Dependencies

```bash
# 安裝前端依賴
cd frontend
npm install

# 驗證安裝
npm list vue vue-router pinia tailwindcss
```

### 3. Environment Configuration

確認 `.env.development` 檔案存在 (如不存在則建立):

```bash
# frontend/.env.development
VITE_API_BASE_URL=http://localhost:9230
```

### 4. Start Development Server

```bash
# 啟動前端開發伺服器
npm run dev

# 應該看到:
# ➜  Local:   http://localhost:5173/
# ➜  Network: use --host to expose
```

開啟瀏覽器訪問 `http://localhost:5173/app-center` (登入後)

---

## Project Structure Overview

```
frontend/src/
├── components/
│   ├── AppCenter/          # 📍 本功能的主要元件
│   │   ├── AppCard.vue
│   │   ├── AppGrid.vue
│   │   └── ComingSoonPage.vue
│   └── Layout/             # 📍 導覽列相關元件
│       ├── Navbar.vue
│       ├── NotificationPanel.vue
│       ├── UserMenu.vue
│       └── Footer.vue
├── views/
│   └── AppCenterView.vue   # 📍 應用程式中心主頁面
├── stores/
│   ├── notifications.ts    # 📍 新增: 通知狀態管理
│   └── applications.ts     # 📍 新增: 應用程式狀態管理
├── composables/
│   ├── useNotifications.ts # 📍 新增: 通知邏輯
│   └── useApplications.ts  # 📍 新增: 應用程式邏輯
├── services/
│   └── notificationService.ts  # 📍 新增: 通知 API
├── types/
│   ├── notification.ts     # 📍 新增: 通知型別
│   └── application.ts      # 📍 新增: 應用程式型別
└── data/
    └── applications.ts     # 📍 新增: 應用程式靜態資料
```

**圖例**: 📍 = 本功能需要建立的檔案

---

## Development Workflow (TDD)

### Step 1: 寫測試 (RED)

遵循 Test-Driven Development (TDD) - **先寫測試,確認失敗,再實作**。

#### 範例: 測試 AppCard 元件

```bash
# 建立測試檔案
touch frontend/tests/unit/components/AppCard.test.ts
```

```typescript
// tests/unit/components/AppCard.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppCard from '@/components/AppCenter/AppCard.vue'
import type { Application } from '@/types/application'

describe('AppCard.vue', () => {
  const mockApp: Application = {
    id: 'app-crm',
    name: 'CRM',
    code: 'crm',
    iconPath: '/app-icons/crm.png',
    routePath: '/crm',
    isAvailable: false,
    order: 1,
    fallbackColor: '#3B82F6'
  }

  it('應該正確渲染應用程式名稱', () => {
    const wrapper = mount(AppCard, {
      props: { app: mockApp }
    })

    expect(wrapper.text()).toContain('CRM')
  })

  it('當點擊卡片時應該發射 click 事件', async () => {
    const wrapper = mount(AppCard, {
      props: { app: mockApp }
    })

    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  // ... 更多測試
})
```

**執行測試 (應該失敗)**:
```bash
npm run test -- AppCard.test.ts

# 預期結果: FAIL (因為 AppCard.vue 尚未建立)
```

### Step 2: 實作程式碼 (GREEN)

測試失敗後,實作最小程式碼讓測試通過。

```bash
# 建立元件檔案
mkdir -p frontend/src/components/AppCenter
touch frontend/src/components/AppCenter/AppCard.vue
```

```vue
<!-- src/components/AppCenter/AppCard.vue -->
<script setup lang="ts">
import type { Application } from '@/types/application'

defineProps<{
  app: Application
}>()

defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    @click="$emit('click')"
    class="..."
  >
    {{ app.name }}
  </button>
</template>
```

**再次執行測試**:
```bash
npm run test -- AppCard.test.ts

# 預期結果: PASS
```

### Step 3: 重構 (REFACTOR)

測試通過後,改進程式碼品質 (不改變行為)。

```vue
<!-- 重構: 加入樣式、無障礙屬性、hover 效果 -->
<script setup lang="ts">
import { computed } from 'vue'
import type { Application } from '@/types/application'

const props = defineProps<{
  app: Application
}>()

const emit = defineEmits<{
  click: []
}>()

const fallbackStyle = computed(() => ({
  backgroundColor: props.app.fallbackColor
}))
</script>

<template>
  <button
    @click="emit('click')"
    :aria-label="`開啟 ${app.name} 應用程式`"
    class="
      relative flex flex-col items-center justify-center
      p-6 rounded-lg bg-gray-100
      transition-all duration-200
      hover:shadow-lg hover:scale-105
      focus:outline-none focus:ring-2 focus:ring-blue-500
    "
  >
    <!-- 圖片或 Fallback -->
    <div class="w-32 h-32 mb-4 rounded-lg overflow-hidden">
      <img
        :src="app.iconPath"
        :alt="`${app.name} 圖示`"
        class="w-full h-full object-cover"
        @error="showFallback = true"
      />
      <div
        v-if="showFallback"
        :style="fallbackStyle"
        class="w-full h-full flex items-center justify-center text-white text-4xl font-bold"
      >
        {{ app.name[0] }}
      </div>
    </div>

    <!-- 應用程式名稱 -->
    <span class="text-lg font-semibold text-gray-900">
      {{ app.name }}
    </span>
  </button>
</template>
```

**確認測試仍通過**:
```bash
npm run test -- AppCard.test.ts
# 預期結果: PASS (重構不應破壞測試)
```

---

## Common Tasks

### Task 1: 建立新元件

```bash
# 1. 建立測試檔案 (TDD: RED)
touch tests/unit/components/NotificationPanel.test.ts

# 2. 撰寫測試 (應該失敗)
# ...

# 3. 建立元件檔案 (TDD: GREEN)
touch src/components/Layout/NotificationPanel.vue

# 4. 實作元件 (讓測試通過)
# ...

# 5. 執行測試
npm run test -- NotificationPanel.test.ts
```

### Task 2: 建立 Pinia Store

```bash
# 1. 建立測試檔案
touch tests/unit/stores/notifications.test.ts

# 2. 撰寫測試
# ...

# 3. 建立 store 檔案
touch src/stores/notifications.ts

# 4. 實作 store
# ...

# 5. 執行測試
npm run test
```

### Task 3: 建立 API Service

```bash
# 1. 建立契約測試
touch tests/contract/notification-api.contract.test.ts

# 2. 設置 MSW handlers
# 編輯 src/mocks/handlers.ts

# 3. 建立 service 檔案
touch src/services/notificationService.ts

# 4. 實作 API 呼叫
# ...

# 5. 執行契約測試
npm run test -- contract
```

### Task 4: 新增路由

```typescript
// src/router/index.ts

import { createRouter, createWebHistory } from 'vue-router'
import AppCenterView from '@/views/AppCenterView.vue'
import ComingSoonPage from '@/components/AppCenter/ComingSoonPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // ... 現有路由

    {
      path: '/app-center',
      name: 'app-center',
      component: AppCenterView,
      meta: { requiresAuth: true }  // 需要登入
    },
    {
      path: '/coming-soon',
      name: 'coming-soon',
      component: ComingSoonPage,
      meta: { requiresAuth: true }
    }
  ]
})

export default router
```

### Task 5: 配置 Tailwind 斷點

```javascript
// tailwind.config.js

module.exports = {
  theme: {
    extend: {
      screens: {
        'sm': '480px',   // 大型手機
        'md': '768px',   // 平板
        'lg': '1024px',  // 桌面
      }
    }
  }
}
```

---

## Testing

### Run All Tests

```bash
# 執行所有測試
npm run test

# 執行測試並產生覆蓋率報告
npm run test:coverage

# 執行測試 UI
npm run test:ui
```

### Run Specific Test Suites

```bash
# 契約測試
npm run test -- tests/contract

# 整合測試
npm run test -- tests/integration

# 單元測試
npm run test -- tests/unit

# E2E 測試
npm run test:e2e
```

### Watch Mode (開發時使用)

```bash
# 監聽模式 (檔案變更時自動執行測試)
npm run test -- --watch
```

---

## Linting & Formatting

### Run Linter

```bash
# 執行 ESLint 檢查
npm run lint

# 自動修復 linting 問題
npm run lint -- --fix
```

### Format Code

```bash
# 使用 Prettier 格式化程式碼
npm run format
```

---

## Build & Preview

### Production Build

```bash
# 建立生產版本
npm run build

# 輸出位置: frontend/dist/

# 檢查 bundle 大小
ls -lh dist/assets/
```

### Preview Production Build

```bash
# 預覽生產版本
npm run preview

# 開啟 http://localhost:4173/
```

---

## Debugging

### VS Code Debugging

建立 `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome against localhost",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/frontend/src"
    }
  ]
}
```

### Vue DevTools

安裝 [Vue DevTools](https://devtools.vuejs.org/) 瀏覽器擴充套件進行除錯。

---

## Troubleshooting

### 常見問題

#### Q1: `npm install` 失敗

```bash
# 清除 npm 快取並重新安裝
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

#### Q2: TypeScript 錯誤

```bash
# 執行型別檢查
npm run type-check

# 重啟 VS Code 的 TypeScript 伺服器
# VS Code Command Palette (Cmd+Shift+P) → "TypeScript: Restart TS Server"
```

#### Q3: Tailwind 樣式不生效

```bash
# 確認 Tailwind 配置正確
cat tailwind.config.js

# 重啟開發伺服器
npm run dev
```

#### Q4: API 請求 401 錯誤

```bash
# 檢查是否已登入
# 確認 sessionStorage 中有 access_token

# 檢查 Axios 攔截器設定
cat src/services/api.ts
```

---

## Next Steps

完成開發環境設置後:

1. ✅ 閱讀 [spec.md](./spec.md) 了解功能需求
2. ✅ 閱讀 [research.md](./research.md) 了解技術決策
3. ✅ 閱讀 [data-model.md](./data-model.md) 了解資料模型
4. ✅ 閱讀 [contracts/README.md](./contracts/README.md) 了解 API 契約
5. 📍 執行 `/speckit.tasks` 生成開發任務清單
6. 📍 按照 TDD 流程開始實作

---

## Resources

### Documentation

- [Vue 3 Documentation](https://vuejs.org/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)

### Project Documentation

- [Project Constitution](../../.specify/memory/constitution.md)
- [CLAUDE.md (Development Guidelines)](../../CLAUDE.md)

### Team Communication

- **Slack Channel**: #entry-development (待補充)
- **Daily Standup**: 每日 10:00 AM (待補充)
- **Code Review**: 所有 PR 需至少一位 reviewer 核准

---

## Support

如有問題,請:
1. 檢查本文件的 Troubleshooting 章節
2. 搜尋專案 GitHub Issues
3. 聯繫團隊成員 (待補充聯絡方式)

**Happy Coding! 🚀**
