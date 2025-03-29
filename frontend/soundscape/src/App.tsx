// src/App.tsx - MODIFY THIS FILE
import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom'; // Remove BrowserRouter import
import { AppProvider, useAppContext } from './context/AppContext';
import Home from './pages/Home';
import About from './pages/About';
import Tutorial from './pages/Tutorial';
import OnboardingModal from './components/common/OnboardingModal';
import AccessibilityControls from './components/common/AccessibilityControls';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import './assets/styles/index.css';

const AppContent: React.FC = () => {
  const { isFirstVisit, isHighContrast } = useAppContext();
  
  useEffect(() => {
    if (isHighContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }, [isHighContrast]);

  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/tutorial" element={<Tutorial />} />
        </Routes>
      </main>
      <AccessibilityControls />
      <Footer />
      {isFirstVisit && <OnboardingModal />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;