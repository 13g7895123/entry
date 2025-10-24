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
        target: 'http://localhost:9230',
        changeOrigin: true,
        secure: false
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
  // @ts-expect-error - Vite types don't include Vitest's test property
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/mocks/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/mocks/',
        '**/*.test.ts',
        '**/*.spec.ts'
      ]
    }
  }
})
