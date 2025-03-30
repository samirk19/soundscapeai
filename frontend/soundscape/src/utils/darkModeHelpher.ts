/**
 * Helper functions for handling dark mode, especially with SVGs
 */

/**
 * Applies appropriate dark mode classes to SVG elements in the DOM
 * Call this function after mounting components with SVGs that need dark mode treatment
 */
export const applyDarkModeSvgClasses = (): void => {
    // Get all SVGs in the document
    const svgs = document.querySelectorAll('svg');
    
    // Skip SVGs that already have specific classes
    const svgsToProcess = Array.from(svgs).filter(svg => 
      !svg.classList.contains('accessibility-icon') && 
      !svg.classList.contains('logo-icon') &&
      !svg.classList.contains('colored-svg') &&
      !svg.classList.contains('primary-svg')
    );
    
    // Add the inversion class to applicable SVGs
    svgsToProcess.forEach(svg => {
      // Check if it has stroke attributes
      const hasStroke = Array.from(svg.querySelectorAll('path, rect, circle, polygon, line'))
        .some(el => el.getAttribute('stroke') && el.getAttribute('stroke') !== 'none');
      
      if (hasStroke) {
        svg.classList.add('stroke-icon-invert');
      } else {
        svg.classList.add('svg-icon-invert');
      }
    });
  };
  
  /**
   * Creates classes for SVG elements to be properly styled in dark mode
   * @param isColored Whether the SVG should maintain its colors in dark mode
   * @param isPrimary Whether the SVG uses primary brand colors
   * @returns CSS class string to apply to the SVG
   */
  export const getSvgDarkModeClass = (isColored = false, isPrimary = false): string => {
    if (isPrimary) return 'primary-svg';
    if (isColored) return 'colored-svg';
    return 'svg-icon-invert';
  };