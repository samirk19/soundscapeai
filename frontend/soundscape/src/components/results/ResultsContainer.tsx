import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import AudioPlayer from '../soundscape/AudioPlayer';
import SceneDescription from './SceneDescription';
import DetectedElements from './DetectedElements';
import Button from '../common/Button';
import ImageModal from '../modal/ImageModal';

const ResultsContainer: React.FC = () => {
  const {
    imagePreview,
    description,
    scene,
    audioUrl,
    detectedElements,
    resetState
  } = useAppContext();

  if (!audioUrl || !description) {
    return null;
  }

  // State for image modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Handle reset/start over
  const handleReset = () => {
    resetState();
  };

  // Handle image click to open modal
  const handleImageClick = () => {
    setIsModalOpen(true);
  };

  // Handle closing the modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="results-container" role="main" aria-label="Soundscape results">
      <h1 className="visually-hidden">Your Soundscape Results</h1>
      
      <div className="results-content">
        {/* Image as the main focus */}
        {imagePreview && (
          <div className="results-image-container">
            <h2>Image Analysis</h2>
            <img 
              src={imagePreview} 
              alt={`Image of ${description}`} 
              className="results-image"
              onClick={handleImageClick}
            />
            <p className="image-click-hint">Click image to view fullscreen</p>
          </div>
        )}
        
        {/* Audio player below the image */}
        <div className="audio-section">
          <AudioPlayer 
            audioUrl={audioUrl} 
            description={description}
            hideVisualizer={true}
          />
        </div>
        
        {/* Description and detected elements */}
        <div className="description-section">
          <SceneDescription 
            description={description} 
            scene={scene || 'unknown'}
          />
          
          <DetectedElements elements={detectedElements} />
        </div>
        
        {/* Start Over button at the bottom */}
        <div className="controls-section">
          <Button 
            variant="primary"
            onClick={handleReset}
            className="reset-button"
            aria-label="Start over with new image"
          >
            Start Over
          </Button>
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal 
        imageUrl={imagePreview || ''}
        altText={`Image of ${description}`}
        audioUrl={audioUrl}
        description={description}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default ResultsContainer;