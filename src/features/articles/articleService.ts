import type { Article, ArticleFormData } from '../../types/article.types';

const MOCK_ARTICLES: Article[] = [
  {
    id: '1',
    title: 'Hướng dẫn React 19 - Những tính năng mới',
    content: 'React 19 mang đến nhiều cải tiến đáng kể về hiệu suất và trải nghiệm developer...',
    excerpt: 'Tổng quan về React 19 và các tính năng mới nhất.',
    status: 'published',
    author: 'Admin User',
    category: 'Frontend',
    tags: ['react', 'javascript', 'frontend'],
    createdAt: '2026-04-10T08:00:00Z',
    updatedAt: '2026-04-10T08:00:00Z',
  },
  {
    id: '2',
    title: 'TypeScript 6.0 - Strict Mode nâng cao',
    content: 'TypeScript tiếp tục phát triển với hệ thống type ngày càng mạnh mẽ...',
    excerpt: 'Deep dive vào TypeScript 6.0 strict mode.',
    status: 'published',
    author: 'Editor User',
    category: 'Frontend',
    tags: ['typescript', 'javascript'],
    createdAt: '2026-04-08T14:30:00Z',
    updatedAt: '2026-04-09T10:00:00Z',
  },
  {
    id: '3',
    title: 'Node.js Performance Tuning 2026',
    content: 'Các kỹ thuật tối ưu hiệu suất cho ứng dụng Node.js trong production...',
    excerpt: 'Best practices cho Node.js performance.',
    status: 'draft',
    author: 'Admin User',
    category: 'Backend',
    tags: ['nodejs', 'performance', 'backend'],
    createdAt: '2026-04-05T09:15:00Z',
    updatedAt: '2026-04-05T09:15:00Z',
  },
  {
    id: '4',
    title: 'Docker Compose cho Development',
    content: 'Thiết lập môi trường development với Docker Compose một cách hiệu quả...',
    excerpt: 'Docker Compose setup cho dev team.',
    status: 'published',
    author: 'Admin User',
    category: 'DevOps',
    tags: ['docker', 'devops'],
    createdAt: '2026-03-28T11:00:00Z',
    updatedAt: '2026-03-30T16:00:00Z',
  },
  {
    id: '5',
    title: 'Tailwind CSS v4 Migration Guide',
    content: 'Hướng dẫn chi tiết upgrade từ Tailwind v3 lên v4...',
    excerpt: 'Step-by-step migration từ Tailwind v3.',
    status: 'archived',
    author: 'Editor User',
    category: 'Frontend',
    tags: ['tailwind', 'css', 'frontend'],
    createdAt: '2026-03-15T07:45:00Z',
    updatedAt: '2026-03-20T12:00:00Z',
  },
  {
    id: '6',
    title: 'PostgreSQL Query Optimization',
    content: 'Phân tích và tối ưu query PostgreSQL cho ứng dụng lớn...',
    excerpt: 'Optimize PostgreSQL queries hiệu quả.',
    status: 'draft',
    author: 'Admin User',
    category: 'Backend',
    tags: ['postgresql', 'database', 'optimization'],
    createdAt: '2026-04-18T13:00:00Z',
    updatedAt: '2026-04-18T13:00:00Z',
  },
];

let articles = [...MOCK_ARTICLES];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const articleService = {
  async getAll(): Promise<Article[]> {
    await delay(500);
    return [...articles];
  },

  async getById(id: string): Promise<Article> {
    await delay(300);
    const article = articles.find((a) => a.id === id);
    if (!article) throw new Error('Không tìm thấy bài viết');
    return { ...article };
  },

  async create(data: ArticleFormData): Promise<Article> {
    await delay(600);
    const newArticle: Article = {
      id: String(Date.now()),
      ...data,
      author: 'Current User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    articles = [newArticle, ...articles];
    return newArticle;
  },

  async update(id: string, data: ArticleFormData): Promise<Article> {
    await delay(600);
    const index = articles.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Không tìm thấy bài viết');
    const updated = { ...articles[index], ...data, updatedAt: new Date().toISOString() };
    articles[index] = updated;
    return { ...updated };
  },

  async remove(id: string): Promise<void> {
    await delay(400);
    articles = articles.filter((a) => a.id !== id);
  },
};
