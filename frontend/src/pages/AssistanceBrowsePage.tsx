import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { assistanceService, AssistanceRequestItem, DocumentItem } from '../services/assistanceService';
import { Heart, Search, CheckCircle, Image as ImageIcon, Video as VideoIcon, Shield, MapPin, Navigation, Crosshair } from 'lucide-react';
import { DonationModal } from '../components/DonationModal';
import { MediaViewerModal } from '../components/MediaViewerModal';
import { ConnectButton } from '../components/ConnectButton';
import { getInitiativeCoverUrl, getCategoryFallbackPhoto } from '../utils/mediaUtils';

export const AssistanceBrowsePage: React.FC = () => {
  const { isAuthenticated, hasRole } = useAuth();
  const isDonor = hasRole('ROLE_DONOR') || hasRole('ROLE_ADMIN');

  const [requests, setRequests] = useState<AssistanceRequestItem[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<AssistanceRequestItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedRequest, setSelectedRequest] = useState<AssistanceRequestItem | null>(null);
  const [activeMedia, setActiveMedia] = useState<{
    type: 'photo' | 'video';
    documents: DocumentItem[];
    causeTitle: string;
  } | null>(null);
  const [donationSuccess, setDonationSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Geographic Proximity State
  const [nearMeActive, setNearMeActive] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(25);
  const [searchCity, setSearchCity] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoMessage, setGeoMessage] = useState<string | null>(null);

  const openMediaModal = (item: AssistanceRequestItem, type: 'photo' | 'video') => {
    setActiveMedia({
      type,
      documents: item.documents || [],
      causeTitle: item.title,
    });
  };

  const categories = ['ALL', 'EDUCATION', 'FOOD', 'UTILITIES', 'EMERGENCY', 'BUSINESS', 'MEDICAL', 'HOUSING', 'ELDER_CARE'];

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = () => {
    setIsLoading(true);
    setNearMeActive(false);
    setGeoMessage(null);
    assistanceService
      .getPublicRequests()
      .then((data) => {
        setRequests(data);
        setFilteredRequests(data);
      })
      .catch((err) => console.error('Failed to load assistance requests', err))
      .finally(() => setIsLoading(false));
  };

  const fetchNearby = (lat?: number, lng?: number, radius?: number, city?: string) => {
    setIsLoading(true);
    assistanceService
      .getNearbyRequests({
        latitude: lat,
        longitude: lng,
        radiusKm: radius ?? radiusKm,
        city: city ?? (searchCity.trim() ? searchCity.trim() : undefined),
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
      })
      .then((data) => {
        setRequests(data);
        setFilteredRequests(data);
        setNearMeActive(true);
      })
      .catch((err) => console.error('Failed to load nearby requests', err))
      .finally(() => setIsLoading(false));
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoMessage('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLoading(true);
    setGeoMessage(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        setGeoLoading(false);
        setGeoMessage(`Showing causes within ${radiusKm} km of your detected location.`);
        fetchNearby(coords.lat, coords.lng, radiusKm);
      },
      () => {
        setGeoLoading(false);
        setGeoMessage('Unable to access location. You can search by City below instead.');
      },
      { timeout: 10000 }
    );
  };

  const handleCitySearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCity.trim()) return;
    setUserLocation(null);
    setGeoMessage(`Showing causes in "${searchCity.trim()}".`);
    fetchNearby(undefined, undefined, undefined, searchCity.trim());
  };

  const handleRadiusChange = (newRadius: number) => {
    setRadiusKm(newRadius);
    if (userLocation) {
      setGeoMessage(`Showing causes within ${newRadius} km of your detected location.`);
      fetchNearby(userLocation.lat, userLocation.lng, newRadius);
    }
  };

  useEffect(() => {
    let result = requests;
    if (selectedCategory !== 'ALL') {
      result = result.filter((r) => r.category.toUpperCase() === selectedCategory);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
      );
    }
    setFilteredRequests(result);
  }, [searchTerm, selectedCategory, requests]);

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Verified Assistance Initiatives
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Browse approved requests undergoing active fundraising. Your contributions make an immediate direct impact.
        </p>
      </div>

      {donationSuccess && (
        <div className="alert alert-success">
          <CheckCircle size={18} />
          <span>{donationSuccess}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="card filter-toolbar" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 260px', display: 'flex', alignItems: 'center', position: 'relative' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 12 }} />
            <input
              type="text"
              placeholder="Search by keyword, medical condition, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>

          <div className="tabs-scroll-container" style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-outline'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Geographic "Causes Near Me" Proximity Bar */}
      <div
        className="card"
        style={{
          padding: '1rem 1.25rem',
          marginBottom: '2rem',
          backgroundColor: nearMeActive ? '#eff6ff' : '#ffffff',
          borderColor: nearMeActive ? '#3b82f6' : '#e2e8f0',
          transition: 'all 0.2s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                backgroundColor: nearMeActive ? '#2563eb' : '#f1f5f9',
                color: nearMeActive ? '#ffffff' : '#64748b',
                padding: '0.45rem',
                borderRadius: '8px',
                display: 'flex',
              }}
            >
              <MapPin size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                  Causes Near Me (Geographic Matching)
                </span>
                {nearMeActive && (
                  <span style={{ backgroundColor: '#dbeafe', color: '#1d4ed8', fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '9999px' }}>
                    Active Filter
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                Discover grassroots causes happening in your neighborhood, city, or radius.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={geoLoading}
              className="btn btn-sm btn-outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', borderColor: '#2563eb', color: '#2563eb' }}
            >
              <Crosshair size={14} />
              <span>{geoLoading ? 'Detecting...' : 'Use My GPS Location'}</span>
            </button>

            {/* City search input */}
            <form onSubmit={handleCitySearch} style={{ display: 'inline-flex', gap: '0.35rem' }}>
              <input
                type="text"
                placeholder="Or enter city (e.g. Chicago)..."
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                style={{
                  padding: '0.3rem 0.65rem',
                  fontSize: '0.82rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  minWidth: '150px',
                }}
              />
              <button type="submit" className="btn btn-sm btn-secondary" style={{ padding: '0.3rem 0.65rem', fontSize: '0.82rem' }}>
                Find
              </button>
            </form>

            {nearMeActive && (
              <button
                type="button"
                onClick={loadRequests}
                className="btn btn-sm"
                style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}
              >
                Reset to All
              </button>
            )}
          </div>
        </div>

        {/* Proximity Radius Pills & Feedback when active */}
        {nearMeActive && (
          <div
            style={{
              marginTop: '0.85rem',
              paddingTop: '0.85rem',
              borderTop: '1px solid #dbeafe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.78rem', color: '#1e40af', fontWeight: 600 }}>Radius:</span>
              {[5, 10, 25, 50, 100].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRadiusChange(r)}
                  style={{
                    padding: '0.15rem 0.55rem',
                    borderRadius: '9999px',
                    border: '1px solid',
                    borderColor: radiusKm === r ? '#2563eb' : '#93c5fd',
                    backgroundColor: radiusKm === r ? '#2563eb' : '#ffffff',
                    color: radiusKm === r ? '#ffffff' : '#1e40af',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {r} km
                </button>
              ))}
            </div>

            {geoMessage && (
              <span style={{ fontSize: '0.78rem', color: '#1e40af', fontWeight: 500 }}>
                {geoMessage}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Initiative Cards Grid */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading active initiatives...</div>
      ) : filteredRequests.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
            No initiatives match your search criteria.
          </p>
        </div>
      ) : (
        <div className="grid-3">
          {filteredRequests.map((item) => {
            const pct = Math.min(100, Math.round(((item.raisedAmount || 0) / item.targetAmount) * 100));
            const isFulfilled = item.status === 'FULFILLED' || pct >= 100;
            const coverImg = getInitiativeCoverUrl(item);

            return (
              <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
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
                    <span className="badge badge-active">{item.category}</span>
                  </div>
                  <div className="initiative-card-urgency">
                    <span className={`badge ${isFulfilled ? 'badge-fulfilled' : `badge-${item.priority.toLowerCase()}`}`}>
                      {isFulfilled ? 'FULFILLED' : item.priority}
                    </span>
                  </div>
                </div>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  {item.title}
                </h3>

                {item.isAnonymous ? (
                  <div style={{ fontSize: '0.8rem', color: '#1e40af', background: '#eff6ff', padding: '0.25rem 0.55rem', borderRadius: '6px', marginBottom: '0.65rem', display: 'inline-flex', alignItems: 'center', gap: '5px', width: 'fit-content' }}>
                    <Shield size={13} color="#2563eb" />
                    <span>{item.isDirectDonorOrAdmin ? `Anonymous (Verified: ${item.userFullName})` : 'Anonymous Beneficiary (HOP Verified)'}</span>
                  </div>
                ) : item.userFullName ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                      Applied by: <span style={{ fontWeight: 600, color: 'var(--secondary)' }}>{item.userFullName}</span>
                    </div>
                    {item.userId && (
                      <ConnectButton targetUserId={item.userId} targetUserName={item.userFullName} compact />
                    )}
                  </div>
                ) : null}

                {/* Location & Proximity Distance Badge */}
                {(item.city || item.distanceKm != null) && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      marginBottom: '0.65rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    {item.city && (
                      <span
                        style={{
                          fontSize: '0.78rem',
                          color: '#475569',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <MapPin size={13} color="#2563eb" />
                        <span>{item.city}{item.state ? `, ${item.state}` : ''}</span>
                      </span>
                    )}
                    {item.distanceKm != null && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          backgroundColor: '#ecfdf5',
                          color: '#059669',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '9999px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          border: '1px solid #a7f3d0',
                        }}
                      >
                        <Navigation size={10} />
                        <span>{item.distanceKm} km away</span>
                      </span>
                    )}
                  </div>
                )}

                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem', flex: 1 }}>
                  {item.description}
                </p>

                <div style={{ marginTop: 'auto' }}>
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--accent)' }}>
                      ${(item.raisedAmount || 0).toLocaleString()} raised
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      Goal: ${item.targetAmount.toLocaleString()} ({pct}%)
                    </span>
                  </div>

                  {/* Two Options: 1. See Photos, 2. See Video */}
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
                          <span>Photos {photoCount > 0 ? `(${photoCount})` : ''}</span>
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
                          <span>Video {videoCount > 0 ? `(${videoCount})` : ''}</span>
                        </button>
                      </div>
                    );
                  })()}

                  {isFulfilled ? (
                    <button disabled className="btn btn-secondary" style={{ width: '100%' }}>
                      <CheckCircle size={16} /> Fully Funded
                    </button>
                  ) : isAuthenticated && !isDonor ? (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '0.65rem 1rem',
                        background: 'var(--bg-main)',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        color: 'var(--text-muted)',
                        fontWeight: 600,
                        border: '1px dashed var(--border-color)',
                      }}
                    >
                      Awaiting Donor Contributions
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedRequest(item)}
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                    >
                      <Heart size={16} /> Donate Now
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Media Viewer Modal */}
      {activeMedia && (
        <MediaViewerModal
          mediaType={activeMedia.type}
          documents={activeMedia.documents}
          causeTitle={activeMedia.causeTitle}
          onClose={() => setActiveMedia(null)}
        />
      )}

      {selectedRequest && (
        <DonationModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onSuccess={(res) => {
            setSelectedRequest(null);
            setDonationSuccess(`Thank you! Your donation of $${res.amount.toFixed(2)} was processed successfully! (Ref: ${res.transactionRef})`);
            loadRequests();
          }}
        />
      )}
    </div>
  );
};
