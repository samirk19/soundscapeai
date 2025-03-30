import React from 'react';
import { useAppContext } from '../../context/AppContext';

interface ThemeAwareSVGProps {
  viewBox: string;
  children: React.ReactNode;
  className?: string;
  width?: string | number;
  height?: string | number;
  preserveColors?: boolean;
  preservePrimaryColors?: boolean;
  ariaHidden?: boolean;
  ariaLabel?: string;
  onClick?: (e: React.MouseEvent<SVGSVGElement>) => void;
}

/**
 * A component that renders an SVG with appropriate classes for dark mode
 */
const ThemeAwareSVG: React.FC<ThemeAwareSVGProps> = ({
  viewBox,
  children,
  className = '',
  width,
  height,
  preserveColors = false,
  preservePrimaryColors = false,
  ariaHidden = true,
  ariaLabel,
  onClick
}) => {
  const { isDarkMode } = useAppContext();
  
  // Determine theme class
  let themeClass = '';
  if (isDarkMode) {
    if (preservePrimaryColors) {
      themeClass = 'primary-svg';
    } else if (preserveColors) {
      themeClass = 'colored-svg';
    } else {
      themeClass = 'svg-icon-invert';
    }
  }
  
  return (
    <svg 
      viewBox={viewBox}
      className={`${className} ${themeClass}`}
      width={width}
      height={height}
      aria-hidden={ariaHidden}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {children}
    </svg>
  );
};

export default ThemeAwareSVG;