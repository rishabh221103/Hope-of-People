import { request } from './api';

export interface DonationItem {
  id: number;
  requestId: number;
  requestTitle: string;
  donorId: number;
  donorFullName: string;
  amount: number;
  transactionRef: string;
  status: string;
  donatedAt: string;
}

export interface CreateDonationPayload {
  requestId: number;
  amount: number;
  paymentMethod?: string;
}

export const donationService = {
  createDonation: (payload: CreateDonationPayload) =>
    request<DonationItem>('/donations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMyDonations: () =>
    request<DonationItem[]>('/donations/my-donations'),

  getDonationsByRequest: (requestId: number) =>
    request<DonationItem[]>(`/donations/request/${requestId}`),
};
