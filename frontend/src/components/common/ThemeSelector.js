import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import './ThemeSelector.css';

const THEME_OPTIONS = [
  // Exact colors from HTML file
  { name: 'green', label: 'Green (Default)', colors: ['#18a36f', '#23bd7c', '#88e2b9', '#c9f3e1'] },
  { name: 'blue', label: 'Ocean Blue', colors: ['#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'] },
  { name: 'purple', label: 'Royal Purple', colors: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#e9d5ff'] },
  { name: 'orange', label: 'Sunset Orange', colors: ['#f97316', '#fb923c', '#fdba74', '#fed7aa'] },
  { name: 'pink', label: 'Cherry Pink', colors: ['#ec4899', '#f472b6', '#f9a8d4', '#fce7f3'] },
  { name: 'teal', label: 'Tropical Teal', colors: ['#14b8a6', '#2dd4bf', '#7dd3fc', '#ccfbf1'] },
  { name: 'red', label: 'Vibrant Red', colors: ['#dc2626', '#ef4444', '#f87171', '#fecaca'] }
];

const ThemeSelector = ({ onThemeChange, showLabel = true }) => {
  const { currentTheme, changeTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const handleThemeChange = async (themeName) => {
    if (isLoading || themeName === currentTheme) return;
    
    setIsLoading(true);
    try {
      await changeTheme(themeName);
      if (onThemeChange) {
        onThemeChange(themeName);
      }
    } catch (error) {
      console.error('Failed to change theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="theme-selector">
      {showLabel && (
        <label className="theme-selector-label">
          Choose Theme
        </label>
      )}
      <div className="theme-options">
        {THEME_OPTIONS.map((theme) => (
          <div
            key={theme.name}
            className={`theme-option ${currentTheme === theme.name ? 'active' : ''} ${isLoading ? 'disabled' : ''}`}
            onClick={() => handleThemeChange(theme.name)}
            title={theme.label}
          >
            <div className="theme-preview">
              <div className="theme-colors">
                {theme.colors.map((color, index) => (
                  <div 
                    key={index} 
                    className="theme-color" 
                    style={{ background: color }}
                  />
                ))}
              </div>
            </div>
            <span className="theme-label">{theme.label}</span>
            {currentTheme === theme.name && (
              <div className="theme-check">
                <i className="ri-check-line"></i>
              </div>
            )}
          </div>
        ))}
      </div>
      {isLoading && (
        <div className="theme-loading">
          <span>Applying theme...</span>
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;