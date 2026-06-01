export interface ScrapeResult {
  url: string;
  finalUrl: string | null;
  ok: boolean;
  method: 'axios-lite' | 'axios-stealth' | 'puppeteer' | 'rss' | 'vbpl-api' | 'failed';
  contentType: string | null;
  contentLength: number;
  durationMs: number;
  error: string | null;
  data: {
    title: string | null;
    description: string | null;
    canonical: string | null;
    language: string | null;
    publishedAt: string | null; // ISO date
    modifiedAt: string | null;
    thumbnailUrl: string | null;
    author: string | null;
    siteName: string | null;
    tags: string[];
    metaKeywords: string[];
    breadcrumb: string[];
    category: string[];
    excerpt: string | null;
    headings: { h1: string[]; h2: string[]; h3: string[] };
    relatedUrls: string[];
    fullText: string | null;
    jsonLd: any[];
    openGraph: Record<string, string>;
    twitterCard: Record<string, string>;
    rssItems: Array<{
      title: string;
      link: string;
      description: string | null;
      pubDate: string | null;
      category: string[];
      enclosure: string | null;
    }> | null;
  } | null;
}

export interface UrlScrapeResponse {
  message: string;
  total: number;
  okCount: number;
  failCount: number;
  results: ScrapeResult[];
}
