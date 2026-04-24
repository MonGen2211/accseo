export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const ROLES = {
  ADMIN: 'ADMIN' as const,
  EDITOR: 'editor' as const,
};

export const ARTICLE_STATUS = {
  DRAFT: 'draft' as const,
  PUBLISHED: 'published' as const,
  ARCHIVED: 'archived' as const,
};

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/',
  ARTICLES: '/articles',
  USERS: '/users',
  DOMAINS: '/domains',
  SETTINGS: '/settings',
};

export const PAGINATION_DEFAULT = {
  PAGE: 1,
  LIMIT: 10,
};
