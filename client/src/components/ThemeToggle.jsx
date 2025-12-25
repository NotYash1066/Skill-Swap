import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { MdPalette, MdDarkMode, MdLightMode } from 'react-icons/md';
import '../styles/ThemeToggle.css';

const ThemeToggle = () => {
  const { isDarkMode, toggleDarkMode, cycleTheme, theme } = useTheme();

  return (
    <div className="theme-controls">
      <button 
        className="control-btn"
        onClick={cycleTheme}
        title={`Current: ${theme.charAt(0).toUpperCase() + theme.slice(1)}. Click to switch.`}
        aria-label="Cycle theme style"
      >
        <MdPalette />
        <span className="control-label">{theme === 'vibrant' ? 'Vibrant' : 'Modern'}</span>
      </button>

      <button 
        className={`theme-toggle ${isDarkMode ? 'is-dark' : 'is-light'}`}
        onClick={toggleDarkMode}
        aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      >
        <div className="toggle-track">
          <div className="toggle-thumb">
            <span className="toggle-icon">
              {isDarkMode ? <MdDarkMode /> : <MdLightMode />}
            </span>
          </div>
        </div>
      </button>
    </div>
  );
};

export default ThemeToggle;