import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AppNotification, NotificationState } from '../../types/notification.types';
import { notificationService } from './notificationService';

const STORAGE_KEY = 'accseo:notifications';

function loadFromStorage(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AppNotification[]) : [];
  } catch { return []; }
}

function saveToStorage(items: AppNotification[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 50)));
  } catch {}
}

const initialState: NotificationState = {
  items: loadFromStorage(),
  unreadCount: 0,
  loading: false,
  sseConnected: false,
  error: null,
};

// ── Async Thunks ───────────────────────────────────────────────

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchAll',
  async () => {
    const res = await notificationService.fetchNotifications();
    return res.data;
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async () => {
    return await notificationService.fetchUnreadCount();
  }
);

export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (_id: string) => {
    await notificationService.markAsRead(_id);
    return _id;
  }
);

export const markAllAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async () => {
    await notificationService.markAllAsRead();
  }
);

// ── Slice ──────────────────────────────────────────────────────

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification(state, action: PayloadAction<AppNotification>) {
      const incoming = action.payload;
      const DEDUP_MS = 5000;
      const isDuplicate = state.items.some((n) => {
        if (n._id === incoming._id) return true;
        const timeDiff = Math.abs(
          new Date(n.createdAt).getTime() - new Date(incoming.createdAt).getTime()
        );
        return n.title === incoming.title && n.type === incoming.type && timeDiff < DEDUP_MS;
      });
      if (!isDuplicate) {
        state.items.unshift(incoming);
        if (!incoming.isRead) state.unreadCount += 1;
        saveToStorage(state.items as AppNotification[]);
      }
    },
    setSseConnected(state, action: PayloadAction<boolean>) {
      state.sseConnected = action.payload;
    },
    resetNotifications() {
      localStorage.removeItem(STORAGE_KEY);
      return { ...initialState, items: [] };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Merge BE results with local cache: BE items win, then append local-only items
        const beIds = new Set((action.payload.items ?? []).map((n: AppNotification) => n._id));
        const localOnly = state.items.filter((n) => !beIds.has(n._id));
        state.items = [...(action.payload.items ?? []), ...localOnly];
        saveToStorage(state.items as AppNotification[]);
      })
      .addCase(fetchNotifications.rejected, (state) => {
        state.loading = false;
        state.error = 'Không thể tải thông báo. Dùng dữ liệu đã cache.';
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const item = state.items.find((n) => n._id === action.payload);
        if (item && !item.isRead) {
          item.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
          saveToStorage(state.items as AppNotification[]);
        }
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.items.forEach((n) => { n.isRead = true; });
        state.unreadCount = 0;
        saveToStorage(state.items as AppNotification[]);
      });
  },
});

export const { addNotification, setSseConnected, resetNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
