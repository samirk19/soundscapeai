import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-logo">
          <svg 
            className="logo-icon" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.84 14,18.7V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z" />
          </svg>
          <span className="logo-text">Soundscape</span>
        </div>
        
        <nav className="footer-nav">
          <ul className="footer-nav-list">
            <li className="footer-nav-item">
              <Link to="/">Home</Link>
            </li>
            <li className="footer-nav-item">
              <Link to="/tutorial">How It Works</Link>
            </li>
            <li className="footer-nav-item">
              <Link to="/about">About</Link>
            </li>
          </ul>
        </nav>
        
        <div className="footer-credits">
          <p>
            Powered by AWS Rekognition and ElevenLabs
          </p>
          <p className="copyright">
            &copy; {currentYear} Soundscape. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;