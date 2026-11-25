import { request } from './api';

export interface DocumentItem {
  id: number;
  requestId: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSizeBytes: number;
  uploadedAt: string;
}

export interface AssistanceRequestItem {
  id: number;
  userId: number;
  userFullName: string;
  userEmail: string;
  title: string;
  description: string;
  category: string;
  targetAmount: number;
  raisedAmount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'FULFILLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  isAnonymous?: boolean;
  consentGiven?: boolean;
  isDirectDonorOrAdmin?: boolean;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  createdAt: string;
  updatedAt: string;
  documents?: DocumentItem[];
}

export interface CreateAssistancePayload {
  title: string;
  description: string;
  category: string;
  targetAmount: number;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  isAnonymous?: boolean;
  consentGiven?: boolean;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export const assistanceService = {
  createRequest: (payload: CreateAssistancePayload) =>
    request<AssistanceRequestItem>('/assistance', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMyRequests: () =>
    request<AssistanceRequestItem[]>('/assistance/my-requests'),

  getPublicRequests: () =>
    request<any>('/assistance/public').then((res) =>
      Array.isArray(res) ? res : res?.content || []
    ),

  getNearbyRequests: (params: {
    latitude?: number;
    longitude?: number;
    radiusKm?: number;
    city?: string;
    postalCode?: string;
    category?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params.latitude !== undefined) searchParams.set('latitude', params.latitude.toString());
    if (params.longitude !== undefined) searchParams.set('longitude', params.longitude.toString());
    if (params.radiusKm !== undefined) searchParams.set('radiusKm', params.radiusKm.toString());
    if (params.city) searchParams.set('city', params.city);
    if (params.postalCode) searchParams.set('postalCode', params.postalCode);
    if (params.category && params.category !== 'ALL') searchParams.set('category', params.category);
    return request<AssistanceRequestItem[]>(`/assistance/nearby?${searchParams.toString()}`);
  },

  getRequestById: (id: number) =>
    request<AssistanceRequestItem>(`/assistance/${id}`),
};
