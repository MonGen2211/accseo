export type NotificationType =
  | 'article' | 'schedule' | 'system' | 'sync' | 'change'
  | 'REQUEST_ASSIGNED' | 'REQUEST_CLAIMED' | 'REQUEST_DONE'
  | 'REQUEST_REJECTED' | 'REQUEST_CANCELLED' | 'REQUEST_REMINDER' | 'REQUEST_REASSIGNED'
  | 'VBPL_AUTO_EXPORT_DISABLED';

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
  error: string | null;
}
