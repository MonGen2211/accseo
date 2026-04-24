export type ArticleStatus = 'draft' | 'published' | 'archived';

export interface Article {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  status: ArticleStatus;
  author: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ArticleFormData {
  title: string;
  content: string;
  excerpt: string;
  status: ArticleStatus;
  category: string;
  tags: string[];
}

export interface ArticleState {
  articles: Article[];
  selectedArticle: Article | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}
