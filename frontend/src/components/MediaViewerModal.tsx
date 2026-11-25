import React, { useState } from 'react';
import { DocumentItem } from '../services/assistanceService';
import { X, Image as ImageIcon, Video as VideoIcon, ChevronLeft, ChevronRight, Download } from 'lucide-react';

interface MediaViewerModalProps {
  mediaType: 'photo' | 'video';
  documents: DocumentItem[];
  causeTitle: string;
  onClose: () => void;
}

export const MediaViewerModal: React.FC<MediaViewerModalProps> = ({
  mediaType,
  documents,
  causeTitle,
  onClose,
}) => {
  const isImage = (doc: DocumentItem) =>
    (doc.fileType && doc.fileType.startsWith('image/')) ||
    /\.(jpe?g|png|webp|gif)$/i.test(doc.fileName);

  const isVideo = (doc: DocumentItem) =>
    (doc.fileType && doc.fileType.startsWith('video/')) ||
    /\.(mp4|webm|mov|avi|mkv)$/i.test(doc.fileName);

  const filteredMedia = documents.filter((d) => (mediaType === 'photo' ? isImage(d) : isVideo(d)));
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentDoc = filteredMedia[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : filteredMedia.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < filteredMedia.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1050 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '850px',
          width: 'min(850px, 96vw)',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: '#0f172a',
          color: '#ffffff',
          borderRadius: '16px',
          padding: 'clamp(1rem, 3vw, 1.75rem)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            borderBottom: '1px solid #334155',
            paddingBottom: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {mediaType === 'photo' ? (
              <div
                style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#60a5fa',
                  padding: '8px',
                  borderRadius: '10px',
                  display: 'flex',
                }}
              >
                <ImageIcon size={22} />
              </div>
            ) : (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#f87171',
                  padding: '8px',
                  borderRadius: '10px',
                  display: 'flex',
                }}
              >
                <VideoIcon size={22} />
              </div>
            )}
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>
                {mediaType === 'photo' ? 'Photo Evidence & Gallery' : 'Beneficiary Video Appeal'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.825rem', color: '#94a3b8' }}>
                Cause: <strong>{causeTitle}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#cbd5e1',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Media Container */}
        {filteredMedia.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94a3b8' }}>
            {mediaType === 'photo' ? (
              <>
                <ImageIcon size={52} color="#475569" style={{ margin: '0 auto 1rem' }} />
                <p style={{ fontSize: '1.05rem', margin: '0 0 0.5rem', color: '#cbd5e1' }}>
                  No photos uploaded for this assistance request yet.
                </p>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  The beneficiary has provided certified written verification details.
                </p>
              </>
            ) : (
              <>
                <VideoIcon size={52} color="#475569" style={{ margin: '0 auto 1rem' }} />
                <p style={{ fontSize: '1.05rem', margin: '0 0 0.5rem', color: '#cbd5e1' }}>
                  No video appeal uploaded for this assistance request yet.
                </p>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Beneficiaries can upload video appeals directly from the aid application form.
                </p>
              </>
            )}
          </div>
        ) : (
          <div>
            <div
              style={{
                position: 'relative',
                background: '#020617',
                borderRadius: '12px',
                overflow: 'hidden',
                minHeight: '220px',
                maxHeight: 'clamp(240px, 55vh, 500px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {mediaType === 'photo' ? (
                <img
                  src={`/api/v1/documents/download/${currentDoc.id}`}
                  alt={currentDoc.fileName}
                  style={{
                    maxWidth: '100%',
                    maxHeight: 'clamp(240px, 55vh, 480px)',
                    objectFit: 'contain',
                    borderRadius: '8px',
                  }}
                />
              ) : (
                <video
                  key={currentDoc.id}
                  controls
                  autoPlay
                  playsInline
                  style={{
                    maxWidth: '100%',
                    maxHeight: 'clamp(240px, 55vh, 480px)',
                    width: '100%',
                    borderRadius: '8px',
                    backgroundColor: '#000000',
                  }}
                >
                  <source src={`/api/v1/documents/download/${currentDoc.id}`} type={currentDoc.fileType} />
                  Your browser does not support HTML5 video playback.
                </video>
              )}

              {/* Navigation Arrows for multi-media */}
              {filteredMedia.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(0, 0, 0, 0.6)',
                      border: 'none',
                      color: '#ffffff',
                      borderRadius: '50%',
                      width: 40,
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={handleNext}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(0, 0, 0, 0.6)',
                      border: 'none',
                      color: '#ffffff',
                      borderRadius: '50%',
                      width: 40,
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>

            {/* Footer with Details */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '1rem',
                fontSize: '0.85rem',
                color: '#94a3b8',
              }}
            >
              <div>
                <span>
                  {currentDoc.fileName} ({Math.round(currentDoc.fileSizeBytes / 1024)} KB)
                </span>
                {filteredMedia.length > 1 && (
                  <span style={{ marginLeft: '12px', color: '#60a5fa', fontWeight: 600 }}>
                    [{currentIndex + 1} of {filteredMedia.length}]
                  </span>
                )}
              </div>

              <a
                href={`/api/v1/documents/download/${currentDoc.id}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-sm"
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: 'none',
                }}
              >
                <Download size={14} /> Open Full Asset
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
