import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../app/store';
import { fetchNotifications, fetchUnreadCount, addNotification, setSseConnected } from '../features/notifications/notificationSlice';
import { notificationService } from '../features/notifications/notificationService';
import { onForegroundMessage } from '../lib/firebase';
import { showNotificationToast } from '../utils/notificationToast';
import type { AppNotification } from '../types/notification.types';

/**
 * Hook quản lý lifecycle thông báo real-time.
 * Chạy trong MainLayout — kết nối SSE, FCM listener, và hiển thị toast.
 */
export function useNotifications() {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Lưu FCM token lên server
    notificationService.saveFcmToken();

    // Fetch dữ liệu ban đầu
    dispatch(fetchNotifications());
    dispatch(fetchUnreadCount());

    // Handler chung khi nhận notification mới (SSE hoặc FCM)
    const handleNewNotification = (notification: AppNotification) => {
      dispatch(addNotification(notification));
      showNotificationToast(notification);
    };

    // Kết nối SSE stream
    notificationService.connectSSE(handleNewNotification);
    dispatch(setSseConnected(true));

    // Lắng nghe Firebase foreground messages
    const unsubscribe = onForegroundMessage((payload) => {
      const { title, body } = payload.notification || {};
      if (!title) return;

      handleNewNotification({
        _id: payload.messageId || `fcm-${Date.now()}`,
        title,
        body: body || '',
        type: (payload.data?.type as AppNotification['type']) || 'system',
        isRead: false,
        createdAt: new Date().toISOString(),
        data: payload.data,
      });
    });

    return () => {
      unsubscribe();
      notificationService.disconnectSSE();
      dispatch(setSseConnected(false));
    };
  }, [isAuthenticated, dispatch]);
}
