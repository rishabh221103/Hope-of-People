import React, { useState } from 'react';
import { X, Upload, Video, AlertCircle, Film, CheckCircle, MapPin, ShieldCheck, Loader2, LogIn } from 'lucide-react';
import { reelService, ReelItem } from '../services/reelService';
import { useAuth } from '../context/AuthContext';

interface CreateReelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newReel: ReelItem) => void;
}

const CATEGORIES = [
  { value: 'GENERAL', label: 'General / Story' },
  { value: 'HEALTHCARE', label: 'Healthcare' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'MICRO_ENTERPRISE', label: 'Micro-Enterprise' },
  { value: 'HOUSING', label: 'Housing' },
  { value: 'EMERGENCY_AID', label: 'Emergency Aid' },
  { value: 'COMMUNITY', label: 'Community' },
];

export const CreateReelModal: React.FC<CreateReelModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [category, setCategory] = useState<string>('GENERAL');
  const [sourceLocation, setSourceLocation] = useState<string>('');
  const [consentGiven, setConsentGiven] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        setError('Please select a valid video file (MP4, WebM).');
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        setError('Video file exceeds maximum allowed limit of 100MB.');
        return;
      }
      setVideoFile(file);
      setPreviewSrc(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim()) {
      setError('Please provide a caption or description for your reel.');
      return;
    }

    if (activeTab === 'upload' && !videoFile) {
      setError('Please choose a video file to upload.');
      return;
    }

    if (activeTab === 'url' && !videoUrl.trim()) {
      setError('Please enter a valid video URL.');
      return;
    }

    if (!consentGiven) {
      setError('You must confirm that this video does not expose personal details of beneficiaries without consent.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let created: ReelItem;

      if (activeTab === 'upload' && videoFile) {
        const formData = new FormData();
        formData.append('video', videoFile);
        formData.append('caption', caption.trim());
        formData.append('category', category);
        formData.append('consentGiven', 'true');
        if (sourceLocation.trim()) formData.append('sourceLocation', sourceLocation.trim());

        created = await reelService.uploadReelVideo(formData);
      } else {
        created = await reelService.createReel({
          videoUrl: videoUrl.trim(),
          caption: caption.trim(),
          durationSeconds: 15,
        });
      }

      onCreated(created);
      handleClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create reel.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setVideoFile(null);
    setVideoUrl('');
    setCaption('');
    setCategory('GENERAL');
    setSourceLocation('');
    setConsentGiven(false);
    setPreviewSrc(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        backgroundColor: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '560px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
              padding: '0.45rem',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Film size={20} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                Upload Impact Reel
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
                Share video proof, source updates, or inspiring stories of recovery
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} style={{
          padding: '1.25rem 1.5rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          flex: 1,
        }}>
          {error && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '0.75rem 1rem',
              color: '#f87171',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {!isAuthenticated && (
            <div style={{
              backgroundColor: 'rgba(234, 179, 8, 0.12)',
              border: '1px solid rgba(234, 179, 8, 0.35)',
              borderRadius: '12px',
              padding: '0.75rem 1rem',
              color: '#fde047',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
            }}>
              <LogIn size={18} style={{ flexShrink: 0 }} />
              <span>You must be signed in to upload reels. Please log in first.</span>
            </div>
          )}

          {/* Mode Switcher */}
          <div style={{
            display: 'flex',
            backgroundColor: 'rgba(30, 41, 59, 0.6)',
            padding: '4px',
            borderRadius: '12px',
            gap: '4px',
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              style={{
                flex: 1,
                padding: '0.55rem',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: activeTab === 'upload' ? '#f43f5e' : 'transparent',
                color: activeTab === 'upload' ? '#ffffff' : '#94a3b8',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s ease',
              }}
            >
              <Upload size={14} />
              <span>Upload Video File</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              style={{
                flex: 1,
                padding: '0.55rem',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: activeTab === 'url' ? '#f43f5e' : 'transparent',
                color: activeTab === 'url' ? '#ffffff' : '#94a3b8',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s ease',
              }}
            >
              <Video size={14} />
              <span>External Video URL</span>
            </button>
          </div>

          {/* File Picker */}
          {activeTab === 'upload' ? (
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Select Video File (MP4 or WebM • Max 100MB)
              </label>
              <label style={{
                border: '2px dashed #334155',
                borderRadius: '14px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                backgroundColor: 'rgba(15, 23, 42, 0.4)',
                transition: 'border-color 0.2s ease',
              }}>
                <input
                  type="file"
                  accept="video/mp4,video/webm"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                {previewSrc ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
                    <video
                      src={previewSrc}
                      style={{ maxHeight: '160px', borderRadius: '10px', objectFit: 'contain', backgroundColor: '#000000' }}
                      controls
                    />
                    <span style={{ fontSize: '0.75rem', color: '#f43f5e', fontWeight: 600 }}>Click to replace file</span>
                  </div>
                ) : (
                  <>
                    <Upload size={32} color="#64748b" style={{ marginBottom: '0.5rem' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9' }}>Click to select vertical video</span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>MP4 or WebM up to 100MB</span>
                  </>
                )}
              </label>
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Video Direct URL (MP4 / WebM)
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://example.com/videos/impact-story.mp4"
                style={{
                  width: '100%',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '10px',
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.82rem',
                  color: '#ffffff',
                  outline: 'none',
                }}
              />
            </div>
          )}

          {/* Caption */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Caption & Impact Story *
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={2}
              placeholder="Tell viewers what this video showcases (e.g. 'Prosthetic limb delivery and mobility training in Pune workshop')..."
              style={{
                width: '100%',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '10px',
                padding: '0.65rem 0.85rem',
                fontSize: '0.82rem',
                color: '#ffffff',
                outline: 'none',
                resize: 'none',
              }}
            />
          </div>

          {/* Category & Location */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '10px',
                  padding: '0.65rem 0.75rem',
                  fontSize: '0.8rem',
                  color: '#ffffff',
                  outline: 'none',
                }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <MapPin size={13} color="#f43f5e" />
                <span>Location (Optional)</span>
              </label>
              <input
                type="text"
                value={sourceLocation}
                onChange={(e) => setSourceLocation(e.target.value)}
                placeholder="e.g. Pune, MH"
                style={{
                  width: '100%',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '10px',
                  padding: '0.65rem 0.75rem',
                  fontSize: '0.8rem',
                  color: '#ffffff',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Mandatory Dignity & Privacy Consent Checkbox */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '12px',
            padding: '0.85rem 1rem',
          }}>
            <input
              type="checkbox"
              id="consentGiven"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              style={{
                marginTop: '3px',
                width: '16px',
                height: '16px',
                cursor: 'pointer',
                accentColor: '#f43f5e',
                flexShrink: 0,
              }}
            />
            <label htmlFor="consentGiven" style={{ fontSize: '0.78rem', color: '#e2e8f0', lineHeight: 1.45, cursor: 'pointer' }}>
              <span style={{ fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '2px' }}>
                <ShieldCheck size={14} /> Dignity & Consent Confirmation:
              </span>
              I confirm that this video does not expose personal, medical, or vulnerable details of assistance beneficiaries without their explicit consent, and complies with HOP dignity standards.
            </label>
          </div>
        </form>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid #1e293b',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.75rem',
          backgroundColor: '#090d16',
        }}>
          <button
            type="button"
            onClick={handleClose}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #334155',
              color: '#94a3b8',
              borderRadius: '10px',
              padding: '0.6rem 1.2rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '0.6rem 1.4rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(244, 63, 94, 0.4)',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Uploading Reel...</span>
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                <span>Submit for Review</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
