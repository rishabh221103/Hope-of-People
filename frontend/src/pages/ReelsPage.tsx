import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Heart, 
  Share2, 
  Volume2, 
  VolumeX, 
  Play, 
  Plus, 
  ChevronUp, 
  ChevronDown, 
  DollarSign, 
  ExternalLink, 
  Check,
  Film,
  MessageCircle,
  MapPin,
  Flag,
  X,
  Send,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { reelService, ReelItem, feedItemToReelItem, ReelCommentItem } from '../services/reelService';
import { assistanceService, AssistanceRequestItem } from '../services/assistanceService';
import { DonationModal } from '../components/DonationModal';
import { CreateReelModal } from '../components/CreateReelModal';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'HEALTHCARE', label: 'Healthcare' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'MICRO_ENTERPRISE', label: 'Micro-Enterprise' },
  { value: 'HOUSING', label: 'Housing' },
  { value: 'EMERGENCY_AID', label: 'Emergency Aid' },
  { value: 'COMMUNITY', label: 'Community' },
];

export const ReelsPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [reels, setReels] = useState<ReelItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [donationRequest, setDonationRequest] = useState<AssistanceRequestItem | null>(null);
  const [videoProgress, setVideoProgress] = useState<number>(0);

  // Pagination & Filtering state
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // Comments Sheet state
  const [isCommentsOpen, setIsCommentsOpen] = useState<boolean>(false);
  const [comments, setComments] = useState<ReelCommentItem[]>([]);
  const [commentsLoading, setCommentsLoading] = useState<boolean>(false);
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [commentSubmitting, setCommentSubmitting] = useState<boolean>(false);

  // Report Modal state
  const [reportModalReelId, setReportModalReelId] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState<string>('');
  const [reportSuccess, setReportSuccess] = useState<boolean>(false);

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const activeReelIdRef = useRef<number | null>(null);

  // Initial feed loader
  const loadInitialFeed = useCallback(async (cat?: string) => {
    try {
      setLoading(true);
      const page = await reelService.getFeed(10, null, cat || undefined);
      const mapped = page.items.map(feedItemToReelItem);
      setReels(mapped);
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
      setCurrentIndex(0);
    } catch (err) {
      console.error('Failed to load reels feed:', err);
      try {
        const legacy = await reelService.getReels();
        setReels(legacy);
        setHasMore(false);
      } catch (e) {
        console.error('Fallback failed:', e);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Category switch
  useEffect(() => {
    loadInitialFeed(selectedCategory);
  }, [selectedCategory, loadInitialFeed]);

  // Load next keyset page
  const loadMoreReels = useCallback(async () => {
    if (!hasMore || loadingMore || !nextCursor) return;
    try {
      setLoadingMore(true);
      const page = await reelService.getFeed(10, nextCursor, selectedCategory || undefined);
      const mapped = page.items.map(feedItemToReelItem);
      setReels((prev) => [...prev, ...mapped]);
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch (err) {
      console.error('Failed to load next page of reels:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, nextCursor, selectedCategory]);

  // Infinite scroll trigger: when within 3 items of the end
  useEffect(() => {
    if (currentIndex >= reels.length - 3 && hasMore && !loadingMore && nextCursor) {
      loadMoreReels();
    }
  }, [currentIndex, reels.length, hasMore, loadingMore, nextCursor, loadMoreReels]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCreateOpen || donationRequest || isCommentsOpen || reportModalReelId) return;
      if (e.key === 'ArrowDown') {
        goToNext();
      } else if (e.key === 'ArrowUp') {
        goToPrev();
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'm' || e.key === 'M') {
        setIsMuted((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, reels.length, isCreateOpen, donationRequest, isCommentsOpen, reportModalReelId, isPlaying]);

  // Video playback
  useEffect(() => {
    const activeReel = reels[currentIndex];
    if (!activeReel) return;

    videoRefs.current.forEach((vid, idx) => {
      if (!vid) return;
      if (idx === currentIndex) {
        if (activeReelIdRef.current !== activeReel.id) {
          activeReelIdRef.current = activeReel.id;
          vid.currentTime = 0;
          vid.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
          reelService.incrementView(activeReel.id).catch(() => {});
        } else if (vid.paused && isPlaying) {
          vid.play().catch(() => {});
        }
      } else {
        vid.pause();
      }
    });
  }, [currentIndex, reels]);

  const goToNext = () => {
    if (currentIndex < reels.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const togglePlayPause = () => {
    const currentVideo = videoRefs.current[currentIndex];
    if (!currentVideo) return;
    if (isPlaying) {
      currentVideo.pause();
      setIsPlaying(false);
    } else {
      currentVideo.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.duration) {
      setVideoProgress((video.currentTime / video.duration) * 100);
    }
  };

  const handleLike = async (reel: ReelItem) => {
    if (!isAuthenticated) {
      if (confirm('Please log in to like this reel. Go to login page?')) {
        navigate('/login');
      }
      return;
    }

    const wasLiked = !!reel.isLikedByCurrentUser;
    const optimisticCount = wasLiked ? Math.max(0, reel.likesCount - 1) : reel.likesCount + 1;

    // Instant optimistic update for immediate feedback
    setReels((prev) =>
      prev.map((r) =>
        r.id === reel.id
          ? {
              ...r,
              likesCount: optimisticCount,
              isLikedByCurrentUser: !wasLiked,
            }
          : r
      )
    );

    try {
      const updated = await reelService.toggleLike(reel.id);
      setReels((prev) =>
        prev.map((r) =>
          r.id === reel.id
            ? {
                ...r,
                likesCount: updated.likesCount,
                isLikedByCurrentUser: updated.isLikedByCurrentUser,
              }
            : r
        )
      );
    } catch (err) {
      // Revert if network call failed
      setReels((prev) =>
        prev.map((r) =>
          r.id === reel.id
            ? {
                ...r,
                likesCount: reel.likesCount,
                isLikedByCurrentUser: wasLiked,
              }
            : r
        )
      );
      console.error('Failed to toggle like:', err);
    }
  };

  const handleShare = (reel: ReelItem) => {
    const shareUrl = `${window.location.origin}/reels?id=${reel.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedId(reel.id);
      setTimeout(() => setCopiedId(null), 2500);
    });
  };

  const handleOpenComments = async (reelId: number) => {
    setIsCommentsOpen(true);
    setCommentsLoading(true);
    try {
      const page = await reelService.getComments(reelId, 20);
      setComments(page.items);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !currentReel) return;
    if (!isAuthenticated) {
      if (confirm('Please log in to comment. Go to login page?')) {
        navigate('/login');
      }
      return;
    }
    setCommentSubmitting(true);
    try {
      const added = await reelService.addComment(currentReel.id, newCommentText.trim());
      setComments((prev) => [added, ...prev]);
      setNewCommentText('');
      setReels((prev) =>
        prev.map((r) =>
          r.id === currentReel.id ? { ...r, commentCount: (r.commentCount || 0) + 1 } : r
        )
      );
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportModalReelId || !reportReason.trim()) return;
    try {
      await reelService.reportReel(reportModalReelId, reportReason.trim());
      setReportSuccess(true);
      setTimeout(() => {
        setReportSuccess(false);
        setReportModalReelId(null);
        setReportReason('');
      }, 1500);
    } catch (err: any) {
      alert(err?.message || 'Failed to submit report.');
    }
  };

  const handleSupportCause = async (reel: ReelItem) => {
    if (reel.assistanceRequestId) {
      try {
        const req = await assistanceService.getRequestById(reel.assistanceRequestId);
        setDonationRequest(req);
      } catch {
        setDonationRequest({
          id: reel.assistanceRequestId,
          userId: reel.userId,
          userFullName: reel.creatorName,
          userEmail: reel.creatorEmail,
          title: reel.assistanceRequestTitle || 'Beneficiary Cause',
          description: reel.caption,
          category: reel.assistanceCategory || 'GENERAL',
          targetAmount: parseFloat(reel.assistanceTargetAmount || '500'),
          raisedAmount: parseFloat(reel.assistanceRaisedAmount || '0'),
          status: 'APPROVED',
          priority: 'HIGH',
          createdAt: reel.createdAt,
          updatedAt: reel.createdAt,
        });
      }
    }
  };

  const handleUploadClick = () => {
    if (!isAuthenticated) {
      if (confirm('You must be logged in to upload an impact reel. Go to Login?')) {
        navigate('/login');
      }
      return;
    }
    setIsCreateOpen(true);
  };

  const currentReel = reels[currentIndex];

  if (loading) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#090d16',
        color: '#ffffff',
        gap: '1rem',
      }}>
        <div style={{
          width: '42px',
          height: '42px',
          border: '4px solid rgba(244, 63, 94, 0.2)',
          borderTopColor: '#f43f5e',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', fontWeight: 500 }}>
          Loading HOP Impact Reels Feed...
        </p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 70px)',
      backgroundColor: '#f8fafc',
      color: '#0f172a',
      padding: '1.25rem 1rem 2rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative',
      userSelect: 'none',
    }}>
      {/* Top Header Row with Clear Upload Button */}
      <div style={{
        width: '100%',
        maxWidth: '920px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
        padding: '0.25rem 0.5rem',
      }}>
        {/* Brand Label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
            padding: '0.5rem',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(244, 63, 94, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Film size={22} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#0f172a' }}>
              HOP Reels
            </h1>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
              Authentic Stories & Source Verification
            </p>
          </div>
        </div>

        {/* ALWAYS-VISIBLE PROMINENT UPLOAD REEL BUTTON */}
        <button
          onClick={handleUploadClick}
          style={{
            background: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            padding: '0.65rem 1.25rem',
            fontSize: '0.875rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 14px rgba(244, 63, 94, 0.45)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Upload Reel</span>
        </button>
      </div>

      {/* Category Filter Chips Bar */}
      <div style={{
        width: '100%',
        maxWidth: '920px',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        overflowX: 'auto',
        padding: '0.25rem 0.5rem 0.75rem',
        marginBottom: '0.75rem',
        scrollbarWidth: 'none',
      }}>
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              style={{
                backgroundColor: isActive ? '#f43f5e' : '#ffffff',
                color: isActive ? '#ffffff' : '#475569',
                border: isActive ? '1px solid #f43f5e' : '1px solid #e2e8f0',
                borderRadius: '9999px',
                padding: '0.35rem 0.9rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? '0 2px 8px rgba(244, 63, 94, 0.35)' : '0 1px 3px rgba(0, 0, 0, 0.04)',
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Main Reels Content Area */}
      {reels.length === 0 ? (
        <div style={{
          maxWidth: '480px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          padding: '3rem 2rem',
          textAlign: 'center',
          border: '1px solid #e2e8f0',
          marginTop: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.06)',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            backgroundColor: 'rgba(244, 63, 94, 0.12)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
            color: '#f43f5e',
          }}>
            <Film size={32} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>
            No Reels Found
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
            {selectedCategory
              ? `There are no live reels under ${selectedCategory} category yet.`
              : 'Be the first creator, beneficiary, or donor to upload a short vertical reel showcase!'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory('')}
                style={{
                  backgroundColor: '#f1f5f9',
                  color: '#0f172a',
                  border: '1px solid #e2e8f0',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                View All Categories
              </button>
            )}
            <button
              onClick={handleUploadClick}
              style={{
                background: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '0.6rem 1.3rem',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Plus size={16} /> Upload First Reel
            </button>
          </div>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          width: '100%',
        }}>
          {/* Vertical Reel Card (9:16 Mobile Aspect Ratio) */}
          <div style={{
            position: 'relative',
            aspectRatio: '9 / 16',
            height: '75vh',
            maxHeight: '690px',
            minHeight: '480px',
            maxWidth: '100%',
            width: 'auto',
            backgroundColor: '#000000',
            borderRadius: '32px',
            border: '6px solid #0f172a',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {/* Active Video Player */}
            <video
              ref={(el) => (videoRefs.current[currentIndex] = el)}
              src={currentReel?.videoUrl}
              poster={currentReel?.thumbnailUrl}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                cursor: 'pointer',
                backgroundColor: '#000000',
              }}
              playsInline
              loop
              muted={isMuted}
              onClick={togglePlayPause}
              onTimeUpdate={handleTimeUpdate}
            />

            {/* Video Fallback / Animated Card Canvas if file has no video frames */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1,
              pointerEvents: 'none',
              background: 'radial-gradient(circle at 50% 30%, rgba(244, 63, 94, 0.15) 0%, rgba(15, 23, 42, 0.4) 100%)',
            }} />

            {/* Top Mute / Sound Toggle */}
            <button
              onClick={() => setIsMuted((prev) => !prev)}
              style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                zIndex: 20,
                backgroundColor: 'rgba(0, 0, 0, 0.55)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} color="#10b981" />}
            </button>

            {/* Center Play / Pause Indicator */}
            {!isPlaying && (
              <div
                onClick={togglePlayPause}
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0, 0, 0, 0.35)',
                  zIndex: 15,
                  cursor: 'pointer',
                }}
              >
                <div style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.65)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: '50%',
                  width: '64px',
                  height: '64px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                }}>
                  <Play size={28} style={{ marginLeft: '3px' }} />
                </div>
              </div>
            )}

            {/* Video Progress Bar */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '3px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              zIndex: 25,
            }}>
              <div style={{
                height: '100%',
                width: `${videoProgress}%`,
                backgroundColor: '#f43f5e',
                transition: 'width 0.1s linear',
              }} />
            </div>

            {/* Right Action Icons Column */}
            <div style={{
              position: 'absolute',
              right: '12px',
              bottom: '80px',
              zIndex: 20,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '14px',
            }}>
              {/* Like Button */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <button
                  onClick={() => handleLike(currentReel)}
                  style={{
                    backgroundColor: currentReel.isLikedByCurrentUser ? '#f43f5e' : 'rgba(0, 0, 0, 0.55)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: currentReel.isLikedByCurrentUser ? '0 4px 12px rgba(244, 63, 94, 0.45)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Heart size={20} fill={currentReel.isLikedByCurrentUser ? '#ffffff' : 'none'} />
                </button>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
                  {currentReel.likesCount}
                </span>
              </div>

              {/* Comment Button */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <button
                  onClick={() => handleOpenComments(currentReel.id)}
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.55)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <MessageCircle size={20} />
                </button>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
                  {currentReel.commentCount || 0}
                </span>
              </div>

              {/* Share Button */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <button
                  onClick={() => handleShare(currentReel)}
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.55)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  {copiedId === currentReel.id ? <Check size={20} color="#10b981" /> : <Share2 size={20} />}
                </button>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
                  {copiedId === currentReel.id ? 'Copied' : 'Share'}
                </span>
              </div>

              {/* Report Button */}
              <button
                onClick={() => setReportModalReelId(currentReel.id)}
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.45)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                title="Report reel"
              >
                <Flag size={15} />
              </button>

              {/* Cause Support Donate Button */}
              {currentReel.assistanceRequestId && (
                <button
                  onClick={() => handleSupportCause(currentReel)}
                  style={{
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(5, 150, 105, 0.45)',
                  }}
                  title="Donate to this cause"
                >
                  <DollarSign size={20} />
                </button>
              )}
            </div>

            {/* Bottom Content Overlay */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '1.25rem 1rem 1rem',
              background: 'linear-gradient(to top, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.75) 50%, transparent 100%)',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
            }}>
              {/* Creator & Category Badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  color: '#ffffff',
                  border: '1.5px solid rgba(255, 255, 255, 0.3)',
                  flexShrink: 0,
                }}>
                  {currentReel.creatorName ? currentReel.creatorName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
                      {currentReel.creatorName || 'HOP Member'}
                    </span>
                    {currentReel.category && (
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        backgroundColor: 'rgba(244, 63, 94, 0.25)',
                        color: '#fda4af',
                        border: '1px solid rgba(244, 63, 94, 0.4)',
                        padding: '0.1rem 0.5rem',
                        borderRadius: '9999px',
                        textTransform: 'uppercase',
                      }}>
                        {currentReel.category}
                      </span>
                    )}
                  </div>
                  {currentReel.sourceLocation && (
                    <span style={{
                      fontSize: '0.72rem',
                      color: '#cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      marginTop: '1px',
                    }}>
                      <MapPin size={11} color="#f43f5e" />
                      {currentReel.sourceLocation}
                    </span>
                  )}
                </div>
              </div>

              {/* Caption */}
              <p style={{
                fontSize: '0.82rem',
                color: '#f1f5f9',
                margin: '0.2rem 0',
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {currentReel.caption}
              </p>

              {/* Verified Source / Supplier Link */}
              {currentReel.supplierLink && (
                <a
                  href={currentReel.supplierLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: '#38bdf8',
                    backgroundColor: 'rgba(12, 74, 110, 0.5)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '8px',
                    width: 'fit-content',
                    textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={12} />
                  <span>Verified Supplier / Source</span>
                </a>
              )}

              {/* Linked Assistance Cause Pill */}
              {currentReel.assistanceRequestId && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  padding: '0.4rem 0.65rem',
                  borderRadius: '10px',
                  gap: '0.5rem',
                  marginTop: '0.2rem',
                }}>
                  <div style={{ overflow: 'hidden' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#f43f5e', textTransform: 'uppercase', display: 'block' }}>
                      {currentReel.assistanceCategory || 'Urgent Cause'}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', display: 'block' }}>
                      {currentReel.assistanceRequestTitle || 'Beneficiary Assistance'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleSupportCause(currentReel)}
                    style={{
                      backgroundColor: '#059669',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.3rem 0.7rem',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      flexShrink: 0,
                    }}
                  >
                    <Heart size={12} fill="#ffffff" />
                    Support
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Navigation Arrows (Up / Down) */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            <button
              onClick={goToPrev}
              disabled={currentIndex === 0}
              style={{
                backgroundColor: currentIndex === 0 ? '#f1f5f9' : '#ffffff',
                color: currentIndex === 0 ? '#94a3b8' : '#0f172a',
                border: '1px solid #e2e8f0',
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                boxShadow: currentIndex === 0 ? 'none' : '0 4px 12px rgba(15, 23, 42, 0.08)',
                transition: 'all 0.15s ease',
              }}
              title="Previous Reel (Up Arrow)"
            >
              <ChevronUp size={24} />
            </button>

            <button
              onClick={goToNext}
              disabled={currentIndex === reels.length - 1 && !hasMore}
              style={{
                backgroundColor: currentIndex === reels.length - 1 && !hasMore ? '#f1f5f9' : '#ffffff',
                color: currentIndex === reels.length - 1 && !hasMore ? '#94a3b8' : '#0f172a',
                border: '1px solid #e2e8f0',
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: currentIndex === reels.length - 1 && !hasMore ? 'not-allowed' : 'pointer',
                boxShadow: currentIndex === reels.length - 1 && !hasMore ? 'none' : '0 4px 12px rgba(15, 23, 42, 0.08)',
                transition: 'all 0.15s ease',
              }}
              title="Next Reel (Down Arrow)"
            >
              {loadingMore ? <Loader2 size={22} color="#f43f5e" className="animate-spin" /> : <ChevronDown size={24} />}
            </button>
          </div>
        </div>
      )}

      {/* Slide-Up Comments Drawer */}
      {isCommentsOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '460px',
            height: '65vh',
            maxHeight: '520px',
            backgroundColor: '#ffffff',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.15)',
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.25rem',
              borderBottom: '1px solid #f1f5f9',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                <MessageCircle size={18} color="#f43f5e" />
                <span>Comments ({currentReel?.commentCount || comments.length})</span>
              </div>
              <button
                onClick={() => setIsCommentsOpen(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Comments Stream */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {commentsLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  <Loader2 size={24} color="#f43f5e" style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                </div>
              ) : comments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b', fontSize: '0.85rem' }}>
                  No comments yet. Be the first to share positive feedback!
                </div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                    <div style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      backgroundColor: '#e2e8f0',
                      color: '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}>
                      {c.user?.name ? c.user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '0.5rem 0.75rem',
                      flex: 1,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>
                          {c.user?.name || 'Community Member'}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                          {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#334155', margin: '0.25rem 0 0', lineHeight: 1.4 }}>
                        {c.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              borderTop: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
            }}>
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder={isAuthenticated ? "Add a kind comment..." : "Log in to post a comment"}
                disabled={!isAuthenticated || commentSubmitting}
                style={{
                  flex: 1,
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  borderRadius: '10px',
                  padding: '0.6rem 0.85rem',
                  fontSize: '0.82rem',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={!isAuthenticated || !newCommentText.trim() || commentSubmitting}
                style={{
                  backgroundColor: '#f43f5e',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.6rem 0.9rem',
                  cursor: !isAuthenticated || !newCommentText.trim() || commentSubmitting ? 'not-allowed' : 'pointer',
                  opacity: !isAuthenticated || !newCommentText.trim() || commentSubmitting ? 0.45 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {commentSubmitting ? <Loader2 size={16} /> : <Send size={16} />}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportModalReelId && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}>
          <div style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '18px',
            width: '100%',
            maxWidth: '400px',
            padding: '1.5rem',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f43f5e', fontWeight: 700, fontSize: '0.95rem' }}>
                <Flag size={18} />
                <span>Report Reel #{reportModalReelId}</span>
              </div>
              <button onClick={() => setReportModalReelId(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            {reportSuccess ? (
              <div style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                borderRadius: '10px',
                padding: '0.75rem',
                fontSize: '0.85rem',
                textAlign: 'center',
              }}>
                Report submitted for admin review. Thank you for keeping HOP safe!
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <p style={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: 1.4, margin: 0 }}>
                  Help maintain community standards. Please describe why this video should be reviewed:
                </p>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="e.g. Beneficiary privacy exposed without consent, misleading claims..."
                  rows={3}
                  required
                  style={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    color: '#ffffff',
                    borderRadius: '10px',
                    padding: '0.65rem',
                    fontSize: '0.82rem',
                    resize: 'none',
                    outline: 'none',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setReportModalReelId(null)}
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px solid #334155',
                      color: '#94a3b8',
                      borderRadius: '8px',
                      padding: '0.45rem 0.9rem',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      backgroundColor: '#f43f5e',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.45rem 1rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Create Reel Modal */}
      <CreateReelModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(newReel) => {
          setReels((prev) => [newReel, ...prev]);
          setCurrentIndex(0);
        }}
      />

      {/* Direct Donation Modal */}
      {donationRequest && (
        <DonationModal
          request={donationRequest}
          onClose={() => setDonationRequest(null)}
          onSuccess={() => {
            alert('Thank you for supporting this cause!');
            setDonationRequest(null);
          }}
        />
      )}
    </div>
  );
};
