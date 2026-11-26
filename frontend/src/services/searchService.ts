import api from './api';

export type SearchResultType = 'CAUSE' | 'REEL' | 'PODCAST' | 'FORUM_POST' | 'BUSINESS';

export interface SearchResultItem {
  id: number;
  type: SearchResultType;
  title: string;
  description?: string;
  category?: string;
  url: string;
  thumbnailUrl?: string | null;
  authorName?: string;
  createdAt?: string;
  extra?: Record<string, any>;
}

export interface GlobalSearchData {
  query: string;
  totalCount: number;
  causes: SearchResultItem[];
  reels: SearchResultItem[];
  podcasts: SearchResultItem[];
  forumPosts: SearchResultItem[];
  businesses: SearchResultItem[];
  allResults: SearchResultItem[];
}

export interface GlobalSearchResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: GlobalSearchData;
  timestamp: string;
}

export const searchService = {
  /**
   * Full search query across all or a specific category.
   */
  async search(query: string, type?: string, limit: number = 20): Promise<GlobalSearchData> {
    const params = new URLSearchParams();
    params.set('q', query);
    if (type && type !== 'ALL') {
      params.set('type', type);
    }
    params.set('limit', limit.toString());

    const res = await api.get<GlobalSearchResponse>(`/search?${params.toString()}`);
    return res.data.data;
  },

  /**
   * Fast debounced quick search for autocomplete dropdowns.
   */
  async quickSearch(query: string): Promise<GlobalSearchData> {
    const res = await api.get<GlobalSearchResponse>(`/search/quick?q=${encodeURIComponent(query)}`);
    return res.data.data;
  },
};
