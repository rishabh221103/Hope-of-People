import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  X,
  Radio,
  DollarSign
} from 'lucide-react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { DonationModal } from './DonationModal';
import { assistanceService, AssistanceRequestItem } from '../services/assistanceService';

export const GlobalAudioPlayerBar: React.FC = () => {
  const location = useLocation();
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    volume,
    isMuted,
    togglePlay,
    pauseTrack,
    seek,
    setSpeed,
    setVolume,
    toggleMute,
    closePlayer,
  } = useAudioPlayer();

  const [donationRequest, setDonationRequest] = useState<AssistanceRequestItem | null>(null);

  const isPodcastPage = location.pathname.startsWith('/podcasts');

  // Automatically pause playback when navigating away from the podcast page so audio doesn't run without visible controls
  useEffect(() => {
    if (!isPodcastPage && isPlaying) {
      pauseTrack();
    }
  }, [isPodcastPage, isPlaying, pauseTrack]);

  // Only render the audio player bar when on the podcasts page and a track is active
  if (!currentTrack || !isPodcastPage) return null;

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(Number(e.target.value));
  };

  const handleSupportCause = async (requestId: number) => {
    try {
      const req = await assistanceService.getRequestById(requestId);
      setDonationRequest(req);
    } catch (err) {
      console.error('Failed to load cause for podcast donation:', err);
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#0f172a',
          color: '#ffffff',
          boxShadow: '0 -10px 25px -5px rgba(0, 0, 0, 0.3)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          zIndex: 9998,
          padding: '0.65rem 1.25rem',
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* Top Mini Scrubber Bar */}
        <div style={{ position: 'relative', width: '100%', marginBottom: '0.4rem' }}>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeekChange}
            style={{
              width: '100%',
              height: '4px',
              borderRadius: '2px',
              appearance: 'none',
              background: `linear-gradient(to right, #3b82f6 ${progressPercent}%, rgba(255, 255, 255, 0.2) ${progressPercent}%)`,
              outline: 'none',
              cursor: 'pointer',
            }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          {/* Left: Track Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: '1 1 240px', minWidth: 0 }}>
            {currentTrack.coverImageUrl ? (
              <img
                src={currentTrack.coverImageUrl}
                alt={currentTrack.title}
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '8px',
                  objectFit: 'cover',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              />
            ) : (
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '8px',
                  backgroundColor: '#1e3a8a',
                  color: '#93c5fd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Radio size={22} />
              </div>
            )}

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: '#f8fafc',
                }}
              >
                {currentTrack.title}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Hosted by {currentTrack.hostName} {currentTrack.guestName ? `ft. ${currentTrack.guestName}` : ''}
              </div>
            </div>
          </div>

          {/* Middle: Controls & Scrubber */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: '2 1 360px', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>
              {formatTime(currentTime)}
            </span>

            {/* Rewind 10s */}
            <button
              onClick={() => seek(Math.max(0, currentTime - 10))}
              title="Rewind 10s"
              style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '0.2rem' }}
            >
              <RotateCcw size={16} />
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 6px rgba(37, 99, 235, 0.4)',
              }}
            >
              {isPlaying ? <Pause size={18} fill="#ffffff" /> : <Play size={18} fill="#ffffff" style={{ marginLeft: '2px' }} />}
            </button>

            {/* Skip 15s */}
            <button
              onClick={() => seek(Math.min(duration, currentTime + 15))}
              title="Skip 15s"
              style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '0.2rem' }}
            >
              <RotateCw size={16} />
            </button>

            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>
              {formatTime(duration)}
            </span>

            {/* Speed Toggle */}
            <div style={{ display: 'flex', gap: '0.2rem', marginLeft: '0.5rem' }}>
              {[1, 1.25, 1.5, 2].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  style={{
                    backgroundColor: playbackRate === s ? '#2563eb' : 'rgba(255, 255, 255, 0.1)',
                    color: playbackRate === s ? '#ffffff' : '#94a3b8',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '0.15rem 0.45rem',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Right: Actions, Volume & Dismiss */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: '1 1 200px', justifyContent: 'flex-end' }}>
            {/* Linked Cause Donation Button */}
            {currentTrack.assistanceRequestId && (
              <button
                onClick={() => handleSupportCause(currentTrack.assistanceRequestId!)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <DollarSign size={13} /> Support Cause
              </button>
            )}

            {/* Volume Control */}
            <button
              onClick={toggleMute}
              style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '0.2rem' }}
            >
              {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              style={{
                width: '65px',
                height: '4px',
                appearance: 'none',
                background: 'rgba(255, 255, 255, 0.3)',
                borderRadius: '2px',
                cursor: 'pointer',
              }}
            />

            {/* Close / Dismiss Player */}
            <button
              onClick={closePlayer}
              title="Close Player"
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: '0.2rem',
                marginLeft: '0.4rem',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Linked Cause Donation Modal */}
      {donationRequest && (
        <DonationModal
          request={donationRequest}
          onClose={() => setDonationRequest(null)}
          onSuccess={() => {
            setDonationRequest(null);
          }}
        />
      )}
    </>
  );
};
