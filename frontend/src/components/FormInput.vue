<template>
  <div class="mb-4">
    <label v-if="label" :for="id" class="block text-sm font-medium text-gray-700 mb-2">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <div class="relative">
      <input
        :id="id"
        :type="inputType"
        :name="name"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :aria-label="label || placeholder"
        :aria-describedby="error ? `${id}-error` : undefined"
        :aria-invalid="!!error"
        :class="inputClasses"
        class="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
        @input="onInput"
        @blur="$emit('blur')"
      />

      <!-- 密碼顯示/隱藏切換按鈕 -->
      <button
        v-if="type === 'password'"
        type="button"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
        @click="togglePasswordVisibility"
      >
        {{ showPassword ? '👁' : '👁‍🗨' }}
      </button>
    </div>

    <!-- 錯誤訊息 -->
    <p v-if="error" :id="`${id}-error`" class="mt-2 text-sm text-red-600" role="alert">
      {{ error }}
    </p>

    <!-- 提示訊息 -->
    <p v-else-if="hint" class="mt-2 text-sm text-gray-500">
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  id: string
  name: string
  label?: string
  type?: 'text' | 'email' | 'password' | 'number'
  modelValue?: string | number
  placeholder?: string
  disabled?: boolean
  required?: boolean
  error?: string
  hint?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  modelValue: '',
  disabled: false,
  required: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: []
}>()

const showPassword = ref(false)

const inputType = computed(() => {
  if (props.type === 'password') {
    return showPassword.value ? 'text' : 'password'
  }
  return props.type
})

const inputClasses = computed(() => {
  const base = 'text-base'
  const errorClass = props.error
    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
    : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
  const disabledClass = props.disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'

  return `${base} ${errorClass} ${disabledClass}`
})

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}
</script>
