import { request } from './api';

export interface ForumCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  displayOrder: number;
}

export interface ForumPost {
  id: number;
  userId: number;
  authorName: string;
  authorEmail: string;
  authorCity?: string;
  authorRole: string;

  categoryId: number;
  categoryName: string;
  categorySlug: string;
  categoryIcon: string;

  title: string;
  content: string;
  tags?: string;

  upvotesCount: number;
  repliesCount: number;
  viewsCount: number;

  isPinned: boolean;
  isLocked: boolean;
  isUpvotedByCurrentUser?: boolean;
  hasAcceptedSolution?: boolean;

  createdAt: string;
  updatedAt: string;

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

export interface ForumReply {
  id: number;
  postId: number;
  userId: number;
  authorName: string;
  authorEmail: string;
  authorRole: string;
  content: string;
  isSolution: boolean;
  upvotesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateForumPostPayload {
  categoryId: number;
  title: string;
  content: string;
  tags?: string;
  assistanceRequestId?: number;
  businessCampaignId?: number;
}

export interface CreateForumReplyPayload {
  content: string;
}

export const forumService = {
  getCategories: async (): Promise<ForumCategory[]> => {
    return request<ForumCategory[]>('/forum/categories', {
      method: 'GET',
    });
  },

  getPosts: async (params?: { categoryId?: number; search?: string; sort?: string }): Promise<ForumPost[]> => {
    const query = new URLSearchParams();
    if (params?.categoryId) query.append('categoryId', params.categoryId.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.sort) query.append('sort', params.sort);

    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<ForumPost[]>(`/forum/posts${qs}`, {
      method: 'GET',
    });
  },

  getPostById: async (id: number): Promise<ForumPost> => {
    return request<ForumPost>(`/forum/posts/${id}`, {
      method: 'GET',
    });
  },

  createPost: async (payload: CreateForumPostPayload): Promise<ForumPost> => {
    return request<ForumPost>('/forum/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  deletePost: async (id: number): Promise<void> => {
    return request<void>(`/forum/posts/${id}`, {
      method: 'DELETE',
    });
  },

  getReplies: async (postId: number): Promise<ForumReply[]> => {
    return request<ForumReply[]>(`/forum/posts/${postId}/replies`, {
      method: 'GET',
    });
  },

  createReply: async (postId: number, payload: CreateForumReplyPayload): Promise<ForumReply> => {
    return request<ForumReply>(`/forum/posts/${postId}/replies`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  toggleUpvote: async (postId: number): Promise<{ postId: number; isUpvoted: boolean }> => {
    return request<{ postId: number; isUpvoted: boolean }>(`/forum/posts/${postId}/upvote`, {
      method: 'POST',
    });
  },

  toggleSolution: async (replyId: number): Promise<ForumReply> => {
    return request<ForumReply>(`/forum/replies/${replyId}/solution`, {
      method: 'PATCH',
    });
  },

  deleteReply: async (replyId: number): Promise<void> => {
    return request<void>(`/forum/replies/${replyId}`, {
      method: 'DELETE',
    });
  },
};
