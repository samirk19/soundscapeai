import React, { useState } from 'react';

interface DownloadButtonProps {
  audioUrl: string;
  description: string;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ audioUrl, description }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a sanitized filename from the description
  const createFilename = (text: string): string => {
    // Replace spaces with underscores and remove special characters
    const sanitized = text
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^\w-]/g, '')
      .substring(0, 50); // Limit length
    
    return `soundscape_${sanitized}.mp3`;
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    setError(null);
    
    try {
      // Fetch the audio file
      const response = await fetch(audioUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.statusText}`);
      }
      
      // Get the blob
      const blob = await response.blob();
      
      // Create a download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = createFilename(description);
      
      // Trigger the download
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
      setError(err instanceof Error ? err.message : 'Failed to download audio');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="download-container">
      <button
        className="download-button"
        onClick={handleDownload}
        disabled={isDownloading}
        aria-label="Download audio file"
        title="Download audio file"
      >
        {isDownloading ? (
          <svg className="spinner" viewBox="0 0 24 24" aria-hidden="true">
            <circle
              className="path"
              cx="12"
              cy="12"
              r="10"
              fill="none"
              strokeWidth="3"
            ></circle>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
          </svg>
        )}
      </button>
      
      {error && (
        <div className="download-error" aria-live="assertive">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default DownloadButton;