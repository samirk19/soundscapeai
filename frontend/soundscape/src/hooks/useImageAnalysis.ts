import { useState } from 'react';
import { api } from '../services/api';
import { useAppContext } from '../context/AppContext';

// interface AnalysisResult {
//   imageId: string;
//   description: string;
//   scene: string;
//   audioUrl: string;
//   detectedElements: string[];
// }

export const useImageAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { setResults } = useAppContext();

  const analyzeImage = async (file: File): Promise<void> => {
    if (!file) return;
    
    try {
      setIsAnalyzing(true);
      setError(null);
      setProgress(0);
      
      // Call the API to analyze the image
      const result = await api.analyzeImage(file, (progress) => {
        setProgress(progress);
      });
      
      // Set the results in the context
      setResults({
        description: result.description,
        scene: result.scene,
        audioUrl: result.audioUrl,
        detectedElements: result.detectedElements,
      });
      
    } catch (err) {
      console.error('Error analyzing image:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while analyzing the image.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    analyzeImage,
    isAnalyzing,
    progress,
    error,
  };
};