import React from 'react';
import { useAppContext } from '../../context/AppContext';
import ProgressBar from './ProgressBar';

const LoadingIndicator: React.FC = () => {
  const { progress } = useAppContext();
  
  return (
    <div className="loading-container" aria-live="polite" aria-busy="true">
      <svg className="spinner" viewBox="0 0 50 50" aria-hidden="true">
        <circle
          className="path"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="5"
        ></circle>
      </svg>
      
      <div className="loading-text">
        <h3>Processing Your Image</h3>
        <p className="processing-step">
          {progress < 25 && 'Analyzing image content...'}
          {progress >= 25 && progress < 50 && 'Identifying scene elements...'}
          {progress >= 50 && progress < 75 && 'Generating audio description...'}
          {progress >= 75 && 'Creating soundscape...'}
        </p>
      </div>
      
      <ProgressBar progress={progress} />
      
      <button
        className="cancel-button"
        onClick={() => window.location.reload()}
        aria-label="Cancel processing"
      >
        Cancel
      </button>
    </div>
  );
};

export default LoadingIndicator;