import { request } from './api';

export interface DocumentItem {
  id: number;
  requestId: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

export const documentService = {
  uploadDocument: (requestId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<DocumentItem>(`/documents/upload/${requestId}`, {
      method: 'POST',
      body: formData,
    });
  },

  getDocumentsByRequest: (requestId: number) =>
    request<DocumentItem[]>(`/documents/request/${requestId}`),

  getDownloadUrl: (documentId: number) =>
    `/api/v1/documents/download/${documentId}`,
};
