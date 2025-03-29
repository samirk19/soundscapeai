import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';

const AccessibilityControls: React.FC = () => {
  const { isHighContrast, toggleHighContrast } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };
  
  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <div className="accessibility-controls">
      <button
        className="accessibility-toggle"
        onClick={toggleMenu}
        aria-expanded={isOpen}
        aria-label="Accessibility options"
      >
        <svg
          className="accessibility-icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="accessibility-menu">
          <div className="menu-header">
            <h3>Accessibility Options</h3>
            <button
              className="close-menu"
              onClick={closeMenu}
              aria-label="Close accessibility menu"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
          
          <div className="menu-options">
            <div className="option-item">
              <label htmlFor="high-contrast" className="option-label">
                High Contrast Mode
              </label>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  id="high-contrast"
                  checked={isHighContrast}
                  onChange={toggleHighContrast}
                  className="toggle-input"
                />
                <span className="toggle-slider"></span>
              </div>
            </div>
            
            <div className="option-item">
              <label htmlFor="font-size" className="option-label">
                Text Size
              </label>
              <div className="font-size-controls">
                <button
                  className="font-decrease"
                  onClick={() => {
                    // Decrease font size logic
                    document.documentElement.style.fontSize = 
                      `${Math.max(parseFloat(getComputedStyle(document.documentElement).fontSize) - 2, 12)}px`;
                  }}
                  aria-label="Decrease text size"
                >
                  A-
                </button>
                <button
                  className="font-reset"
                  onClick={() => {
                    // Reset font size logic
                    document.documentElement.style.fontSize = '';
                  }}
                  aria-label="Reset text size"
                >
                  Reset
                </button>
                <button
                  className="font-increase"
                  onClick={() => {
                    // Increase font size logic
                    document.documentElement.style.fontSize = 
                      `${Math.min(parseFloat(getComputedStyle(document.documentElement).fontSize) + 2, 24)}px`;
                  }}
                  aria-label="Increase text size"
                >
                  A+
                </button>
              </div>
            </div>
            
            <div className="option-item">
              <button
                className="option-button full-width"
                onClick={() => {
                  window.open('/tutorial', '_self');
                  closeMenu();
                }}
                aria-label="Open tutorial"
              >
                View Tutorial
              </button>
            </div>
          </div>
        </div>
      )}
      
      {isOpen && (
        <div 
          className="menu-backdrop" 
          onClick={closeMenu}
          aria-hidden="true"
        ></div>
      )}
    </div>
  );
};

export default AccessibilityControls;