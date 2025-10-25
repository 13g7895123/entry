import api from './api'
import type { NotificationResponse } from '@/types/notification'

/**
 * Notification Service
 *
 * 處理所有通知相關的 API 呼叫
 */
class NotificationService {
  /**
   * 獲取通知列表
   *
   * @param limit 限制返回的通知數量（預設為 5）
   * @returns 通知列表和未讀數量
   */
  async fetchNotifications(limit: number = 5): Promise<NotificationResponse> {
    const response = await api.get<NotificationResponse>('/notifications', {
      params: { limit }
    })
    return response.data
  }

  /**
   * 標記通知為已讀
   *
   * @param notificationId 通知 ID
   * @returns 操作結果
   */
  async markAsRead(notificationId: string): Promise<void> {
    await api.post(`/notifications/${notificationId}/read`)
  }

  /**
   * 標記所有通知為已讀
   *
   * @returns 操作結果
   */
  async markAllAsRead(): Promise<void> {
    await api.post('/notifications/read-all')
  }
}

// Export singleton instance
export default new NotificationService()
