<template>
  <div
    v-if="visible"
    :class="alertClasses"
    role="alert"
    class="rounded-lg p-4 mb-4 flex items-center justify-between"
  >
    <div class="flex items-center">
      <span :class="iconClasses" class="mr-3">
        {{ icon }}
      </span>
      <p class="text-sm font-medium">{{ message }}</p>
    </div>
    <button
      v-if="dismissible"
      type="button"
      class="ml-4 text-current opacity-50 hover:opacity-100"
      @click="dismiss"
    >
      ✕
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  dismissible?: boolean
  autoClose?: number
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  dismissible: true,
  autoClose: 0
})

const visible = ref(true)
let timeout: ReturnType<typeof setTimeout> | null = null

const alertClasses = computed(() => {
  const baseClasses = 'transition-all duration-300'
  const typeClasses = {
    success: 'bg-green-100 text-green-800 border border-green-300',
    error: 'bg-red-100 text-red-800 border border-red-300',
    warning: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    info: 'bg-blue-100 text-blue-800 border border-blue-300'
  }
  return `${baseClasses} ${typeClasses[props.type]}`
})

const iconClasses = computed(() => {
  const typeClasses = {
    success: 'text-green-600',
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600'
  }
  return typeClasses[props.type]
})

const icon = computed(() => {
  const icons = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ'
  }
  return icons[props.type]
})

const dismiss = () => {
  visible.value = false
  if (timeout) {
    clearTimeout(timeout)
  }
}

// 自動關閉
watch(
  () => props.autoClose,
  (duration) => {
    if (duration > 0) {
      timeout = setTimeout(() => {
        dismiss()
      }, duration)
    }
  },
  { immediate: true }
)

// 重置 visible 當 message 改變
watch(
  () => props.message,
  () => {
    visible.value = true
  }
)
</script>
