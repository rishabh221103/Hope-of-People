import { request } from './api';

export interface StoryItem {
  id: number;
  requestId: number;
  userId: number;
  userEmail: string;
  beneficiaryName: string;
  title: string;
  description: string;
  category: string;
  targetAmount: number;
  raisedAmount: number;
  urgency: string;
  location: string;
  imageUrl?: string;
  createdAt: string;
  expiresAt: string;
  secondsRemaining: number;
  status: string;
  documents?: any[];
}

export interface CreateStoryPayload {
  title: string;
  description: string;
  category: string;
  targetAmount: number;
  beneficiaryName?: string;
  location?: string;
  urgencyTag?: string;
  imageUrl?: string;
  photo?: File | null;
}

export const storyService = {
  getActiveStories: () => request<StoryItem[]>('/stories/active'),

  getMyStories: () => request<StoryItem[]>('/stories/my-stories'),

  createStory: (payload: CreateStoryPayload) => {
    if (payload.photo) {
      const formData = new FormData();
      formData.append('title', payload.title);
      formData.append('description', payload.description);
      formData.append('category', payload.category);
      formData.append('targetAmount', payload.targetAmount.toString());
      if (payload.beneficiaryName) formData.append('beneficiaryName', payload.beneficiaryName);
      if (payload.location) formData.append('location', payload.location);
      if (payload.urgencyTag) formData.append('urgencyTag', payload.urgencyTag);
      if (payload.imageUrl) formData.append('imageUrl', payload.imageUrl);
      formData.append('photo', payload.photo);

      return request<StoryItem>('/stories', {
        method: 'POST',
        body: formData,
      });
    }

    return request<StoryItem>('/stories', {
      method: 'POST',
      body: JSON.stringify({
        title: payload.title,
        description: payload.description,
        category: payload.category,
        targetAmount: payload.targetAmount,
        beneficiaryName: payload.beneficiaryName,
        location: payload.location,
        urgencyTag: payload.urgencyTag,
        imageUrl: payload.imageUrl,
      }),
    });
  },
};
