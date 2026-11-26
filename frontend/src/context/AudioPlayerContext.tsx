import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { PodcastItem, podcastService } from '../services/podcastService';

interface AudioPlayerContextType {
  currentTrack: PodcastItem | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  playTrack: (track: PodcastItem) => void;
  pauseTrack: () => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  setSpeed: (speed: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  closePlayer: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<PodcastItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playRecordedRef = useRef<number | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = (e: any) => {
      console.warn('Audio playback error:', e);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  const playTrack = (track: PodcastItem) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio.play().then(() => setIsPlaying(true)).catch(console.error);
      }
      return;
    }

    setCurrentTrack(track);
    setCurrentTime(0);
    audio.src = track.audioUrl;
    audio.playbackRate = playbackRate;
    audio.volume = isMuted ? 0 : volume;

    audio.play().then(() => {
      setIsPlaying(true);
      if (playRecordedRef.current !== track.id) {
        playRecordedRef.current = track.id;
        podcastService.recordPlay(track.id).catch(() => {});
      }
    }).catch(err => {
      console.error('Failed to start audio playback:', err);
      setIsPlaying(false);
    });
  };

  const pauseTrack = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
    }
    setIsPlaying(false);
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const seek = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = seconds;
    setCurrentTime(seconds);
  };

  const setSpeed = (speed: number) => {
    const audio = audioRef.current;
    setPlaybackRateState(speed);
    if (audio) {
      audio.playbackRate = speed;
    }
  };

  const setVolume = (vol: number) => {
    const audio = audioRef.current;
    setVolumeState(vol);
    setIsMuted(vol === 0);
    if (audio) {
      audio.volume = vol;
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (audio) {
      audio.volume = newMuted ? 0 : volume;
    }
  };

  const closePlayer = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTrack(null);
    setCurrentTime(0);
    setDuration(0);
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        playbackRate,
        volume,
        isMuted,
        playTrack,
        pauseTrack,
        togglePlay,
        seek,
        setSpeed,
        setVolume,
        toggleMute,
        closePlayer,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
};
