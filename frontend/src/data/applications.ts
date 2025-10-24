/**
 * Static Application Data
 * 靜態應用程式資料
 *
 * 定義應用程式中心顯示的 5 個應用程式
 */

import type { Application } from '@/types/application'

/**
 * 應用程式列表 (靜態資料)
 *
 * 包含 CRM、ERP、Ecommerce、Resume、設定 5 個應用程式
 * 本階段為靜態資料，未來可擴展為從後端 API 獲取
 */
export const APPLICATIONS: Application[] = [
  {
    id: 'app-crm',
    name: 'CRM',
    code: 'crm',
    iconPath: '/app-icons/crm.svg',
    routePath: '/crm',
    isAvailable: false, // 未開發，導向 /coming-soon
    order: 1,
    description: '客戶關係管理系統',
    fallbackColor: '#3B82F6' // blue-500
  },
  {
    id: 'app-erp',
    name: 'ERP',
    code: 'erp',
    iconPath: '/app-icons/erp.svg',
    routePath: '/erp',
    isAvailable: false,
    order: 2,
    description: '企業資源規劃系統',
    fallbackColor: '#10B981' // green-500
  },
  {
    id: 'app-ecommerce',
    name: 'Ecommerce',
    code: 'ecommerce',
    iconPath: '/app-icons/ecommerce.svg',
    routePath: '/ecommerce',
    isAvailable: false,
    order: 3,
    description: '電子商務平台',
    fallbackColor: '#F59E0B' // amber-500
  },
  {
    id: 'app-resume',
    name: 'Resume',
    code: 'resume',
    iconPath: '/app-icons/resume.svg',
    routePath: '/resume',
    isAvailable: false,
    order: 4,
    description: '履歷管理系統',
    fallbackColor: '#8B5CF6' // violet-500
  },
  {
    id: 'app-settings',
    name: '設定',
    code: 'settings',
    iconPath: '/app-icons/settings.svg',
    routePath: '/settings',
    isAvailable: true, // 設定頁面可用
    order: 5,
    description: '系統設定',
    fallbackColor: '#6B7280' // gray-500
  }
]
