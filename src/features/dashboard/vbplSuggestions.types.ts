export interface KeywordSet {
  base: string;
  variations: string[];
}

export interface ArticleSuggestion {
  _id: string;
  title: string;
  url: string;
  docNumber: string | null;
  issuingAgency: string | null;
  publishedAt: string | null;
  effectiveDate: string | null;
  docType: string | null;
  isAmendment: boolean;
  keywords: KeywordSet[];
}

export interface Cluster {
  linhVuc: string;
  docCount: number;
  agencies: string[];
  docTypes: string[];
  latestDate: string | null;
  articles: ArticleSuggestion[];
}

export interface VbplSuggestionFilters {
  days?: number;
  limit?: number;
  linhVuc?: string;
  agency?: string;
}

export interface VbplKeywordsResponse {
  fromDate: string;       // ISO
  toDate: string;         // ISO
  totalArticles: number;  // số văn bản đã quét
  keywords?: string[];     // New flat shape
  clusters?: Cluster[];   // Old grouped shape
  uncategorized?: ArticleSuggestion[]; // Old grouped shape
}

export interface TrendingKeywordsResponse {
  geo: string;
  hours: number;
  fetchedDate: string;
  fetchedAt: string;
  categoryIds: string[];
  total: number;
  keywords: string[];
}

export interface PublicTrendScrapeDetail {
  success: boolean;
  currentScore?: number | null;
  avg?: number | null;
  slope?: number | null;
  isSpike?: boolean | null;
  trendTimeline?: Array<{ date: string; value: number }>;
  failReasons?: string[];
}

export interface PublicTrendSuggestionItem {
  name: string;
  hotKeyword: string;
  reason: string;
  position: number | null;
  searchVolume: number | null;
  increasePercentage: number | null;
  categories: string[];
  scrape?: PublicTrendScrapeDetail;
}

export interface PublicTrendSuggestionsResponse {
  fetchedDate: string;
  fetchedAt: string;
  categoryIds: string[];
  trendingKeywordsCount: number;
  timeRange: string;
  total: number;
  suggestions: PublicTrendSuggestionItem[];
  savedId?: string;
}

export interface PublicTrendDateItem {
  fetchedDate: string;
  fetchedAt: string;
  id: string;
  count: number;
}

export interface PublicTrendDatesResponse {
  today: string;
  hasToday: boolean;
  todaySnapshot: { id: string; fetchedAt: string; count: number } | null;
  total: number;
  dates: PublicTrendDateItem[];
}

export interface CustomTrendScrapeDetail {
  success: boolean;
  currentScore?: number | null;
  avg?: number | null;
  slope?: number | null;
  isSpike?: boolean | null;
  trendTimeline?: Array<{ date: string; value: number }>;
  failReasons?: string[];
}

export interface CustomTrendSuggestionItem {
  name: string;
  sourceKeyword: string;
  reason: string;
  scrape?: CustomTrendScrapeDetail;
}

export interface CustomTrendSnapshotResponse {
  _id: string;
  name: string;
  baseName: string;
  description: string;
  inputKeywords: string[];
  count: number;
  timeRange: string;
  fetchedAt: string;
  suggestions: CustomTrendSuggestionItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomTrendSnapshotSummary {
  id: string;
  name: string;
  baseName: string;
  description: string;
  count: number;
  timeRange: string;
  fetchedAt: string;
  inputKeywordsCount: number;
  suggestionsCount: number;
}

export interface CustomTrendPaginationResponse {
  items: CustomTrendSnapshotSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export interface CustomProjectGroup {
  baseName: string;
  snapshots: CustomTrendSnapshotSummary[];
  latestId: string;
}

export interface AiExpandKeywordsRequest {
  keywords: string[];
  perSeed?: number;
  page?: number;
  limit?: number;
  minVolume?: number;
  maxVolume?: number;
  competition?: string[];
  location?: string;
  language?: string;
  sortOrder?: 'asc' | 'desc';
  refresh?: boolean;
}

export interface MonthlySearchVolume {
  year: number;
  month: number;
  volume: number;
}

export interface AiExpandKeywordItem {
  keyword: string;
  avgMonthlySearches: number;
  monthlySearchVolumes: MonthlySearchVolume[];
  competition: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';
  competitionIndex: number;
  bidLow: number | null;
  bidHigh: number | null;
}

export interface AiExpandKeywordsResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  generated: number;
  keywords: AiExpandKeywordItem[];
}



