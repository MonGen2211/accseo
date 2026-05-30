export interface ScraperArticle {
  _id: string;
  title: string;
  url: string;
  source: string;
  section: string;
  tags?: string[];
  category?: string[];
  publishedAt: string | null;
  subTime?: string | null;
  dateStr?: string | null;
  createdAt: string;
  description?: string | null;
  breadcrumb?: string[] | null;
  excerpt?: string | null;
  thumbnailUrl?: string | null;
  metadata?: {
    docNumber?: string;
    issuedDate?: string;
    issuingAgency?: string;
    effectiveDate?: string;
    linhVuc?: string;
    scope?: string | null;
    effStatus?: string | null;
    effStatusCode?: string | null;
    nganh?: string;
    nganhs?: string[];
    linhVucs?: string[];
    docType?: string;
    docTypeCode?: string;
    expiredDate?: string | null;
    publicDate?: string | null;
    updatedDate?: string;
    signer?: string;
    signerTitle?: string;
    signers?: { name: string; title: string; agency?: string }[];
    organizationName?: string;
    organizationType?: string;
    pdfFileName?: string | null;
    language?: string;
    viewCount?: number;
    publishStatus?: string;
    isAdministrative?: boolean;
    isConsolidated?: boolean;
    isConstitutional?: boolean;
    isEffectAll?: boolean;
    isLegalDoc?: boolean;
    isOld?: boolean;
    isTranslation?: boolean;
    hasContent?: boolean;
    hasOriginalPdf?: boolean | null;
    hasAIProcessed?: boolean;
  } | null;
  relatedUrls?: string[] | null;
  firstSeenAt?: string | null;
  isNew?: boolean;
  aiGenerated?: boolean;
  aiResult?: AiResultSchema | null;
  aiGeneratedAt?: string | null;
  aiModel?: string | null;
  sheetUrl?: string | null;
  sheetPushedAt?: string | null;
  sheetLastBatch?: number | null;
}

export interface AiGenerateResultData {
  sheetUrl: string;
  sheetPushedAt: string;
  batchNumber: number;
  keywordCount: number;
}

export interface AiGenerateResponseData {
  message: string;
  cached: boolean;
  data: AiGenerateResultData;
}

export interface AiResultResponseData {
  sheetUrl: string | null;
  sheetPushedAt: string | null;
  sheetLastBatch: number | null;
}

export interface AiResultTopic {
  name: string;
  targetAudience: string;
  insight: string;
  keywords: string[];
}

export interface AiResultSchema {
  topics: AiResultTopic[];
}

export interface GetArticlesParams {
  source?: string;
  section?: string;
  tag?: string;
  date?: string;
  q?: string;
  onlyNew?: boolean;
  page?: number;
  limit?: number;
  scope?: string;
  effStatusCode?: string;
  startDate?: string;
  endDate?: string;
  nganh?: string;
  linhVuc?: string;
  docTypeCode?: string;
  sheetStatus?: string;
}

export interface GetArticlesResponse {
  items: ScraperArticle[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ScraperSummary {
  total: number;
  bySection: Record<string, number>;
  topTags: { name: string; count: number }[];
  topCategories: { name: string; count: number }[];
}

export interface TriggerScrapeResponse {
  message: string;
  results: { source: string; total: number }[];
}

export interface ScraperSchedule {
  cron: string;
  enabled: boolean;
  nextRun?: string;
}

export interface ScheduleUpdateResponse {
  message: string;
  cron?: string;
}
