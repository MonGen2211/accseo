import type { AppNotification } from '../types/notification.types';

/** Event name dùng chung giữa toast trigger và toast component */
export const NOTIFICATION_TOAST_EVENT = 'accseo:notification-toast';

/** Gọi hàm này để hiển thị toast từ bất kỳ đâu (SSE, FCM, ...) */
export function showNotificationToast(notification: AppNotification) {
  window.dispatchEvent(
    new CustomEvent<AppNotification>(NOTIFICATION_TOAST_EVENT, { detail: notification })
  );
}
