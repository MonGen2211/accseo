export interface FixGuide {
  summary?: string;
  example?: string;
  whereToChange?: string[];
  commonCauses?: string[];
  bestPractices?: string[];
}

export interface Criterion {
  key: string;
  name: string;
  importance: 'critical' | 'medium' | 'low' | 'reference';
  importanceLabel: string;
  weight: number;
  status: 'pass' | 'warn' | 'fail';
  description: string;
  message: string;
  recommendation?: string;
  fixGuide?: FixGuide | null;
  evidence?: any | null;
}

export interface ReportSection {
  key: string;
  label: string;
  pass: number;
  warn: number;
  fail: number;
  total: number;
  criteria: Criterion[];
}

export interface ReportSummaryStats {
  score: number;
  pass: number;
  warn: number;
  fail: number;
  total: number;
}

export interface SeoReportMetrics {
  ttfbMs: number | null;
  fcpMs: number | null;
  lcpMs: number | null;
  cls: number | null;
  loadMs: number | null;
  totalRequests: number;
  totalBytes: number;
  domNodes: number;
}

export interface SeoReport {
  id: string;
  url: string;
  finalUrl?: string;
  score: number;
  summary: ReportSummaryStats;
  sections?: ReportSection[];
  metrics?: SeoReportMetrics;
  responseMs?: number;
  createdAt: string;
}

export interface SeoAuditHistoryResponse {
  items: SeoReport[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
