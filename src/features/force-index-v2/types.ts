export type LinkHubStatus = 'pending' | 'submitted' | 'crawled' | 'failed';

export interface LinkHubItem {
  _id: string;
  slug: string;
  targetUrl: string;
  hubUrl: string;
  anchorText: string;
  topic: string | null;
  status: LinkHubStatus;
  indexingApiResponse?: string | null;
  indexingApiAccount?: string | null;
  indexingApiCalledAt?: string | null;
  crawlVisits: number;
  lastCrawlAt?: string | null;
  indexed: boolean | null;
  indexedAt?: string | null;
  lastIndexCheckAt?: string | null;
  createdAt: string;
  updatedAt: string;
  aiContent?: {
    title: string;
    metaDescription: string;
    intro: string;
    sections: Array<{
      heading: string;
      paragraphs: string[];
    }>;
    anchorText: string;
    tags: string[];
  } | null;
  aiContentAt?: string | null;
  aiModel?: string | null;
}

export interface LinkHubVisit {
  _id: string;
  slug: string;
  ip: string;
  userAgent: string;
  isGooglebot: boolean;
  reverseDnsHost: string | null;
  createdAt: string;
}

export interface LinkHubListResponse {
  items: LinkHubItem[];
  total: number;
}

export interface LinkHubStatusResponse {
  link: LinkHubItem;
  visits: LinkHubVisit[];
}

export interface LinkHubSubmitResponse {
  count: number;
  items: Array<{
    url: string;
    slug: string;
    hubUrl: string;
    replaced: boolean;
  }>;
  queueSize: number;
  note?: string;
}

export interface LinkHubStats {
  totals: {
    links: number;
    submitted: number;
    crawled: number;
    indexed: number;
    visits: number;
    googlebotVisits: number;
  };
  perDay: Array<{
    _id: string;
    total: number;
    googlebot: number;
  }>;
}

export interface CheckIndexResponse {
  checked: number;
  summary: {
    total: number;
    indexed: number;
    notIndexed: number;
    failed: number;
  };
  results: Array<{
    slug: string;
    url: string;
    indexed: boolean;
    error: string | null;
  }>;
}
