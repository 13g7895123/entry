<template>
  <form class="form-container space-y-6" @submit.prevent="handleSubmit">
    <div class="text-center mb-6 sm:mb-8">
      <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">登入</h1>
      <p class="text-sm sm:text-base text-gray-600">請輸入您的帳號密碼</p>
    </div>

    <!-- 成功訊息 -->
    <Alert
      v-if="isSuccess && successMessage"
      :message="successMessage"
      type="success"
      :dismissible="false"
    />

    <!-- 錯誤訊息 -->
    <Alert
      v-if="errorMessage && !isSuccess"
      :message="errorMessage"
      type="error"
      :dismissible="true"
    />

    <!-- 帳號欄位 -->
    <FormInput
      id="username"
      v-model="values.username"
      name="username"
      type="text"
      label="帳號"
      placeholder="請輸入帳號"
      :required="true"
      :disabled="isLoading"
      :error="errors.username"
      @blur="handleFieldBlur('username')"
    />

    <!-- 密碼欄位 -->
    <FormInput
      id="password"
      v-model="values.password"
      name="password"
      type="password"
      label="密碼"
      placeholder="請輸入密碼"
      :required="true"
      :disabled="isLoading"
      :error="errors.password"
      @blur="handleFieldBlur('password')"
    />

    <!-- 記住我 -->
    <div class="flex items-center">
      <input
        id="rememberMe"
        v-model="values.rememberMe"
        type="checkbox"
        class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
        aria-label="記住我的登入狀態"
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
import { useForm } from '@/composables/useForm'
import { loginCredentialsSchema } from '@/utils/validators'
import FormInput from './FormInput.vue'
import Button from './Button.vue'
import Alert from './Alert.vue'
import type { LoginCredentials } from '@/types/auth'

const { login, isLoading, error } = useAuth()

// 成功狀態追蹤
const isSuccess = ref(false)
const successMessage = ref('')

// 使用 useForm composable 進行表單驗證
const { values, errors, isValid, validateField, validateForm } = useForm<LoginCredentials>(
  loginCredentialsSchema,
  {
    username: '',
    password: '',
    rememberMe: false
  }
)

const errorMessage = computed(() => error.value?.message || '')

// 表單有效性：驗證通過且未在載入中
const isFormValid = computed(() => {
  console.log(isValid, isLoading.value, isSuccess.value)
  return isValid && !isLoading.value && !isSuccess.value
})

/**
 * 處理欄位失焦事件
 * 觸發即時驗證
 */
const handleFieldBlur = (fieldName: keyof LoginCredentials) => {
  validateField(fieldName)
}

/**
 * 處理表單提交
 */
const handleSubmit = async () => {
  // 先驗證整個表單
  const valid = await validateForm()

  if (!valid) {
    return
  }

  try {
    const result = await login(values)

    if (result.success) {
      // 顯示成功訊息
      isSuccess.value = true
      successMessage.value = '登入成功！正在跳轉...'

      // 成功訊息會在導向前短暫顯示
      // 實際導向由 useAuth 的 login 函式處理
    }
  } catch (err) {
    // 錯誤已在 useAuth 中處理
    console.error('Login error:', err)
    isSuccess.value = false
  }
}
</script>
