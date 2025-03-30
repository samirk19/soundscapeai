import React from 'react';
import { Link } from 'react-router-dom';

const Tutorial: React.FC = () => {
  return (
    <div className="tutorial-container">
      <section className="tutorial-hero">
        <h1>How to Use Soundscape AI</h1>
        <p className="subtitle">A complete guide to transforming your images into immersive soundscapes</p>
      </section>
      
      <section className="tutorial-steps">
        <div className="tutorial-step">
          <div className="step-image">
            <img 
              src="/tutorial/upload.svg" 
              alt="Upload image illustration" 
              className="tutorial-illustration"
            />
          </div>
          <div className="step-content">
            <h2>Step 1: Upload Your Image</h2>
            <p>
              Start by uploading an image from your device. You can either drag and drop your image onto the 
              upload area or click the "Browse Files" button to select an image from your file browser.
            </p>
            <div className="tip-box">
              <h4>Tips:</h4>
              <ul>
                <li>Supported formats: JPEG, PNG, and GIF</li>
                <li>Maximum file size: 5MB</li>
                <li>Images with clear scenes and objects work best</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="tutorial-step">
          <div className="step-image">
            <img 
              src="/tutorial/processing.svg" 
              alt="Processing image illustration" 
              className="tutorial-illustration"
            />
          </div>
          <div className="step-content">
            <h2>Step 2: Wait for Processing</h2>
            <p>
              After uploading your image, our system will analyze it to identify objects, scenes, and 
              context. This analysis is then used to generate a unique soundscape that represents your image.
            </p>
            <p>
              The processing usually takes 10-15 seconds, depending on the complexity of the image and 
              current system load. You'll see a progress indicator while you wait.
            </p>
          </div>
        </div>
        
        <div className="tutorial-step">
          <div className="step-image">
            <img 
              src="/tutorial/listen.svg" 
              alt="Listening to soundscape illustration" 
              className="tutorial-illustration"
            />
          </div>
          <div className="step-content">
            <h2>Step 3: Explore Your Soundscape</h2>
            <p>
              Once processing is complete, you'll see your image alongside the generated soundscape. 
              Use the audio player controls to play, pause, and adjust the volume of your soundscape.
            </p>
            <p>
              You'll also see a list of detected elements in your image and a description of the scene. 
              This helps you understand what objects and contexts were identified and represented in the audio.
            </p>
          </div>
        </div>
        
        <div className="tutorial-step">
          <div className="step-image">
            <img 
              src="/tutorial/download.svg" 
              alt="Downloading soundscape illustration" 
              className="tutorial-illustration"
            />
          </div>
          <div className="step-content">
            <h2>Step 4: Save and Share</h2>
            <p>
              If you like your soundscape, you can download it as an MP3 file using the download button 
              in the audio player. This allows you to keep the soundscape for offline listening or to share 
              it with others.
            </p>
            <p>
              To create a new soundscape, simply click the "Start Over" button and upload a different image.
            </p>
          </div>
        </div>
      </section>
      
      <section className="accessibility-section">
        <h2>Accessibility Features</h2>
        <p>
          Soundscape is designed to be accessible to all users. Here are some accessibility features that might help you:
        </p>
        <div className="features-grid">
          <div className="feature-item">
            <h3>High Contrast Mode</h3>
            <p>
              Toggle high contrast mode using the accessibility button in the bottom right corner 
              of any screen. This enhances visual contrast for better readability.
            </p>
          </div>
          
          <div className="feature-item">
            <h3>Text Size Adjustment</h3>
            <p>
              Adjust text size using the font size controls in the accessibility menu. This allows you to 
              make text larger or smaller according to your preference.
            </p>
          </div>
          
          <div className="feature-item">
            <h3>Screen Reader Support</h3>
            <p>
              Soundscape is fully compatible with screen readers. All interactive elements have appropriate 
              ARIA labels and the application follows proper heading structure.
            </p>
          </div>
          
          <div className="feature-item">
            <h3>Keyboard Navigation</h3>
            <p>
              Navigate the entire application using only your keyboard. Use Tab to move between interactive 
              elements and Enter or Space to activate them.
            </p>
          </div>
        </div>
      </section>
      
      <section className="cta-section">
        <h2>Ready to create your first soundscape?</h2>
        <Link to="/" className="cta-button">Get Started Now</Link>
      </section>
    </div>
  );
};

export default Tutorial;