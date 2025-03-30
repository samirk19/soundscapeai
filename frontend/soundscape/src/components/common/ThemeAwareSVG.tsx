import React from 'react';
import { useAppContext } from '../../context/AppContext';

interface ThemeAwareSVGProps {
  src: string;
  alt: string;
  className?: string;
}

/**
 * A component that renders an SVG with appropriate classes for dark mode
 */
const ThemeAwareSVG: React.FC<ThemeAwareSVGProps> = ({ src, alt, className = '' }) => {
  const { isDarkMode } = useAppContext();
  
  // Determine theme class
  let themeClass = '';
  if (isDarkMode) {
    themeClass = 'svg-icon-invert';
  }
  
  return (
    <img 
      src={src} 
      alt={alt} 
      className={`${themeClass} ${className}`}
    />
  );
};

export default ThemeAwareSVG;