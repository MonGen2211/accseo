export interface KeywordUserRef {
  _id: string;
  name: string;
  email: string;
  imgAvatar?: string;
  role: string;
}

export interface KeywordGroup {
  id: string;
  name: string;
  domainId: string;
  createdAt?: string;
  updatedAt?: string;
  _id?: string;
  reason?: string | null;
  createdBy?: KeywordUserRef;
  approvedBy?: KeywordUserRef | null;
  approvalReason?: string | null;
}

export interface KeywordGroupSummary {
  total: number;
  pending_approval: number;
  not_started: number;
  in_progress: number;
  deployed: number;
  rejected: number;
}

export interface KeywordGroupDataResponse {
  items: KeywordGroup[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary?: KeywordGroupSummary;
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
  categories?: string[];
}

export interface SerpRelatedQuery {
  query: string;
  value: string;
  extracted_value?: number;
  link?: string;
}

export interface SerpRelatedQueriesData {
  rising?: SerpRelatedQuery[];
  top?: SerpRelatedQuery[];
}

export interface SerpTopic {
  value?: string;
  title: string;
  type: string;
}

export interface SerpRelatedTopic {
  topic: SerpTopic;
  value: string;
  extracted_value?: number;
  link?: string;
}

export interface SerpRelatedTopicsData {
  rising?: SerpRelatedTopic[];
  top?: SerpRelatedTopic[];
}

export interface TrendTimelinePoint {
  date: string;
  value: number;
  isPartial?: boolean;
}

export interface AiSuggestedKeyword {
  name: string;
  reason?: string;
  nameScore?: number;
  avg?: number;
  slope?: number;
  isSpike?: boolean;
  currentScore?: number;
  isPartial?: boolean;
  trendTimeline?: TrendTimelinePoint[];
  relatedQueries?: SerpRelatedQueriesData;
  relatedTopics?: SerpRelatedTopicsData;
}

export interface KeywordGroupTrends {
  group: string;
  currentScore: number;
  avg: number;
  slope: number;
  isSpike: boolean;
  isPartial: boolean;
  nameScore: number | null;
  trendTimeline: TrendTimelinePoint[];
  relatedQueries?: SerpRelatedQueriesData;
  relatedTopics?: SerpRelatedTopicsData;
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
  REJECTED: 'rejected',
} as const;

export type KeywordItemStatus = typeof KeywordItemStatus[keyof typeof KeywordItemStatus];

export interface KeywordItemInput {
  name: string;
  reason?: string | null;
  status?: KeywordItemStatus;
  nameScore?: number;
  currentScore?: number;
  avg?: number;
  slope?: number;
  isSpike?: boolean;
  isPartial?: boolean;
  trendTimeline?: TrendTimelinePoint[];
  relatedQueries?: SerpRelatedQueriesData;
  relatedTopics?: SerpRelatedTopicsData;
}

export interface CreateKeywordGroupItemsPayload {
  domainId: string;
  items: KeywordItemInput[];
  aiGen?: boolean;
}

export interface SuggestByTrendsLivePayload {
  count: number;
  geo?: string;
  category?: string;
}

export type StreamLogStep =
  | 'llm_start' | 'llm_done'
  | 'serp_start'
  | 'candidate_pass' | 'candidate_fail'
  | 'enrich_start'
  | 'trending_fetch' | 'trending_done' | 'trending_skip';

export interface StreamLogEvent {
  step: StreamLogStep;
  message: string;
  name?: string;
  avg?: number;
  currentScore?: number;
  passedCount?: number;
  needed?: number;
  reasons?: string[];
  candidates?: string[];
  count?: number;
  keywords?: string[];
}

export interface SuggestByGroupsPayload {
  domainId: string;
  timeRange: string;
  minScore?: number;
  count?: number;
  keywordHot?: boolean;
}

export interface GoogleAdsMonthlyVolume {
  year: number;
  month: number;
  volume: number;
}

export interface GoogleAdsKeyword {
  keyword: string;
  avgMonthlySearches: number;
  monthlySearchVolumes: GoogleAdsMonthlyVolume[];
  competition: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';
  competitionIndex: number;
  bidLow: number | null;
  bidHigh: number | null;
}

export interface GoogleAdsKeywordResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  keywords: GoogleAdsKeyword[];
}

export interface KeywordFilters {
  minVolume?: number;
  maxVolume?: number;
  competition?: string[];
  location?: string;
  language?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
