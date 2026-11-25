import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { assistanceService, AssistanceRequestItem } from '../services/assistanceService';
import { documentService } from '../services/documentService';
import { storyService, StoryItem } from '../services/storyService';
import { PlusCircle, FileText, Upload, Clock, Sparkles, Shield } from 'lucide-react';
import { isImageDocument } from '../utils/mediaUtils';
import { CreateStoryModal } from '../components/CreateStoryModal';

export const MyRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<AssistanceRequestItem[]>([]);
  const [myStories, setMyStories] = useState<StoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);

  useEffect(() => {
    loadMyRequests();
    loadMyStories();
  }, []);

  const loadMyRequests = () => {
    setIsLoading(true);
    assistanceService
      .getMyRequests()
      .then(setRequests)
      .catch((err) => console.error('Failed to load my requests', err))
      .finally(() => setIsLoading(false));
  };

  const loadMyStories = () => {
    storyService
      .getMyStories()
      .then(setMyStories)
      .catch((err) => console.error('Failed to load my stories', err));
  };

  const handleFileUpload = async (requestId: number, file: File) => {
    try {
      await documentService.uploadDocument(requestId, file);
      setUploadMessage(`Document "${file.name}" uploaded successfully!`);
      loadMyRequests();
      setTimeout(() => setUploadMessage(null), 4000);
    } catch (err: any) {
      alert(`Upload error: ${err?.message || 'Could not upload file'}`);
    }
  };

  const formatCountdown = (seconds?: number) => {
    if (!seconds || seconds <= 0) return 'Expired (48h Window Ended)';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `Live: ${hours}h ${minutes}m left`;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>My Assistance Applications</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Track the status of your submitted assistance requests and attach supporting documents
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setIsStoryModalOpen(true)}
            className="btn btn-sm"
            style={{
              background: '#dc2626',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              borderRadius: '8px',
              padding: '0.55rem 1.15rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.35)',
              cursor: 'pointer',
            }}
          >
            <Clock size={16} /> Post 48-Hour Urgent Story (Max $500)
          </button>
          <Link to="/request-aid" className="btn btn-primary btn-sm">
            <PlusCircle size={18} /> New Application
          </Link>
        </div>
      </div>

      {/* 48-Hour Urgent Stories Section */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={20} color="#dc2626" />
              My 48-Hour Urgent Stories (Max $500 Limit)
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Emergency micro-aid requests featured on the community story carousel for 48 hours
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsStoryModalOpen(true)}
            className="btn btn-outline btn-sm"
            style={{ borderColor: '#dc2626', color: '#dc2626', fontWeight: 600 }}
          >
            + Post Urgent Story
          </button>
        </div>

        {myStories.length === 0 ? (
          <div
            className="card"
            style={{
              padding: '1.75rem',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #fff7ed 0%, #ffffff 100%)',
              border: '1px dashed #fdba74',
              borderRadius: '12px',
            }}
          >
            <Sparkles size={32} color="#f97316" style={{ margin: '0 auto 0.5rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.35rem' }}>
              No Active 48-Hour Stories
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto 1rem' }}>
              Have an immediate emergency need up to $500? Post an urgent story to get featured front-and-center on the donor homepage for 48 hours.
            </p>
            <button
              type="button"
              onClick={() => setIsStoryModalOpen(true)}
              className="btn btn-sm"
              style={{ background: '#dc2626', color: '#ffffff', fontWeight: 700, border: 'none' }}
            >
              Post 48-Hour Urgent Story (Max $500)
            </button>
          </div>
        ) : (
          <div className="grid-3">
            {myStories.map((story) => {
              const isLive = story.secondsRemaining > 0 && story.status !== 'EXPIRED';
              const pct = Math.min(100, Math.round(((story.raisedAmount || 0) / story.targetAmount) * 100));
              return (
                <div
                  key={story.id}
                  className="card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    border: isLive ? '1.5px solid #fca5a5' : '1px solid var(--border)',
                    boxShadow: isLive ? '0 4px 15px rgba(220, 38, 38, 0.12)' : undefined,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span className="badge badge-active">{story.category}</span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '9999px',
                        background: isLive ? '#fee2e2' : '#f1f5f9',
                        color: isLive ? '#991b1b' : '#64748b',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Clock size={12} />
                      {formatCountdown(story.secondsRemaining)}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--secondary)' }}>
                    {story.title}
                  </h3>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1rem', flex: 1, lineClamp: 2 }}>
                    {story.description}
                  </p>

                  <div style={{ marginTop: 'auto' }}>
                    <div className="progress-bar-container">
                      <div className="progress-bar-fill" style={{ width: `${pct}%`, background: '#dc2626' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '4px' }}>
                      <span style={{ fontWeight: 700, color: '#16a34a' }}>
                        ${(story.raisedAmount || 0).toLocaleString()} raised
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        Target: ${story.targetAmount.toLocaleString()} ({pct}%)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Humanitarian Aid Category Spotlight */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--secondary)', margin: 0 }}>
              Assistance Categories Available for Community Funding
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Select a category to apply for aid with photo evidence and video appeals
            </p>
          </div>
          <Link to="/request-aid" className="btn btn-outline btn-sm">
            View Application Form →
          </Link>
        </div>

        <div className="grid-4">
          <div className="card" style={{ padding: '0.85rem', overflow: 'hidden', textAlign: 'center' }}>
            <div className="initiative-card-media" style={{ height: '120px', marginBottom: '0.65rem' }}>
              <img src="https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=400&q=80" alt="Medical Care" />
              <div className="initiative-card-badge">
                <span className="badge badge-active" style={{ fontSize: '0.7rem' }}>Medical</span>
              </div>
            </div>
            <strong style={{ fontSize: '0.9rem', display: 'block', color: 'var(--secondary)' }}>Critical Healthcare</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Surgery, Dialysis, Medication</span>
          </div>

          <div className="card" style={{ padding: '0.85rem', overflow: 'hidden', textAlign: 'center' }}>
            <div className="initiative-card-media" style={{ height: '120px', marginBottom: '0.65rem' }}>
              <img src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=400&q=80" alt="Food Aid" />
              <div className="initiative-card-badge">
                <span className="badge badge-active" style={{ fontSize: '0.7rem' }}>Food Relief</span>
              </div>
            </div>
            <strong style={{ fontSize: '0.9rem', display: 'block', color: 'var(--secondary)' }}>Nutritional Rations</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Staple grain kits & water</span>
          </div>

          <div className="card" style={{ padding: '0.85rem', overflow: 'hidden', textAlign: 'center' }}>
            <div className="initiative-card-media" style={{ height: '120px', marginBottom: '0.65rem' }}>
              <img src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=400&q=80" alt="Education" />
              <div className="initiative-card-badge">
                <span className="badge badge-active" style={{ fontSize: '0.7rem' }}>Education</span>
              </div>
            </div>
            <strong style={{ fontSize: '0.9rem', display: 'block', color: 'var(--secondary)' }}>Child Schooling</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tuition fees & textbook kits</span>
          </div>

          <div className="card" style={{ padding: '0.85rem', overflow: 'hidden', textAlign: 'center' }}>
            <div className="initiative-card-media" style={{ height: '120px', marginBottom: '0.65rem' }}>
              <img src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=400&q=80" alt="Shelter" />
              <div className="initiative-card-badge">
                <span className="badge badge-active" style={{ fontSize: '0.7rem' }}>Housing</span>
              </div>
            </div>
            <strong style={{ fontSize: '0.9rem', display: 'block', color: 'var(--secondary)' }}>Emergency Shelter</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Disaster repair & tarpaulins</span>
          </div>
        </div>
      </div>

      {uploadMessage && (
        <div className="alert alert-success">
          <span>{uploadMessage}</span>
        </div>
      )}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading your applications...</div>
      ) : requests.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem' }}>
          <FileText size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Applications Found</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            You haven't submitted any assistance requests yet.
          </p>
          <Link to="/request-aid" className="btn btn-primary">
            Apply for Assistance
          </Link>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Target Amount</th>
                <th>Raised</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((item) => {
                const photoDoc = item.documents?.find(isImageDocument);
                return (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {photoDoc ? (
                          <img
                            src={`/api/v1/documents/download/${photoDoc.id}`}
                            alt={item.title}
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '6px',
                              objectFit: 'cover',
                              flexShrink: 0,
                              border: '1px solid var(--border-color)',
                            }}
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : null}
                        <div>
                          <strong>{item.title}</strong>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Submitted: {new Date(item.createdAt).toLocaleDateString()}
                            {item.documents && item.documents.length > 0 && (
                              <span style={{ marginLeft: '6px', color: 'var(--primary)', fontWeight: 600 }}>
                                • {item.documents.length} file{item.documents.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          {item.isAnonymous ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#1e40af', background: '#eff6ff', fontSize: '0.725rem', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 600, marginTop: '3px' }}>
                              <Shield size={11} color="#2563eb" /> Anonymous to Public
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.725rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                              Public Request
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                  <td>{item.category}</td>
                  <td>${item.targetAmount.toLocaleString()}</td>
                  <td>
                    <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                      ${(item.raisedAmount || 0).toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${item.status.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${item.priority.toLowerCase()}`}>
                      {item.priority}
                    </span>
                  </td>
                  <td>
                    <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                      <Upload size={14} /> Attach Doc
                      <input
                        type="file"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleFileUpload(item.id, e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 48-Hour Urgent Story Modal */}
      <CreateStoryModal
        isOpen={isStoryModalOpen}
        onClose={() => setIsStoryModalOpen(false)}
        onStoryCreated={() => {
          loadMyStories();
          setUploadMessage('🎉 Your 48-hour urgent story was published successfully and is now featured on the community carousel!');
          setTimeout(() => setUploadMessage(null), 6000);
        }}
      />
    </div>
  );
};
