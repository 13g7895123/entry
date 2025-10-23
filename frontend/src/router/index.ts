// router/index.ts
// Vue Router 配置

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useLocalStorage } from '@/composables/useLocalStorage'

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
  const { isTokenExpired, clearToken } = useLocalStorage()
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  // 檢查 token 是否過期
  if (authStore.isAuthenticated && isTokenExpired()) {
    authStore.clearAuth()
    clearToken()
  }

  // 訪問需登入的頁面
  if (requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  }
  // 已登入訪問登入頁，導向 dashboard
  else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/dashboard')
  }
  // 其他情況正常通過
  else {
    next()
  }
})

export default router
