import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Heart,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Clock,
  Activity,
  Apple,
  BookOpen,
  Home,
  Users,
  Eye,
  PlusCircle,
} from 'lucide-react';
import { DonationModal } from './DonationModal';
import { CreateStoryModal } from './CreateStoryModal';
import { AssistanceRequestItem } from '../services/assistanceService';
import { storyService, StoryItem } from '../services/storyService';
import { getCategoryFallbackPhoto } from '../utils/mediaUtils';

export interface HumanitarianStory {
  id: number;
  category: 'MEDICAL' | 'FOOD' | 'EDUCATION' | 'HOUSING' | 'ELDER_CARE' | string;
  title: string;
  beneficiaryName: string;
  location: string;
  description: string;
  urgency: string;
  targetAmount: number;
  raisedAmount: number;
  imageUrl: string;
  icon: React.ReactNode;
  tagColor: string;
  isRealSubmission?: boolean;
  secondsRemaining?: number;
  expiresAt?: string;
}

const getCategoryMeta = (cat: string) => {
  switch (cat?.toUpperCase()) {
    case 'MEDICAL':
      return { tagColor: '#dc2626', icon: <Activity size={16} /> };
    case 'FOOD':
      return { tagColor: '#059669', icon: <Apple size={16} /> };
    case 'EDUCATION':
      return { tagColor: '#2563eb', icon: <BookOpen size={16} /> };
    case 'HOUSING':
      return { tagColor: '#d97706', icon: <Home size={16} /> };
    case 'ELDER_CARE':
      return { tagColor: '#7c3aed', icon: <Users size={16} /> };
    default:
      return { tagColor: '#dc2626', icon: <Heart size={16} /> };
  }
};

interface Props {
  onDonateClick?: (story: HumanitarianStory) => void;
  compact?: boolean;
}

