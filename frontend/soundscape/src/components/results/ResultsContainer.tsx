import React from 'react';
import { useAppContext } from '../../context/AppContext';
import AudioPlayer from '../soundscape/AudioPlayer';
import SceneDescription from './SceneDescription';
import DetectedElements from './DetectedElements';

const ResultsContainer: React.FC = () => {
  const {
    imagePreview,
    description,
    scene,
    audioUrl,
    detectedElements
  } = useAppContext();

  if (!audioUrl || !description) {
    return null;
  }

  return (
    <div className="results-container">
      <h2>Your Soundscape</h2>
      
      <div className="results-grid">
        <div className="results-image-section">
          {imagePreview && (
            <div className="results-image-container">
              <h3>Uploaded Image</h3>
              <img 
                src={imagePreview} 
                alt="Uploaded image" 
                className="results-image"
              />
            </div>
          )}
          
          <DetectedElements elements={detectedElements} />
        </div>
        
        <div className="results-audio-section">
          <SceneDescription 
            description={description} 
            scene={scene || 'unknown'}
          />
          
          <AudioPlayer 
            audioUrl={audioUrl} 
            description={description}
          />
        </div>
      </div>
    </div>
  );
};

export default ResultsContainer;