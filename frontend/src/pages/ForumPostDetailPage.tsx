import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ThumbsUp,
  MessageSquare,
  Eye,
  CheckCircle,
  Share2,
  Trash2,
  Send,
  Check,
  AlertCircle,
  DollarSign,
  HeartHandshake
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { forumService, ForumPost, ForumReply } from '../services/forumService';
import { assistanceService, AssistanceRequestItem } from '../services/assistanceService';
import { DonationModal } from '../components/DonationModal';

export const ForumPostDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, hasRole } = useAuth();

  const [post, setPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New reply state
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  // Linked cause donation
  const [donationRequest, setDonationRequest] = useState<AssistanceRequestItem | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadPostAndReplies(Number(id));
    }
  }, [id]);

  const loadPostAndReplies = async (postId: number) => {
    try {
      setLoading(true);
      setError(null);
      const [postData, repliesData] = await Promise.all([
        forumService.getPostById(postId),
        forumService.getReplies(postId),
      ]);
      setPost(postData);
      setReplies(repliesData);
    } catch (err: any) {
      console.error('Failed to load post detail:', err);
      setError('Unable to load discussion. It may have been deleted or does not exist.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUpvote = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!post) return;

    try {
      const res = await forumService.toggleUpvote(post.id);
      setPost({
        ...post,
        isUpvotedByCurrentUser: res.isUpvoted,
        upvotesCount: res.isUpvoted ? post.upvotesCount + 1 : Math.max(0, post.upvotesCount - 1),
      });
    } catch (err) {
      console.error('Failed to upvote post:', err);
    }
  };

  const handleCreateReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!post || !replyContent.trim()) return;

    try {
      setSubmittingReply(true);
      setReplyError(null);
      const newReply = await forumService.createReply(post.id, {
        content: replyContent.trim(),
      });
      setReplies([...replies, newReply]);
      setReplyContent('');
      setPost({ ...post, repliesCount: post.repliesCount + 1 });
      setActionMessage('Reply posted successfully!');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setReplyError(err.message || 'Failed to post reply.');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleToggleSolution = async (replyId: number) => {
    try {
      const updated = await forumService.toggleSolution(replyId);
      setReplies((prev) =>
        prev.map((r) => (r.id === replyId ? updated : r))
      );
      if (post) {
        setPost({
          ...post,
          hasAcceptedSolution: replies.some((r) => r.id === replyId ? updated.isSolution : r.isSolution),
        });
      }
      setActionMessage(updated.isSolution ? 'Marked as accepted solution!' : 'Solution un-marked.');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      console.error('Failed to toggle solution:', err);
    }
  };

  const handleDeleteReply = async (replyId: number) => {
    if (!window.confirm('Are you sure you want to delete this reply?')) return;
    try {
      await forumService.deleteReply(replyId);
      setReplies((prev) => prev.filter((r) => r.id !== replyId));
      if (post) {
        setPost({ ...post, repliesCount: Math.max(0, post.repliesCount - 1) });
      }
      setActionMessage('Reply deleted.');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      console.error('Failed to delete reply:', err);
    }
  };

  const handleDeletePost = async () => {
    if (!post || !window.confirm('Are you sure you want to delete this discussion thread? This cannot be undone.')) return;
    try {
      await forumService.deletePost(post.id);
      navigate('/community');
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  const handleSupportCause = async (requestId: number) => {
    try {
      const req = await assistanceService.getRequestById(requestId);
      setDonationRequest(req);
    } catch (err) {
      console.error('Failed to load cause for donation:', err);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setActionMessage('Discussion link copied to clipboard!');
    setTimeout(() => setActionMessage(null), 3000);
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '860px', margin: '4rem auto', textAlign: 'center', color: '#64748b' }}>
        <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Loading discussion details...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div style={{ maxWidth: '860px', margin: '4rem auto', textAlign: 'center', padding: '2rem' }}>
        <p style={{ fontSize: '1.1rem', color: '#dc2626', fontWeight: 600 }}>{error || 'Discussion not found'}</p>
        <Link
          to="/community"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: '#2563eb',
            fontWeight: 600,
            marginTop: '1rem',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={16} /> Return to Community Forum
        </Link>
      </div>
    );
  }

  const isPostAuthor = user?.email === post.authorEmail;
  const isAdmin = hasRole('ROLE_ADMIN');

  return (
    <div style={{ minHeight: '90vh', backgroundColor: '#f8fafc', padding: '2rem 1rem 4rem 1rem' }}>
      {/* Toast Alert */}
      {actionMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '0.75rem 1.25rem',
            borderRadius: '10px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            zIndex: 9999,
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          {actionMessage}
        </div>
      )}

      <div style={{ maxWidth: '880px', margin: '0 auto' }}>
        {/* Back Link */}
        <button
          onClick={() => navigate('/community')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'none',
            border: 'none',
            color: '#475569',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: '1.25rem',
            padding: 0,
          }}
        >
          <ArrowLeft size={16} /> Back to Community Forum
        </button>

        {/* Main Post Card */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            marginBottom: '1.75rem',
          }}
        >
          {/* Header Metadata */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  backgroundColor: '#eff6ff',
                  color: '#1d4ed8',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                }}
              >
                {post.categoryName}
              </span>

              {post.hasAcceptedSolution && (
                <span
                  style={{
                    backgroundColor: '#ecfdf5',
                    color: '#059669',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <CheckCircle size={14} /> Solved
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={handleShare}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  backgroundColor: '#f1f5f9',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.8rem',
                  color: '#475569',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                <Share2 size={14} /> Share
              </button>

              {(isPostAuthor || isAdmin) && (
                <button
                  onClick={handleDeletePost}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    backgroundColor: '#fef2f2',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.4rem 0.75rem',
                    fontSize: '0.8rem',
                    color: '#dc2626',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  <Trash2 size={14} /> Delete
                </button>
              )}
            </div>
          </div>

          {/* Title */}
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem 0', lineHeight: 1.3 }}>
            {post.title}
          </h1>

          {/* Author Details Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              paddingBottom: '1.25rem',
              borderBottom: '1px solid #f1f5f9',
              marginBottom: '1.25rem',
              fontSize: '0.85rem',
              color: '#64748b',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem',
              }}
            >
              {post.authorName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontWeight: 700, color: '#1e293b' }}>{post.authorName}</span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    padding: '0.1rem 0.45rem',
                    borderRadius: '4px',
                    backgroundColor: '#e2e8f0',
                    color: '#475569',
                    fontWeight: 700,
                  }}
                >
                  {post.authorRole}
                </span>
                {post.authorCity && <span>• {post.authorCity}</span>}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Posted on {new Date(post.createdAt).toLocaleDateString()} at {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          {/* Post Content */}
          <div
            style={{
              fontSize: '0.96rem',
              lineHeight: 1.7,
              color: '#334155',
              whiteSpace: 'pre-wrap',
              marginBottom: '1.5rem',
            }}
          >
            {post.content}
          </div>

          {/* Tags */}
          {post.tags && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {post.tags.split(',').map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '0.8rem',
                    color: '#475569',
                    backgroundColor: '#f1f5f9',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                    fontWeight: 500,
                  }}
                >
                  #{tag.trim()}
                </span>
              ))}
            </div>
          )}

          {/* Linked Cause Support Card */}
          {post.assistanceRequestId && (
            <div
              style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#15803d', fontWeight: 700, fontSize: '0.85rem' }}>
                  <HeartHandshake size={18} /> Linked Assistance Cause
                </div>
                <h4 style={{ margin: '0.3rem 0', fontSize: '1.05rem', color: '#0f172a', fontWeight: 700 }}>
                  {post.assistanceRequestTitle}
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#166534' }}>
                  Target: ${post.assistanceTargetAmount} • Raised: ${post.assistanceRaisedAmount}
                </p>
              </div>

              <button
                onClick={() => handleSupportCause(post.assistanceRequestId!)}
                style={{
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.65rem 1.25rem',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                <DollarSign size={16} /> Support Cause Now
              </button>
            </div>
          )}

          {/* Footer Metrics & Upvote Action */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid #f1f5f9',
              paddingTop: '1rem',
            }}
          >
            <button
              onClick={handleToggleUpvote}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: post.isUpvotedByCurrentUser ? '#2563eb' : '#cbd5e1',
                backgroundColor: post.isUpvotedByCurrentUser ? '#eff6ff' : '#ffffff',
                color: post.isUpvotedByCurrentUser ? '#1d4ed8' : '#334155',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <ThumbsUp size={16} fill={post.isUpvotedByCurrentUser ? '#2563eb' : 'none'} />
              <span>{post.upvotesCount} {post.upvotesCount === 1 ? 'Upvote' : 'Upvotes'}</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.85rem', color: '#64748b' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <MessageSquare size={16} /> {replies.length} replies
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <Eye size={16} /> {post.viewsCount} views
              </span>
            </div>
          </div>
        </div>

        {/* Discussion Replies Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
            Community Discussion & Answers ({replies.length})
          </h2>

          {/* New Reply Box */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '1.25rem',
              marginBottom: '1.5rem',
            }}
          >
            {replyError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  backgroundColor: '#fef2f2',
                  color: '#b91c1c',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  marginBottom: '0.75rem',
                }}
              >
                <AlertCircle size={15} />
                <span>{replyError}</span>
              </div>
            )}

            {isAuthenticated ? (
              <form onSubmit={handleCreateReply}>
                <textarea
                  rows={4}
                  placeholder="Share your experience, suggest a clinic, or offer advice..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    color: '#0f172a',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    marginBottom: '0.75rem',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    disabled={submittingReply || !replyContent.trim()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      backgroundColor: submittingReply || !replyContent.trim() ? '#93c5fd' : '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.55rem 1.25rem',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      cursor: submittingReply || !replyContent.trim() ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <Send size={15} /> {submittingReply ? 'Posting...' : 'Post Reply'}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '0 0 0.75rem 0' }}>
                  You must be logged in to participate in community discussions.
                </p>
                <Link
                  to="/login"
                  style={{
                    display: 'inline-block',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    padding: '0.5rem 1.25rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  Log In to Reply
                </Link>
              </div>
            )}
          </div>

          {/* Replies Thread */}
          {replies.length === 0 ? (
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                color: '#64748b',
                border: '1px solid #e2e8f0',
              }}
            >
              <MessageSquare size={32} style={{ color: '#cbd5e1', marginBottom: '0.5rem' }} />
              <p style={{ fontSize: '0.95rem', margin: 0, fontWeight: 600 }}>No replies yet.</p>
              <p style={{ fontSize: '0.82rem', margin: '0.25rem 0 0 0' }}>Be the first to share an answer or word of encouragement!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {replies.map((reply) => {
                const isReplyAuthor = user?.email === reply.authorEmail;
                const canMarkSolution = isPostAuthor || isAdmin;
                const canDelete = isReplyAuthor || isPostAuthor || isAdmin;

                return (
                  <div
                    key={reply.id}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid',
                      borderColor: reply.isSolution ? '#10b981' : '#e2e8f0',
                      padding: '1.25rem',
                      boxShadow: reply.isSolution
                        ? '0 4px 6px -1px rgba(16, 185, 129, 0.1), 0 2px 4px -2px rgba(16, 185, 129, 0.05)'
                        : '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    {/* Solution Highlight Banner */}
                    {reply.isSolution && (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          backgroundColor: '#ecfdf5',
                          color: '#047857',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          marginBottom: '0.75rem',
                        }}
                      >
                        <Check size={14} /> Accepted Community Solution
                      </div>
                    )}

                    {/* Author & Actions Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: reply.isSolution ? '#10b981' : '#64748b',
                            color: '#ffffff',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8rem',
                          }}
                        >
                          {reply.authorName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                              {reply.authorName}
                            </span>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                padding: '0.1rem 0.35rem',
                                borderRadius: '4px',
                                backgroundColor: '#f1f5f9',
                                color: '#475569',
                                fontWeight: 700,
                              }}
                            >
                              {reply.authorRole}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                            {new Date(reply.createdAt).toLocaleDateString()} at {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {canMarkSolution && (
                          <button
                            onClick={() => handleToggleSolution(reply.id)}
                            title={reply.isSolution ? 'Unmark solution' : 'Mark as accepted solution'}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.3rem 0.6rem',
                              borderRadius: '6px',
                              border: '1px solid',
                              borderColor: reply.isSolution ? '#10b981' : '#cbd5e1',
                              backgroundColor: reply.isSolution ? '#ecfdf5' : '#ffffff',
                              color: reply.isSolution ? '#047857' : '#64748b',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            <Check size={13} /> {reply.isSolution ? 'Solution' : 'Mark Solution'}
                          </button>
                        )}

                        {canDelete && (
                          <button
                            onClick={() => handleDeleteReply(reply.id)}
                            title="Delete reply"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#94a3b8',
                              padding: '0.3rem',
                              cursor: 'pointer',
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Reply Text */}
                    <div style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {reply.content}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Donation Modal for linked causes */}
      {donationRequest && (
        <DonationModal
          request={donationRequest}
          onClose={() => setDonationRequest(null)}
          onSuccess={() => {
            setActionMessage('Thank you! Your donation was submitted.');
            setDonationRequest(null);
          }}
        />
      )}
    </div>
  );
};
