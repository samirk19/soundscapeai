import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import ImageUploader from '../components/imageUpload/ImageUploader';
import LoadingIndicator from '../components/common/LoadingIndicator';
import ErrorMessage from '../components/common/ErrorMessage';
import ResultsContainer from '../components/results/ResultsContainer';
import { api } from '../services/api';

const Home: React.FC = () => {
  const { 
    isLoading, 
    error, 
    imageFile, 
    setLoading, 
    setProgress, 
    setError, 
    setResults,
    audioUrl,
    resetState
  } = useAppContext();
  
  const [showExample, setShowExample] = useState(false);

  // Process the image when it's uploaded
  useEffect(() => {
    if (imageFile && !isLoading && !audioUrl) {
      processImage(imageFile);
    }
  }, [imageFile]);

  // Process the uploaded image
  const processImage = async (file: File) => {
    try {
      setLoading(true);
      setError(null);
      
      // Send the image to the API
      const result = await api.analyzeImage(file, (progress) => {
        setProgress(progress);
      });
      
      // Set the results in the context
      setResults({
        description: result.description,
        scene: result.scene,
        audioUrl: result.audioUrl,
        detectedElements: result.detectedElements,
      });
    } catch (err) {
      console.error('Error processing image:', err);
      setLoading(false);
      
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    }
  };

  // Load an example
  const loadExample = () => {
    setShowExample(true);
    // This would typically load a pre-defined example from assets
    // For now, we'll just simulate it
    setTimeout(() => {
      setResults({
        description: "A busy city street with tall buildings and traffic",
        scene: "city",
        audioUrl: "https://soundscape-audio.s3.amazonaws.com/examples/city.mp3",
        detectedElements: ["Building", "Car", "Person", "Traffic Light", "Road"],
      });
      setShowExample(false);
    }, 2000);
  };

  // Reset the state to start over
  const handleReset = () => {
    resetState();
  };

  return (
    <div className="home-container">
      <section className="hero-section">
        <h1>Soundscape</h1>
        <p className="subtitle">Hear the world through images</p>
        
        <div className="cta-container">
          {!audioUrl ? (
            <>
              <button 
                onClick={loadExample}
                className="example-button"
                aria-label="Load example soundscape"
                disabled={isLoading || showExample}
              >
                Try an Example
              </button>
              
              <div className="or-divider">or</div>
            </>
          ) : (
            <button 
              onClick={handleReset}
              className="reset-button"
              aria-label="Start over with new image"
            >
              Start Over
            </button>
          )}
        </div>
      </section>

      {!audioUrl && (
        <section className="upload-section">
          {(isLoading || showExample) ? (
            <LoadingIndicator />
          ) : (
            <ImageUploader />
          )}
          
          {error && <ErrorMessage message={error} />}
        </section>
      )}

      {audioUrl && (
        <section className="results-section">
          <ResultsContainer />
        </section>
      )}
    </div>
  );
};

export default Home;