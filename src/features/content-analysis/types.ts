export type OutlineSessionStatus =
  | 'queued'
  | 'scraping_serp'
  | 'scraping_competitors'
  | 'analyzing'
  | 'generating_outline'
  | 'done'
  | 'failed';

export interface MetricStats {
  avg: number;
  median: number;
  p25: number;
  p75: number;
  min: number;
  max: number;
}

export interface PerArticleStructural {
  url: string;
  title: string | null;
  wordCount: number;
  h2Count: number;
  h3Count: number;
  h4Count: number;
  imageCount: number;
  imageWithAltCount: number;
  imageWithKeywordAltCount: number;
  keywordOccurrences: number;
  keywordDensity: number;          // %, ví dụ 1.234
}

export interface StructuralRecommendation {
  recommendedWordCount: { min: number; ideal: number; max: number };
  recommendedH2Count: { min: number; ideal: number };
  recommendedH3Count: { min: number; ideal: number };
  recommendedImageCount: { min: number; ideal: number };
  recommendedKeywordDensity: { min: number; ideal: number; max: number };
}

export interface TermFrequencyItem {
  term: string;
  totalCount: number;
  articleCount: number;
  averageInArticles: number;
}

export interface OutlineNode {
  level: 2 | 3 | 4;
  text: string;
  isCoreIntent: boolean;        // xuất hiện ở ≥4/10 bài → BẮT BUỘC
  isUniqueValue: boolean;       // xuất hiện ở 1-2/10 bài → góc nhìn độc đáo
  appearsInArticles: number[];  // index 1-based của các bài trong sources
  supportingKeywords: string[];
  parentH2?: string;            // nếu là H3/H4
}

export interface OutlineFaq {
  question: string;
  shortAnswer: string;
}

export interface SessionDetail {
  _id: string;
  keyword: string;
  normalizedKeyword: string;
  location: string;
  language: string;
  topN: number;
  submittedBy: string;
  status: OutlineSessionStatus;
  progress: number;
  currentStep: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  result: {
    keyword: string;
    location: string;
    language: string;
    structural: {
      perArticle: PerArticleStructural[];
      aggregate: {
        wordCount: MetricStats;
        h2Count: MetricStats;
        h3Count: MetricStats;
        h4Count: MetricStats;
        imageCount: MetricStats;
        imageWithAltCount: MetricStats;
        imageWithKeywordAltCount: MetricStats;
        keywordDensity: MetricStats;
      };
      recommendation: StructuralRecommendation;
      termFrequency: TermFrequencyItem[];
      scrapedCount: number;
      totalRequested: number;
    };
    outline: {
      title: string;
      metaDescription: string;
      outline: OutlineNode[];
      faqs: OutlineFaq[];
      recommendedWordCount: number;
      differentiationStrategy: string;
      model: string;
    };
    peopleAlsoAsk: string[];
    relatedSearches: string[];
    featuredSnippet: { text: string; source: string | null } | null;
    sources: Array<{
      index: number;
      url: string;
      title: string | null;
      displayUrl: string | null;
      snippet: string | null;
      position: number | null;
    }>;
    failedSources?: FailedSource[];
    scrapeSummary?: ScrapeSummary;
    analyzedAt: string;
  } | null;
}

export type FailedReason = 'scrape_failed' | 'no_fulltext' | 'thin_content';

export interface FailedSource {
  url: string;
  reason: FailedReason;
  method: string;
  error: string | null;
  fullTextLength: number;
  durationMs: number;
}

export interface ScrapeSummary {
  attempted: number;
  succeeded: number;
  failed: number;
}

export interface SessionListItem {
  _id: string;
  keyword: string;
  location: string;
  language: string;
  status: OutlineSessionStatus;
  progress: number;
  currentStep: string | null;
  errorCode: string | null;
  createdAt: string;
  finishedAt: string | null;
}

export interface HistoryResponse {
  items: SessionListItem[];
  total: number;
}
