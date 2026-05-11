import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { requestService } from './requestService';
import type { RequestState, CreateRequestPayload, ResolvePayload, ReassignPayload } from './types';
import type { RequestFilterParams } from './requestService';

const initialState: RequestState = {
  inbox: [],
  outbox: [],
  current: null,
  auditLogs: [],
  loading: false,
  actionLoading: false,
  inboxTotal: 0,
  inboxPages: 1,
  outboxTotal: 0,
  outboxPages: 1,
  error: null,
};

export const fetchInbox = createAsyncThunk('requests/fetchInbox', async (params: RequestFilterParams, { rejectWithValue }) => {
  try {
    return await requestService.getInbox(params);
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } };
    return rejectWithValue(e.response?.data?.message ?? 'Lỗi tải inbox');
  }
});

export const fetchOutbox = createAsyncThunk('requests/fetchOutbox', async (params: RequestFilterParams, { rejectWithValue }) => {
  try {
    return await requestService.getOutbox(params);
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } };
    return rejectWithValue(e.response?.data?.message ?? 'Lỗi tải outbox');
  }
});

export const fetchRequestById = createAsyncThunk('requests/fetchById', async (id: string, { rejectWithValue }) => {
  try {
    return await requestService.getById(id);
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } };
    return rejectWithValue(e.response?.data?.message ?? 'Lỗi tải request');
  }
});

export const fetchAuditLogs = createAsyncThunk('requests/fetchAuditLogs', async (id: string, { rejectWithValue }) => {
  try {
    return await requestService.getAuditLogs(id);
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } };
    return rejectWithValue(e.response?.data?.message ?? 'Lỗi tải lịch sử');
  }
});

export const createRequest = createAsyncThunk('requests/create', async (data: CreateRequestPayload, { rejectWithValue }) => {
  try {
    return await requestService.create(data);
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string; code?: string; errorCode?: string } } };
    const code = e.response?.data?.code ?? e.response?.data?.errorCode ?? '';
    if (code === 'NO_MEMBERS') return rejectWithValue('Nhóm/vai trò không có thành viên nào');
    return rejectWithValue(e.response?.data?.message ?? 'Lỗi tạo request');
  }
});

export const claimRequest = createAsyncThunk('requests/claim', async (id: string, { rejectWithValue }) => {
  try {
    return await requestService.claim(id);
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } };
    return rejectWithValue(e.response?.data?.message ?? 'Lỗi nhận việc');
  }
});

export const resolveRequest = createAsyncThunk('requests/resolve', async ({ id, data }: { id: string; data: ResolvePayload }, { rejectWithValue }) => {
  try {
    return await requestService.resolve(id, data);
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string; code?: string; errorCode?: string } } };
    const code = e.response?.data?.code ?? e.response?.data?.errorCode ?? '';
    if (code === 'REQUEST_ALREADY_RESOLVED') return rejectWithValue('Yêu cầu này đã được xử lý rồi');
    if (code === 'REQUEST_TERMINAL') return rejectWithValue('Yêu cầu đã ở trạng thái kết thúc');
    return rejectWithValue(e.response?.data?.message ?? 'Lỗi xử lý request');
  }
});

export const cancelRequest = createAsyncThunk('requests/cancel', async (id: string, { rejectWithValue }) => {
  try {
    return await requestService.cancel(id);
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string; code?: string; errorCode?: string } } };
    const code = e.response?.data?.code ?? e.response?.data?.errorCode ?? '';
    if (code === 'CANNOT_CANCEL') return rejectWithValue('Không thể huỷ yêu cầu đã kết thúc');
    return rejectWithValue(e.response?.data?.message ?? 'Lỗi huỷ request');
  }
});

export const reassignRequest = createAsyncThunk('requests/reassign', async ({ id, data }: { id: string; data: ReassignPayload }, { rejectWithValue }) => {
  try {
    return await requestService.reassign(id, data);
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string; code?: string; errorCode?: string } } };
    const code = e.response?.data?.code ?? e.response?.data?.errorCode ?? '';
    if (code === 'REASSIGN_TERMINAL') return rejectWithValue('Không thể chuyển người khi yêu cầu đã kết thúc');
    return rejectWithValue(e.response?.data?.message ?? 'Lỗi reassign request');
  }
});

const requestSlice = createSlice({
  name: 'requests',
  initialState,
  reducers: {
    clearCurrent(state) {
      state.current = null;
      state.auditLogs = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInbox.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchInbox.fulfilled, (state, action) => {
        state.loading = false;
        state.inbox = action.payload.items;
        state.inboxTotal = action.payload.total;
        state.inboxPages = action.payload.totalPages;
      })
      .addCase(fetchInbox.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })

      .addCase(fetchOutbox.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchOutbox.fulfilled, (state, action) => {
        state.loading = false;
        state.outbox = action.payload.items;
        state.outboxTotal = action.payload.total;
        state.outboxPages = action.payload.totalPages;
      })
      .addCase(fetchOutbox.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })

      .addCase(fetchRequestById.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchRequestById.fulfilled, (state, action) => { state.loading = false; state.current = action.payload; })
      .addCase(fetchRequestById.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })

      .addCase(fetchAuditLogs.fulfilled, (state, action) => { state.auditLogs = action.payload; })

      .addCase(createRequest.pending, (state) => { state.actionLoading = true; })
      .addCase(createRequest.fulfilled, (state) => { state.actionLoading = false; })
      .addCase(createRequest.rejected, (state) => { state.actionLoading = false; })

      .addCase(claimRequest.pending, (state) => { state.actionLoading = true; })
      .addCase(claimRequest.fulfilled, (state, action) => { state.actionLoading = false; state.current = action.payload; })
      .addCase(claimRequest.rejected, (state) => { state.actionLoading = false; })

      .addCase(resolveRequest.pending, (state) => { state.actionLoading = true; })
      .addCase(resolveRequest.fulfilled, (state, action) => { state.actionLoading = false; state.current = action.payload; })
      .addCase(resolveRequest.rejected, (state) => { state.actionLoading = false; })

      .addCase(cancelRequest.pending, (state) => { state.actionLoading = true; })
      .addCase(cancelRequest.fulfilled, (state, action) => { state.actionLoading = false; state.current = action.payload; })
      .addCase(cancelRequest.rejected, (state) => { state.actionLoading = false; })

      .addCase(reassignRequest.pending, (state) => { state.actionLoading = true; })
      .addCase(reassignRequest.fulfilled, (state, action) => { state.actionLoading = false; state.current = action.payload; })
      .addCase(reassignRequest.rejected, (state) => { state.actionLoading = false; });
  },
});

export const { clearCurrent } = requestSlice.actions;
export default requestSlice.reducer;
