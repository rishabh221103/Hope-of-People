import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Heart,
  ShieldCheck,
  CheckCircle,
  Users,
  Activity,
  Apple,
  BookOpen,
  Home,
  DollarSign,
  ArrowRight,
  Eye,
  FileCheck,
  Sparkles,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { isAuthenticated, hasRole } = useAuth();
  const isDonor = hasRole('ROLE_DONOR');

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '4rem' }}>
      {/* Brand Hero Header */}
      <section
        style={{
          textAlign: 'center',
          padding: 'clamp(2.5rem, 6vw, 4.5rem) 1rem 2.5rem',
          background: 'linear-gradient(180deg, rgba(239, 246, 255, 0.7) 0%, rgba(255, 255, 255, 0) 100%)',
          borderRadius: '24px',
          marginBottom: '3rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <img
            src="/hop-logo.jpg"
            alt="HOP Logo"
            style={{
              width: '90px',
              height: '90px',
              borderRadius: '20px',
              objectFit: 'cover',
              boxShadow: '0 10px 25px -5px rgba(29, 78, 216, 0.25)',
              border: '3px solid #ffffff',
            }}
          />
        </div>

        <span
          className="badge badge-active"
          style={{ fontSize: '0.85rem', padding: '0.4rem 1.15rem', marginBottom: '1rem', display: 'inline-block' }}
        >
          Hands-On Platform • Hope Of People
        </span>

        <h1
          style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 800,
            color: '#0f172a',
            lineHeight: 1.2,
            marginBottom: '1rem',
          }}
        >
          Direct, Transparent Community Aid <br />
          <span style={{ color: 'var(--primary)' }}>Empowering Human Hope</span>
        </h1>

        <p
          style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.15rem)',
            color: 'var(--text-muted)',
            maxWidth: '720px',
            margin: '0 auto 2rem',
            lineHeight: 1.6,
          }}
        >
          <strong>HOP (Hope Of People)</strong> is a full-stack humanitarian coordination platform engineered to connect
          families and individuals facing urgent life emergencies directly with compassionate donors, transparent ledgers,
          and zero administrative deductions.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {isAuthenticated && isDonor ? (
            <Link to="/donor-dashboard" className="btn btn-primary btn-lg">
              <Heart size={18} fill="#ffffff" /> Open Donor Dashboard
            </Link>
          ) : isAuthenticated && !isDonor ? (
            <Link to="/request-aid" className="btn btn-primary btn-lg">
              <Sparkles size={18} /> Apply for Assistance
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary btn-lg">
                Join HOP Community <ArrowRight size={18} />
              </Link>
              <Link to="/initiatives" className="btn btn-outline btn-lg">
                Browse Community Causes
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Trust & Transparency Metrics */}
      <section className="grid-3" style={{ marginBottom: '3.5rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              color: 'var(--primary)',
            }}
          >
            <ShieldCheck size={28} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>100% Certified Cases</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
            Every assistance ticket is validated by platform administrators alongside government IDs and certified medical or community proof.
          </p>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'var(--accent-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              color: 'var(--accent)',
            }}
          >
            <DollarSign size={28} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Strict Donor Separation</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
            Role-based boundaries ensure beneficiaries only request aid while donors contribute. No internal circular funding or opaque fees.
          </p>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: '#fffbeb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              color: '#d97706',
            }}
          >
            <Eye size={28} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Photos & Video Evidence</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
            Donors can view high-resolution photo proof and direct beneficiary video appeals before donating to any community initiative.
          </p>
        </div>
      </section>

      {/* Mission & Problem Statement */}
      <section className="card" style={{ padding: 'clamp(1.5rem, 4vw, 2.75rem)', marginBottom: '3.5rem' }}>
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
          <span className="badge badge-active" style={{ marginBottom: '0.75rem', display: 'inline-block' }}>
            Our Purpose & Vision
          </span>
          <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, color: 'var(--secondary)', marginBottom: '1.25rem' }}>
            Why We Built HOP (Hope Of People)
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '1.25rem' }}>
            Traditional fundraising is often plagued by slow bureaucracy, high intermediary platform cuts (often 10–25%),
            and a complete lack of transparency on where contributions go. Families facing critical surgery or sudden
            disasters cannot afford to wait weeks for assistance approvals.
          </p>
          <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
            <strong>HOP changes this equation completely:</strong>
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <CheckCircle size={20} color="var(--accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', color: 'var(--secondary)', marginBottom: '2px' }}>Zero Middleman Commissions</strong>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>100% of verified contributions go toward the cause's designated target limit.</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <CheckCircle size={20} color="var(--accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', color: 'var(--secondary)', marginBottom: '2px' }}>Video Appeals from Real People</strong>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Authentic video stories allow donors to connect empathetically with verified beneficiaries.</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <CheckCircle size={20} color="var(--accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', color: 'var(--secondary)', marginBottom: '2px' }}>Auditable Ledger Records</strong>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Every donation generates an immutable transaction reference for verifiable receipts.</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <CheckCircle size={20} color="var(--accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', color: 'var(--secondary)', marginBottom: '2px' }}>Set-Limit Funding Targets</strong>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Beneficiaries define exact limits so campaigns automatically close when fully funded.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The 4-Step Process: How HOP Works */}
      <section style={{ marginBottom: '3.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--secondary)' }}>
            How the Platform Works
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            A streamlined 4-step workflow connecting urgent need with community generosity.
          </p>
        </div>

        <div className="grid-4">
          <div className="card" style={{ position: 'relative', padding: '1.75rem 1.25rem' }}>
            <div
              style={{
                position: 'absolute',
                top: '-14px',
                left: '18px',
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--primary)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(29, 78, 216, 0.4)',
              }}
            >
              1
            </div>
            <FileCheck size={26} color="var(--primary)" style={{ marginTop: '0.5rem', marginBottom: '0.75rem' }} />
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.35rem' }}>Apply for Aid</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Beneficiaries submit details, set required target limits ($), and upload supporting photos and video messages.
            </p>
          </div>

          <div className="card" style={{ position: 'relative', padding: '1.75rem 1.25rem' }}>
            <div
              style={{
                position: 'absolute',
                top: '-14px',
                left: '18px',
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--primary)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(29, 78, 216, 0.4)',
              }}
            >
              2
            </div>
            <ShieldCheck size={26} color="var(--primary)" style={{ marginTop: '0.5rem', marginBottom: '0.75rem' }} />
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.35rem' }}>Verification</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Platform administrators audit documents, authenticate identity, and approve legitimate causes for public funding.
            </p>
          </div>

          <div className="card" style={{ position: 'relative', padding: '1.75rem 1.25rem' }}>
            <div
              style={{
                position: 'absolute',
                top: '-14px',
                left: '18px',
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--primary)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(29, 78, 216, 0.4)',
              }}
            >
              3
            </div>
            <Heart size={26} color="var(--primary)" style={{ marginTop: '0.5rem', marginBottom: '0.75rem' }} />
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.35rem' }}>Donor Backing</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Donors review initiatives, see photos and watch video appeals, contributing directly via card or bank transfer.
            </p>
          </div>

          <div className="card" style={{ position: 'relative', padding: '1.75rem 1.25rem' }}>
            <div
              style={{
                position: 'absolute',
                top: '-14px',
                left: '18px',
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--primary)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(29, 78, 216, 0.4)',
              }}
            >
              4
            </div>
            <CheckCircle size={26} color="var(--accent)" style={{ marginTop: '0.5rem', marginBottom: '0.75rem' }} />
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.35rem' }}>Direct Fulfillment</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Funds reach beneficiaries immediately. Progress meters reach 100% and transaction receipts are permanently recorded.
            </p>
          </div>
        </div>
      </section>

      {/* Core Humanitarian Categories Supported */}
      <section style={{ marginBottom: '3.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span className="badge badge-active" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>
            Relief Sectors
          </span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--secondary)' }}>
            Core Categories Supported on HOP
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Covering essential humanitarian relief areas where timely funding saves lives and restores dignity.
          </p>
        </div>

        <div className="grid-3">
          <div className="card" style={{ display: 'flex', gap: '1rem', padding: '1.5rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: '10px', background: 'var(--danger-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)', flexShrink: 0 }}>
              <Activity size={22} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Medical & Surgical Care</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Critical open-heart surgeries, chemotherapy, regular dialysis, and emergency accident trauma recovery.
              </p>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', gap: '1rem', padding: '1.5rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: '10px', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0 }}>
              <Apple size={22} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Food & Nutrition Relief</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Emergency ration kits with rice, lentils, oil, and clean drinking water for famine and flood victims.
              </p>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', gap: '1rem', padding: '1.5rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: '10px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
              <BookOpen size={22} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Child Schooling Grants</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Preventing school dropouts for underprivileged youth by funding tuition, textbooks, and school uniforms.
              </p>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', gap: '1rem', padding: '1.5rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: '10px', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0 }}>
              <Home size={22} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Disaster & Shelter Repair</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Weatherized tarpaulins, bamboo supports, and corrugated roofing for cyclone and landslide survivors.
              </p>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', gap: '1rem', padding: '1.5rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: '10px', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', flexShrink: 0 }}>
              <Users size={22} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Elderly Hospice & Medicine</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Monthly diabetes, cardiac medicine, and palliative support for destitute seniors without living relatives.
              </p>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', gap: '1rem', padding: '1.5rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: '10px', background: 'var(--secondary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary)', flexShrink: 0 }}>
              <Sparkles size={22} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Urgent Community Crises</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Local emergency appeals verified by ground community workers with rapid disbursement capability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section
        className="card"
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)',
          color: '#ffffff',
          padding: 'clamp(2rem, 5vw, 3.5rem)',
          textAlign: 'center',
          borderRadius: '20px',
        }}
      >
        <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 800, margin: '0 0 1rem', color: '#ffffff' }}>
          Be the Reason Someone Has Hope Today
        </h2>
        <p style={{ fontSize: '1.05rem', color: '#e0e7ff', maxWidth: '640px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
          Join thousands of compassionate donors and verified organizations making an auditable difference with 100% transparency.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/initiatives" className="btn" style={{ background: '#ffffff', color: '#1d4ed8', fontWeight: 700, padding: '0.75rem 1.5rem' }}>
            Explore Causes Seeking Aid
          </Link>
          <Link to="/register" className="btn" style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.4)', fontWeight: 600, padding: '0.75rem 1.5rem' }}>
            Register as a Donor / Beneficiary
          </Link>
        </div>
      </section>
    </div>
  );
};
