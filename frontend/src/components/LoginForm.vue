<template>
  <form class="w-full max-w-md space-y-6" @submit.prevent="handleSubmit">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">登入</h1>
      <p class="text-gray-600">請輸入您的帳號密碼</p>
    </div>

    <!-- 錯誤訊息 -->
    <Alert
      v-if="errorMessage"
      :message="errorMessage"
      type="error"
      :dismissible="true"
    />

    <!-- 帳號欄位 -->
    <FormInput
      id="username"
      v-model="formData.username"
      name="username"
      type="text"
      label="帳號"
      placeholder="請輸入帳號"
      :required="true"
      :disabled="isLoading"
    />

    <!-- 密碼欄位 -->
    <FormInput
      id="password"
      v-model="formData.password"
      name="password"
      type="password"
      label="密碼"
      placeholder="請輸入密碼"
      :required="true"
      :disabled="isLoading"
    />

    <!-- 記住我 -->
    <div class="flex items-center">
      <input
        id="rememberMe"
        v-model="formData.rememberMe"
        type="checkbox"
        class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
      />
      <label for="rememberMe" class="ml-2 block text-sm text-gray-700">
        記住我
      </label>
    </div>

    <!-- 登入按鈕 -->
    <Button
      type="submit"
      variant="primary"
      size="large"
      :loading="isLoading"
      :disabled="!isFormValid"
      :full-width="true"
      loading-text="登入中..."
    >
      登入
    </Button>
  </form>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'
import FormInput from './FormInput.vue'
import Button from './Button.vue'
import Alert from './Alert.vue'
import type { LoginCredentials } from '@/types/auth'

const { login, isLoading, error } = useAuth()

const formData = ref<LoginCredentials>({
  username: '',
  password: '',
  rememberMe: false
})

const errorMessage = computed(() => error.value?.message || '')

const isFormValid = computed(() => {
  return (
    formData.value.username.trim().length >= 3 &&
    formData.value.password.length >= 6 &&
    !isLoading.value
  )
})

const handleSubmit = async () => {
  if (!isFormValid.value) return

  try {
    await login(formData.value)
  } catch (err) {
    // 錯誤已在 useAuth 中處理
    console.error('Login error:', err)
  }
}
</script>
