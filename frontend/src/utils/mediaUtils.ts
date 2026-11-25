import { AssistanceRequestItem, DocumentItem } from '../services/assistanceService';

export const isImageDocument = (doc: DocumentItem): boolean => {
  if (doc.fileType && doc.fileType.startsWith('image/')) return true;
  return Boolean(doc.fileName && /\.(jpe?g|png|webp|gif|svg|avif)$/i.test(doc.fileName));
};

export const isVideoDocument = (doc: DocumentItem): boolean => {
  if (doc.fileType && doc.fileType.startsWith('video/')) return true;
  return Boolean(doc.fileName && /\.(mp4|webm|mov|avi|mkv)$/i.test(doc.fileName));
};

export const getCategoryFallbackPhoto = (category: string): string => {
  switch (category?.toUpperCase()) {
    case 'MEDICAL':
      return 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80';
    case 'FOOD':
      return 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=600&q=80';
    case 'EDUCATION':
      return 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=600&q=80';
    case 'HOUSING':
    case 'SHELTER':
      return 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80';
    case 'DISASTER_RELIEF':
    case 'DISASTER':
    case 'EMERGENCY':
      return 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80';
    default:
      return 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=600&q=80';
  }
};

export const getInitiativeCoverUrl = (item: AssistanceRequestItem): string => {
  const photoDoc = item.documents?.find(isImageDocument);
  if (photoDoc) {
    if (photoDoc.id) {
      return `/api/v1/documents/download/${photoDoc.id}`;
    }
    if (photoDoc.fileUrl) {
      return photoDoc.fileUrl.startsWith('/') || photoDoc.fileUrl.startsWith('http')
        ? photoDoc.fileUrl
        : `/api/v1/documents/download/${photoDoc.fileUrl}`;
    }
  }
  return getCategoryFallbackPhoto(item.category);
};
