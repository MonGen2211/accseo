export interface DirectSubmitResponse {
  domain: string;
  accepted: number;
  rejected: { url: string; reason: string }[];
  queueSize: number;
  note: string;
}

export interface DirectHistoryItem {
  _id: string;
  targetUrl: string;
  domain: string;
  status: 'pending' | 'submitted' | 'failed';
  indexingApiCalledAt?: string;
  indexingApiResponse?: string;
  indexingApiAccount?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DirectHistoryResponse {
  items: DirectHistoryItem[];
  total: number;
}
