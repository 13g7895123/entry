<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 頂部導航列 -->
    <nav class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <h1 class="text-xl font-semibold text-gray-900">SaaS 登入系統</h1>
          </div>
          <div class="flex items-center space-x-4">
            <span class="text-gray-700">{{ user?.displayName }}</span>
            <Button variant="outline" size="small" @click="handleLogout">
              登出
            </Button>
          </div>
        </div>
      </div>
    </nav>

    <!-- 主要內容 -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">會員頁面</h2>

        <div class="space-y-4">
          <Alert message="登入成功！歡迎使用系統" type="success" :dismissible="false" />

          <div class="border-t border-gray-200 pt-4">
            <h3 class="text-lg font-semibold text-gray-900 mb-3">使用者資訊</h3>
            <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt class="text-sm font-medium text-gray-500">使用者 ID</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ user?.id }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">帳號</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ user?.username }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">顯示名稱</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ user?.displayName }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">電子郵件</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ user?.email || '未提供' }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">角色</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ user?.role }}</dd>
              </div>
              <div v-if="user?.permissions && user.permissions.length > 0">
                <dt class="text-sm font-medium text-gray-500">權限</dt>
                <dd class="mt-1 text-sm text-gray-900">
                  {{ user.permissions.join(', ') }}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useAuth } from '@/composables/useAuth'
import Button from '@/components/Button.vue'
import Alert from '@/components/Alert.vue'

const authStore = useAuthStore()
const { logout } = useAuth()

const user = computed(() => authStore.user)

const handleLogout = async () => {
  await logout()
}
</script>
