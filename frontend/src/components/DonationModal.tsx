import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { donationService, DonationItem } from '../services/donationService';
import { AssistanceRequestItem } from '../services/assistanceService';
import { X, AlertCircle, Heart, Lock } from 'lucide-react';

interface DonationModalProps {
  request: AssistanceRequestItem;
  onClose: () => void;
  onSuccess: (donation: DonationItem) => void;
}

export const DonationModal: React.FC<DonationModalProps> = ({
  request,
  onClose,
  onSuccess,
}) => {
  const { isAuthenticated, hasRole } = useAuth();
  const isDonor = hasRole('ROLE_DONOR') || hasRole('ROLE_ADMIN');

  const [amount, setAmount] = useState<number>(25);
  const [customAmount, setCustomAmount] = useState<string>('25');
  const [paymentMethod, setPaymentMethod] = useState<string>('CREDIT_CARD');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const presetAmounts = [10, 25, 50, 100, 250];

  const handlePresetClick = (val: number) => {
    setAmount(val);
    setCustomAmount(val.toString());
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomAmount(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setAmount(num);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setError('Please enter a valid donation amount.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await donationService.createDonation({
        requestId: request.id,
        amount,
        paymentMethod,
      });
      onSuccess(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to process donation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Heart size={20} color="#dc2626" fill="#dc2626" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Support Initiative</h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={20} color="#64748b" />
          </button>
        </div>

        <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.25rem' }}>
          Contributing to: <strong style={{ color: '#0f172a' }}>{request.title}</strong>
        </p>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {isAuthenticated && !isDonor && (
          <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
            <Lock size={18} />
            <div>
              <strong>Donor Only Feature:</strong> Beneficiary accounts are registered to request aid and cannot donate. Please log in with a Donor account to contribute.
            </div>
          </div>
        )}

        {!isAuthenticated && (
          <div className="alert alert-pending" style={{ marginBottom: '1.25rem' }}>
            <AlertCircle size={18} />
            <div>
              Please <a href="/login" style={{ fontWeight: 700, textDecoration: 'underline' }}>Sign In as Donor</a> or <a href="/register" style={{ fontWeight: 700, textDecoration: 'underline' }}>Create a Donor Account</a> to complete this donation.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Select Amount ($)</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              {presetAmounts.map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => handlePresetClick(val)}
                  className={`btn ${amount === val ? 'btn-primary' : 'btn-outline'}`}
                  style={{ flex: '1 1 50px' }}
                >
                  ${val}
                </button>
              ))}
            </div>

            <input
              type="number"
              step="0.01"
              min="1"
              value={customAmount}
              onChange={handleCustomChange}
              placeholder="Or enter custom amount"
              className="form-control"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="form-control"
            >
              <option value="CREDIT_CARD">Credit / Debit Card</option>
              <option value="BANK_TRANSFER">Direct Bank Transfer</option>
              <option value="PAYPAL">PayPal</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" style={{ flex: 1 }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (isAuthenticated && !isDonor) || !isAuthenticated}
              className="btn btn-primary"
              style={{ flex: 2 }}
            >
              {isSubmitting ? 'Processing...' : (isAuthenticated && !isDonor) ? 'Donations Restricted' : `Donate $${amount.toFixed(2)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
