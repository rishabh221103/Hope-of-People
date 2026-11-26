import { request } from './api';

export interface PodcastItem {
  id: number;
  userId: number;
  creatorName: string;
  creatorEmail: string;
  creatorRole: string;

  title: string;
  description: string;
  audioUrl: string;
  coverImageUrl?: string;
  hostName: string;
  guestName?: string;
  category: string;
  durationSeconds: number;
  playsCount: number;
  likesCount: number;
  isLikedByCurrentUser?: boolean;
  publishedAt: string;
  createdAt: string;

  // Linked Assistance Request
  assistanceRequestId?: number;
  assistanceRequestTitle?: string;
  assistanceCategory?: string;
  assistanceTargetAmount?: string;
  assistanceRaisedAmount?: string;

  // Linked Business Campaign
  businessCampaignId?: number;
  businessName?: string;
  businessTargetAmount?: string;
  businessRaisedAmount?: string;
}

export interface CreatePodcastPayload {
  title: string;
  description: string;
  audioUrl: string;
  coverImageUrl?: string;
  hostName: string;
  guestName?: string;
  category: string;
  durationSeconds?: number;
  assistanceRequestId?: number;
  businessCampaignId?: number;
}

export const podcastService = {
  getPodcasts: async (params?: { category?: string; search?: string; sort?: string }): Promise<PodcastItem[]> => {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    if (params?.sort) query.append('sort', params.sort);

    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<PodcastItem[]>(`/podcasts${qs}`, {
      method: 'GET',
    });
  },

  getPodcastById: async (id: number): Promise<PodcastItem> => {
    return request<PodcastItem>(`/podcasts/${id}`, {
      method: 'GET',
    });
  },

  createPodcast: async (payload: CreatePodcastPayload): Promise<PodcastItem> => {
    return request<PodcastItem>('/podcasts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  uploadAudio: async (file: File): Promise<{ filename: string; audioUrl: string }> => {
    const token = localStorage.getItem('hop_token');
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/v1/podcasts/upload', {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: formData,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      throw new Error(errData?.message || 'Failed to upload audio file');
    }

    const data = await res.json();
    return data.data;
  },

  recordPlay: async (id: number): Promise<void> => {
    return request<void>(`/podcasts/${id}/play`, {
      method: 'POST',
    });
  },

  toggleLike: async (id: number): Promise<{ podcastId: number; isLiked: boolean }> => {
    return request<{ podcastId: number; isLiked: boolean }>(`/podcasts/${id}/like`, {
      method: 'POST',
    });
  },

  deletePodcast: async (id: number): Promise<void> => {
    return request<void>(`/podcasts/${id}`, {
      method: 'DELETE',
    });
  },
};
