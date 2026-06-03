export interface IndexBoosterSubmitResult {
  jobId: string;
  url: string;
  okCount: number;
  failCount: number;
  results: {
    indexNow?: {
      _verified: string;
      [key: string]: string;
    };
    ping?: {
      [key: string]: string;
    };
    forceIndex?: {
      hashId: string;
      decoyUrl: string;
      reused: boolean;
      queued: boolean;
    };
    hub?: {
      slug: string;
      hubUrl: string;
      reused: boolean;
      queued: boolean;
    };
  };
  note: string;
}

export interface IndexBoosterSubmitResponse {
  count: number;
  results: IndexBoosterSubmitResult[];
}

export interface IndexBoosterHistoryItem {
  _id: string;
  url: string;
  okCount: number;
  failCount: number;
  results: {
    indexNow?: {
      _verified: string;
      [key: string]: string;
    };
    ping?: {
      [key: string]: string;
    };
    forceIndex?: {
      hashId: string;
      decoyUrl: string;
      reused: boolean;
      queued: boolean;
    };
    hub?: {
      slug: string;
      hubUrl: string;
      reused: boolean;
      queued: boolean;
    };
  };
  createdAt: string;
}

export interface IndexBoosterHistoryResponse {
  items: IndexBoosterHistoryItem[];
  total: number;
}

export interface IndexBoosterAccountQuota {
  account: string;
  projectId: string;
  used: number;
  success: number;
  fail: number;
  limit: number;
  remaining: number;
}

export interface IndexBoosterQuotaResponse {
  dateKey: string;
  accountsCount: number;
  dailyQuotaPerAccount: number;
  totalRemaining: number;
  accounts: IndexBoosterAccountQuota[];
}

export interface CheckIndexResult {
  url: string;
  indexed: boolean | null;
  foundCount: number;
  error: string | null;
}

export interface CheckIndexResponse {
  results: CheckIndexResult[];
  summary: {
    total: number;
    indexed: number;
    notIndexed: number;
    failed: number;
  };
}
