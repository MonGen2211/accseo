import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AppNotification, NotificationState } from '../../types/notification.types';
import { notificationService } from './notificationService';

const initialState: NotificationState = {
  items: [],
  unreadCount: 0,
  loading: false,
  sseConnected: false,
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
      const exists = state.items.some((n) => n._id === action.payload._id);
      if (!exists) {
        state.items.unshift(action.payload);
        if (!action.payload.isRead) {
          state.unreadCount += 1;
        }
      }
    },
    setSseConnected(state, action: PayloadAction<boolean>) {
      state.sseConnected = action.payload;
    },
    resetNotifications() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
      })
      .addCase(fetchNotifications.rejected, (state) => {
        state.loading = false;
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const item = state.items.find((n) => n._id === action.payload);
        if (item && !item.isRead) {
          item.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.items.forEach((n) => { n.isRead = true; });
        state.unreadCount = 0;
      });
  },
});

export const { addNotification, setSseConnected, resetNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
