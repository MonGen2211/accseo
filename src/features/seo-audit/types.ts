export interface AuditCategory {
  key: string;
  label: string;
  score: number;
  weight: number;
  findings: string;
}

export interface AuditIssue {
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  detail: string;
  recommendation: string;
}

export interface AuditResult {
  id: string;
  url: string;
  healthScore: number;
  businessTypeGuess: string;
  summary: string;
  categories: AuditCategory[];
  issues: AuditIssue[];
  quickWins: string[];
  notAssessed: string[];
  scrapeMethod: string;
  aiProvider: string;
  aiModel: string;
  createdAt: string;
}

export interface SeoAuditHistoryResponse {
  items: AuditResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
