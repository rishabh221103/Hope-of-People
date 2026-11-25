import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { assistanceService, AssistanceRequestItem, DocumentItem } from '../services/assistanceService';
import { donationService, DonationItem } from '../services/donationService';
import { DonationModal } from '../components/DonationModal';
import { MediaViewerModal } from '../components/MediaViewerModal';
import { ConnectButton } from '../components/ConnectButton';
import { HumanitarianStoryCarousel } from '../components/HumanitarianStoryCarousel';
import {
  Heart,
  DollarSign,
  Award,
  TrendingUp,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Image as ImageIcon,
  Video as VideoIcon,
  Shield,
} from 'lucide-react';
import { getInitiativeCoverUrl, getCategoryFallbackPhoto } from '../utils/mediaUtils';

export const DonorDashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [initiatives, setInitiatives] = useState<AssistanceRequestItem[]>([]);
  const [myDonations, setMyDonations] = useState<DonationItem[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<AssistanceRequestItem | null>(null);
  const [activeMedia, setActiveMedia] = useState<{
    type: 'photo' | 'video';
    documents: DocumentItem[];
    causeTitle: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const openMediaModal = (item: AssistanceRequestItem, type: 'photo' | 'video') => {
    setActiveMedia({
      type,
      documents: item.documents || [],
      causeTitle: item.title,
    });
  };

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'causes' | 'history'>('causes');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [causesData, donationsData] = await Promise.all([
        assistanceService.getPublicRequests(),
        donationService.getMyDonations().catch(() => [] as DonationItem[])
      ]);
      setInitiatives(causesData || []);
      setMyDonations(donationsData || []);
    } catch (err) {
      console.error('Failed to load donor dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute Donor Stats
  const totalDonated = myDonations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const uniqueCausesSupported = new Set(myDonations.map((d) => d.requestId)).size;

  // Filter Initiatives
  const filteredInitiatives = initiatives.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.userFullName && item.userFullName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'ALL' || item.category.toUpperCase() === selectedCategory.toUpperCase();

    return matchesSearch && matchesCategory;
  });

  const categories = ['ALL', 'EDUCATION', 'FOOD', 'UTILITIES', 'EMERGENCY', 'BUSINESS', 'MEDICAL', 'HOUSING', 'ELDER_CARE'];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Donor Hero Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #3b82f6 100%)',
          color: '#ffffff',
          padding: 'clamp(1.35rem, 4vw, 2.5rem)',
          borderRadius: '16px',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(29, 78, 216, 0.3)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '0.35rem 0.85rem',
                borderRadius: '9999px',
                fontSize: '0.825rem',
                fontWeight: 600,
                marginBottom: '0.75rem',
                backdropFilter: 'blur(4px)',
              }}
            >
              <Sparkles size={14} /> Donor Giving Dashboard
            </span>
            <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#ffffff' }}>
              Welcome back, {user?.firstName || 'Generous Donor'}!
            </h1>
            <p style={{ margin: 0, fontSize: 'clamp(0.9rem, 2.5vw, 1.05rem)', color: '#e0e7ff', maxWidth: '620px', lineHeight: 1.5 }}>
              Your contributions make an immediate, tangible difference. Review community assistance requests applied for by beneficiaries and donate with transparent tracking.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('causes')}
            className="btn"
            style={{
              background: '#ffffff',
              color: '#1d4ed8',
              fontWeight: 700,
              padding: '0.75rem 1.35rem',
              borderRadius: '10px',
              border: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            <Heart size={18} fill="#1d4ed8" /> Donate to a Cause
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid-3" style={{ marginBottom: '2.5rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.75rem' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '14px',
              background: 'var(--accent-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent)'
            }}
          >
            <DollarSign size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Contributed
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--secondary)' }}>
              ${totalDonated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.75rem' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '14px',
              background: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)'
            }}
          >
            <Heart size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Causes Supported
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--secondary)' }}>
              {uniqueCausesSupported} {uniqueCausesSupported === 1 ? 'Initiative' : 'Initiatives'}
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.75rem' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '14px',
              background: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d97706'
            }}
          >
            <Award size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Donations
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--secondary)' }}>
              {myDonations.length} {myDonations.length === 1 ? 'Contribution' : 'Contributions'}
            </div>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="alert alert-success" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CheckCircle size={20} />
          <span style={{ fontWeight: 600 }}>{successMessage}</span>
        </div>
      )}

      {/* Tabs Navigation (Responsive Scroll) */}
      <div className="tabs-scroll-container" style={{ display: 'flex', gap: '0.75rem', borderBottom: '2px solid var(--border-color)', marginBottom: '1.75rem' }}>
        <button
          onClick={() => setActiveTab('causes')}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.75rem 1rem',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
            color: activeTab === 'causes' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'causes' ? '3px solid var(--primary)' : '3px solid transparent',
            marginBottom: '-2px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          <TrendingUp size={18} /> Community Causes ({initiatives.length})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          style={{
            background: 'none',
            border: 'none',
            padding: '0.75rem 1rem',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
            color: activeTab === 'history' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'history' ? '3px solid var(--primary)' : '3px solid transparent',
            marginBottom: '-2px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          <Clock size={18} /> Giving History ({myDonations.length})
        </button>
      </div>

      {/* TAB 1: CAUSES SEEKING AID */}
      {activeTab === 'causes' && (
        <div>
          {/* Urgent Humanitarian Visual Spotlight */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
              <Sparkles size={18} color="var(--primary)" />
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--secondary)' }}>
                Urgent Beneficiary Stories Needing Immediate Aid
              </h3>
            </div>
            <HumanitarianStoryCarousel compact onDonateClick={(story) => setSelectedRequest({
              id: story.id,
              userId: 999,
              userFullName: story.beneficiaryName,
              userEmail: 'beneficiary@hop.org',
              title: story.title,
              description: story.description,
              category: story.category,
              targetAmount: story.targetAmount,
              raisedAmount: story.raisedAmount,
              status: 'APPROVED',
              priority: 'URGENT',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              documents: [],
            })} />
          </div>

          {/* Search & Filter Header (Responsive) */}
          <div
            className="card filter-toolbar"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
              padding: '1rem 1.25rem',
            }}
          >
            <div style={{ position: 'relative', flex: '1 1 300px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search causes by title, description, or beneficiary..."
                className="form-control"
                style={{ paddingLeft: '38px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Filter size={16} color="var(--text-muted)" />
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="form-control"
                style={{ width: 'auto', padding: '0.45rem 1rem' }}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'ALL' ? 'All Categories' : cat.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--text-muted)' }}>Loading initiatives...</p>
            </div>
          ) : filteredInitiatives.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
              <Heart size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Initiatives Found</h3>
              <p style={{ color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto' }}>
                There are currently no active assistance requests matching your criteria. Once beneficiaries submit aid applications, they will immediately reflect here for funding.
              </p>
            </div>
          ) : (
            <div className="grid-3">
              {filteredInitiatives.map((item) => {
                const raised = item.raisedAmount || 0;
                const pct = Math.min(100, Math.round((raised / item.targetAmount) * 100));
                const isFulfilled = raised >= item.targetAmount || item.status === 'FULFILLED';
                const coverImg = getInitiativeCoverUrl(item);

                return (
                  <div
                    key={item.id}
                    className="card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      border: '1px solid var(--border-color)',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    }}
                  >
                    {/* Animated Cover Photo */}
                    <div className="initiative-card-media">
                      <img
                        src={coverImg}
                        alt={item.title}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = getCategoryFallbackPhoto(item.category);
                        }}
                      />
                      <div className="initiative-card-badge">
                        <span className="badge badge-active">{item.category.replace('_', ' ')}</span>
                      </div>
                      <div className="initiative-card-urgency">
                        {item.status === 'APPROVED' ? (
                          <span className="badge" style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.75rem', fontWeight: 600 }}>
                            Verified
                          </span>
                        ) : (
                          <span className="badge badge-pending" style={{ fontSize: '0.75rem' }}>
                            Open for Aid
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--secondary)' }}>
                      {item.title}
                    </h3>

                    {item.isAnonymous ? (
                      <div style={{ fontSize: '0.8rem', color: '#1e40af', background: '#eff6ff', padding: '0.25rem 0.6rem', borderRadius: '6px', marginBottom: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '5px', width: 'fit-content' }}>
                        <Shield size={13} color="#2563eb" />
                        <span>{item.isDirectDonorOrAdmin ? `Anonymous (Verified: ${item.userFullName})` : 'Anonymous Beneficiary (HOP Verified)'}</span>
                      </div>
                    ) : item.userFullName ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', gap: '0.5rem' }}>
                        <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                          Applied by: <span style={{ fontWeight: 600, color: 'var(--secondary)' }}>{item.userFullName}</span>
                        </div>
                        {item.userId && (
                          <ConnectButton targetUserId={item.userId} targetUserName={item.userFullName} compact />
                        )}
                      </div>
                    ) : null}

                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '1.25rem', flex: 1 }}>
                      {item.description}
                    </p>

                    <div style={{ marginTop: 'auto', background: 'var(--bg-main)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                      <div className="progress-bar-container" style={{ height: '8px', marginBottom: '0.5rem' }}>
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${pct}%`,
                            background: isFulfilled ? 'var(--accent)' : 'linear-gradient(90deg, #3b82f6, #1d4ed8)'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--accent)' }}>
                          ${raised.toLocaleString()} raised
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          Goal: ${item.targetAmount.toLocaleString()} ({pct}%)
                        </span>
                      </div>
                    </div>

                    {/* Donor Media Options: 1. See Photos, 2. See Video */}
                    {(() => {
                      const docs = item.documents || [];
                      const photoCount = docs.filter(
                        (d) => (d.fileType && d.fileType.startsWith('image/')) || /\.(jpe?g|png|webp|gif)$/i.test(d.fileName)
                      ).length;
                      const videoCount = docs.filter(
                        (d) => (d.fileType && d.fileType.startsWith('video/')) || /\.(mp4|webm|mov|avi|mkv)$/i.test(d.fileName)
                      ).length;

                      return (
                        <div className="card-media-actions">
                          <button
                            type="button"
                            onClick={() => openMediaModal(item, 'photo')}
                            className="btn btn-outline btn-sm"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              fontSize: '0.825rem',
                              padding: '0.5rem 0.35rem',
                              borderColor: photoCount > 0 ? 'var(--primary)' : 'var(--border)',
                              background: photoCount > 0 ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                              minHeight: '38px',
                            }}
                          >
                            <ImageIcon size={16} color="var(--primary)" />
                            <span>See Photos {photoCount > 0 ? `(${photoCount})` : ''}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openMediaModal(item, 'video')}
                            className="btn btn-outline btn-sm"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              fontSize: '0.825rem',
                              padding: '0.5rem 0.35rem',
                              borderColor: videoCount > 0 ? '#dc2626' : 'var(--border)',
                              background: videoCount > 0 ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                              minHeight: '38px',
                            }}
                          >
                            <VideoIcon size={16} color="#dc2626" />
                            <span>See Video {videoCount > 0 ? `(${videoCount})` : ''}</span>
                          </button>
                        </div>
                      );
                    })()}

                    {isFulfilled ? (
                      <button className="btn btn-secondary" disabled style={{ width: '100%', cursor: 'not-allowed' }}>
                        <CheckCircle size={16} /> Fully Funded!
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedRequest(item)}
                        className="btn btn-primary"
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      >
                        <Heart size={16} fill="#ffffff" /> Donate Now
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY GIVING HISTORY */}
      {activeTab === 'history' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>My Contribution Records</h3>

          {myDonations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <Heart size={44} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '1.25rem' }}>
                You haven't made any contributions yet. Support a community initiative to see your records here!
              </p>
              <button onClick={() => setActiveTab('causes')} className="btn btn-primary">
                Browse Causes & Donate <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Transaction Ref</th>
                    <th>Initiative / Cause</th>
                    <th>Amount</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myDonations.map((d) => (
                    <tr key={d.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)' }}>
                        {d.transactionRef}
                      </td>
                      <td style={{ fontWeight: 600 }}>{d.requestTitle || `Initiative #${d.requestId}`}</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent)' }}>
                        ${Number(d.amount).toFixed(2)}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        {new Date(d.donatedAt).toLocaleString()}
                      </td>
                      <td>
                        <span className="badge badge-approved" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={12} /> {d.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Media Viewer Modal (Photos & Video) */}
      {activeMedia && (
        <MediaViewerModal
          mediaType={activeMedia.type}
          documents={activeMedia.documents}
          causeTitle={activeMedia.causeTitle}
          onClose={() => setActiveMedia(null)}
        />
      )}

      {/* Donation Modal */}
      {selectedRequest && (
        <DonationModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onSuccess={(res) => {
            setSelectedRequest(null);
            setSuccessMessage(
              `Thank you so much! Your donation of $${res.amount.toFixed(2)} was successfully recorded with reference ${res.transactionRef}.`
            );
            loadData();
          }}
        />
      )}
    </div>
  );
};
