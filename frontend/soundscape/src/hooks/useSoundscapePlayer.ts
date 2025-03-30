import { useState, useEffect, useRef } from 'react';

interface SoundscapePlayerOptions {
  initialVolume?: number;
  autoPlay?: boolean;
}

export const useSoundscapePlayer = (audioUrl: string | null, options: SoundscapePlayerOptions = {}) => {
  const { initialVolume = 0.75, autoPlay = false } = options;
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(initialVolume);
  const [isLooping, setIsLooping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize audio element
  useEffect(() => {
    if (!audioUrl) return;
    
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.volume = volume;
    audio.loop = isLooping;
    
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      if (autoPlay) {
        play();
      }
    };
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    
    const handleError = () => {
      setIsLoading(false);
      setError('Error loading audio');
    };
    
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    
    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl, autoPlay]);
  
  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);
  
  // Update loop state when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = isLooping;
    }
  }, [isLooping]);
  
  const play = () => {
    if (!audioRef.current) return;
    audioRef.current.play().catch(err => {
      console.error('Error playing audio:', err);
      setError('Error playing audio');
    });
    setIsPlaying(true);
  };
  
  const pause = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
  };
  
  const togglePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };
  
  const seek = (time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };
  
  const changeVolume = (newVolume: number) => {
    setVolume(newVolume);
  };
  
  const toggleLoop = () => {
    setIsLooping(!isLooping);
  };
  
  return {
    audioRef,
    isPlaying,
    duration,
    currentTime,
    volume,
    isLooping,
    isLoading,
    error,
    play,
    pause,
    togglePlay,
    seek,
    changeVolume,
    toggleLoop,
  };
};