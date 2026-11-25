import { request } from './api';
import { AssistanceRequestItem } from './assistanceService';
import { UserProfile } from './userService';

export interface AdminMetrics {
  totalUsers: number;
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  fulfilledRequests: number;
  totalTargetAmount: number;
  totalRaisedAmount: number;
}

export interface ReviewRequestPayload {
  action: 'APPROVE' | 'REJECT';
  remarks?: string;
}

export const adminService = {
  getAllUsers: (page = 0, size = 50) =>
    request<{ content: UserProfile[]; totalElements: number } | UserProfile[]>(
      `/admin/users?page=${page}&size=${size}`
    ),

  updateUserStatus: (userId: number, status: 'ACTIVE' | 'SUSPENDED' | 'PENDING') =>
    request<UserProfile>(`/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  getReviewQueue: (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return request<AssistanceRequestItem[]>(`/admin/assistance${query}`);
  },

  reviewRequest: (requestId: number, payload: ReviewRequestPayload) =>
    request<AssistanceRequestItem>(`/admin/assistance/${requestId}/review`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  getMetrics: () => request<AdminMetrics>('/admin/metrics'),
};
