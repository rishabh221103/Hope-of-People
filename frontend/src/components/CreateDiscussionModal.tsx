import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Tag, AlertCircle, CheckCircle } from 'lucide-react';
import { forumService, ForumCategory, ForumPost } from '../services/forumService';
import { assistanceService, AssistanceRequestItem } from '../services/assistanceService';

interface CreateDiscussionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (post: ForumPost) => void;
  preselectedCategoryId?: number;
}

export const CreateDiscussionModal: React.FC<CreateDiscussionModalProps> = ({
  isOpen,
  onClose,
  onPostCreated,
  preselectedCategoryId,
}) => {
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [categoryId, setCategoryId] = useState<number | ''>(preselectedCategoryId || '');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [assistanceRequestId, setAssistanceRequestId] = useState<number | ''>('');
  const [myCauses, setMyCauses] = useState<AssistanceRequestItem[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
      if (preselectedCategoryId) {
        setCategoryId(preselectedCategoryId);
      }
    } else {
      resetForm();
    }
  }, [isOpen, preselectedCategoryId]);

  const loadInitialData = async () => {
    try {
      const cats = await forumService.getCategories();
      setCategories(cats);
      if (!categoryId && cats.length > 0) {
        setCategoryId(preselectedCategoryId || cats[0].id);
      }

      // Load user causes for optional linkage
      try {
        const causes = await assistanceService.getMyRequests();
        setMyCauses(causes);
      } catch {
        // User may not have causes; non-fatal
      }
    } catch (err: any) {
      console.error('Failed to load modal categories:', err);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setTags('');
    setAssistanceRequestId('');
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      setError('Please select a category for this discussion.');
      return;
    }
    if (title.trim().length < 5) {
      setError('Title must be at least 5 characters long.');
      return;
    }
    if (content.trim().length < 10) {
      setError('Content must be at least 10 characters long.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const post = await forumService.createPost({
        categoryId: Number(categoryId),
        title: title.trim(),
        content: content.trim(),
        tags: tags.trim() ? tags.trim() : undefined,
        assistanceRequestId: assistanceRequestId ? Number(assistanceRequestId) : undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        onPostCreated(post);
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Failed to publish discussion. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '620px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          padding: '1.75rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MessageSquare size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Start a Community Discussion</h2>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>Ask advice, offer medical gear, or share self-reliance ideas.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: '0.25rem',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#fef2f2',
              color: '#b91c1c',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '1rem',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#ecfdf5',
              color: '#047857',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '1rem',
            }}
          >
            <CheckCircle size={16} />
            <span>Discussion published successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Category Dropdown */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Category Channel *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              required
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                color: '#0f172a',
                backgroundColor: '#ffffff',
                outline: 'none',
              }}
            >
              <option value="" disabled>Select a channel...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Discussion Title *
            </label>
            <input
              type="text"
              placeholder="e.g., Where can I find affordable pediatric physiotherapy in Delhi?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                color: '#0f172a',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Content */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Details & Questions *
            </label>
            <textarea
              rows={5}
              placeholder="Provide background, what you've tried so far, or exact specifications of equipment you're offering/seeking..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                color: '#0f172a',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Tags */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              <Tag size={14} /> Topic Tags (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. wheelchair, physiotherapy, scholarships (comma-separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                color: '#0f172a',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Optional Linked Assistance Request */}
          {myCauses.length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Attach Linked Aid Request (Optional)
              </label>
              <select
                value={assistanceRequestId}
                onChange={(e) => setAssistanceRequestId(e.target.value ? Number(e.target.value) : '')}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  color: '#0f172a',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                }}
              >
                <option value="">None (General Discussion)</option>
                {myCauses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} (${c.raisedAmount} / ${c.targetAmount})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '0.6rem 1.25rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.6rem 1.4rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: loading ? '#93c5fd' : '#2563eb',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Publishing...' : 'Publish Topic'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
