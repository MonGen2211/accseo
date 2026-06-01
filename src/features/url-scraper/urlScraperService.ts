import api from '../../utils/api';
import type { UrlScrapeResponse } from './types';

export const urlScraperService = {
  scrapeUrls: async (params: {
    urls: string[];
    includeFullText?: boolean;
    forcePuppeteer?: boolean;
    skipAxios?: boolean;
  }): Promise<UrlScrapeResponse> => {
    const res = await api.post<any>('/scraper/url', params);
    return res.data.data;
  },
};
