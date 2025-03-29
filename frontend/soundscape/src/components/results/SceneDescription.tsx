import React from 'react';

interface SceneDescriptionProps {
  description: string;
  scene: string;
}

const SceneDescription: React.FC<SceneDescriptionProps> = ({ description, scene }) => {
  // Get a scene icon based on the scene type
  const getSceneIcon = (): string => {
    const lowerScene = scene.toLowerCase();
    
    const sceneIconMap: Record<string, string> = {
      'city': '🏙️',
      'urban': '🏙️',
      'beach': '🏖️',
      'ocean': '🌊',
      'sea': '🌊',
      'mountain': '⛰️',
      'mountains': '🏔️',
      'forest': '🌲',
      'woods': '🌳',
      'park': '🏞️',
      'garden': '🌷',
      'desert': '🏜️',
      'rural': '🏡',
      'countryside': '🌄',
      'farm': '🚜',
      'river': '🏞️',
      'lake': '🌅',
      'indoor': '🏠',
      'room': '🏠',
      'kitchen': '🍳',
      'restaurant': '🍽️',
      'cafe': '☕',
      'office': '💼',
      'school': '🏫',
      'stadium': '🏟️',
      'airport': '✈️',
      'train station': '🚆',
      'road': '🛣️',
      'highway': '🛣️',
      'street': '🏙️',
      'village': '🏘️',
    };
    
    // Look for exact matches
    if (lowerScene in sceneIconMap) {
      return sceneIconMap[lowerScene];
    }
    
    // Try partial matches
    for (const [key, icon] of Object.entries(sceneIconMap)) {
      if (lowerScene.includes(key)) {
        return icon;
      }
    }
    
    // Default icon for unknown scenes
    return '🌍';
  };

  // Get a background color class based on the scene type
  const getSceneColorClass = (): string => {
    const lowerScene = scene.toLowerCase();
    
    if (lowerScene.includes('city') || lowerScene.includes('urban')) {
      return 'scene-urban';
    } else if (lowerScene.includes('beach') || lowerScene.includes('ocean') || lowerScene.includes('sea')) {
      return 'scene-beach';
    } else if (lowerScene.includes('mountain') || lowerScene.includes('hill')) {
      return 'scene-mountain';
    } else if (lowerScene.includes('forest') || lowerScene.includes('woods') || lowerScene.includes('park')) {
      return 'scene-forest';
    } else if (lowerScene.includes('desert')) {
      return 'scene-desert';
    } else if (lowerScene.includes('rural') || lowerScene.includes('countryside') || lowerScene.includes('farm')) {
      return 'scene-rural';
    } else if (lowerScene.includes('indoor') || lowerScene.includes('room')) {
      return 'scene-indoor';
    }
    
    return 'scene-default';
  };

  return (
    <div className={`scene-description ${getSceneColorClass()}`}>
      <div className="scene-header">
        <span className="scene-icon" aria-hidden="true">
          {getSceneIcon()}
        </span>
        <h3>Scene Description</h3>
      </div>
      
      <div className="scene-content">
        <p>{description}</p>
        
        <div className="scene-type">
          <span className="scene-label">Scene Type:</span>
          <span className="scene-value">{scene}</span>
        </div>
      </div>
    </div>
  );
};

export default SceneDescription;