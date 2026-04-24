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
  name: string;
  domainId: string;
}

export interface SuggestAiKeywordsPayload {
  days: number;
  top: number;
}

export interface UpdateKeywordGroupPayload {
  name?: string;
  status?: string;
}
