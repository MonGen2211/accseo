import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { ArticleState, ArticleFormData } from '../../types/article.types';
import { articleService } from './articleService';

const initialState: ArticleState = {
  articles: [],
  selectedArticle: null,
  loading: false,
  error: null,
  pagination: { page: 1, limit: 10, total: 0 },
};

export const fetchArticles = createAsyncThunk('articles/fetchAll', async (_, { rejectWithValue }) => {
  try {
    return await articleService.getAll();
  } catch (err) {
    return rejectWithValue((err as Error).message);
  }
});

export const createArticle = createAsyncThunk(
  'articles/create',
  async (data: ArticleFormData, { rejectWithValue }) => {
    try {
      return await articleService.create(data);
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

export const updateArticle = createAsyncThunk(
  'articles/update',
  async ({ id, data }: { id: string; data: ArticleFormData }, { rejectWithValue }) => {
    try {
      return await articleService.update(id, data);
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

export const deleteArticle = createAsyncThunk(
  'articles/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await articleService.remove(id);
      return id;
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

const articleSlice = createSlice({
  name: 'articles',
  initialState,
  reducers: {
    setSelectedArticle(state, action) {
      state.selectedArticle = action.payload;
    },
    clearSelectedArticle(state) {
      state.selectedArticle = null;
    },
    clearArticleError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchArticles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchArticles.fulfilled, (state, action) => {
        state.loading = false;
        state.articles = action.payload;
        state.pagination.total = action.payload.length;
      })
      .addCase(fetchArticles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createArticle.fulfilled, (state, action) => {
        state.articles.unshift(action.payload);
        state.pagination.total += 1;
      })
      .addCase(updateArticle.fulfilled, (state, action) => {
        const idx = state.articles.findIndex((a) => a.id === action.payload.id);
        if (idx !== -1) state.articles[idx] = action.payload;
      })
      .addCase(deleteArticle.fulfilled, (state, action) => {
        state.articles = state.articles.filter((a) => a.id !== action.payload);
        state.pagination.total -= 1;
      });
  },
});

export const { setSelectedArticle, clearSelectedArticle, clearArticleError } = articleSlice.actions;
export default articleSlice.reducer;
