import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';

const Header: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  
  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className="app-header">
      <div className="header-container">
        <Link to="/" className="logo-link" onClick={closeMenu}>
          <div className="logo">
            <svg 
              className="logo-icon" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.84 14,18.7V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z" />
            </svg>
            <span className="logo-text">Soundscape</span>
          </div>
        </Link>
        
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