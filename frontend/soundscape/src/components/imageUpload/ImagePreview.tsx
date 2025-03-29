import React, { useState, useEffect } from 'react';

interface ImagePreviewProps {
  imageUrl: string;
  onReset: () => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ imageUrl, onReset }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    const img = new Image();
    img.src = imageUrl;
    
    img.onload = () => {
      setIsLoading(false);
    };
    
    img.onerror = () => {
      setIsLoading(false);
      setError('Failed to load image preview');
    };
  }, [imageUrl]);

  return (
    <div className="image-preview-container">
      <div className="image-preview-header">
        <h3>Image Preview</h3>
        <button
          type="button"
          className="reset-button"
          onClick={onReset}
          aria-label="Remove this image and upload another"
        >
          <span aria-hidden="true">×</span> Change Image
        </button>
      </div>
      
      <div className="image-preview-content">
        {isLoading ? (
          <div className="image-loading" aria-live="polite">
            <svg
              className="spinner"
              viewBox="0 0 50 50"
              aria-label="Loading image preview"
            >
              <circle
                className="path"
                cx="25"
                cy="25"
                r="20"
                fill="none"
                strokeWidth="5"
              ></circle>
            </svg>
            <span>Loading preview...</span>
          </div>
        ) : error ? (
          <div className="image-error" aria-live="assertive">
            <p>{error}</p>
            <button
              type="button"
              className="try-again-button"
              onClick={onReset}
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="image-wrapper">
            <img
              src={imageUrl}
              alt="Uploaded image preview"
              className="preview-image"
            />
          </div>
        )}
      </div>
      
      <div className="image-preview-footer">
        <p className="image-status" aria-live="polite">
          {isLoading
            ? 'Loading preview...'
            : error
            ? 'Error loading image'
            : 'Image ready to process'}
        </p>
      </div>
    </div>
  );
};

export default ImagePreview;