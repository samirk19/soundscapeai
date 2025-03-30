import React, { useEffect, useRef, useState } from 'react';

interface ImageModalProps {
  imageUrl: string;
  altText: string;
  audioUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({
  imageUrl,
  altText,
  audioUrl,
  isOpen,
  onClose
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const loopTimeoutRef = useRef<number | null>(null);
  
  // Add keyboard handler for escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent scrolling of the body when modal is open
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);
  
  // Handle audio playback
  useEffect(() => {
    const audio = audioRef.current;
    
    // Function to start loop with pause
    const startLoop = () => {
      if (!audio) return;
      
      setIsPlaying(true);
      audio.play().catch(error => console.error('Error playing audio:', error));
    };
    
    // Function to handle end of audio
    const handleEnded = () => {
      if (!audio) return;
      
      // Clear any existing timeout
      if (loopTimeoutRef.current !== null) {
        window.clearTimeout(loopTimeoutRef.current);
      }
      
      // Set a timeout to play again after 2 second pause
      loopTimeoutRef.current = window.setTimeout(() => {
        if (isPlaying) {
          audio.currentTime = 0;
          audio.play().catch(error => console.error('Error playing audio:', error));
        }
      }, 2000); // 2 second pause
    };
    
    if (isOpen && audio) {
      // Add ended event listener
      audio.addEventListener('ended', handleEnded);
      
      // Start playing when modal opens
      startLoop();
    }
    
    return () => {
      // Clean up
      if (audio) {
        audio.pause();
        audio.removeEventListener('ended', handleEnded);
      }
      
      // Clear any timeout
      if (loopTimeoutRef.current !== null) {
        window.clearTimeout(loopTimeoutRef.current);
        loopTimeoutRef.current = null;
      }
      
      setIsPlaying(false);
    };
  }, [isOpen, isPlaying]);
  
  // Handle clicks outside the modal
  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      // Pause audio when clicking outside
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      onClose();
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="modal-overlay" 
      onClick={handleOutsideClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-container" ref={modalRef}>
        <button 
          className="modal-close-button" 
          onClick={() => {
            // Pause audio when closing
            if (audioRef.current) {
              audioRef.current.pause();
              setIsPlaying(false);
            }
            onClose();
          }}
          aria-label="Close modal"
        >
          &times;
        </button>
        
        <h2 id="modal-title" className="visually-hidden">Fullscreen Image</h2>
        
        <div className="modal-image-container">
          <img 
            src={imageUrl} 
            alt={altText} 
            className="modal-image"
          />
        </div>
        
        {/* Hidden audio element instead of audio player */}
        <audio 
          ref={audioRef}
          src={audioUrl}
          preload="auto"
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
};

export default ImageModal;