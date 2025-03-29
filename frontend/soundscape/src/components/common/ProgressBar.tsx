import React from 'react';

interface ProgressBarProps {
  progress: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  // Ensure progress is between 0 and 100
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);
  
  return (
    <div className="progress-container" aria-hidden="true">
      <div 
        className="progress-bar"
        style={{ width: `${normalizedProgress}%` }}
      ></div>
      <div className="progress-text">
        {Math.round(normalizedProgress)}%
      </div>
    </div>
  );
};

export default ProgressBar;