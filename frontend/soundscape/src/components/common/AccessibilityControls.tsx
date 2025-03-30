import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';

const AccessibilityControls: React.FC = () => {
  const { isHighContrast, toggleHighContrast, isDarkMode, toggleDarkMode } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Handle clicks outside the menu to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && 
          menuRef.current && 
          buttonRef.current &&
          !menuRef.current.contains(event.target as Node) && 
          !buttonRef.current.contains(event.target as Node)) {
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleDarkModeToggle = (e: React.MouseEvent | React.ChangeEvent) => {
    e.stopPropagation();
    toggleDarkMode();
  };

  const handleHighContrastToggle = (e: React.MouseEvent | React.ChangeEvent) => {
    e.stopPropagation();
    toggleHighContrast();
  };

  const handleFontSizeChange = (action: 'decrease' | 'reset' | 'increase', e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (action === 'decrease') {
      document.documentElement.style.fontSize = 
        `${Math.max(parseFloat(getComputedStyle(document.documentElement).fontSize) - 2, 12)}px`;
    } else if (action === 'reset') {
      document.documentElement.style.fontSize = '';
    } else if (action === 'increase') {
      document.documentElement.style.fontSize = 
        `${Math.min(parseFloat(getComputedStyle(document.documentElement).fontSize) + 2, 24)}px`;
    }
  };

  const openTutorial = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open('/tutorial', '_self');
    setIsOpen(false);
  };

  return (
    <div className="accessibility-controls">
      <button
        ref={buttonRef}
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
        <div ref={menuRef} className="accessibility-menu">
          <div className="menu-header">
            <h3>Accessibility Options</h3>
            <button
              className="close-menu"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              aria-label="Close accessibility menu"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
          
          <div className="menu-options">
            {/* Dark Mode Toggle */}
            <div className="option-item">
              <label htmlFor="dark-mode" className="option-label">
                {isDarkMode ? (
                  <>
                    <span className="theme-toggle-icon theme-toggle-light">🌙</span>
                    Dark Mode
                  </>
                ) : (
                  <>
                    <span className="theme-toggle-icon theme-toggle-dark">☀️</span>
                    Light Mode
                  </>
                )}
              </label>
              <div className="toggle-switch" onClick={handleDarkModeToggle}>
                <input
                  type="checkbox"
                  id="dark-mode"
                  checked={isDarkMode}
                  onChange={handleDarkModeToggle}
                  className="toggle-input"
                  aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                />
                <span className="toggle-slider"></span>
              </div>
            </div>
            
            {/* High Contrast Mode Toggle */}
            <div className="option-item">
              <label htmlFor="high-contrast" className="option-label">
                High Contrast Mode
              </label>
              <div className="toggle-switch" onClick={handleHighContrastToggle}>
                <input
                  type="checkbox"
                  id="high-contrast"
                  checked={isHighContrast}
                  onChange={handleHighContrastToggle}
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
                  onClick={(e) => handleFontSizeChange('decrease', e)}
                  aria-label="Decrease text size"
                >
                  A-
                </button>
                <button
                  className="font-reset"
                  onClick={(e) => handleFontSizeChange('reset', e)}
                  aria-label="Reset text size"
                >
                  Reset
                </button>
                <button
                  className="font-increase"
                  onClick={(e) => handleFontSizeChange('increase', e)}
                  aria-label="Increase text size"
                >
                  A+
                </button>
              </div>
            </div>
            
            <div className="option-item">
              <button
                className="option-button full-width"
                onClick={openTutorial}
                aria-label="Open tutorial"
              >
                View Tutorial
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessibilityControls;