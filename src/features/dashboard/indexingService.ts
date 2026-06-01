import api from '../../utils/api';

export interface IndexingResult {
  jobId: string;
  url: string;
  okCount: number;
  failCount: number;
  results: {
    indexNow?: Record<string, string>;
    ping?: Record<string, string>;
  };
  note?: string;
}

export interface IndexingHistoryItem {
  _id: string;
  url: string;
  submittedBy: string;
  okCount: number;
  failCount: number;
  results: {
    indexNow?: Record<string, string>;
    ping?: Record<string, string>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IndexingHistoryResponse {
  items: IndexingHistoryItem[];
  total: number;
}

export const indexingService = {
  submitUrl: async (url: string): Promise<IndexingResult> => {
    const response = await api.post<any>('/indexing/submit', { url });
    return response.data.data;
  },

  getHistory: async (limit = 20): Promise<IndexingHistoryResponse> => {
    const response = await api.get<any>(`/indexing/history?limit=${limit}`);
    return response.data.data;
  },
};
