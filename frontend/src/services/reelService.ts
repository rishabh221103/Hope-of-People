import { request } from './api';

export interface ReelItem {
  id: number;
  userId: number;
  creatorName: string;
  creatorEmail: string;
  videoUrl: string;
  thumbnailUrl?: string;
  caption: string;
  durationSeconds: number;
  viewsCount: number;
  likesCount: number;
  sharesCount: number;
  isLikedByCurrentUser?: boolean;
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

export interface CreateReelPayload {
  videoUrl: string;
  thumbnailUrl?: string;
  caption: string;
  durationSeconds?: number;
  assistanceRequestId?: number;
  businessCampaignId?: number;
}

export const reelService = {
  getReels: async (): Promise<ReelItem[]> => {
    return request<ReelItem[]>('/reels', {
      method: 'GET',
    });
  },

  getReelById: async (id: number): Promise<ReelItem> => {
    return request<ReelItem>(`/reels/${id}`, {
      method: 'GET',
    });
  },

  getUserReels: async (userId: number): Promise<ReelItem[]> => {
    return request<ReelItem[]>(`/reels/user/${userId}`, {
      method: 'GET',
    });
  },

  createReel: async (payload: CreateReelPayload): Promise<ReelItem> => {
    return request<ReelItem>('/reels', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  uploadReelVideo: async (formData: FormData): Promise<ReelItem> => {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/v1/reels/upload', {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Failed to upload video reel.');
    }

    const res = await response.json();
    return res.data;
  },

  toggleLike: async (id: number): Promise<ReelItem> => {
    return request<ReelItem>(`/reels/${id}/like`, {
      method: 'POST',
    });
  },

  incrementView: async (id: number): Promise<void> => {
    return request<void>(`/reels/${id}/view`, {
      method: 'POST',
    });
  },

  deleteReel: async (id: number): Promise<void> => {
    return request<void>(`/reels/${id}`, {
      method: 'DELETE',
    });
  },
};
