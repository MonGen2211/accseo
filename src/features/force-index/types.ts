export interface ForceIndexStats {
  totals: {
    allTime: number;
    last24h: number;
    googlebot: number;
    cloaked: number;
    redirected: number;
  };
  topHashIds: Array<{
    _id: string;
    count: number;
    googlebotCount: number;
    lastVisit: string;
    targetUrl?: string; // resolved locally or from list
  }>;
  perDay: Array<{
    _id: string;
    total: number;
    googlebot: number;
  }>;
  mappingsCount: number;
}

export interface ForceIndexMapping {
  _id: string;
  hashId: string;
  targetUrl: string;
  decoyUrl: string;
  submittedBy: string;
  indexingApiCalledAt?: string;
  indexingApiResponse?: string;
  indexingApiAccount?: string;
  crawlVisits: number;
  lastCrawlAt?: string;
  status: 'pending' | 'submitted' | 'failed' | 'crawled';
  createdAt: string;
  updatedAt: string;
}

export interface ForceIndexVisit {
  _id: string;
  mappingId: string;
  hashId: string;
  ip: string;
  userAgent: string;
  isGooglebot: boolean;
  reverseDnsHost: string | null;
  action: 'redirected' | 'cloaked' | 'rejected';
  createdAt: string;
}

export interface ForceIndexListResponse {
  items: ForceIndexMapping[];
  total: number;
}

export interface ForceIndexVisitsResponse {
  items: ForceIndexVisit[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ForceIndexStatusResponse {
  mapping: ForceIndexMapping;
  visits: ForceIndexVisit[];
}

export interface ForceIndexSubmitResponse {
  jobId: string;
  url: string;
  okCount: number;
  failCount: number;
  results: {
    indexNow?: {
      _verified?: string;
      [key: string]: any;
    };
    ping?: {
      [key: string]: any;
    };
    forceIndex?: {
      hashId: string;
      decoyUrl: string;
      reused: boolean;
      queued: boolean;
      skipped?: string;
    };
  };
  note?: string;
}
