<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="buttonClasses"
    class="px-6 py-3 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
  >
    <span v-if="loading" class="inline-block animate-spin mr-2">⟳</span>
    <slot>{{ loading ? loadingText : '' }}</slot>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'outline' | 'danger'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  loading?: boolean
  loadingText?: string
  fullWidth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'button',
  variant: 'primary',
  size: 'medium',
  disabled: false,
  loading: false,
  loadingText: '載入中...',
  fullWidth: false
})

const buttonClasses = computed(() => {
  const base = 'inline-flex items-center justify-center'

  // 變體樣式
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
    outline:
      'bg-transparent hover:bg-gray-50 text-primary-600 border-2 border-primary-600 focus:ring-primary-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
  }

  // 尺寸樣式
  const sizes = {
    small: 'text-sm px-4 py-2',
    medium: 'text-base px-6 py-3',
    large: 'text-lg px-8 py-4'
  }

  // 禁用樣式
  const disabledClass =
    props.disabled || props.loading
      ? 'opacity-50 cursor-not-allowed'
      : 'cursor-pointer'

  // 全寬樣式
  const widthClass = props.fullWidth ? 'w-full' : ''

  return `${base} ${variants[props.variant]} ${sizes[props.size]} ${disabledClass} ${widthClass}`
})
</script>
