import { request } from './api';

export interface ConnectedUser {
  connectionId: number;
  userId: number;
  fullName: string;
  email: string;
  role: string;
  avatarUrl?: string;
  connectedSince?: string;
}

export interface ConnectionResponse {
  id: number;
  requesterId: number;
  requesterName: string;
  requesterRole: string;
  requesterAvatarUrl?: string;
  receiverId: number;
  receiverName: string;
  receiverRole: string;
  receiverAvatarUrl?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  updatedAt?: string;
}

export interface ConnectionStatusResponse {
  targetUserId: number;
  status: 'NONE' | 'PENDING_OUTGOING' | 'PENDING_INCOMING' | 'ACCEPTED' | 'REJECTED' | 'SELF' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'CONNECTED';
  connectionId?: number | null;
  id?: number | null;
}

export const connectionService = {
  async sendRequest(targetUserId: number): Promise<ConnectionResponse> {
    return request<ConnectionResponse>(`/connections/request/${targetUserId}`, {
      method: 'POST',
    });
  },

  async acceptRequest(connectionId: number): Promise<ConnectionResponse> {
    return request<ConnectionResponse>(`/connections/${connectionId}/accept`, {
      method: 'PUT',
    });
  },

  async rejectRequest(connectionId: number): Promise<void> {
    return request<void>(`/connections/${connectionId}/reject`, {
      method: 'PUT',
    });
  },

  async disconnect(connectionId: number): Promise<void> {
    return request<void>(`/connections/${connectionId}`, {
      method: 'DELETE',
    });
  },

  async getStatus(targetUserId: number): Promise<ConnectionStatusResponse> {
    return request<ConnectionStatusResponse>(`/connections/status/${targetUserId}`);
  },

  async getMyConnections(): Promise<ConnectedUser[]> {
    return request<ConnectedUser[]>('/connections/my');
  },

  async getPendingIncoming(): Promise<ConnectionResponse[]> {
    return request<ConnectionResponse[]>('/connections/pending/incoming');
  },

  async getPendingOutgoing(): Promise<ConnectionResponse[]> {
    return request<ConnectionResponse[]>('/connections/pending/outgoing');
  },

  async getPendingCount(): Promise<{ count: number }> {
    return request<{ count: number }>('/connections/pending/count');
  },

  async getDiscoverPeople(): Promise<ConnectedUser[]> {
    return request<ConnectedUser[]>('/connections/discover');
  },
};
