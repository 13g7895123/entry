// stores/applications.ts
// Pinia 應用程式狀態管理

import { defineStore } from 'pinia'
import type { Application } from '@/types/application'
import { APPLICATIONS } from '@/data/applications'

export interface ApplicationsState {
  applications: Application[]
  isLoading: boolean
  error: string | null
}

export const useApplicationsStore = defineStore('applications', {
  state: (): ApplicationsState => ({
    applications: [],
    isLoading: false,
    error: null,
  }),

  getters: {
    /**
     * 取得所有應用程式（依 order 排序）
     */
    allApplications: (state): Application[] => {
      return [...state.applications].sort((a, b) => a.order - b.order)
    },

    /**
     * 取得可用的應用程式
     */
    availableApplications: (state): Application[] => {
      return state.applications.filter((app) => app.isAvailable)
    },

    /**
     * 根據 code 取得應用程式
     */
    getApplicationByCode: (state) => {
      return (code: string): Application | undefined => {
        return state.applications.find((app) => app.code === code)
      }
    },

    /**
     * 根據 id 取得應用程式
     */
    getApplicationById: (state) => {
      return (id: string): Application | undefined => {
        return state.applications.find((app) => app.id === id)
      }
    },
  },

  actions: {
    /**
     * 載入應用程式列表
     * 目前使用靜態資料，未來可擴展為從 API 獲取
     */
    async loadApplications() {
      this.isLoading = true
      this.error = null

      try {
        // 模擬非同步載入（未來可替換為 API 呼叫）
        await new Promise((resolve) => setTimeout(resolve, 100))

        this.applications = APPLICATIONS
      } catch (error: any) {
        this.error = error.message || '載入應用程式列表失敗'
        console.error('載入應用程式列表失敗:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 初始化應用程式列表（同步載入靜態資料）
     */
    initializeApplications() {
      this.applications = APPLICATIONS
    },

    /**
     * 清除錯誤訊息
     */
    clearError() {
      this.error = null
    },
  },
})
