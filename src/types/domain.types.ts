export interface DomainOwner {
  _id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
}

export interface Domain {
  _id: string;
  domain: string;
  metaDescription: string;
  lastCheckedAt: string;
  createdAt: string;
  updatedAt: string;
  owners?: DomainOwner[];
  scanSchedule?: { enabled: boolean; hour: number };
  gscSyncSchedule?: { enabled: boolean; hour: number };
  ga4SyncSchedule?: { enabled: boolean; hour: number };
  __v?: number;
}
