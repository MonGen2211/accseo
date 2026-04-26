export type NotificationType = 'article' | 'schedule' | 'system' | 'sync' | 'change';

export interface AppNotification {
  _id: string;
  title: string;
  body: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, string>;
}

export interface NotificationsResponse {
  statusCode: number;
  data: {
    items: AppNotification[];
    total: number;
    page: number;
    limit: number;
  };
}

export interface UnreadCountResponse {
  statusCode: number;
  data: {
    count: number;
  };
}

export interface NotificationState {
  items: AppNotification[];
  unreadCount: number;
  loading: boolean;
  sseConnected: boolean;
}
