// ─── GSC Overview ──────────────────────────────────────────────────────────
export interface GscOverviewSummary {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  totalKeywords: number;
  totalPages: number;
}

export interface GscOverviewData {
  startDate: string;
  endDate: string;
  summary: GscOverviewSummary;
}

// ─── GSC Keywords ──────────────────────────────────────────────────────────
export interface GscKeywordItem {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscKeywordsData {
  items: GscKeywordItem[];
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

// ─── GSC Pages ─────────────────────────────────────────────────────────────
export interface GscPageItem {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscPagesData {
  items: GscPageItem[];
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

// ─── Date Range ────────────────────────────────────────────────────────────
export type GscDateRange = 7 | 28 | 90;
export type GscContentTab = 'overview' | 'keywords' | 'pages';
