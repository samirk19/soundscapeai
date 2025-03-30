import React, { useRef, useState, useEffect } from 'react';
import AudioVisualizer from './AudioVisualizer';
import DownloadButton from './DownloadButton';
import Button from '../common/Button';

interface AudioPlayerProps {
  audioUrl: string;
  description: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, description }) => {
  const audioRef = useRef<HTMLAudioElement>(null) as React.RefObject<HTMLAudioElement>;
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.75);
  const [isLooping, setIsLooping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Set up event listeners for the audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (isLooping) {
        audio.play().catch(err => {
          console.error('Error replaying audio:', err);
          setError('Error replaying audio');
        });
      }
    };

    const handleError = () => {
      setIsLoading(false);
      setError('Error loading audio');
      console.error('Audio element error:', audio.error);
    };

    // Add event listeners
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    
    // Update audio volume
    audio.volume = volume;

    // Return cleanup function
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [isLooping, volume]);

  // Toggle play/pause
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(err => {
        console.error('Error playing audio:', err);
        setError('Error playing audio');
      });
    }
    setIsPlaying(!isPlaying);
  };

  // Seek to a specific time
  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const seekTime = parseFloat(e.target.value);
    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  // Update volume
  const updateVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Toggle volume
  const toggleVolume = () => {
    const newVolume = volume === 0 ? 0.75 : 0;
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Toggle loop
  const toggleLoop = () => {
    setIsLooping(!isLooping);
    if (audioRef.current) {
      audioRef.current.loop = !isLooping;
    }
  };

  // Format time as mm:ss
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="audio-player">
      <h3>Generated Soundscape</h3>
      
      <div className="audio-player-container" aria-label="Audio player">
        <audio 
          ref={audioRef} 
          src={audioUrl} 
          preload="metadata"
          aria-hidden="true"
        />
        
        {isLoading ? (
          <div className="audio-loading" aria-live="polite">
            <svg className="spinner" viewBox="0 0 50 50">
              <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
            </svg>
            <span>Loading audio...</span>
          </div>
        ) : error ? (
          <div className="audio-error" aria-live="assertive">
            <p>{error}</p>
            <Button
              variant="outline"
              onClick={() => {
                setError(null);
                setIsLoading(true);
                if (audioRef.current) {
                  audioRef.current.load();
                }
              }}
            >
              Retry
            </Button>
          </div>
        ) : (
          <>
            <div className="player-controls">
              <Button
                variant="ghost"
                className={`play-pause-button ${isPlaying ? 'playing' : ''}`}
                onClick={togglePlayPause}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                )}
              </Button>
              
              <div className="time-slider">
                <span className="current-time">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={seek}
                  className="seek-slider"
                  aria-label="Seek audio position"
                />
                <span className="duration">{formatTime(duration)}</span>
              </div>
              
              <div className="volume-control">
                <Button
                  variant="ghost"
                  className="volume-button"
                  aria-label={volume === 0 ? 'Unmute' : 'Mute'}
                  onClick={toggleVolume}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3,9H7L12,4V20L7,15H3V9Z" />
                    {volume > 0 && (
                      <path d="M16.5,12C16.5,10.23 15.48,8.71 14,7.97V16.02C15.48,15.29 16.5,13.77 16.5,12Z" />
                    )}
                    {volume > 0.5 && (
                      <path d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.85 14,18.71V20.77C18.01,19.86 21,16.28 21,12C21,7.72 18.01,4.14 14,3.23Z" />
                    )}
                  </svg>
                </Button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={updateVolume}
                  className="volume-slider"
                  aria-label="Volume"
                />
              </div>
              
              <Button
                variant="ghost"
                className={`loop-button ${isLooping ? 'active' : ''}`}
                onClick={toggleLoop}
                aria-label={isLooping ? 'Disable loop' : 'Enable loop'}
                title={isLooping ? 'Disable loop' : 'Enable loop'}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M17,17H7V14L3,18L7,22V19H19V13H17M7,7H17V10L21,6L17,2V5H5V11H7V7Z" />
                </svg>
              </Button>
              
              <DownloadButton audioUrl={audioUrl} description={description} />
            </div>
            
            {audioRef.current && (
              <AudioVisualizer audioRef={audioRef} isPlaying={isPlaying} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AudioPlayer;