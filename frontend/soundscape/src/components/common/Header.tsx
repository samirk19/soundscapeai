import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Button from './Button';
import { useAppContext } from '../../context/AppContext';

const Header: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { audioUrl, resetState } = useAppContext();
  
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  
  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    closeMenu();
    // Always reset state and navigate home
    if (audioUrl) {
      resetState();
    }
    navigate('/');
  };

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="logo">
          <a href="#" className="logo-link" onClick={(e) => {
            e.preventDefault();
            handleLogoClick(e);
          }} aria-label="Go to home page">
            <span className="logo-text">Soundscape AI</span>
          </a>
        </div>
        
        <nav className="main-nav">
          <Button 
            variant="ghost"
            className={`menu-toggle ${menuOpen ? 'open' : ''}`}
            onClick={toggleMenu}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            <span className="menu-icon"></span>
          </Button>
          
          <ul className={`nav-list ${menuOpen ? 'open' : ''}`}>
            <li className="nav-item">
              <Link to="/" onClick={closeMenu}>Home</Link>
            </li>
            <li className="nav-item">
              <Link to="/tutorial" onClick={closeMenu}>How It Works</Link>
            </li>
            <li className="nav-item">
              <Link to="/about" onClick={closeMenu}>About</Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;