import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import './ThemeSelector.css';

const THEME_OPTIONS = [
  // Modern aesthetic color themes
  { name: 'green', label: 'Emerald', colors: ['#18a36f', '#23bd7c', '#88e2b9', '#c9f3e1'] },
  { name: 'blue', label: 'Ocean Blue', colors: ['#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'] },
  { name: 'purple', label: 'Royal Purple', colors: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#e9d5ff'] },
  { name: 'orange', label: 'Sunset Orange', colors: ['#f97316', '#fb923c', '#fdba74', '#fed7aa'] },
  { name: 'pink', label: 'Cherry Pink', colors: ['#ec4899', '#f472b6', '#f9a8d4', '#fce7f3'] },
  { name: 'teal', label: 'Tropical Teal', colors: ['#14b8a6', '#2dd4bf', '#5eead4', '#ccfbf1'] },
  { name: 'red', label: 'Crimson', colors: ['#dc2626', '#ef4444', '#f87171', '#fecaca'] },
  // New modern aesthetic themes
  { name: 'indigo', label: 'Deep Indigo', colors: ['#4f46e5', '#6366f1', '#818cf8', '#c7d2fe'] },
  { name: 'cyan', label: 'Electric Cyan', colors: ['#06b6d4', '#22d3ee', '#67e8f9', '#cffafe'] },
  { name: 'rose', label: 'Rose Gold', colors: ['#f43f5e', '#fb7185', '#fda4af', '#ffe4e6'] },
  { name: 'amber', label: 'Golden Amber', colors: ['#f59e0b', '#fbbf24', '#fcd34d', '#fef3c7'] },
  { name: 'slate', label: 'Modern Slate', colors: ['#475569', '#64748b', '#94a3b8', '#e2e8f0'] }
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