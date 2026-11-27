import { request } from './api';

export interface UserSummary {
  id: number;
  name: string;
  avatar?: string;
}

export interface ReelFeedItem {
  id: number;
  caption: string;
  category: string;
  playbackUrl: string;
  thumbnailUrl?: string;
  durationSec: number;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  sourceLocation?: string;
  supplierLink?: string;
  businessIdeaId?: number;
  user: UserSummary;
}

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ReelCommentItem {
  id: number;
  reelId: number;
  user: UserSummary;
  content: string;
  createdAt: string;
}

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

  // Fields from HOP Reels module
  category?: string;
  sourceLocation?: string;
  supplierLink?: string;
  commentCount?: number;

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

export function feedItemToReelItem(item: ReelFeedItem): ReelItem {
  return {
    id: item.id,
    userId: item.user?.id || 0,
    creatorName: item.user?.name || 'HOP Member',
    creatorEmail: '',
    videoUrl: item.playbackUrl,
    thumbnailUrl: item.thumbnailUrl,
    caption: item.caption,
    durationSeconds: item.durationSec || 15,
    viewsCount: 0,
    likesCount: item.likeCount,
    sharesCount: 0,
    isLikedByCurrentUser: item.likedByMe,
    createdAt: (item as any).createdAt || new Date().toISOString(),
    category: item.category,
    sourceLocation: item.sourceLocation,
    supplierLink: item.supplierLink,
    businessCampaignId: item.businessIdeaId,
    commentCount: item.commentCount || 0,
  };
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
  getFeed: async (
    limit: number = 10,
    cursor?: string | null,
    category?: string
  ): Promise<CursorPage<ReelFeedItem>> => {
    const params = new URLSearchParams();
    params.set('limit', limit.toString());
    if (cursor) params.set('cursor', cursor);
    if (category) params.set('category', category);

    return request<CursorPage<ReelFeedItem>>(`/reels/feed?${params.toString()}`, {
      method: 'GET',
    });
  },

  getReels: async (): Promise<ReelItem[]> => {
    try {
      const feed = await reelService.getFeed(20);
      return feed.items.map(feedItemToReelItem);
    } catch {
      return request<ReelItem[]>('/reels', {
        method: 'GET',
      });
    }
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
    const token = localStorage.getItem('hop_token') || localStorage.getItem('token');
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
    const data = res?.data || res;
    return feedItemToReelItem(data);
  },

  toggleLike: async (id: number): Promise<{ id: number; likesCount: number; isLikedByCurrentUser: boolean }> => {
    const res = await request<any>(`/reels/${id}/like`, {
      method: 'POST',
    });
    return {
      id,
      likesCount: res.likeCount ?? res.likesCount ?? 0,
      isLikedByCurrentUser: res.likedByMe ?? res.likedByCurrentUser ?? res.isLikedByCurrentUser ?? res.liked ?? false,
    };
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

  // Keyset Comments
  getComments: async (
    reelId: number,
    limit: number = 20,
    cursor?: string | null
  ): Promise<CursorPage<ReelCommentItem>> => {
    const params = new URLSearchParams();
    params.set('limit', limit.toString());
    if (cursor) params.set('cursor', cursor);

    return request<CursorPage<ReelCommentItem>>(`/reels/${reelId}/comments?${params.toString()}`, {
      method: 'GET',
    });
  },

  addComment: async (reelId: number, content: string): Promise<ReelCommentItem> => {
    return request<ReelCommentItem>(`/reels/${reelId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  reportReel: async (reelId: number, reason: string): Promise<void> => {
    return request<void>(`/reels/${reelId}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // Admin moderation
  getAdminQueue: async (status: string = 'PENDING_REVIEW'): Promise<ReelFeedItem[]> => {
    const res = await request<any>(`/admin/reels?status=${status}`, {
      method: 'GET',
    });
    return Array.isArray(res) ? res : (res?.content || []);
  },

  approveReel: async (id: number): Promise<void> => {
    return request<void>(`/admin/reels/${id}/approve`, {
      method: 'POST',
    });
  },

  rejectReel: async (id: number, reason: string): Promise<void> => {
    return request<void>(`/admin/reels/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
};
