import React from 'react';

interface DetectedElementsProps {
  elements: string[];
}

const DetectedElements: React.FC<DetectedElementsProps> = ({ elements }) => {
  if (!elements.length) {
    return null;
  }

  // Map common elements to appropriate icons
  const getElementIcon = (element: string): string => {
    const lowerElement = element.toLowerCase();
    
    // Common mappings for visual elements
    const iconMap: Record<string, string> = {
      'building': '🏢',
      'car': '🚗',
      'person': '👤',
      'traffic light': '🚦',
      'road': '🛣️',
      'tree': '🌳',
      'water': '💧',
      'mountain': '⛰️',
      'sky': '☁️',
      'animal': '🐾',
      'bird': '🐦',
      'beach': '🏖️',
      'ocean': '🌊',
      'grass': '🌿',
      'flower': '🌸',
      'sun': '☀️',
      'cloud': '☁️',
      'rain': '🌧️',
      'snow': '❄️',
      'fire': '🔥',
      'food': '🍲',
      'dog': '🐕',
      'cat': '🐈',
      'phone': '📱',
      'computer': '💻',
      'book': '📚',
      'table': '🪑',
      'chair': '🪑',
    };
    
    // Look for exact matches first
    if (lowerElement in iconMap) {
      return iconMap[lowerElement];
    }
    
    // Then try to find partial matches
    for (const [key, icon] of Object.entries(iconMap)) {
      if (lowerElement.includes(key)) {
        return icon;
      }
    }
    
    // Default icon for unknown elements
    return '🔍';
  };

  return (
    <div className="detected-elements">
      <h3>Detected Elements</h3>
      
      <ul className="elements-list" role="list" aria-label="List of detected elements in the image">
        {elements.map((element, index) => (
          <li key={index} className="element-item" role="listitem">
            <span className="element-icon" aria-hidden="true">
              {getElementIcon(element)}
            </span>
            <span className="element-name">{element}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DetectedElements;