export const HumanitarianStoryCarousel: React.FC<Props> = ({ onDonateClick, compact = false }) => {
  const { isAuthenticated, hasRole } = useAuth();
  const isDonor = hasRole('ROLE_DONOR');

  const [stories, setStories] = useState<HumanitarianStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [modalRequest, setModalRequest] = useState<AssistanceRequestItem | null>(null);
  const [donationMsg, setDonationMsg] = useState<string | null>(null);

  const timerRef = useRef<any>(null);
  const SLIDE_DURATION = 6000; // 6 seconds per slide

  useEffect(() => {
    loadActiveStories();
  }, []);

  const loadActiveStories = () => {
    setIsLoading(true);
    storyService
      .getActiveStories()
      .then((data) => {
        if (data && data.length > 0) {
          const dynamicStories: HumanitarianStory[] = data.map((s) => {
            const meta = getCategoryMeta(s.category);
            return {
              id: s.id,
              category: s.category as any,
              title: s.title,
              beneficiaryName: s.beneficiaryName,
              location: s.location || 'Community Location',
              description: s.description,
              urgency: s.urgency || 'CRITICAL AID: 48 HOURS',
              targetAmount: s.targetAmount,
              raisedAmount: s.raisedAmount || 0,
              imageUrl: s.imageUrl || getCategoryFallbackPhoto(s.category),
              icon: meta.icon,
              tagColor: meta.tagColor,
              isRealSubmission: true,
              secondsRemaining: s.secondsRemaining,
              expiresAt: s.expiresAt,
            };
          });

          setStories(dynamicStories);
        } else {
          setStories([]);
        }
      })
      .catch((err) => {
        console.error('Failed to load active stories', err);
        setStories([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (isPaused || stories.length === 0) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % stories.length);
    }, SLIDE_DURATION);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, currentIndex, stories.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? stories.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % stories.length);
  };

  const current = stories.length > 0 ? (stories[currentIndex] || stories[0]) : null;
  const pct = current ? Math.min(100, Math.round(((current.raisedAmount || 0) / current.targetAmount) * 100)) : 0;

  const formatCountdown = (seconds?: number) => {
    if (!seconds || seconds <= 0) return '48-Hour Live Story';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `Expires in ${hours}h ${minutes}m`;
  };

  const handleStoryCreated = (newStoryItem: StoryItem) => {
    const meta = getCategoryMeta(newStoryItem.category);
    const newStory: HumanitarianStory = {
      id: newStoryItem.id,
      category: newStoryItem.category as any,
      title: newStoryItem.title,
      beneficiaryName: newStoryItem.beneficiaryName,
      location: newStoryItem.location || 'Community Location',
      description: newStoryItem.description,
      urgency: newStoryItem.urgency || 'CRITICAL AID: 48 HOURS',
      targetAmount: newStoryItem.targetAmount,
      raisedAmount: newStoryItem.raisedAmount || 0,
      imageUrl: newStoryItem.imageUrl || getCategoryFallbackPhoto(newStoryItem.category),
      icon: meta.icon,
      tagColor: meta.tagColor,
      isRealSubmission: true,
      secondsRemaining: newStoryItem.secondsRemaining || 172800,
      expiresAt: newStoryItem.expiresAt,
    };

    setStories((prev) => [newStory, ...prev.filter((s) => s.id !== newStory.id)]);
    setCurrentIndex(0);
    setDonationMsg('🎉 Your 48-hour urgent story was published successfully! It is now live on the community showcase.');
    setTimeout(() => setDonationMsg(null), 7000);
  };

  const handleDonate = (story: HumanitarianStory) => {
    if (onDonateClick) {
      onDonateClick(story);
      return;
    }

    // Convert story to AssistanceRequestItem for DonationModal
    setModalRequest({
      id: story.id,
      userId: 999,
      userFullName: story.beneficiaryName,
      userEmail: 'beneficiary@hop.org',
      title: story.title,
      description: story.description,
      category: story.category,
      targetAmount: story.targetAmount,
      raisedAmount: story.raisedAmount,
      status: 'APPROVED',
      priority: 'URGENT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      documents: [],
    });
  };

  return (
    <div
      className="humanitarian-carousel-wrapper"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        position: 'relative',
        marginBottom: compact ? '2rem' : '3.5rem',
      }}
    >
      {/* Beneficiary Quick Action Banner */}
      {isAuthenticated && !isDonor && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            padding: '0.75rem 1.25rem',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} color="#dc2626" />
            <div>
              <strong style={{ fontSize: '0.9rem', color: '#991b1b', display: 'block' }}>
                Need emergency micro-funding?
              </strong>
              <span style={{ fontSize: '0.775rem', color: '#7f1d1d' }}>
                Share your urgent story to this community carousel (Featured for 48 hours, Max limit $500).
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsStoryModalOpen(true)}
            className="btn btn-sm"
            style={{
              background: '#dc2626',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 10px rgba(220, 38, 38, 0.3)',
              cursor: 'pointer',
            }}
          >
            <PlusCircle size={15} />
            <span>Post 48-Hour Urgent Story</span>
          </button>
        </div>
      )}

      {donationMsg && (
        <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
          <span>{donationMsg}</span>
        </div>
      )}

      {isLoading ? (
        <div
          className="humanitarian-carousel-card"
          style={{
            position: 'relative',
            borderRadius: '20px',
            overflow: 'hidden',
            minHeight: compact ? '280px' : '360px',
            boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.3)',
            border: '1px solid var(--border)',
            background: '#0f172a',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem', width: '36px', height: '36px', borderColor: '#ef4444', borderTopColor: 'transparent' }} />
            <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Loading verified 48-hour humanitarian stories...</p>
          </div>
        </div>
      ) : stories.length === 0 ? (
        /* Empty State when no real stories are currently active */
        <div
          className="humanitarian-carousel-card"
          style={{
            position: 'relative',
            borderRadius: '20px',
            overflow: 'hidden',
            minHeight: compact ? '260px' : '320px',
            boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.3)',
            border: '1px solid var(--border)',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '3rem 1.5rem',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem',
              color: '#f87171',
            }}
          >
            <Clock size={32} />
          </div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem', color: '#ffffff' }}>
            No Urgent 48-Hour Stories Active
          </h3>
          <p
            style={{
              color: '#94a3b8',
              maxWidth: '540px',
              fontSize: '0.925rem',
              lineHeight: 1.6,
              marginBottom: '1.5rem',
            }}
          >
            Beneficiaries can publish time-sensitive emergency appeals (max $500, active for 48 hours). When submitted, they will appear directly in this live community carousel and auto-expire once completed or expired.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {isAuthenticated && !isDonor ? (
              <button
                type="button"
                onClick={() => setIsStoryModalOpen(true)}
                className="btn btn-primary"
                style={{
                  background: '#dc2626',
                  borderColor: '#dc2626',
                  fontWeight: 700,
                  padding: '0.65rem 1.35rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)',
                }}
              >
                <PlusCircle size={18} />
                <span>Post 48-Hour Urgent Story</span>
              </button>
            ) : (
              <Link
                to="/initiatives"
                className="btn btn-primary"
                style={{
                  fontWeight: 700,
                  padding: '0.65rem 1.35rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Eye size={18} />
                <span>Browse All Community Causes</span>
              </Link>
            )}
          </div>
        </div>
      ) : current ? (
        <>
          {/* Category Navigation Pills */}
          <div
            className="tabs-scroll-container"
            style={{
              display: 'flex',
              gap: '0.5rem',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: '1rem',
              flexWrap: 'wrap',
            }}
          >
            {stories.map((s, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={s.id}
                  onClick={() => setCurrentIndex(idx)}
                  className="category-pill-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '0.45rem 0.95rem',
                    borderRadius: '9999px',
                    fontSize: '0.825rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: isActive ? `2px solid ${s.tagColor}` : '1px solid var(--border)',
                    background: isActive ? s.tagColor : 'var(--surface)',
                    color: isActive ? '#ffffff' : 'var(--text-muted)',
                    boxShadow: isActive ? `0 4px 12px ${s.tagColor}40` : 'var(--shadow-sm)',
                    transition: 'all 0.25s ease',
                  }}
                >
                  <span>{s.icon}</span>
                  <span>{s.category.replace('_', ' ')}</span>
                </button>
              );
            })}
          </div>

          {/* Main Animated Display Card */}
          <div
            className="humanitarian-carousel-card"
            style={{
              position: 'relative',
              borderRadius: '20px',
              overflow: 'hidden',
              minHeight: compact ? '420px' : '480px',
              boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.4)',
              border: '1px solid var(--border)',
              background: '#0f172a',
              color: '#ffffff',
            }}
          >
            {/* Animated Background Slide Images */}
            {stories.map((story, idx) => {
              const isCurrent = idx === currentIndex;
              return (
                <div
                  key={story.id}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: isCurrent ? 1 : 0,
                    zIndex: isCurrent ? 1 : 0,
                    transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                    pointerEvents: isCurrent ? 'auto' : 'none',
                  }}
                >
                  <img
                    src={story.imageUrl}
                    alt={story.title}
                    className={isCurrent ? 'carousel-animated-img' : ''}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      filter: 'brightness(0.65) contrast(1.1)',
                    }}
                  />
                </div>
              );
            })}

            {/* Cinematic Gradient Overlays */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(to top, rgba(15, 23, 42, 0.96) 0%, rgba(15, 23, 42, 0.72) 45%, rgba(15, 23, 42, 0.25) 100%)',
                zIndex: 2,
              }}
            />

            {/* Animated Slide Progress Bar */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'rgba(255, 255, 255, 0.15)',
                zIndex: 10,
              }}
            >
              <div
                key={currentIndex}
                className="carousel-timer-fill"
                style={{
                  height: '100%',
                  background: current.tagColor,
                  animation: isPaused ? 'none' : `timerProgress ${SLIDE_DURATION}ms linear forwards`,
                }}
              />
            </div>

            {/* Foreground Content */}
            <div
              style={{
                position: 'relative',
                zIndex: 3,
                padding: 'clamp(1.5rem, 4vw, 3rem)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
                minHeight: compact ? '420px' : '480px',
                boxSizing: 'border-box',
              }}
            >
              {/* Top Bar: Urgency Tag & Verified Indicator */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: current.tagColor,
                      color: '#ffffff',
                      padding: '0.35rem 0.85rem',
                      borderRadius: '9999px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      boxShadow: `0 0 15px ${current.tagColor}80`,
                    }}
                  >
                    <span className="live-pulse-dot" />
                    {current.isRealSubmission ? `⚡ ${formatCountdown(current.secondsRemaining)}` : current.urgency}
                  </span>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(6px)',
                      color: '#ffffff',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    <ShieldCheck size={14} color="#4ade80" />
                    {current.isRealSubmission ? 'Verified Beneficiary Story (Max $500)' : 'HOP Verified Case'}
                  </span>

                  {current.isRealSubmission && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: '#fef3c7',
                        color: '#92400e',
                        padding: '0.35rem 0.65rem',
                        borderRadius: '9999px',
                        fontSize: '0.725rem',
                        fontWeight: 700,
                      }}
                    >
                      <Clock size={12} />
                      48-Hour Live Appeal
                    </span>
                  )}
                </div>

                <div
                  style={{
                    fontSize: '0.8rem',
                    color: '#cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Clock size={14} />
                  Story {currentIndex + 1} of {stories.length}
                </div>
              </div>

              {/* Center Story Description */}
              <div style={{ margin: '1.5rem 0', maxWidth: '780px' }}>
                <div
                  style={{
                    fontSize: '0.85rem',
                    color: '#93c5fd',
                    fontWeight: 600,
                    marginBottom: '0.4rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>Applied by: {current.beneficiaryName}</span>
                  <span>•</span>
                  <span>{current.location}</span>
                </div>

                <h2
                  style={{
                    fontSize: 'clamp(1.35rem, 3.5vw, 2.15rem)',
                    fontWeight: 800,
                    color: '#ffffff',
                    lineHeight: 1.25,
                    marginBottom: '0.85rem',
                    textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  }}
                >
                  {current.title}
                </h2>

                <p
                  style={{
                    color: '#e2e8f0',
                    fontSize: 'clamp(0.9rem, 2vw, 1.05rem)',
                    lineHeight: 1.6,
                    marginBottom: '1.25rem',
                    maxWidth: '720px',
                    textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                  }}
                >
                  {current.description}
                </p>

                {/* Funding Progress Meter */}
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    padding: '0.85rem 1.15rem',
                    maxWidth: '560px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.5rem',
                      fontSize: '0.85rem',
                    }}
                  >
                    <span style={{ color: '#4ade80', fontWeight: 800, fontSize: '0.95rem' }}>
                      ${current.raisedAmount.toLocaleString()} funded
                    </span>
                    <span style={{ color: '#cbd5e1' }}>
                      Target: <strong>${current.targetAmount.toLocaleString()}</strong> ({pct}%)
                    </span>
                  </div>

                  <div
                    style={{
                      width: '100%',
                      height: '8px',
                      background: 'rgba(255, 255, 255, 0.15)',
                      borderRadius: '9999px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, #3b82f6, ${current.tagColor})`,
                        borderRadius: '9999px',
                        transition: 'width 0.8s ease-out',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                {/* Contextual Action Buttons */}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {isDonor || !isAuthenticated ? (
                    <button
                      type="button"
                      onClick={() => handleDonate(current)}
                      className="btn btn-primary"
                      style={{
                        background: current.tagColor,
                        borderColor: current.tagColor,
                        fontWeight: 700,
                        padding: '0.65rem 1.35rem',
                        boxShadow: `0 4px 14px ${current.tagColor}60`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <Heart size={18} fill="#ffffff" />
                      <span>Donate to This Cause</span>
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setIsStoryModalOpen(true)}
                        className="btn btn-primary"
                        style={{
                          background: '#dc2626',
                          borderColor: '#dc2626',
                          fontWeight: 700,
                          padding: '0.65rem 1.35rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)',
                        }}
                      >
                        <Clock size={18} />
                        <span>Post 48h Story (Max $500)</span>
                      </button>
                      <Link
                        to="/request-aid"
                        className="btn btn-outline"
                        style={{
                          borderColor: 'rgba(255, 255, 255, 0.4)',
                          color: '#ffffff',
                          background: 'rgba(255, 255, 255, 0.08)',
                          padding: '0.65rem 1.15rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>Full Aid Application</span>
                      </Link>
                    </div>
                  )}

                  <Link
                    to="/initiatives"
                    className="btn btn-outline"
                    style={{
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                      color: '#ffffff',
                      background: 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(4px)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Eye size={16} />
                    <span>Browse All Active Requests</span>
                  </Link>
                </div>

                {/* Carousel Navigation Arrows */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handlePrev}
                    aria-label="Previous Slide"
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.15)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      backdropFilter: 'blur(6px)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)')}
                  >
                    <ChevronLeft size={22} />
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    aria-label="Next Slide"
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.15)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      backdropFilter: 'blur(6px)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)')}
                  >
                    <ChevronRight size={22} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Pagination Dots */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              marginTop: '1rem',
            }}
          >
            {stories.map((_, dotIdx) => {
              const isAct = dotIdx === currentIndex;
              return (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={() => setCurrentIndex(dotIdx)}
                  aria-label={`Go to slide ${dotIdx + 1}`}
                  style={{
                    width: isAct ? 28 : 10,
                    height: 10,
                    borderRadius: '9999px',
                    background: isAct ? 'var(--primary)' : 'var(--border)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                />
              );
            })}
          </div>
        </>
      ) : null}

      {/* Embedded Modal if donor clicks directly on a slide */}
      {modalRequest && (
        <DonationModal
          request={modalRequest}
          onClose={() => setModalRequest(null)}
          onSuccess={(res) => {
            setModalRequest(null);
            setDonationMsg(
              `Thank you! Your donation of $${res.amount.toFixed(2)} was successfully recorded (Ref: ${res.transactionRef}).`
            );
          }}
        />
      )}

      {/* Create Story Modal for Beneficiaries */}
      <CreateStoryModal
        isOpen={isStoryModalOpen}
        onClose={() => setIsStoryModalOpen(false)}
        onStoryCreated={handleStoryCreated}
      />
    </div>
  );
};
