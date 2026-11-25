import React, { useState, useEffect, useRef } from 'react';
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
  Sparkles,
  Check,
  Film
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { reelService, ReelItem } from '../services/reelService';
import { assistanceService, AssistanceRequestItem } from '../services/assistanceService';
import { DonationModal } from '../components/DonationModal';
import { CreateReelModal } from '../components/CreateReelModal';
import { Link } from 'react-router-dom';

export const ReelsPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [reels, setReels] = useState<ReelItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [donationRequest, setDonationRequest] = useState<AssistanceRequestItem | null>(null);
  const [videoProgress, setVideoProgress] = useState<number>(0);

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    loadReels();
  }, []);

  const loadReels = async () => {
    try {
      setLoading(true);
      const data = await reelService.getReels();
      setReels(data);
    } catch (err) {
      console.error('Failed to load reels:', err);
    } finally {
      setLoading(false);
    }
  };

  // Switch reel on keyboard up/down arrows
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCreateOpen || donationRequest) return;
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
  }, [currentIndex, reels.length, isCreateOpen, donationRequest, isPlaying]);

  // Handle video playback when index changes
  useEffect(() => {
    videoRefs.current.forEach((vid, idx) => {
      if (!vid) return;
      if (idx === currentIndex) {
        vid.currentTime = 0;
        vid.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        // Record view in backend
        if (reels[currentIndex]) {
          reelService.incrementView(reels[currentIndex].id).catch(() => {});
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
      alert('Please log in to like this reel.');
      return;
    }
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

  const handleSupportCause = async (reel: ReelItem) => {
    if (reel.assistanceRequestId) {
      try {
        const req = await assistanceService.getRequestById(reel.assistanceRequestId);
        setDonationRequest(req);
      } catch (err) {
        // Fallback synthetic item if fetch fails
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

  const currentReel = reels[currentIndex];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-400">Loading HOP Reels Feed...</p>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="min-h-[85vh] bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex items-center justify-center text-rose-500 mb-6 shadow-2xl">
          <Film className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">No Impact Reels Yet</h2>
        <p className="text-slate-400 max-w-md text-sm mb-6">
          Be the first beneficiary or fundraiser to upload a short vertical video showcasing recovery updates, equipment delivery, or heartfelt stories.
        </p>
        {isAuthenticated ? (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-semibold rounded-xl shadow-lg shadow-rose-500/25 flex items-center gap-2 transition"
          >
            <Plus className="w-5 h-5" />
            Upload First Reel
          </button>
        ) : (
          <Link
            to="/login"
            className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl transition"
          >
            Log In to Post a Reel
          </Link>
        )}
        <CreateReelModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onCreated={(newReel) => {
            setReels([newReel]);
            setCurrentIndex(0);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-[90vh] bg-slate-950 flex items-center justify-center py-4 px-2 relative select-none">
      {/* Top Floating Bar */}
      <div className="absolute top-6 left-6 z-30 hidden sm:flex items-center gap-2 text-white">
        <div className="p-2 bg-rose-600 rounded-xl shadow-lg">
          <Film className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-bold leading-tight">HOP Reels</h1>
          <p className="text-xs text-slate-400">Authentic Impact & Proof</p>
        </div>
      </div>

      {/* Floating Create Reel Button */}
      {isAuthenticated && (
        <button
          onClick={() => setIsCreateOpen(true)}
          className="absolute top-6 right-6 z-30 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-500/30 flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Post Reel</span>
        </button>
      )}

      {/* Main Reels Vertical Container */}
      <div className="relative w-full max-w-[420px] h-[84vh] max-h-[780px] bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex items-center justify-center">
        {/* Current Active Video */}
        <video
          ref={(el) => (videoRefs.current[currentIndex] = el)}
          src={currentReel.videoUrl}
          poster={currentReel.thumbnailUrl}
          className="w-full h-full object-cover cursor-pointer"
          playsInline
          loop
          muted={isMuted}
          onClick={togglePlayPause}
          onTimeUpdate={handleTimeUpdate}
        />

        {/* Video Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
          <div
            className="h-full bg-rose-500 transition-all duration-100 ease-linear"
            style={{ width: `${videoProgress}%` }}
          />
        </div>

        {/* Play / Pause Central Indicator */}
        {!isPlaying && (
          <div
            onClick={togglePlayPause}
            className="absolute inset-0 flex items-center justify-center bg-black/35 z-10 cursor-pointer animate-fade-in"
          >
            <div className="p-5 bg-black/60 backdrop-blur-md rounded-full text-white/90 border border-white/20 shadow-2xl">
              <Play className="w-10 h-10 fill-white" />
            </div>
          </div>
        )}

        {/* Top Sound Toggle */}
        <button
          onClick={() => setIsMuted((prev) => !prev)}
          className="absolute top-4 left-4 z-20 p-2.5 bg-black/50 backdrop-blur-md text-white rounded-full hover:bg-black/70 transition"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        {/* Right Action Bar */}
        <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-4 text-white">
          {/* Like Button */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => handleLike(currentReel)}
              className={`p-3 rounded-full backdrop-blur-md transition transform active:scale-125 ${
                currentReel.isLikedByCurrentUser
                  ? 'bg-rose-600/90 text-white shadow-lg shadow-rose-600/40'
                  : 'bg-black/50 text-white hover:bg-black/70'
              }`}
            >
              <Heart
                className={`w-6 h-6 ${
                  currentReel.isLikedByCurrentUser ? 'fill-white stroke-white' : ''
                }`}
              />
            </button>
            <span className="text-[11px] font-bold mt-1 text-slate-200">
              {currentReel.likesCount}
            </span>
          </div>

          {/* Share Button */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => handleShare(currentReel)}
              className="p-3 bg-black/50 backdrop-blur-md hover:bg-black/70 rounded-full transition text-white"
              title="Share Link"
            >
              {copiedId === currentReel.id ? (
                <Check className="w-6 h-6 text-emerald-400" />
              ) : (
                <Share2 className="w-6 h-6" />
              )}
            </button>
            <span className="text-[11px] font-bold mt-1 text-slate-200">
              {copiedId === currentReel.id ? 'Copied' : 'Share'}
            </span>
          </div>

          {/* Cause Direct CTA Link Icon */}
          {currentReel.assistanceRequestId && (
            <div className="flex flex-col items-center">
              <button
                onClick={() => handleSupportCause(currentReel)}
                className="p-3 bg-emerald-600/90 backdrop-blur-md hover:bg-emerald-500 rounded-full shadow-lg shadow-emerald-600/30 text-white transition animate-bounce"
                title="Direct Donate"
              >
                <DollarSign className="w-6 h-6" />
              </button>
              <span className="text-[10px] font-bold mt-1 text-emerald-300">Donate</span>
            </div>
          )}
        </div>

        {/* Bottom Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5 pt-12 bg-gradient-to-t from-black via-black/80 to-transparent z-10 flex flex-col gap-2.5">
          {/* Creator Profile */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center font-bold text-white text-xs border border-white/20">
              {currentReel.creatorName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white leading-tight">
                  {currentReel.creatorName}
                </span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <span className="text-[10px] text-slate-400">Verified Impact Creator</span>
            </div>
          </div>

          {/* Caption */}
          <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed">
            {currentReel.caption}
          </p>

          {/* Linked Cause Pill & Direct Donate CTA */}
          {currentReel.assistanceRequestId && (
            <div className="mt-1 flex items-center justify-between gap-2 p-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl">
              <div className="truncate flex-1">
                <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider block">
                  {currentReel.assistanceCategory || 'Urgent Cause'}
                </span>
                <span className="text-xs font-semibold text-white truncate block">
                  {currentReel.assistanceRequestTitle || 'Beneficiary Assistance Request'}
                </span>
              </div>
              <button
                onClick={() => handleSupportCause(currentReel)}
                className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-1 shrink-0 transition"
              >
                <Heart className="w-3.5 h-3.5 fill-white" />
                Support
              </button>
            </div>
          )}

          {/* Linked Business Campaign Pill */}
          {currentReel.businessCampaignId && (
            <Link
              to="/business-hub"
              className="mt-1 flex items-center justify-between gap-2 p-2 bg-slate-900/90 backdrop-blur-md border border-blue-700/80 rounded-xl text-white hover:bg-slate-800 transition"
            >
              <div className="truncate flex-1">
                <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider block">
                  Micro-Enterprise
                </span>
                <span className="text-xs font-semibold text-white truncate block">
                  {currentReel.businessName}
                </span>
              </div>
              <ExternalLink className="w-4 h-4 text-blue-400 shrink-0" />
            </Link>
          )}
        </div>
      </div>

      {/* Floating Vertical Up/Down Controls (Desktop) */}
      <div className="hidden lg:flex flex-col gap-3 ml-6 z-20">
        <button
          onClick={goToPrev}
          disabled={currentIndex === 0}
          className="p-3 bg-slate-900 border border-slate-800 text-white rounded-full hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 transition shadow-xl"
          title="Previous Reel (Up Arrow)"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
        <div className="text-center text-xs font-bold text-slate-400">
          {currentIndex + 1} / {reels.length}
        </div>
        <button
          onClick={goToNext}
          disabled={currentIndex === reels.length - 1}
          className="p-3 bg-slate-900 border border-slate-800 text-white rounded-full hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 transition shadow-xl"
          title="Next Reel (Down Arrow)"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      </div>

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
