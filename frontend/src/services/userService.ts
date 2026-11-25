import { request } from './api';

export interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: string;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfilePayload {
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const userService = {
  getProfile: () => request<UserProfile>('/users/profile'),

  updateProfile: (payload: UpdateProfilePayload) =>
    request<UserProfile>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  changePassword: (payload: ChangePasswordPayload) =>
    request<string>('/users/password', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
};
