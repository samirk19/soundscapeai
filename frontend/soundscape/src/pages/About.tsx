import React from 'react';
import { Link } from 'react-router-dom';

const About: React.FC = () => {
  return (
    <div className="about-container">
      <section className="about-hero">
        <h1>About Soundscape</h1>
        <p className="subtitle">Transforming visual experiences into immersive audio</p>
      </section>
      
      <section className="about-section">
        <h2>Our Mission</h2>
        <p>
          Soundscape was created with a simple yet powerful mission: to make visual content accessible to everyone through 
          the power of sound. We believe that images contain rich information that should be available to all people, 
          regardless of visual ability.
        </p>
        <p>
          By translating visual elements into rich, contextual soundscapes, we're creating a new way to experience 
          the world of images that goes beyond simple descriptions. Our technology identifies objects, scenes, and 
          contexts within images and transforms them into realistic audio environments.
        </p>
      </section>
      
      <section className="about-section">
        <h2>How It Works</h2>
        <div className="process-steps">
          <div className="process-step">
            <div className="step-number">1</div>
            <h3>Image Analysis</h3>
            <p>
              Using AWS Rekognition, we analyze uploaded images to identify key elements, 
              objects, and the overall scene context.
            </p>
          </div>
          
          <div className="process-step">
            <div className="step-number">2</div>
            <h3>Scene Interpretation</h3>
            <p>
              Our algorithms interpret the visual data and determine what type of audio 
              environment would best represent the image.
            </p>
          </div>
          
          <div className="process-step">
            <div className="step-number">3</div>
            <h3>Soundscape Generation</h3>
            <p>
              Using ElevenLabs Sound Effects API, we generate a unique audio composition 
              that represents the image through carefully selected and arranged sounds.
            </p>
          </div>
        </div>
      </section>
      
      <section className="about-section">
        <h2>Technology</h2>
        <p>
          Soundscape is built using modern web technologies including React, TypeScript, and AWS services. 
          Our frontend is designed with accessibility as a core principle, ensuring that all users can easily navigate and 
          interact with the application.
        </p>
        <p>
          For image analysis, we leverage AWS Rekognition's powerful computer vision capabilities to identify objects, 
          scenes, and context within images. The audio generation is powered by ElevenLabs' cutting-edge sound synthesis 
          technology, which creates realistic and immersive soundscapes.
        </p>
      </section>
      
      <section className="cta-section">
        <h2>Ready to experience images in a new way?</h2>
        <Link to="/" className="cta-button">Try Soundscape Now</Link>
      </section>
    </div>
  );
};

export default About;