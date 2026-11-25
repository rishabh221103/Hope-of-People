import { request } from './api';

export interface ChatMessage {
  id: number;
  senderId: number;
  senderName: string;
  senderRole: string;
  senderAvatarUrl?: string;
  recipientId: number;
  recipientName: string;
  recipientRole: string;
  recipientAvatarUrl?: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  isMe: boolean;
}

export interface ConversationSummary {
  otherUserId: number;
  otherUserName: string;
  otherUserRole: string;
  otherUserAvatarUrl?: string;
  lastMessage: string;
  lastMessageAt?: string | null;
  unreadCount: number;
}

export const messageService = {
  async sendMessage(recipientId: number, content: string): Promise<ChatMessage> {
    return request<ChatMessage>('/messages', {
      method: 'POST',
      body: JSON.stringify({ recipientId, content }),
    });
  },

  async getConversation(otherUserId: number): Promise<ChatMessage[]> {
    return request<ChatMessage[]>(`/messages/conversation/${otherUserId}`);
  },

  async getConversations(): Promise<ConversationSummary[]> {
    return request<ConversationSummary[]>('/messages/conversations');
  },

  async getUnreadCount(): Promise<{ unreadCount: number }> {
    return request<{ unreadCount: number }>('/messages/unread-count');
  },

  async markAsRead(otherUserId: number): Promise<void> {
    return request<void>(`/messages/read/${otherUserId}`, {
      method: 'PUT',
    });
  },
};
