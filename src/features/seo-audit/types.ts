export interface Criterion {
  key: string;
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
}

export interface ReportSection {
  key: string;
  label: string;
  criteria: Criterion[];
}

export interface ReportSummaryStats {
  score: number;
  pass: number;
  warn: number;
  fail: number;
  total: number;
}

export interface SeoReport {
  id: string;
  url: string;
  finalUrl: string;
  score: number;
  summary: ReportSummaryStats;
  sections?: ReportSection[];
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
