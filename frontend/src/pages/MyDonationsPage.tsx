import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { donationService, DonationItem } from '../services/donationService';
import { Heart, DollarSign, Calendar, CheckCircle, ArrowRight } from 'lucide-react';

export const MyDonationsPage: React.FC = () => {
  const [donations, setDonations] = useState<DonationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    donationService
      .getMyDonations()
      .then((data) => setDonations(data || []))
      .catch((err) => console.error('Failed to load donations', err))
      .finally(() => setIsLoading(false));
  }, []);

  const totalDonated = donations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span className="badge badge-active" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>
            Contribution Records
          </span>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>My Giving History</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0' }}>
            Official records and transaction receipts of your community contributions.
          </p>
        </div>

        <Link to="/donor-dashboard" className="btn btn-primary">
          <Heart size={16} /> Donate to Causes
        </Link>
      </div>

      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL GIVEN</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--secondary)' }}>
              ${totalDonated.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <Calendar size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL DONATIONS</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--secondary)' }}>
              {donations.length}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '1.75rem' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
            Loading donation records...
          </div>
        ) : donations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <Heart size={44} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '1.25rem' }}>
              You have not made any donations yet.
            </p>
            <Link to="/donor-dashboard" className="btn btn-primary">
              Explore Causes Seeking Aid <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Transaction Reference</th>
                  <th>Initiative</th>
                  <th>Amount</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((d) => (
                  <tr key={d.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)' }}>
                      {d.transactionRef}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {d.requestTitle || `Initiative #${d.requestId}`}
                    </td>
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
    </div>
  );
};
