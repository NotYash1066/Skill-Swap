import React, { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import { MdPalette, MdDarkMode, MdLightMode } from 'react-icons/md';

const ThemeToggle = () => {
  const themeContext = useContext(ThemeContext);

  if (!themeContext) {
    return null;
  }

  const { isDarkMode, toggleDarkMode, cycleTheme, theme } = themeContext;

  return (
    <div className="flex items-center gap-2">
      <button 
        className="p-2 hover:bg-surface-container-low rounded-lg transition-all duration-200 text-on-surface-variant flex items-center gap-2"
        onClick={cycleTheme}
        title={`Current: ${theme.charAt(0).toUpperCase() + theme.slice(1)}. Click to switch.`}
        aria-label="Cycle theme style"
      >
        <MdPalette size={20} />
        <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">{theme === 'kinetic' ? 'Kinetic' : 'Modern'}</span>
      </button>

      <button 
        className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${isDarkMode ? 'bg-primary' : 'bg-surface-container-highest'}`}
        onClick={toggleDarkMode}
        aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      >
        <div className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-transform duration-300 flex items-center justify-center ${isDarkMode ? 'translate-x-6 bg-on-primary' : 'bg-primary text-on-primary'}`}>
          {isDarkMode ? <MdDarkMode size={10} /> : <MdLightMode size={10} />}
        </div>
      </button>
    </div>
  );
};

export default ThemeToggle;
