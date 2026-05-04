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
  retry?: boolean;
  rejection_reason?: string[];
  categories?: string[];
}

export interface AiSuggestedKeyword {
  name: string;
  reason?: string;
  expandExample?: string;
}

export interface UpdateKeywordGroupPayload {
  name?: string;
  status?: string;
}

export const KeywordItemStatus = {
  PENDING_APPROVAL: 'pending_approval',
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  DEPLOYED: 'deployed',
} as const;

export type KeywordItemStatus = typeof KeywordItemStatus[keyof typeof KeywordItemStatus];

export interface KeywordItemInput {
  name: string;
  reason?: string;
  status?: KeywordItemStatus;
}

export interface CreateKeywordGroupItemsPayload {
  domainId: string;
  items: KeywordItemInput[];
}
