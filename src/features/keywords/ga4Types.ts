// ─── GA4 Overview ──────────────────────────────────────────────────────────
export interface Ga4OverviewSummary {
  sessions: number;
  activeUsers: number;
  screenPageViews: number;
  conversions: number;
  totalPages: number;
}

export interface Ga4OverviewTrend {
  sessions: number;
  activeUsers: number;
  screenPageViews: number;
  date: string;
}

export interface Ga4OverviewData {
  startDate: string;
  endDate: string;
  summary: Ga4OverviewSummary;
  trend: Ga4OverviewTrend[];
}

// ─── GA4 Pages ─────────────────────────────────────────────────────────────
export interface Ga4PageItem {
  pagePath: string;
  sessions: number;
  activeUsers: number;
  screenPageViews: number;
  conversions: number;
  engagedSessions: number;
}

export interface Ga4PagesData {
  items: Ga4PageItem[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

// ─── Config ────────────────────────────────────────────────────────────────
export type Ga4DateRange = 7 | 28 | 90;
export type Ga4ContentTab = 'overview' | 'pages';
export type Ga4SortField = 'sessions' | 'activeUsers' | 'screenPageViews' | 'conversions' | 'engagedSessions';
