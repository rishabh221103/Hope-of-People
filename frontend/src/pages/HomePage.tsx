import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { assistanceService, AssistanceRequestItem } from '../services/assistanceService';
import { Heart, ShieldCheck, ArrowRight, DollarSign, Award, LayoutDashboard, Shield } from 'lucide-react';
import { DonationModal } from '../components/DonationModal';
import { HumanitarianStoryCarousel } from '../components/HumanitarianStoryCarousel';
import { getInitiativeCoverUrl, getCategoryFallbackPhoto } from '../utils/mediaUtils';

export const HomePage: React.FC = () => {
  const { isAuthenticated, hasRole } = useAuth();
  const [initiatives, setInitiatives] = useState<AssistanceRequestItem[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<AssistanceRequestItem | null>(null);
  const [donationSuccess, setDonationSuccess] = useState<string | null>(null);

  const isDonor = hasRole('ROLE_DONOR');

  useEffect(() => {
    assistanceService
      .getPublicRequests()
      .then((data) => setInitiatives(data.slice(0, 3)))
      .catch((err) => console.error('Failed to load initiatives', err));
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', padding: 'clamp(2rem, 5vw, 3.5rem) 0.5rem 1.5rem' }}>
        <span
          className="badge badge-active"
          style={{ fontSize: '0.85rem', padding: '0.4rem 1rem', marginBottom: '1.25rem', display: 'inline-block' }}
        >
          Community Aid & Transparent Funding
        </span>
        <h1 style={{ fontSize: 'clamp(1.85rem, 5vw, 2.75rem)', fontWeight: 800, color: 'var(--secondary)', lineHeight: 1.2, marginBottom: '1.25rem' }}>
          Direct, Verified Support <br />
          <span style={{ color: 'var(--primary)' }}>When It Matters Most</span>
        </h1>
        <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.15rem)', color: 'var(--text-muted)', maxWidth: '680px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
          HOP connects individuals in need of urgent assistance directly with compassionate donors and verified organizations. Real-time audit trails and transparent funding.
        </p>

        <div className="hero-cta-group" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', maxWidth: '540px', margin: '0 auto 2.5rem' }}>
          {isAuthenticated && isDonor ? (
            <>
              <Link to="/donor-dashboard" className="btn btn-primary btn-lg">
                <LayoutDashboard size={18} /> Open Donor Dashboard
              </Link>
              <Link to="/initiatives" className="btn btn-outline btn-lg">
                <Heart size={18} /> Explore Community Causes
              </Link>
            </>
          ) : isAuthenticated && !isDonor ? (
            <>
              <Link to="/my-requests" className="btn btn-primary btn-lg">
                View My Requests <ArrowRight size={18} />
              </Link>
              <Link to="/request-aid" className="btn btn-outline btn-lg">
                Apply for Aid
              </Link>
            </>
          ) : (
            <>
              <Link to="/initiatives" className="btn btn-primary btn-lg">
                Browse Initiatives <ArrowRight size={18} />
              </Link>
              <Link to="/register" className="btn btn-outline btn-lg">
                Get Started
              </Link>
            </>
          )}
        </div>
      </section>

      {/* HUMANITARIAN PHOTO SPOTLIGHT & ANIMATED STORIES (Medical, Food, Education, Shelter, Elder Care) */}
      <section style={{ marginBottom: '3.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: 'var(--primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.5rem',
            }}
          >
            <Heart size={16} /> Urgent Community Needs
          </span>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.15rem)', fontWeight: 800, color: 'var(--secondary)', margin: 0 }}>
            People Seeking Critical Support
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '640px', margin: '0.5rem auto 0' }}>
            Browse verified real-life appeals for emergency healthcare, food rations, child education, and weatherized housing.
          </p>
        </div>

        <HumanitarianStoryCarousel />
      </section>

      {/* Feature Value Props */}
      <section className="grid-3" style={{ marginBottom: '4rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <ShieldCheck size={26} color="var(--primary)" />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.5rem' }}>Strict Verification</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Every assistance ticket is validated by platform administrators alongside certified document proof.
          </p>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <DollarSign size={26} color="var(--accent)" />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.5rem' }}>Transparent Ledger</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            100% of verified contributions go directly toward fulfillment goals with unique transaction tracking.
          </p>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <Award size={26} color="#d97706" />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.5rem' }}>Auditable Governance</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Enterprise relational database schema, Flyway migrations, and stateless JWT access control.
          </p>
        </div>
      </section>

      {/* Active Initiatives Showcase with Photo Cards */}
      <section style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Featured Initiatives</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Urgent assistance requests awaiting community backing.
            </p>
          </div>
          <Link to="/initiatives" className="btn btn-outline btn-sm">
            View All ({initiatives.length})
          </Link>
        </div>

        {donationSuccess && (
          <div className="alert alert-success">
            <span>{donationSuccess}</span>
          </div>
        )}

        {initiatives.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>No public initiatives currently available. Be the first to apply!</p>
            <Link to="/request-aid" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Create an Initiative
            </Link>
          </div>
        ) : (
          <div className="grid-3">
            {initiatives.map((item) => {
              const pct = Math.min(100, Math.round(((item.raisedAmount || 0) / item.targetAmount) * 100));
              const coverImg = getInitiativeCoverUrl(item);

              return (
                <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                  {/* Photo Banner with Animated Hover */}
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
                      <span className={`badge badge-${item.priority.toLowerCase()}`}>{item.priority}</span>
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    {item.title}
                  </h3>

                  {item.isAnonymous ? (
                    <div style={{ fontSize: '0.785rem', color: '#1e40af', background: '#eff6ff', padding: '0.2rem 0.5rem', borderRadius: '6px', marginBottom: '0.65rem', display: 'inline-flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                      <Shield size={12} color="#2563eb" />
                      <span>{item.isDirectDonorOrAdmin ? `Anonymous (${item.userFullName})` : 'Anonymous Beneficiary'}</span>
                    </div>
                  ) : item.userFullName ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
                      Applied by: <span style={{ fontWeight: 600, color: 'var(--secondary)' }}>{item.userFullName}</span>
                    </div>
                  ) : null}
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem', lineClamp: 3 }}>
                    {item.description}
                  </p>

                  <div style={{ marginTop: 'auto' }}>
                    <div className="progress-bar-container">
                      <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '1rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--accent)' }}>
                        ${(item.raisedAmount || 0).toLocaleString()} raised
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        Goal: ${item.targetAmount.toLocaleString()} ({pct}%)
                      </span>
                    </div>

                    {isAuthenticated && !isDonor ? (
                      <div
                        style={{
                          textAlign: 'center',
                          padding: '0.65rem',
                          background: 'var(--bg-main)',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          color: 'var(--text-muted)',
                          fontWeight: 600,
                          border: '1px dashed var(--border-color)',
                        }}
                      >
                        Awaiting Donor Backing
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
      </section>

      {selectedRequest && (
        <DonationModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onSuccess={(res) => {
            setSelectedRequest(null);
            setDonationSuccess(`Thank you! Your donation of $${res.amount.toFixed(2)} was processed (Ref: ${res.transactionRef}).`);
            assistanceService.getPublicRequests().then(setInitiatives);
          }}
        />
      )}
    </div>
  );
};
