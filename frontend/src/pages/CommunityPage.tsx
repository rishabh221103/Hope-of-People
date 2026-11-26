import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Search,
  Plus,
  ThumbsUp,
  Eye,
  CheckCircle,
  Activity,
  Accessibility,
  GraduationCap,
  Briefcase,
  Heart,
  HelpCircle,
  Share2,
  DollarSign,
  Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { forumService, ForumCategory, ForumPost } from '../services/forumService';
import { CreateDiscussionModal } from '../components/CreateDiscussionModal';
import { DonationModal } from '../components/DonationModal';
import { AssistanceRequestItem, assistanceService } from '../services/assistanceService';

export const CommunityPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<'newest' | 'popular' | 'unanswered'>('newest');
  const [loading, setLoading] = useState(true);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [donationRequest, setDonationRequest] = useState<AssistanceRequestItem | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadPosts();
  }, [selectedCategoryId, sortOption]);

  const loadCategories = async () => {
    try {
      const data = await forumService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadPosts = async () => {
    try {
      setLoading(true);
      const data = await forumService.getPosts({
        categoryId: selectedCategoryId || undefined,
        search: searchQuery.trim() || undefined,
        sort: sortOption,
      });
      setPosts(data);
    } catch (err) {
      console.error('Failed to load forum posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadPosts();
  };

  const handleToggleUpvote = async (e: React.MouseEvent, postId: number) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const res = await forumService.toggleUpvote(postId);
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              isUpvotedByCurrentUser: res.isUpvoted,
              upvotesCount: res.isUpvoted ? p.upvotesCount + 1 : Math.max(0, p.upvotesCount - 1),
            };
          }
          return p;
        })
      );
    } catch (err) {
      console.error('Failed to upvote post:', err);
    }
  };

  const handleSupportCause = async (e: React.MouseEvent, requestId: number) => {
    e.stopPropagation();
    try {
      const req = await assistanceService.getRequestById(requestId);
      setDonationRequest(req);
    } catch (err) {
      console.error('Failed to load cause for donation:', err);
    }
  };

  const handleSharePost = (e: React.MouseEvent, postId: number) => {
    e.stopPropagation();
    const url = `${window.location.origin}/community/posts/${postId}`;
    navigator.clipboard.writeText(url);
    setActionMessage('Discussion link copied to clipboard!');
    setTimeout(() => setActionMessage(null), 3000);
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Activity':
        return <Activity size={18} />;
      case 'Accessibility':
        return <Accessibility size={18} />;
      case 'GraduationCap':
        return <GraduationCap size={18} />;
      case 'Briefcase':
        return <Briefcase size={18} />;
      case 'Heart':
        return <Heart size={18} />;
      default:
        return <MessageSquare size={18} />;
    }
  };

  return (
    <div style={{ minHeight: '90vh', backgroundColor: '#f8fafc', paddingBottom: '3rem' }}>
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

      {/* Hero Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%)',
          color: '#ffffff',
          padding: '3rem 1.5rem',
          textAlign: 'center',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              padding: '0.4rem 1rem',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '1rem',
              backdropFilter: 'blur(4px)',
            }}
          >
            <MessageSquare size={16} /> Public Knowledge & Mutual Aid Exchange
          </div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, margin: '0 0 0.75rem 0', letterSpacing: '-0.025em' }}>
            HOP Community Forum & Discussion Wall
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#bfdbfe', margin: '0 0 1.75rem 0', lineHeight: 1.5 }}>
            Ask health questions, lend or request medical equipment, share study guidance, and exchange micro-enterprise tips.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  navigate('/login');
                } else {
                  setIsCreateModalOpen(true);
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#ffffff',
                color: '#1d4ed8',
                border: 'none',
                borderRadius: '10px',
                padding: '0.75rem 1.5rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              }}
            >
              <Plus size={18} /> Start a Discussion
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Category Pills Navigation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem',
            marginBottom: '1.75rem',
          }}
        >
          <button
            onClick={() => setSelectedCategoryId(null)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.55rem 1rem',
              borderRadius: '9999px',
              border: '1px solid',
              borderColor: selectedCategoryId === null ? '#2563eb' : '#cbd5e1',
              backgroundColor: selectedCategoryId === null ? '#eff6ff' : '#ffffff',
              color: selectedCategoryId === null ? '#1d4ed8' : '#475569',
              fontWeight: 600,
              fontSize: '0.86rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <Filter size={15} /> All Discussions
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.55rem 1rem',
                borderRadius: '9999px',
                border: '1px solid',
                borderColor: selectedCategoryId === cat.id ? '#2563eb' : '#cbd5e1',
                backgroundColor: selectedCategoryId === cat.id ? '#eff6ff' : '#ffffff',
                color: selectedCategoryId === cat.id ? '#1d4ed8' : '#475569',
                fontWeight: 600,
                fontSize: '0.86rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {getCategoryIcon(cat.iconName)}
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.5rem',
            backgroundColor: '#ffffff',
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
          }}
        >
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', flex: '1 1 300px', maxWidth: '500px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type="text"
                placeholder="Search topics by keyword, symptoms, equipment, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem 0.55rem 2.25rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <Search
                size={16}
                style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
              />
            </div>
            <button
              type="submit"
              style={{
                marginLeft: '0.5rem',
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Search
            </button>
          </form>

          {/* Sort Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Sort By:</span>
            <button
              onClick={() => setSortOption('newest')}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: sortOption === 'newest' ? '#2563eb' : '#e2e8f0',
                backgroundColor: sortOption === 'newest' ? '#eff6ff' : '#ffffff',
                color: sortOption === 'newest' ? '#2563eb' : '#475569',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Newest
            </button>
            <button
              onClick={() => setSortOption('popular')}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: sortOption === 'popular' ? '#2563eb' : '#e2e8f0',
                backgroundColor: sortOption === 'popular' ? '#eff6ff' : '#ffffff',
                color: sortOption === 'popular' ? '#2563eb' : '#475569',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Most Upvoted
            </button>
            <button
              onClick={() => setSortOption('unanswered')}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: sortOption === 'unanswered' ? '#2563eb' : '#e2e8f0',
                backgroundColor: sortOption === 'unanswered' ? '#eff6ff' : '#ffffff',
                color: sortOption === 'unanswered' ? '#2563eb' : '#475569',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Unanswered
            </button>
          </div>
        </div>

        {/* Discussion Post Feed */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>Loading discussions...</div>
          </div>
        ) : posts.length === 0 ? (
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '3rem 2rem',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
              }}
            >
              <HelpCircle size={28} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              No discussions found
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '0 0 1.5rem 0' }}>
              Be the first to start a conversation, share guidance, or ask for help in this category!
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              Start First Discussion
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {posts.map((post) => (
              <div
                key={post.id}
                onClick={() => navigate(`/community/posts/${post.id}`)}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  gap: '1.25rem',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#93c5fd';
                  e.currentTarget.style.boxShadow = '0 6px 12px -2px rgba(0, 0, 0, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.05)';
                }}
              >
                {/* Left: Upvote Column */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <button
                    onClick={(e) => handleToggleUpvote(e, post.id)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '46px',
                      padding: '0.45rem 0',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: post.isUpvotedByCurrentUser ? '#2563eb' : '#e2e8f0',
                      backgroundColor: post.isUpvotedByCurrentUser ? '#eff6ff' : '#f8fafc',
                      color: post.isUpvotedByCurrentUser ? '#2563eb' : '#64748b',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <ThumbsUp size={16} fill={post.isUpvotedByCurrentUser ? '#2563eb' : 'none'} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, marginTop: '0.2rem' }}>
                      {post.upvotesCount}
                    </span>
                  </button>
                </div>

                {/* Main Content Column */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                    <span
                      style={{
                        backgroundColor: '#eff6ff',
                        color: '#1d4ed8',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
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
                          padding: '0.2rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <CheckCircle size={13} /> Solved
                      </span>
                    )}

                    {post.isPinned && (
                      <span
                        style={{
                          backgroundColor: '#fef3c7',
                          color: '#d97706',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        Pinned
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: '#0f172a',
                      margin: '0 0 0.4rem 0',
                      lineHeight: 1.35,
                    }}
                  >
                    {post.title}
                  </h3>

                  {/* Post excerpt */}
                  <p
                    style={{
                      fontSize: '0.88rem',
                      color: '#475569',
                      margin: '0 0 0.75rem 0',
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {post.content}
                  </p>

                  {/* Linked Cause Pill */}
                  {post.assistanceRequestId && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '8px',
                        padding: '0.4rem 0.75rem',
                        marginBottom: '0.75rem',
                        maxWidth: '100%',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#166534', fontWeight: 600 }}>
                        <DollarSign size={14} />
                        <span>Linked Cause: <strong>{post.assistanceRequestTitle}</strong></span>
                      </div>
                      <button
                        onClick={(e) => handleSupportCause(e, post.assistanceRequestId!)}
                        style={{
                          backgroundColor: '#16a34a',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.25rem 0.65rem',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Support ($)
                      </button>
                    </div>
                  )}

                  {/* Tags */}
                  {post.tags && (
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                      {post.tags.split(',').map((tag, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '0.74rem',
                            color: '#64748b',
                            backgroundColor: '#f1f5f9',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                          }}
                        >
                          #{tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Bottom Meta Bar */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      fontSize: '0.8rem',
                      color: '#64748b',
                      borderTop: '1px solid #f1f5f9',
                      paddingTop: '0.65rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 600, color: '#334155' }}>{post.authorName}</span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          backgroundColor: '#e2e8f0',
                          color: '#475569',
                          fontWeight: 600,
                        }}
                      >
                        {post.authorRole}
                      </span>
                      {post.authorCity && <span>• {post.authorCity}</span>}
                      <span>• {new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MessageSquare size={14} /> {post.repliesCount} replies
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Eye size={14} /> {post.viewsCount} views
                      </span>
                      <button
                        onClick={(e) => handleSharePost(e, post.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          color: '#64748b',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                          fontSize: '0.8rem',
                        }}
                      >
                        <Share2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Discussion Modal */}
      <CreateDiscussionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        preselectedCategoryId={selectedCategoryId || undefined}
        onPostCreated={(newPost) => {
          setPosts([newPost, ...posts]);
          setActionMessage('Discussion published successfully!');
          setTimeout(() => setActionMessage(null), 3000);
        }}
      />

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
