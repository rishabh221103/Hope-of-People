import React, { useState } from 'react';
import { storyService, StoryItem } from '../services/storyService';
import {
  X,
  Clock,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onStoryCreated: (story: StoryItem) => void;
}

export const CreateStoryModal: React.FC<Props> = ({ isOpen, onClose, onStoryCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('MEDICAL');
  const [targetAmount, setTargetAmount] = useState<string>('250');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [location, setLocation] = useState('');
  const [urgencyTag, setUrgencyTag] = useState('CRITICAL AID: 48 HOURS');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setPhotoFile(f);
      setPhotoPreview(URL.createObjectURL(f));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amount = parseFloat(targetAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid donation target amount.');
      return;
    }

    if (amount > 500) {
      setError('The maximum allowed amount for 48-hour urgent stories is $500.00.');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a story title.');
      return;
    }

    if (!description.trim()) {
      setError('Please describe your emergency situation.');
      return;
    }

    setIsLoading(true);
    try {
      const created = await storyService.createStory({
        title: title.trim(),
        description: description.trim(),
        category,
        targetAmount: amount,
        beneficiaryName: beneficiaryName.trim() || undefined,
        location: location.trim() || undefined,
        urgencyTag: urgencyTag.trim() || undefined,
        photo: photoFile,
      });

      onStoryCreated(created);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to publish urgent story. Please check your inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  const parsedAmount = parseFloat(targetAmount) || 0;
  const isOverLimit = parsedAmount > 500;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        overflowY: 'auto',
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          maxWidth: '650px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--border)',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#dc2626',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(220, 38, 38, 0.3)',
              }}
            >
              <Clock size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--secondary)', margin: 0 }}>
                Share 48-Hour Urgent Story
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Fast-track micro aid directly on community showcase
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.4rem', borderRadius: '50%', width: '32px', height: '32px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* 48-Hour & $500 Rules Callout */}
        <div style={{ padding: '1.25rem 1.5rem 0' }}>
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '10px',
              padding: '0.85rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#991b1b', fontWeight: 700, fontSize: '0.85rem' }}>
              <Sparkles size={16} />
              <span>48-Hour Community Showcase Guidelines</span>
            </div>
            <div style={{ fontSize: '0.785rem', color: '#7f1d1d', lineHeight: 1.45 }}>
              • <strong>48-Hour Shelf Life:</strong> Your story will be actively featured on the homepage & donor carousel for exactly <strong>48 hours</strong>.<br />
              • <strong>Max Donation Limit: $500:</strong> Designed for urgent emergency medical bills, groceries, or immediate relief.
            </div>
          </div>
        </div>

        {error && (
          <div style={{ padding: '1rem 1.5rem 0' }}>
            <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem 1.5rem 1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Story Title */}
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                Urgent Story Headline *
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g., Emergency Medications & Nebulizer for Aarav"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                required
              />
            </div>

            {/* Category & Target Amount ($500 Max) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                  Aid Category *
                </label>
                <select
                  className="form-control"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  <option value="MEDICAL">Medical & Surgery</option>
                  <option value="FOOD">Food & Clean Water</option>
                  <option value="EDUCATION">Education & Tuition</option>
                  <option value="HOUSING">Emergency Shelter</option>
                  <option value="ELDER_CARE">Elder Care & Hospice</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                  <span>Requested Aid ($) *</span>
                  <span style={{ color: isOverLimit ? '#dc2626' : '#16a34a', fontSize: '0.75rem', fontWeight: 700 }}>
                    Max $500
                  </span>
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                    $
                  </span>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    step="1"
                    className="form-control"
                    style={{
                      paddingLeft: '1.75rem',
                      borderColor: isOverLimit ? '#dc2626' : undefined,
                    }}
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    required
                  />
                </div>
                {isOverLimit && (
                  <span style={{ color: '#dc2626', fontSize: '0.725rem', marginTop: '2px', display: 'block' }}>
                    Amount cannot exceed $500 for 48-hour stories.
                  </span>
                )}
              </div>
            </div>

            {/* Beneficiary Name & Location */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                  Patient / Beneficiary Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Meera (Mother of Aarav)"
                  value={beneficiaryName}
                  onChange={(e) => setBeneficiaryName(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                  Hospital / Town / Location
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., District Children Hospital"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>

            {/* Urgency Badge Text */}
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                Urgency Badge Label
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g., CRITICAL SURGERY: 48 HOURS"
                value={urgencyTag}
                onChange={(e) => setUrgencyTag(e.target.value)}
              />
            </div>

            {/* Story Description */}
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                Emergency Situation Description *
              </label>
              <textarea
                className="form-control"
                rows={4}
                placeholder="Explain the critical situation, why funds are needed immediately within 48 hours, and how donations will be used..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            {/* Photo Upload */}
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                Photo Proof / Condition Image (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="form-control"
              />
              {photoPreview && (
                <div style={{ marginTop: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img
                    src={photoPreview}
                    alt="Story preview"
                    style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border)' }}
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {photoFile?.name} (Ready to attach)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Modal Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || isOverLimit}
              style={{
                background: '#dc2626',
                borderColor: '#dc2626',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              {isLoading ? (
                'Publishing 48-Hour Story...'
              ) : (
                <>
                  <Clock size={16} /> Publish 48-Hour Story ($500 Max)
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
