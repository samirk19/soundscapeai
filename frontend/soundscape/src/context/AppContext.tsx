import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Define the shape of our app state
interface AppState {
  isLoading: boolean;
  progress: number;
  error: string | null;
  imagePreview: string | null;
  imageFile: File | null;
  description: string | null;
  scene: string | null;
  audioUrl: string | null;
  detectedElements: string[];
  isFirstVisit: boolean;
  isHighContrast: boolean;
  isDarkMode: boolean; // Dark mode state
}

// Define the actions that can modify the state
interface AppContextType extends AppState {
  setLoading: (isLoading: boolean) => void;
  setProgress: (progress: number) => void;
  setError: (error: string | null) => void;
  setImagePreview: (preview: string | null) => void;
  setImageFile: (file: File | null) => void;
  setResults: (results: { 
    description: string; 
    scene: string; 
    audioUrl: string; 
    detectedElements: string[] 
  }) => void;
  resetState: () => void;
  completeOnboarding: () => void;
  toggleHighContrast: () => void;
  toggleDarkMode: () => void; // Dark mode toggle
}

// Initial state - set dark mode default to true
const initialState: AppState = {
  isLoading: false,
  progress: 0,
  error: null,
  imagePreview: null,
  imageFile: null,
  description: null,
  scene: null,
  audioUrl: null,
  detectedElements: [],
  isFirstVisit: true,
  isHighContrast: false,
  isDarkMode: true, // Dark mode default is true
};

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    // Check localStorage for saved preferences
    const storedFirstVisit = localStorage.getItem('isFirstVisit');
    const storedHighContrast = localStorage.getItem('isHighContrast');
    const storedDarkMode = localStorage.getItem('isDarkMode');
    
    return {
      ...initialState,
      isFirstVisit: storedFirstVisit ? storedFirstVisit === 'true' : true,
      isHighContrast: storedHighContrast ? storedHighContrast === 'true' : false,
      // Default to dark mode (true) if isDarkMode is null or undefined
      isDarkMode: storedDarkMode ? storedDarkMode === 'true' : true,
    };
  });

  // Apply theme classes on initial load
  useEffect(() => {
    // Apply dark mode immediately on first load
    if (state.isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }

    if (state.isHighContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
    
    // Store dark mode preference
    localStorage.setItem('isDarkMode', state.isDarkMode.toString());
  }, [state.isDarkMode, state.isHighContrast]);

  // Actions to update state
  const setLoading = (isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  };

  const setProgress = (progress: number) => {
    setState(prev => ({ ...prev, progress }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }));
  };

  const setImagePreview = (imagePreview: string | null) => {
    setState(prev => ({ ...prev, imagePreview }));
  };

  const setImageFile = (imageFile: File | null) => {
    setState(prev => ({ ...prev, imageFile }));
  };

  const setResults = (results: { 
    description: string; 
    scene: string; 
    audioUrl: string; 
    detectedElements: string[] 
  }) => {
    setState(prev => ({
      ...prev,
      isLoading: false,
      progress: 100,
      description: results.description,
      scene: results.scene,
      audioUrl: results.audioUrl,
      detectedElements: results.detectedElements,
    }));
  };

  const resetState = () => {
    setState(prev => ({
      ...initialState,
      isFirstVisit: prev.isFirstVisit,
      isHighContrast: prev.isHighContrast,
      isDarkMode: prev.isDarkMode,
    }));
  };

  const completeOnboarding = () => {
    setState(prev => ({ ...prev, isFirstVisit: false }));
    localStorage.setItem('isFirstVisit', 'false');
  };

  const toggleHighContrast = () => {
    const newValue = !state.isHighContrast;
    setState(prev => ({ ...prev, isHighContrast: newValue }));
    localStorage.setItem('isHighContrast', newValue.toString());
  };

  const toggleDarkMode = () => {
    const newValue = !state.isDarkMode;
    setState(prev => ({ ...prev, isDarkMode: newValue }));
    localStorage.setItem('isDarkMode', newValue.toString());
  };

  // Context value
  const contextValue: AppContextType = {
    ...state,
    setLoading,
    setProgress,
    setError,
    setImagePreview,
    setImageFile,
    setResults,
    resetState,
    completeOnboarding,
    toggleHighContrast,
    toggleDarkMode,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the app context
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};