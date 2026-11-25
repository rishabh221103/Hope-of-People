import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
          <img
            src="/hop-logo.jpg"
            alt="HOP Logo"
            style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }}
          />
          <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#1e3a8a' }}>
            HOP <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.9rem' }}>— Hope Of People</span>
          </span>
        </div>
        <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
          Hands-On Platform (HOP) &copy; 2026
        </p>
        <p style={{ maxWidth: '580px', margin: '0 auto' }}>
          A transparent, auditable digital aid coordination system. Empowering communities with direct, verified support.
        </p>
      </div>
    </footer>
  );
};
