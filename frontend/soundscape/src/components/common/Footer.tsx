import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-credits">
          <p>
            Powered by Claude and ElevenLabs
          </p>
          <p className="copyright">
            &copy; {currentYear} Soundscape AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;