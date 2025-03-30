import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import Button from './Button';

const OnboardingModal: React.FC = () => {
  const { completeOnboarding } = useAppContext();
  const [currentStep, setCurrentStep] = useState(0);
  
  // Add keyboard and focus trap functionality
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        completeOnboarding();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        goToPrevious();
      }
    };
    
    // Add event listener
    window.addEventListener('keydown', handleKeyDown);
    
    // Focus the modal when it opens
    const modalElement = document.getElementById('onboarding-modal');
    if (modalElement) {
      modalElement.focus();
    }
    
    // Remove event listener on cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentStep]);

  const steps = [
    {
      title: 'Welcome to Soundscape',
      content: 'Soundscape transforms images into immersive audio experiences. Upload an image, and we\'ll generate a soundscape that represents what\'s in the picture.',
      image: '/onboarding/welcome.svg'
    },
    {
      title: 'Upload Your Images',
      content: 'Simply drag and drop any image, or use the file browser. We\'ll analyze your image to identify key elements like objects, scenery, and context.',
      image: '/onboarding/upload.svg'
    },
    {
      title: 'Hear Your Images',
      content: 'Our AI translates your image into a rich, contextual soundscape that brings the visual content to life. Perfect for people with visual impairments or anyone who wants to experience images in a new way.',
      image: '/onboarding/listen.svg'
    },
    {
      title: 'Save and Share',
      content: 'Download your soundscapes to listen offline or share them with friends. Every soundscape is uniquely generated based on what\'s in your image.',
      image: '/onboarding/share.svg'
    }
  ];

  const goToNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const goToPrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTutorial = () => {
    completeOnboarding();
  };

  return (
    <div className="modal-overlay" aria-modal="true" role="dialog">
      <div 
        id="onboarding-modal"
        className="onboarding-modal"
        tabIndex={0}
      >
        <button 
          className="modal-close-button"
          onClick={skipTutorial}
          aria-label="Close tutorial"
        >
          <span aria-hidden="true">×</span>
        </button>
        
        <div className="modal-content">
          <div className="step-image">
            <img 
              src={steps[currentStep].image} 
              alt={`Illustration for ${steps[currentStep].title}`}
              className="tutorial-image"
            />
          </div>
          
          <div className="step-content">
            <h2 className="step-title">{steps[currentStep].title}</h2>
            <p className="step-description">{steps[currentStep].content}</p>
          </div>
        </div>
        
        <div className="modal-actions">
          <div className="step-indicators">
            {steps.map((_, index) => (
              <button
                key={index}
                className={`step-indicator ${index === currentStep ? 'active' : ''}`}
                onClick={() => setCurrentStep(index)}
                aria-label={`Go to step ${index + 1}`}
                aria-current={index === currentStep ? 'step' : undefined}
              ></button>
            ))}
          </div>
          
          <div className="navigation-buttons">
            {currentStep > 0 && (
              <Button 
                variant="outline"
                onClick={goToPrevious}
                aria-label="Previous step"
              >
                Previous
              </Button>
            )}
            <Button 
              onClick={goToNext}
              aria-label={currentStep < steps.length - 1 ? 'Next step' : 'Get started'}
            >
              {currentStep < steps.length - 1 ? 'Next' : 'Get Started'}
            </Button>
          </div>
          
          <Button 
            variant="skip"
            onClick={skipTutorial}
            aria-label="Skip tutorial"
          >
            Skip Tutorial
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;