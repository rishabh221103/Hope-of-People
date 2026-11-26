import React, { useState, useEffect } from 'react';
import { X, Mic, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { podcastService, PodcastItem } from '../services/podcastService';
import { assistanceService, AssistanceRequestItem } from '../services/assistanceService';

interface CreatePodcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPodcastCreated: (podcast: PodcastItem) => void;
}

export const CreatePodcastModal: React.FC<CreatePodcastModalProps> = ({
  isOpen,
  onClose,
  onPodcastCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hostName, setHostName] = useState('');
  const [guestName, setGuestName] = useState('');
  const [category, setCategory] = useState('Healthcare & Healing');
  const [audioUrl, setAudioUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [durationSeconds, setDurationSeconds] = useState<number>(300);
  const [assistanceRequestId, setAssistanceRequestId] = useState<number | ''>('');
  const [myCauses, setMyCauses] = useState<AssistanceRequestItem[]>([]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const categories = [
    'Healthcare & Healing',
    'Self-Reliance & Small Business',
    'Inspiring Recovery Journeys',
    'Education & Mentorship',
    'General Community Voices',
  ];

  useEffect(() => {
    if (isOpen) {
      loadCauses();
    } else {
      resetForm();
    }
  }, [isOpen]);

  const loadCauses = async () => {
    try {
      const causes = await assistanceService.getMyRequests();
      setMyCauses(causes);
    } catch {
      // Non-fatal
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setHostName('');
    setGuestName('');
    setCategory('Healthcare & Healing');
    setAudioUrl('');
    setCoverImageUrl('');
    setDurationSeconds(300);
    setAssistanceRequestId('');
    setSelectedFile(null);
    setError(null);
    setSuccess(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    // Automatically detect duration from audio file metadata in browser
    try {
      const objectUrl = URL.createObjectURL(file);
      const audio = new Audio(objectUrl);
      audio.onloadedmetadata = () => {
        if (audio.duration && !isNaN(audio.duration)) {
          setDurationSeconds(Math.round(audio.duration));
        }
        URL.revokeObjectURL(objectUrl);
      };
    } catch {
      // Non-fatal if metadata read fails in browser
    }

    try {
      setUploadingFile(true);
      setError(null);
      const res = await podcastService.uploadAudio(file);
      setAudioUrl(res.audioUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to upload audio file.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioUrl.trim()) {
      setError('Please choose and upload an audio file from your device.');
      return;
    }
    if (title.trim().length < 5) {
      setError('Title must be at least 5 characters long.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const podcast = await podcastService.createPodcast({
        title: title.trim(),
        description: description.trim(),
        hostName: hostName.trim(),
        guestName: guestName.trim() ? guestName.trim() : undefined,
        category: category.trim(),
        audioUrl: audioUrl.trim(),
        coverImageUrl: coverImageUrl.trim() ? coverImageUrl.trim() : undefined,
        durationSeconds: durationSeconds || 0,
        assistanceRequestId: assistanceRequestId ? Number(assistanceRequestId) : undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        onPodcastCreated(podcast);
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Failed to publish podcast episode.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '620px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          padding: '1.75rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Mic size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Publish a Podcast Episode</h2>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>Share recovery talks, expert health advice, or self-reliance discussions.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.25rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#fef2f2',
              color: '#b91c1c',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '1rem',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#ecfdf5',
              color: '#047857',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '1rem',
            }}
          >
            <CheckCircle size={16} />
            <span>Podcast episode published successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Audio Upload From Device Only */}
          <div
            style={{
              border: audioUrl ? '2px solid #10b981' : '2px dashed #cbd5e1',
              borderRadius: '12px',
              padding: '1.5rem 1.25rem',
              textAlign: 'center',
              backgroundColor: audioUrl ? '#f0fdf4' : '#f8fafc',
              marginBottom: '1.25rem',
              transition: 'all 0.2s ease',
            }}
          >
            {audioUrl ? (
              <div>
                <CheckCircle size={32} style={{ color: '#10b981', marginBottom: '0.4rem' }} />
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#065f46', marginBottom: '0.2rem' }}>
                  {selectedFile ? selectedFile.name : 'Audio File Uploaded Successfully'}
                </div>
                {selectedFile && (
                  <p style={{ fontSize: '0.78rem', color: '#047857', margin: '0 0 0.75rem 0' }}>
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to stream
                  </p>
                )}
                <input
                  type="file"
                  id="audioFileInput"
                  accept="audio/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  disabled={uploadingFile}
                  onClick={() => document.getElementById('audioFileInput')?.click()}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#059669',
                    border: '1px solid #a7f3d0',
                    borderRadius: '8px',
                    padding: '0.45rem 1rem',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {uploadingFile ? 'Uploading...' : 'Replace Audio File'}
                </button>
              </div>
            ) : (
              <div>
                <Upload size={32} style={{ color: '#64748b', marginBottom: '0.4rem' }} />
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.2rem' }}>
                  Upload Audio File from Device
                </div>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0 0 0.85rem 0' }}>
                  Supports .mp3, .wav, .ogg, .m4a (Max 100MB)
                </p>
                <input
                  type="file"
                  id="audioFileInput"
                  accept="audio/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  disabled={uploadingFile}
                  onClick={() => document.getElementById('audioFileInput')?.click()}
                  style={{
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.55rem 1.4rem',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: uploadingFile ? 'not-allowed' : 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                >
                  {uploadingFile ? 'Uploading audio file...' : 'Choose Audio File'}
                </button>
              </div>
            )}
          </div>

          {/* Episode Title */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Episode Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Navigating Chronic Illness with Dignity & Community Support"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Host & Guest */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Host Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Dr. Ramesh Gupta"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Guest Speaker (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Elena Vance (Beneficiary)"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Category & Duration */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                  backgroundColor: '#ffffff',
                }}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Duration (Seconds)
              </label>
              <input
                type="number"
                min={30}
                placeholder="e.g. 900 (15 mins)"
                value={durationSeconds}
                onChange={(e) => setDurationSeconds(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Episode Synopsis / Description *
            </label>
            <textarea
              rows={3}
              placeholder="What will listeners learn? Who is featured in this episode?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.88rem',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Cover Image URL */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Cover Image URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/photo-..."
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Optional Linked Assistance Request */}
          {myCauses.length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Attach Linked Aid Request (Optional)
              </label>
              <select
                value={assistanceRequestId}
                onChange={(e) => setAssistanceRequestId(e.target.value ? Number(e.target.value) : '')}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  backgroundColor: '#ffffff',
                }}
              >
                <option value="">None (Standalone Podcast)</option>
                {myCauses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} (${c.raisedAmount} / ${c.targetAmount})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Submit Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '0.6rem 1.25rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploadingFile}
              style={{
                padding: '0.6rem 1.4rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: loading || uploadingFile ? '#93c5fd' : '#2563eb',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: loading || uploadingFile ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Publishing...' : 'Publish Episode'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
