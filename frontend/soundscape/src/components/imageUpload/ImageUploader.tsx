import React, { useRef, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import DragDropZone from './DragDropZone';
import ImagePreview from './ImagePreview';

// Maximum file size in bytes (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed file types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

const ImageUploader: React.FC = () => {
  const { 
    imagePreview, 
    setImagePreview, 
    setImageFile, 
    setError 
  } = useAppContext();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Validate the file and set it in the context
  const validateAndSetFile = (file: File): boolean => {
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Unsupported file type. Please upload a JPEG, PNG, or GIF image.');
      return false;
    }
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File is too large. Maximum size is 5MB.');
      return false;
    }
    
    // Clear any previous errors
    setError(null);
    
    // Create a preview URL
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    
    // Set the file
    setImageFile(file);
    
    return true;
  };

  // Handle file selection from the file input
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  // Handle file drop from drag and drop
  const handleFileDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      validateAndSetFile(acceptedFiles[0]);
    }
    setIsDragging(false);
  };

  // Handle drag events
  const handleDragEnter = () => setIsDragging(true);
  const handleDragLeave = () => setIsDragging(false);

  // Trigger file input click
  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Reset the image preview and file
  const handleReset = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setImageFile(null);
    setError(null);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="image-uploader">
      <h2>Upload an Image</h2>
      
      {!imagePreview ? (
        <>
          <DragDropZone
            onDrop={handleFileDrop}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            isDragging={isDragging}
            onBrowseClick={handleBrowseClick}
          />
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept={ALLOWED_TYPES.join(',')}
            style={{ display: 'none' }}
            aria-label="Upload image file"
          />
          
          <div className="file-requirements">
            <p>Supported formats: JPEG, PNG, GIF</p>
            <p>Maximum file size: 5MB</p>
          </div>
        </>
      ) : (
        <ImagePreview imageUrl={imagePreview} onReset={handleReset} />
      )}
    </div>
  );
};

export default ImageUploader;