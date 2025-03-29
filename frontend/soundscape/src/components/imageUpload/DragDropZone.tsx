import React from 'react';

interface DragDropZoneProps {
  onDrop: (files: File[]) => void;
  onDragEnter: () => void;
  onDragLeave: () => void;
  isDragging: boolean;
  onBrowseClick: () => void;
}

const DragDropZone: React.FC<DragDropZoneProps> = ({
  onDrop,
  onDragEnter,
  onDragLeave,
  isDragging,
  onBrowseClick,
}) => {
  // Prevent default behavior for drag events
  const preventDefaults = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Handle file drop
  const handleDrop = (e: React.DragEvent) => {
    preventDefaults(e);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onDrop(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div
      className={`drag-drop-zone ${isDragging ? 'dragging' : ''}`}
      onDragEnter={(e) => {
        preventDefaults(e);
        onDragEnter();
      }}
      onDragOver={preventDefaults}
      onDragLeave={(e) => {
        preventDefaults(e);
        onDragLeave();
      }}
      onDrop={handleDrop}
      aria-label="Drag and drop zone for image upload"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onBrowseClick();
        }
      }}
      onClick={onBrowseClick}
    >
      <div className="drag-drop-content">
        <svg
          className="upload-icon"
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        
        <p className="drag-text">
          {isDragging
            ? 'Drop your image here'
            : 'Drag and drop your image here'}
        </p>
        
        <p className="or-text">or</p>
        
        <button
          type="button"
          className="browse-button"
          onClick={onBrowseClick}
          aria-label="Browse files for upload"
        >
          Browse Files
        </button>
      </div>
    </div>
  );
};

export default DragDropZone;