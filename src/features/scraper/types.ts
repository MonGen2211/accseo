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
    fullText?: string | null;
    fullTextFetchedAt?: string;
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
  fullInfoPushedAt?: string | null;
  fullInfoSheetUrl?: string | null;
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
  sheetLastBatch: string | null;
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
  fullInfoStatus?: string;
  articleType?: string;
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

export interface VbplAiAutoConfig {
  enabled: boolean;
  activatedAt: string | null;
  scopes: ('TW' | 'DP')[];
  effStatusCodes: string[];
  docTypeCodes: string[];
  nganhs: string[];
  linhVucs: string[];
  consecutiveFailures: number;
  lastError: string | null;
  lastErrorAt: string | null;
  updatedBy: string | null;
  _id: string;
  createdAt: string;
  updatedAt: string;
  isRunning: boolean;
  lastRunAt: string | null;
  lastRunResult: VbplAiAutoRunResult | null;
}

export interface VbplAiAutoFilterOptions {
  scopes: string[];
  effStatuses: { code: string; name: string }[];
  docTypes: { code: string; name: string }[];
  nganhs: string[];
  linhVucs: string[];
}

export interface VbplAiAutoRunResult {
  matched: number;
  processed: number;
  succeeded: number;
  failed: number;
}

export interface ScraperHealthSource {
  source: string;
  status: 'healthy' | 'warn' | 'critical' | 'gathering';
  lastRunAt: string | null;
  lastRunOk: boolean;
  total: number;
  baselineTotal: number | null;
  inserted: number;
  baselineInserted: number | null;
  durationMs: number;
  fillRates: {
    title?: number;
    publishedAt?: number;
    tags?: number;
    metadata?: number;
    [key: string]: number | undefined;
  } | null;
  baselineFillRates: {
    title?: number;
    publishedAt?: number;
    tags?: number;
    metadata?: number;
    [key: string]: number | undefined;
  } | null;
  sectionCounts: Record<string, number> | null;
  driftSamples: {
    field: string;
    samples: { url: string; title: string }[];
  }[] | null;
  newSectionDetails: {
    section: string;
    count: number;
    samples: { url: string; title: string | null }[];
  }[] | null;
  anomalies: string[];
  errorMessage: string | null;
  errorStack: string | null;
  isDown: boolean;
}

export interface ScraperHealthResponse {
  generatedAt: string;
  sources: ScraperHealthSource[];
}

export interface ScraperRun {
  _id: string;
  source: string;
  trigger: 'cron' | 'manual';
  ok: boolean;
  total: number;
  inserted: number;
  durationMs: number;
  fillRates: {
    title?: number;
    publishedAt?: number;
    tags?: number;
    metadata?: number;
    [key: string]: number | undefined;
  } | null;
  baselineFillRates: {
    title?: number;
    publishedAt?: number;
    tags?: number;
    metadata?: number;
    [key: string]: number | undefined;
  } | null;
  baselineTotal: number | null;
  baselineInserted: number | null;
  sectionCounts: Record<string, number> | null;
  anomalies: string[];
  driftSamples: {
    field: string;
    samples: { url: string; title: string }[];
  }[];
  newSectionDetails: {
    section: string;
    count: number;
    samples: { url: string; title: string | null }[];
  }[];
  errorMessage: string | null;
  errorStack: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScraperHistoryResponse {
  source: string;
  total: number;
  limit: number;
  anomaliesOnly: boolean;
  runs: ScraperRun[];
}

export interface KnownRoot {
  id: string;
  source: string;
  segment: string;
  sampleUrl: string;
  status: 'new' | 'acknowledged' | 'ignored';
  note: string | null;
  firstSeenAt: string;
  updatedAt: string;
}

export interface GetKnownRootsResponse {
  items: KnownRoot[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetKnownRootSourcesResponse {
  sources: string[];
}

export interface DiscoverKnownRootsResponse {
  message: string;
  data: {
    results: Array<{
      source: string;
      scanned: number;
      created: number;
      skipped: boolean;
    }>;
  };
}
