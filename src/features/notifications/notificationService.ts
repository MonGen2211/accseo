import { fetchEventSource } from '@microsoft/fetch-event-source';
import api from '../../utils/api';
import { requestFcmToken } from '../../lib/firebase';
import { authService } from '../auth/authService';
import type { AppNotification, NotificationsResponse, UnreadCountResponse } from '../../types/notification.types';
import { API_BASE_URL } from '../../utils/constants';

let sseController: AbortController | null = null;
let savedFcmToken: string | null = null;

export const notificationService = {
  // ── FCM Token ────────────────────────────────────────────────

  /** Lấy FCM token từ browser rồi POST lên server */
  async saveFcmToken(): Promise<void> {
    try {
      const token = await requestFcmToken();
      if (!token) return;
      await api.post('/notifications/fcm-token', { token });
      savedFcmToken = token;
    } catch (err) {
      console.error('[FCM] Save token failed:', err);
    }
  },

  /** Xóa FCM token trên server khi logout */
  async deleteFcmToken(): Promise<void> {
    if (!savedFcmToken) return;
    try {
      await api.delete('/notifications/fcm-token', {
        data: { token: savedFcmToken },
      });
      savedFcmToken = null;
    } catch (err) {
      console.error('[FCM] Delete token failed:', err);
    }
  },

  // ── REST API ─────────────────────────────────────────────────

  /** Lấy danh sách thông báo (paginated) */
  async fetchNotifications(page = 1, limit = 20): Promise<NotificationsResponse> {
    const res = await api.get<NotificationsResponse>('/notifications', {
      params: { page, limit },
    });
    return res.data;
  },

  /** Lấy số thông báo chưa đọc */
  async fetchUnreadCount(): Promise<number> {
    const res = await api.get<UnreadCountResponse>('/notifications/unread-count');
    return res.data.data.count;
  },

  /** Đánh dấu 1 thông báo đã đọc */
  async markAsRead(_id: string): Promise<void> {
    await api.patch(`/notifications/${_id}/read`);
  },

  /** Đánh dấu tất cả đã đọc */
  async markAllAsRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  },

  // ── SSE Stream ───────────────────────────────────────────────

  /** Mở kết nối SSE để nhận thông báo realtime */
  connectSSE(onNotification: (notification: AppNotification) => void): void {
    this.disconnectSSE();
    sseController = new AbortController();

    fetchEventSource(`${API_BASE_URL}/notifications/stream`, {
      signal: sseController.signal,
      method: 'GET',
      headers: { Authorization: `Bearer ${authService.getAccessToken()}` },
      credentials: 'include',
      onmessage(event) {
        if (!event.data) return;
        try {
          const raw = JSON.parse(event.data);

          // Server gửi flat { _id, ... } hoặc wrapped { data: { _id, ... } }
          const nested = raw._id ? raw : raw.data;
          if (!nested || !nested.title) return;

          // Đảm bảo có _id — fallback nếu server không gửi
          const notification: AppNotification = {
            ...nested,
            _id: nested._id || `sse-${Date.now()}`,
          };

          onNotification(notification);
        } catch {
          // Bỏ qua non-JSON (ping, heartbeat)
        }
      },
      onerror(err) {
        console.error('[SSE] Error:', err);
      },
      openWhenHidden: true,
    });
  },

  /** Ngắt kết nối SSE */
  disconnectSSE(): void {
    if (sseController) {
      sseController.abort();
      sseController = null;
    }
  },
};
