/**
 * Application Type Definitions
 * 應用程式型別定義
 *
 * 定義應用程式中心顯示的應用程式卡片資料結構
 */

/**
 * 應用程式代碼
 */
export type ApplicationCode = 'crm' | 'erp' | 'ecommerce' | 'resume' | 'settings'

/**
 * 應用程式介面
 *
 * 代表應用程式中心顯示的可用應用程式
 */
export interface Application {
  /** 唯一識別碼 */
  id: string

  /** 應用程式名稱 (繁體中文) */
  name: string

  /** 應用程式英文代碼 (用於路由和圖示檔名) */
  code: ApplicationCode

  /** 圖示路徑 (相對於 assets/images/app-icons/) */
  iconPath: string

  /** 點擊後導向的路由路徑 */
  routePath: string

  /** 應用程式是否已開發完成 */
  isAvailable: boolean

  /** 顯示順序 (用於排序) */
  order: number

  /** 應用程式描述 (可選，未來擴展用) */
  description?: string

  /** Fallback 顏色 (圖片載入失敗時的背景色) */
  fallbackColor: string
}
