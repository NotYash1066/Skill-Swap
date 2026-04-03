import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

export const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Current supported themes: 'kinetic', 'modern'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'kinetic';
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    
    // Apply theme and dark mode to document root
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('theme-vibrant', 'theme-modern', 'theme-kinetic', 'theme-dark', 'dark-theme', 'dark');
    
    // Add current theme class
    root.classList.add(`theme-${theme}`);
    
    // Add dark mode class if enabled
    if (isDarkMode) {
      root.classList.add('theme-dark');
      root.classList.add('dark-theme');
      root.classList.add('dark');
    }
  }, [theme, isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const cycleTheme = () => {
    setTheme(prev => (prev === 'kinetic' ? 'modern' : 'kinetic'));
  };

  const value = {
    theme,
    setTheme,
    isDarkMode,
    toggleDarkMode,
    cycleTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
