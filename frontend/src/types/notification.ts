/**
 * Notification Type Definitions
 * 通知型別定義
 *
 * 定義通知面板顯示的通知訊息資料結構
 */

/**
 * 通知類型
 */
export type NotificationType = 'info' | 'warning' | 'success' | 'error'

/**
 * 通知介面
 *
 * 代表通知面板顯示的通知訊息
 */
export interface Notification {
  /** 通知唯一識別碼 */
  id: string

  /** 通知標題 */
  title: string

  /** 通知訊息內容 */
  message: string

  /** 通知類型 (決定圖示和顏色) */
  type: NotificationType

  /** 建立時間 (ISO 8601 格式) */
  createdAt: string

  /** 是否已讀 */
  isRead: boolean

  /** 可選的連結 (點擊通知導向的路徑) */
  link?: string

  /** 可選的元數據 (未來擴展用) */
  metadata?: Record<string, any>
}

/**
 * 通知 API 回應介面
 */
export interface NotificationResponse {
  /** 通知列表 */
  notifications: Notification[]

  /** 未讀通知數量 */
  unreadCount: number

  /** 總通知數量 */
  totalCount: number
}
