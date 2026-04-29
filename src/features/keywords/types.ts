export interface KeywordGroup {
  id: string;
  name: string;
  domainId: string;
  createdAt?: string;
  updatedAt?: string;
  _id?: string;
}

export interface KeywordGroupDataResponse {
  items: KeywordGroup[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateKeywordGroupPayload {
  names: string[];
  domainId: string;
  aiGen?: boolean;
}

export interface SuggestAiKeywordsPayload {
  days: number;
  top: number;
  count: number;
  names?: string[];
  retry?: boolean;
  rejection_reason?: string[];
}

export interface AiSuggestedKeyword {
  name: string;
  reason?: string;
}

export interface UpdateKeywordGroupPayload {
  name?: string;
  status?: string;
}
