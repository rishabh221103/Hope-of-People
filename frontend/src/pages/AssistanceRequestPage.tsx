import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { assistanceService } from '../services/assistanceService';
import { documentService } from '../services/documentService';
import {
  AlertCircle,
  Heart,
  ArrowRight,
  Image as ImageIcon,
  Video as VideoIcon,
  DollarSign,
  FileText,
  UploadCloud,
  CheckCircle,
  Trash2,
  Shield,
  EyeOff,
  Lock,
} from 'lucide-react';

export const AssistanceRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const isDonor = hasRole('ROLE_DONOR');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('EDUCATION');
  const [targetAmount, setTargetAmount] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [consentGiven, setConsentGiven] = useState(true);

  // Dedicated Media States
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [docFiles, setDocFiles] = useState<File[]>([]);

  // Previews
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const categories = [
    { value: 'EDUCATION', label: '🎓 Education & School Fees' },
    { value: 'FOOD', label: '🛒 Food & Daily Essentials' },
    { value: 'UTILITIES', label: '💡 Utilities & Household Bills' },
    { value: 'EMERGENCY', label: '🛡️ Insurance & Emergency Relief' },
    { value: 'BUSINESS', label: '💼 Business & Self-Reliance Hardships' },
    { value: 'MEDICAL', label: '🏥 Medical & Surgery Support' },
    { value: 'HOUSING', label: '🏠 Housing & Shelter Repairs' },
    { value: 'ELDER_CARE', label: '👥 Senior & Destitute Elder Care' },
  ];

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      setPhotoFiles((prev) => [...prev, ...filesArr]);

      // Generate object URLs for immediate preview
      const newPreviews = filesArr.map((f) => URL.createObjectURL(f));
      setPhotoPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const v = e.target.files[0];
      setVideoFile(v);
      setVideoPreview(URL.createObjectURL(v));
    }
  };

  const removeVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
  };

  const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(targetAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please specify the donation limit needed for your cause ($).');
      return;
    }

    if (!consentGiven) {
      setError('You must accept the Consent & Dignity Agreement to submit your assistance request.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setUploadStatus('Creating assistance request...');

    try {
      const created = await assistanceService.createRequest({
        title,
        description,
        category,
        targetAmount: amount,
        priority,
        isAnonymous,
        consentGiven,
      });

      // Combine all files to upload
      const allUploads: File[] = [...photoFiles, ...docFiles];
      if (videoFile) {
        allUploads.push(videoFile);
      }

      if (allUploads.length > 0) {
        for (let i = 0; i < allUploads.length; i++) {
          const f = allUploads[i];
          setUploadStatus(`Uploading media asset ${i + 1} of ${allUploads.length}: ${f.name}...`);
          try {
            await documentService.uploadDocument(created.id, f);
          } catch (fileErr: any) {
            console.error(`Failed to upload ${f.name}:`, fileErr);
          }
        }
      }

      setUploadStatus('Application submitted successfully!');
      setTimeout(() => {
        navigate('/my-requests');
      }, 500);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit assistance application.');
      setIsSubmitting(false);
      setUploadStatus(null);
    }
  };

  if (isDonor) {
    return (
      <div style={{ maxWidth: '640px', margin: '3rem auto' }}>
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              color: 'var(--primary)',
            }}
          >
            <Heart size={30} fill="var(--primary)" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            Donor Account Notice
          </h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.75rem' }}>
            You are currently logged in with a <strong>Donor</strong> profile. Assistance applications are reserved for beneficiaries seeking aid. You can view, search, and support all community initiatives directly from your Donor Dashboard.
          </p>
          <Link to="/donor-dashboard" className="btn btn-primary btn-lg">
            Go to Donor Dashboard <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '760px', margin: '1rem auto 3rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <span className="badge badge-active" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>
          Beneficiary Aid Application
        </span>
        <h1 style={{ fontSize: '2.15rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Apply for Assistance with Photos & Video
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Create your fundraising appeal by adding a photo gallery, video message, and setting the exact donation limit required.
        </p>
      </div>

      <div className="card" style={{ padding: '2.25rem' }}>
        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {uploadStatus && (
          <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} />
            <span>{uploadStatus}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700 }}>Initiative Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Critical Medical Surgery & Post-Op Treatment for Child"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-control"
            />
          </div>

          {/* Category & Urgency */}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="form-control"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>Urgency / Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="form-control"
              >
                <option value="LOW">Low - General long-term assistance</option>
                <option value="MEDIUM">Medium - Normal assistance needed within weeks</option>
                <option value="HIGH">High - Urgent need within days</option>
                <option value="URGENT">Urgent - Immediate critical emergency</option>
              </select>
            </div>
          </div>

          {/* Target Donation Limit Needed */}
          <div
            className="form-group"
            style={{
              background: '#f8fafc',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1.75rem',
            }}
          >
            <label className="form-label" style={{ fontWeight: 800, color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DollarSign size={18} color="var(--accent)" />
              Set Donation Limit: How Much Funding Do You Need? ($)
            </label>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 0.75rem' }}>
              Set the total financial threshold required for your assistance initiative. Donors will contribute toward this exact limit.
            </p>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontWeight: 700,
                  fontSize: '1.2rem',
                  color: 'var(--secondary)',
                }}
              >
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="5"
                required
                placeholder="e.g. 1500.00"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="form-control"
                style={{
                  paddingLeft: '32px',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color: 'var(--accent)',
                }}
              />
            </div>
          </div>

          {/* Detailed Description */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700 }}>Detailed Description of Situation & Need</label>
            <textarea
              required
              rows={5}
              placeholder="Provide a clear, detailed breakdown of the circumstances, what the funds will be used for, and the impact donor help will provide..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-control"
            />
          </div>

          {/* MEDIA SECTION 1: PHOTO UPLOAD */}
          <div
            style={{
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              background: 'var(--bg-main)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
              <ImageIcon size={20} color="var(--primary)" />
              <label style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                Upload Campaign Photos (Option for Donors to See Photos)
              </label>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Attach photos of the condition, estimates, or patient/family (JPG, PNG, WebP). Donors will be able to review these photos.
            </p>

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoChange}
              className="form-control"
              style={{ marginBottom: '1rem' }}
            />

            {/* Photo Previews */}
            {photoPreviews.length > 0 && (
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                {photoPreviews.map((src, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'relative',
                      width: 90,
                      height: 90,
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '2px solid var(--primary)',
                    }}
                  >
                    <img
                      src={src}
                      alt={`Upload preview ${i}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        background: 'rgba(0,0,0,0.7)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MEDIA SECTION 2: VIDEO APPEAL UPLOAD */}
          <div
            style={{
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              background: 'var(--bg-main)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
              <VideoIcon size={20} color="#dc2626" />
              <label style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                Upload Video Appeal (Option for Donors to See Video)
              </label>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Upload a short video message explaining your need (MP4, WebM, MOV, max 100MB). Donors will have a dedicated button to watch your video.
            </p>

            <input
              type="file"
              accept="video/*,.mp4,.webm,.mov"
              onChange={handleVideoChange}
              className="form-control"
              style={{ marginBottom: '1rem' }}
            />

            {/* Video Preview */}
            {videoPreview && (
              <div style={{ marginTop: '0.75rem', position: 'relative' }}>
                <video
                  src={videoPreview}
                  controls
                  style={{
                    maxWidth: '100%',
                    maxHeight: '240px',
                    borderRadius: '8px',
                    border: '2px solid #dc2626',
                    background: '#000000',
                  }}
                />
                <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {videoFile?.name} ({Math.round((videoFile?.size || 0) / (1024 * 1024))} MB)
                  </span>
                  <button
                    type="button"
                    onClick={removeVideo}
                    className="btn btn-outline btn-sm"
                    style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                  >
                    <Trash2 size={14} /> Remove Video
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ADDITIONAL DOCUMENTS (Optional) */}
          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={16} /> Certified Proof Documents (PDF, Hospital Invoices, Bills)
            </label>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx"
              onChange={handleDocChange}
              className="form-control"
            />
            {docFiles.length > 0 && (
              <small style={{ color: 'var(--accent)', fontWeight: 600, display: 'block', marginTop: '0.4rem' }}>
                {docFiles.length} verification file(s) attached.
              </small>
            )}
          </div>

          {/* DIGNITY & PRIVACY PROTOCOLS (PDF Specification) */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.65rem' }}>
              <Shield size={18} color="var(--primary)" />
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--secondary)' }}>
                Dignity & Privacy Protocols
              </h4>
            </div>
            
            {/* Anonymous Toggle */}
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                cursor: 'pointer',
                marginBottom: '0.85rem',
                padding: '0.75rem',
                borderRadius: '8px',
                background: isAnonymous ? '#eff6ff' : '#ffffff',
                border: isAnonymous ? '1px solid #93c5fd' : '1px solid #e2e8f0',
                transition: 'all 0.2s ease',
              }}
            >
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                style={{ marginTop: '3px', cursor: 'pointer' }}
              />
              <div>
                <strong style={{ fontSize: '0.9rem', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <EyeOff size={15} />
                  Request Anonymously (Dignity Guardrail)
                </strong>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                  Keep your real name and email private from the public feed. Your appeal will appear as <strong>"Anonymous Beneficiary (HOP Verified)"</strong>. Only verified platform admins and direct donors who fund your cause can view recipient details.
                </p>
              </div>
            </label>

            {/* Consent Checkbox */}
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                cursor: 'pointer',
                padding: '0.75rem',
                borderRadius: '8px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
              }}
            >
              <input
                type="checkbox"
                required
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                style={{ marginTop: '3px', cursor: 'pointer' }}
              />
              <div>
                <strong style={{ fontSize: '0.875rem', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lock size={14} />
                  Consent & Dignity Verification Agreement *
                </strong>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                  I consent for HOP to review my uploaded bills/documents to verify genuine hardship and present my cause to kind-hearted donors.
                </p>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', padding: '0.95rem' }}
          >
            <UploadCloud size={20} />
            {isSubmitting ? (uploadStatus || 'Submitting Request...') : 'Publish Assistance Request with Media'}
          </button>
        </form>
      </div>
    </div>
  );
};
