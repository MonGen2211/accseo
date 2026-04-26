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
  __v?: number;
}
