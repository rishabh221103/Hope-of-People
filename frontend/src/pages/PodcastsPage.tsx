import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  Play,
  Pause,
  Heart,
  Search,
  Clock,
  Headphones,
  DollarSign,
  Share2,
  Trash2,
  Radio,
  Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { podcastService, PodcastItem } from '../services/podcastService';
import { CreatePodcastModal } from '../components/CreatePodcastModal';
import { DonationModal } from '../components/DonationModal';
import { AssistanceRequestItem, assistanceService } from '../services/assistanceService';

export const PodcastsPage: React.FC = () => {
  const { user, isAuthenticated, hasRole } = useAuth();
  const navigate = useNavigate();
  const { currentTrack, isPlaying, playTrack } = useAudioPlayer();

  const [podcasts, setPodcasts] = useState<PodcastItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOption, setSortOption] = useState<'newest' | 'popular'>('newest');
  const [loading, setLoading] = useState<boolean>(true);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [donationRequest, setDonationRequest] = useState<AssistanceRequestItem | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const categories = [
    'All',
    'Healthcare & Healing',
    'Self-Reliance & Small Business',
    'Inspiring Recovery Journeys',
    'Education & Mentorship',
    'General Community Voices',
  ];

  useEffect(() => {
    loadPodcasts();
  }, [selectedCategory, sortOption]);

  const loadPodcasts = async () => {
    try {
      setLoading(true);
      const data = await podcastService.getPodcasts({
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        search: searchQuery.trim() || undefined,
        sort: sortOption,
      });
      setPodcasts(data);
    } catch (err) {
      console.error('Failed to load podcasts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadPodcasts();
  };

  const handleToggleLike = async (e: React.MouseEvent, podcastId: number) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const res = await podcastService.toggleLike(podcastId);
      setPodcasts((prev) =>
        prev.map((p) => {
          if (p.id === podcastId) {
            return {
              ...p,
              isLikedByCurrentUser: res.isLiked,
              likesCount: res.isLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1),
            };
          }
          return p;
        })
      );
    } catch (err) {
      console.error('Failed to like podcast:', err);
    }
  };

  const handleDeletePodcast = async (e: React.MouseEvent, podcastId: number) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this podcast episode?')) return;

    try {
      await podcastService.deletePodcast(podcastId);
      setPodcasts((prev) => prev.filter((p) => p.id !== podcastId));
      setActionMessage('Podcast episode deleted.');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      console.error('Failed to delete podcast:', err);
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

  const handleShare = (e: React.MouseEvent, podcast: PodcastItem) => {
    e.stopPropagation();
    navigator.clipboard.writeText(window.location.origin + '/podcasts?id=' + podcast.id);
    setActionMessage('Episode link copied to clipboard!');
    setTimeout(() => setActionMessage(null), 3000);
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '5 mins';
    const mins = Math.floor(seconds / 60);
    return `${mins} min${mins === 1 ? '' : 's'}`;
  };

  const featuredEpisode = podcasts.length > 0 ? podcasts[0] : null;

  return (
    <div style={{ minHeight: '90vh', backgroundColor: '#f8fafc', paddingBottom: '7rem' }}>
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
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
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
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              padding: '0.4rem 1rem',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '1rem',
              backdropFilter: 'blur(4px)',
            }}
          >
            <Radio size={16} /> Human Stories & Self-Reliance Audio
          </div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, margin: '0 0 0.75rem 0', letterSpacing: '-0.025em' }}>
            HOP Podcasts & Audio Hub
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#c7d2fe', margin: '0 0 1.75rem 0', lineHeight: 1.5 }}>
            Listen to inspiring journeys, medical guidance, recovery talks, and practical self-reliance mentoring on the go.
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
                color: '#312e81',
                border: 'none',
                borderRadius: '10px',
                padding: '0.75rem 1.5rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              }}
            >
              <Mic size={18} /> Publish Podcast Episode
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Featured Episode Banner */}
        {featuredEpisode && (
          <div
            style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              color: '#ffffff',
              borderRadius: '18px',
              padding: '2rem',
              marginBottom: '2.5rem',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '2rem',
              flexWrap: 'wrap',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ position: 'relative', width: '160px', height: '160px', flexShrink: 0 }}>
              {featuredEpisode.coverImageUrl ? (
                <img
                  src={featuredEpisode.coverImageUrl}
                  alt={featuredEpisode.title}
                  style={{ width: '100%', height: '100%', borderRadius: '14px', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '14px',
                    backgroundColor: '#3730a3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#c7d2fe',
                  }}
                >
                  <Radio size={54} />
                </div>
              )}

              {/* Big Circular Play Button */}
              <button
                onClick={() => playTrack(featuredEpisode)}
                style={{
                  position: 'absolute',
                  inset: 0,
                  margin: 'auto',
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: '#2563eb',
                  border: 'none',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
                }}
              >
                {currentTrack?.id === featuredEpisode.id && isPlaying ? (
                  <Pause size={24} fill="#ffffff" />
                ) : (
                  <Play size={24} fill="#ffffff" style={{ marginLeft: '3px' }} />
                )}
              </button>
            </div>

            <div style={{ flex: 1, minWidth: '260px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                <span
                  style={{
                    backgroundColor: '#4338ca',
                    color: '#e0e7ff',
                    padding: '0.2rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                  }}
                >
                  FEATURED EPISODE
                </span>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>• {featuredEpisode.category}</span>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>• {formatDuration(featuredEpisode.durationSeconds)}</span>
              </div>

              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#f8fafc' }}>
                {featuredEpisode.title}
              </h2>
              <p style={{ fontSize: '0.88rem', color: '#94a3b8', margin: '0 0 1rem 0', lineHeight: 1.5 }}>
                {featuredEpisode.description}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => playTrack(featuredEpisode)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.55rem 1.25rem',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {currentTrack?.id === featuredEpisode.id && isPlaying ? (
                    <>
                      <Pause size={16} fill="#ffffff" /> Pause Episode
                    </>
                  ) : (
                    <>
                      <Play size={16} fill="#ffffff" /> Listen Now
                    </>
                  )}
                </button>

                {featuredEpisode.assistanceRequestId && (
                  <button
                    onClick={(e) => handleSupportCause(e, featuredEpisode.assistanceRequestId!)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.55rem 1.1rem',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <DollarSign size={15} /> Support Linked Cause
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Category Pills Navigation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem',
            marginBottom: '1.75rem',
          }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.95rem',
                borderRadius: '9999px',
                border: '1px solid',
                borderColor: selectedCategory === cat ? '#312e81' : '#cbd5e1',
                backgroundColor: selectedCategory === cat ? '#e0e7ff' : '#ffffff',
                color: selectedCategory === cat ? '#312e81' : '#475569',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {cat === 'All' ? <Filter size={14} /> : <Headphones size={14} />}
              <span>{cat}</span>
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
                placeholder="Search episodes by title, host, guest or topic..."
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
                backgroundColor: '#312e81',
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
                borderColor: sortOption === 'newest' ? '#312e81' : '#e2e8f0',
                backgroundColor: sortOption === 'newest' ? '#e0e7ff' : '#ffffff',
                color: sortOption === 'newest' ? '#312e81' : '#475569',
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
                borderColor: sortOption === 'popular' ? '#312e81' : '#e2e8f0',
                backgroundColor: sortOption === 'popular' ? '#e0e7ff' : '#ffffff',
                color: sortOption === 'popular' ? '#312e81' : '#475569',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Most Played
            </button>
          </div>
        </div>

        {/* Podcasts Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>Loading podcast episodes...</div>
          </div>
        ) : podcasts.length === 0 ? (
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
                backgroundColor: '#e0e7ff',
                color: '#312e81',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
              }}
            >
              <Mic size={28} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              No episodes in this category yet
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '0 0 1.5rem 0' }}>
              Be the first to share an inspiring audio story, recovery conversation, or healthcare guidance.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              style={{
                backgroundColor: '#312e81',
                color: '#ffffff',
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              Publish First Episode
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {podcasts.map((podcast) => {
              const isThisPlaying = currentTrack?.id === podcast.id && isPlaying;
              const isAuthor = user?.email === podcast.creatorEmail;
              const isAdmin = hasRole('ROLE_ADMIN');

              return (
                <div
                  key={podcast.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#c7d2fe';
                    e.currentTarget.style.boxShadow = '0 6px 14px -2px rgba(0,0,0,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                  }}
                >
                  {/* Card Cover & Header */}
                  <div style={{ position: 'relative', height: '160px', backgroundColor: '#1e1b4b' }}>
                    {podcast.coverImageUrl ? (
                      <img
                        src={podcast.coverImageUrl}
                        alt={podcast.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#c7d2fe',
                        }}
                      >
                        <Radio size={48} />
                      </div>
                    )}

                    {/* Duration Badge */}
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '10px',
                        right: '10px',
                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                        color: '#ffffff',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      <Clock size={12} /> {formatDuration(podcast.durationSeconds)}
                    </span>

                    {/* Category Pill */}
                    <span
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        color: '#312e81',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      {podcast.category}
                    </span>

                    {/* Play/Pause Float Button */}
                    <button
                      onClick={() => playTrack(podcast)}
                      style={{
                        position: 'absolute',
                        bottom: '10px',
                        left: '10px',
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                      }}
                    >
                      {isThisPlaying ? (
                        <Pause size={18} fill="#ffffff" />
                      ) : (
                        <Play size={18} fill="#ffffff" style={{ marginLeft: '2px' }} />
                      )}
                    </button>
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3
                      style={{
                        fontSize: '1.05rem',
                        fontWeight: 700,
                        color: '#0f172a',
                        margin: '0 0 0.35rem 0',
                        lineHeight: 1.35,
                      }}
                    >
                      {podcast.title}
                    </h3>

                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.65rem' }}>
                      Hosted by <strong>{podcast.hostName}</strong> {podcast.guestName ? `• Guest: ${podcast.guestName}` : ''}
                    </div>

                    <p
                      style={{
                        fontSize: '0.85rem',
                        color: '#475569',
                        margin: '0 0 1rem 0',
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        flex: 1,
                      }}
                    >
                      {podcast.description}
                    </p>

                    {/* Linked Cause Pill */}
                    {podcast.assistanceRequestId && (
                      <div
                        style={{
                          backgroundColor: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          borderRadius: '8px',
                          padding: '0.45rem 0.75rem',
                          marginBottom: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                        }}
                      >
                        <div style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Linked Cause: {podcast.assistanceRequestTitle}
                        </div>
                        <button
                          onClick={(e) => handleSupportCause(e, podcast.assistanceRequestId!)}
                          style={{
                            backgroundColor: '#16a34a',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.2rem 0.6rem',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Support ($)
                        </button>
                      </div>
                    )}

                    {/* Footer Row */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTop: '1px solid #f1f5f9',
                        paddingTop: '0.75rem',
                        fontSize: '0.8rem',
                        color: '#64748b',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <button
                          onClick={(e) => handleToggleLike(e, podcast.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: podcast.isLikedByCurrentUser ? '#dc2626' : '#64748b',
                            fontSize: '0.8rem',
                            padding: 0,
                          }}
                        >
                          <Heart size={15} fill={podcast.isLikedByCurrentUser ? '#dc2626' : 'none'} />
                          <span>{podcast.likesCount}</span>
                        </button>

                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Headphones size={14} /> {podcast.playsCount}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          onClick={(e) => handleShare(e, podcast)}
                          title="Share episode link"
                          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.2rem' }}
                        >
                          <Share2 size={15} />
                        </button>

                        {(isAuthor || isAdmin) && (
                          <button
                            onClick={(e) => handleDeletePodcast(e, podcast.id)}
                            title="Delete episode"
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Podcast Modal */}
      <CreatePodcastModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPodcastCreated={(newEpisode) => {
          setPodcasts([newEpisode, ...podcasts]);
          setActionMessage('Podcast episode published successfully!');
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
