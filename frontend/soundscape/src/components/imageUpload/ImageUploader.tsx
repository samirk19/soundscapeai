import React, { useRef, useState, useEffect } from 'react';
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
    // Mark the dialog as closed
    setIsDialogOpen(false);
    
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

  // Trigger file input click - this is the key function that needs to work
  const handleBrowseClick = () => {
    // Prevent opening multiple file dialogs
    if (isDialogOpen) {
      return;
    }
    
    // Ensure we have the input ref
    if (fileInputRef.current) {
      // Set the flag indicating the dialog is open
      setIsDialogOpen(true);
      
      // Directly trigger the click on the input element
      fileInputRef.current.click();
    } else {
      console.error("File input reference is not available");
    }
  };

  // Add a focus event listener to detect when the dialog loses focus (likely canceled)
  useEffect(() => {
    const handleWindowFocus = () => {
      // When window regains focus, we assume the file dialog was closed
      // Set a small timeout to give the change event a chance to fire first
      setTimeout(() => {
        if (isDialogOpen) {
          setIsDialogOpen(false);
        }
      }, 300);
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [isDialogOpen]);

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
            onClick={(e) => {
              // Prevent reopening if the dialog was just canceled
              if (!isDialogOpen) {
                setIsDialogOpen(true);
              } else {
                // If the dialog is still considered open, this is a quick successive click
                // Prevent it to avoid double-opening
                e.stopPropagation();
                e.preventDefault();
              }
            }}
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