import { request } from './api';

export interface BusinessMilestoneItem {
  id: number;
  campaignId: number;
  title: string;
  description: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';
  completedAt?: string | null;
  createdAt: string;
}

export interface BusinessBackerItem {
  id: number;
  campaignId: number;
  donorId: number;
  donorName: string;
  amount: number;
  message?: string;
  isMentorOffer?: boolean;
  createdAt: string;
}

export interface BusinessCampaignItem {
  id: number;
  founderId: number;
  founderName: string;
  founderEmail: string;
  businessName: string;
  industry: string;
  tagline: string;
  description: string;
  equipmentNeeded: string;
  targetAmount: number;
  raisedAmount: number;
  fundingPercentage: number;
  status: 'PENDING' | 'APPROVED' | 'FUNDED' | 'ACTIVE' | 'REJECTED';
  location?: string;
  sustainabilityPlan?: string;
  createdAt: string;
  updatedAt: string;
  milestones?: BusinessMilestoneItem[];
  recentBackers?: BusinessBackerItem[];
  totalBackersCount?: number;
}

export interface CreateCampaignPayload {
  businessName: string;
  industry: string;
  tagline: string;
  description: string;
  equipmentNeeded: string;
  targetAmount: number;
  location?: string;
  sustainabilityPlan?: string;
}

export interface CreateMilestonePayload {
  title: string;
  description: string;
}

export interface FundCampaignPayload {
  amount: number;
  message?: string;
  isMentorOffer?: boolean;
}

export const businessService = {
  async getCampaigns(industry?: string): Promise<BusinessCampaignItem[]> {
    const query = industry && industry !== 'ALL' ? `?industry=${encodeURIComponent(industry)}` : '';
    return request<BusinessCampaignItem[]>(`/business-hub/campaigns${query}`);
  },

  async getCampaignById(id: number): Promise<BusinessCampaignItem> {
    return request<BusinessCampaignItem>(`/business-hub/campaigns/${id}`);
  },

  async getMyCampaigns(): Promise<BusinessCampaignItem[]> {
    return request<BusinessCampaignItem[]>('/business-hub/campaigns/my');
  },

  async createCampaign(payload: CreateCampaignPayload): Promise<BusinessCampaignItem> {
    return request<BusinessCampaignItem>('/business-hub/campaigns', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async addMilestone(campaignId: number, payload: CreateMilestonePayload): Promise<BusinessMilestoneItem> {
    return request<BusinessMilestoneItem>(`/business-hub/campaigns/${campaignId}/milestones`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async completeMilestone(milestoneId: number): Promise<BusinessMilestoneItem> {
    return request<BusinessMilestoneItem>(`/business-hub/milestones/${milestoneId}/complete`, {
      method: 'PUT',
    });
  },

  async fundCampaign(campaignId: number, payload: FundCampaignPayload): Promise<BusinessBackerItem> {
    return request<BusinessBackerItem>(`/business-hub/campaigns/${campaignId}/fund`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
