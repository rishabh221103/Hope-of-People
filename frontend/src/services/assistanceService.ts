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

  getRequestById: (id: number) =>
    request<AssistanceRequestItem>(`/assistance/${id}`),
};
