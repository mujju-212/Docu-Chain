import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

const THEMES = {
  green: {
    // Green theme colors from HTML - Default theme
    '--g-900': '#0a3f2f',
    '--g-800': '#0e5842', 
    '--g-700': '#11684f',
    '--g-600': '#13815f',
    '--g-500': '#18a36f',
    '--g-400': '#23bd7c',
    '--g-300': '#88e2b9',
    '--g-200': '#c9f3e1',
    '--g-100': '#e6f9f1',
    '--g-50': '#f0fdf4',
    '--primary-color': '#18a36f',
    '--primary-dark': '#11684f',
    '--primary-light': '#c9f3e1',
    '--secondary-color': '#6b7280',
    '--accent-color': '#f59e0b',
    '--bg-primary': '#ffffff',
    '--bg-secondary': '#f9fafb',
    '--bg-tertiary': '#f3f4f6',
    '--text-primary': '#111827',
    '--text-secondary': '#6b7280',
    '--text-muted': '#9ca3af',
    '--border-color': '#e5e7eb',
    '--error-color': '#ef4444',
    '--success-color': '#18a36f',
    '--warning-color': '#f59e0b',
    '--info-color': '#3b82f6'
  },
  blue: {
    // Blue theme colors from HTML
    '--g-900': '#1e3a8a',
    '--g-800': '#1e40af',
    '--g-700': '#1d4ed8',
    '--g-600': '#2563eb',
    '--g-500': '#3b82f6',
    '--g-400': '#60a5fa',
    '--g-300': '#93c5fd',
    '--g-200': '#dbeafe',
    '--g-100': '#eff6ff',
    '--g-50': '#f8fafc',
    '--primary-color': '#3b82f6',
    '--primary-dark': '#1d4ed8',
    '--primary-light': '#dbeafe',
    '--secondary-color': '#6b7280',
    '--accent-color': '#f59e0b',
    '--bg-primary': '#ffffff',
    '--bg-secondary': '#f9fafb',
    '--bg-tertiary': '#f3f4f6',
    '--text-primary': '#111827',
    '--text-secondary': '#6b7280',
    '--text-muted': '#9ca3af',
    '--border-color': '#e5e7eb',
    '--error-color': '#ef4444',
    '--success-color': '#10b981',
    '--warning-color': '#f59e0b',
    '--info-color': '#3b82f6'
  },
  purple: {
    // Purple theme colors from HTML
    '--g-900': '#581c87',
    '--g-800': '#6b21a8',
    '--g-700': '#7c2d92',
    '--g-600': '#7c3aed',
    '--g-500': '#8b5cf6',
    '--g-400': '#a78bfa',
    '--g-300': '#c4b5fd',
    '--g-200': '#e9d5ff',
    '--g-100': '#f3e8ff',
    '--g-50': '#faf5ff',
    '--primary-color': '#8b5cf6',
    '--primary-dark': '#7c3aed',
    '--primary-light': '#e9d5ff',
    '--secondary-color': '#6b7280',
    '--accent-color': '#f59e0b',
    '--bg-primary': '#ffffff',
    '--bg-secondary': '#f9fafb',
    '--bg-tertiary': '#f3f4f6',
    '--text-primary': '#111827',
    '--text-secondary': '#6b7280',
    '--text-muted': '#9ca3af',
    '--border-color': '#e5e7eb',
    '--error-color': '#ef4444',
    '--success-color': '#10b981',
    '--warning-color': '#f59e0b',
    '--info-color': '#3b82f6'
  },
  orange: {
    // Orange theme colors from HTML
    '--g-900': '#9a3412',
    '--g-800': '#c2410c',
    '--g-700': '#dc2626',
    '--g-600': '#ea580c',
    '--g-500': '#f97316',
    '--g-400': '#fb923c',
    '--g-300': '#fdba74',
    '--g-200': '#fed7aa',
    '--g-100': '#ffedd5',
    '--g-50': '#fff7ed',
    '--primary-color': '#f97316',
    '--primary-dark': '#ea580c',
    '--primary-light': '#fed7aa',
    '--secondary-color': '#6b7280',
    '--accent-color': '#8b5cf6',
    '--bg-primary': '#ffffff',
    '--bg-secondary': '#f9fafb',
    '--bg-tertiary': '#f3f4f6',
    '--text-primary': '#111827',
    '--text-secondary': '#6b7280',
    '--text-muted': '#9ca3af',
    '--border-color': '#e5e7eb',
    '--error-color': '#ef4444',
    '--success-color': '#10b981',
    '--warning-color': '#f59e0b',
    '--info-color': '#3b82f6'
  },
  pink: {
    // Pink theme colors from HTML
    '--g-900': '#831843',
    '--g-800': '#9d174d',
    '--g-700': '#be185d',
    '--g-600': '#db2777',
    '--g-500': '#ec4899',
    '--g-400': '#f472b6',
    '--g-300': '#f9a8d4',
    '--g-200': '#fce7f3',
    '--g-100': '#fdf2f8',
    '--g-50': '#fdf2f8',
    '--primary-color': '#ec4899',
    '--primary-dark': '#db2777',
    '--primary-light': '#fce7f3',
    '--secondary-color': '#6b7280',
    '--accent-color': '#f59e0b',
    '--bg-primary': '#ffffff',
    '--bg-secondary': '#f9fafb',
    '--bg-tertiary': '#f3f4f6',
    '--text-primary': '#111827',
    '--text-secondary': '#6b7280',
    '--text-muted': '#9ca3af',
    '--border-color': '#e5e7eb',
    '--error-color': '#ef4444',
    '--success-color': '#10b981',
    '--warning-color': '#f59e0b',
    '--info-color': '#3b82f6'
  },
  teal: {
    // Teal theme colors from HTML
    '--g-900': '#134e4a',
    '--g-800': '#115e59',
    '--g-700': '#0f766e',
    '--g-600': '#0d9488',
    '--g-500': '#14b8a6',
    '--g-400': '#2dd4bf',
    '--g-300': '#7dd3fc',
    '--g-200': '#ccfbf1',
    '--g-100': '#f0fdfa',
    '--g-50': '#f0fdfa',
    '--primary-color': '#14b8a6',
    '--primary-dark': '#0d9488',
    '--primary-light': '#ccfbf1',
    '--secondary-color': '#6b7280',
    '--accent-color': '#f59e0b',
    '--bg-primary': '#ffffff',
    '--bg-secondary': '#f9fafb',
    '--bg-tertiary': '#f3f4f6',
    '--text-primary': '#111827',
    '--text-secondary': '#6b7280',
    '--text-muted': '#9ca3af',
    '--border-color': '#e5e7eb',
    '--error-color': '#ef4444',
    '--success-color': '#10b981',
    '--warning-color': '#f59e0b',
    '--info-color': '#3b82f6'
  },
  red: {
    // Red theme colors from HTML
    '--g-900': '#7f1d1d',
    '--g-800': '#991b1b',
    '--g-700': '#b91c1c',
    '--g-600': '#dc2626',
    '--g-500': '#ef4444',
    '--g-400': '#f87171',
    '--g-300': '#fca5a5',
    '--g-200': '#fecaca',
    '--g-100': '#fef2f2',
    '--g-50': '#fef2f2',
    '--g-100': '#fee2e2',
    '--g-50': '#fef2f2',
    '--primary-color': '#dc2626',
    '--primary-dark': '#b91c1c',
    '--primary-light': '#fecaca',
    '--secondary-color': '#6b7280',
    '--accent-color': '#f59e0b',
    '--bg-primary': '#ffffff',
    '--bg-secondary': '#f9fafb',
    '--bg-tertiary': '#f3f4f6',
    '--text-primary': '#111827',
    '--text-secondary': '#6b7280',
    '--text-muted': '#9ca3af',
    '--border-color': '#e5e7eb',
    '--error-color': '#dc2626',
    '--success-color': '#10b981',
    '--warning-color': '#f59e0b',
    '--info-color': '#3b82f6'
  },
  indigo: {
    // Deep Indigo - Modern aesthetic theme
    '--g-900': '#312e81',
    '--g-800': '#3730a3',
    '--g-700': '#4338ca',
    '--g-600': '#4f46e5',
    '--g-500': '#6366f1',
    '--g-400': '#818cf8',
    '--g-300': '#a5b4fc',
    '--g-200': '#c7d2fe',
    '--g-100': '#e0e7ff',
    '--g-50': '#eef2ff',
    '--primary-color': '#4f46e5',
    '--primary-dark': '#4338ca',
    '--primary-light': '#c7d2fe',
    '--primary-hover': '#4338ca',
    '--secondary-color': '#6b7280',
    '--accent-color': '#f59e0b',
    '--bg-primary': '#ffffff',
    '--bg-secondary': '#f9fafb',
    '--bg-tertiary': '#f3f4f6',
    '--text-primary': '#111827',
    '--text-secondary': '#6b7280',
    '--text-muted': '#9ca3af',
    '--border-color': '#e5e7eb',
    '--error-color': '#ef4444',
    '--success-color': '#10b981',
    '--warning-color': '#f59e0b',
    '--info-color': '#6366f1'
  },
  cyan: {
    // Electric Cyan - Modern aesthetic theme
    '--g-900': '#164e63',
    '--g-800': '#155e75',
    '--g-700': '#0e7490',
    '--g-600': '#0891b2',
    '--g-500': '#06b6d4',
    '--g-400': '#22d3ee',
    '--g-300': '#67e8f9',
    '--g-200': '#a5f3fc',
    '--g-100': '#cffafe',
    '--g-50': '#ecfeff',
    '--primary-color': '#06b6d4',
    '--primary-dark': '#0891b2',
    '--primary-light': '#a5f3fc',
    '--primary-hover': '#0891b2',
    '--secondary-color': '#6b7280',
    '--accent-color': '#f59e0b',
    '--bg-primary': '#ffffff',
    '--bg-secondary': '#f9fafb',
    '--bg-tertiary': '#f3f4f6',
    '--text-primary': '#111827',
    '--text-secondary': '#6b7280',
    '--text-muted': '#9ca3af',
    '--border-color': '#e5e7eb',
    '--error-color': '#ef4444',
    '--success-color': '#10b981',
    '--warning-color': '#f59e0b',
    '--info-color': '#06b6d4'
  },
  rose: {
    // Rose Gold - Modern aesthetic theme
    '--g-900': '#881337',
    '--g-800': '#9f1239',
    '--g-700': '#be123c',
    '--g-600': '#e11d48',
    '--g-500': '#f43f5e',
    '--g-400': '#fb7185',
    '--g-300': '#fda4af',
    '--g-200': '#fecdd3',
    '--g-100': '#ffe4e6',
    '--g-50': '#fff1f2',
    '--primary-color': '#f43f5e',
    '--primary-dark': '#e11d48',
    '--primary-light': '#fecdd3',
    '--primary-hover': '#e11d48',
    '--secondary-color': '#6b7280',
    '--accent-color': '#f59e0b',
    '--bg-primary': '#ffffff',
    '--bg-secondary': '#f9fafb',
    '--bg-tertiary': '#f3f4f6',
    '--text-primary': '#111827',
    '--text-secondary': '#6b7280',
    '--text-muted': '#9ca3af',
    '--border-color': '#e5e7eb',
    '--error-color': '#ef4444',
    '--success-color': '#10b981',
    '--warning-color': '#f59e0b',
    '--info-color': '#3b82f6'
  },
  amber: {
    // Golden Amber - Modern aesthetic theme
    '--g-900': '#78350f',
    '--g-800': '#92400e',
    '--g-700': '#b45309',
    '--g-600': '#d97706',
    '--g-500': '#f59e0b',
    '--g-400': '#fbbf24',
    '--g-300': '#fcd34d',
    '--g-200': '#fde68a',
    '--g-100': '#fef3c7',
    '--g-50': '#fffbeb',
    '--primary-color': '#f59e0b',
    '--primary-dark': '#d97706',
    '--primary-light': '#fde68a',
    '--primary-hover': '#d97706',
    '--secondary-color': '#6b7280',
    '--accent-color': '#8b5cf6',
    '--bg-primary': '#ffffff',
    '--bg-secondary': '#f9fafb',
    '--bg-tertiary': '#f3f4f6',
    '--text-primary': '#111827',
    '--text-secondary': '#6b7280',
    '--text-muted': '#9ca3af',
    '--border-color': '#e5e7eb',
    '--error-color': '#ef4444',
    '--success-color': '#10b981',
    '--warning-color': '#f59e0b',
    '--info-color': '#3b82f6'
  },
  slate: {
    // Modern Slate - Neutral aesthetic theme
    '--g-900': '#0f172a',
    '--g-800': '#1e293b',
    '--g-700': '#334155',
    '--g-600': '#475569',
    '--g-500': '#64748b',
    '--g-400': '#94a3b8',
    '--g-300': '#cbd5e1',
    '--g-200': '#e2e8f0',
    '--g-100': '#f1f5f9',
    '--g-50': '#f8fafc',
    '--primary-color': '#475569',
    '--primary-dark': '#334155',
    '--primary-light': '#e2e8f0',
    '--primary-hover': '#334155',
    '--secondary-color': '#64748b',
    '--accent-color': '#3b82f6',
    '--bg-primary': '#ffffff',
    '--bg-secondary': '#f9fafb',
    '--bg-tertiary': '#f3f4f6',
    '--text-primary': '#111827',
    '--text-secondary': '#6b7280',
    '--text-muted': '#9ca3af',
    '--border-color': '#e5e7eb',
    '--error-color': '#ef4444',
    '--success-color': '#10b981',
    '--warning-color': '#f59e0b',
    '--info-color': '#3b82f6'
  }
};

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('green');
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const applyTheme = (themeName) => {
    const theme = THEMES[themeName];
    if (!theme) return;

    const root = document.documentElement;
    Object.entries(theme).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  };

  const loadUserTheme = async () => {
    if (!isAuthenticated || !user) {
      console.log('🎨 ThemeContext: Not authenticated or no user, skipping theme load');
      return;
    }

    try {
      console.log('🎨 ThemeContext: Loading user theme...');
      const response = await api.get('/users/profile');
      console.log('🎨 ThemeContext: Profile response:', response.data);
      
      if (response.data.success && response.data.user) {
        const userTheme = response.data.user.theme || 'green';
        console.log('🎨 ThemeContext: Setting theme to:', userTheme);
        setCurrentTheme(userTheme);
        applyTheme(userTheme);
      } else {
        console.log('🎨 ThemeContext: No user data, using default theme');
        setCurrentTheme('green');
        applyTheme('green');
      }
    } catch (error) {
      console.error('🎨 ThemeContext: Failed to load user theme:', error);
      setCurrentTheme('green');
      applyTheme('green');
    }
  };

  const loadUserThemeDirectly = async () => {
    try {
      console.log('🎨 ThemeContext: Loading user theme directly...');
      const response = await api.get('/users/profile');
      console.log('🎨 ThemeContext: Direct profile response:', response.data);
      
      if (response.data.success && response.data.user) {
        const userTheme = response.data.user.theme || 'green';
        console.log('🎨 ThemeContext: Setting theme directly to:', userTheme);
        setCurrentTheme(userTheme);
        applyTheme(userTheme);
      } else {
        console.log('🎨 ThemeContext: No user data, using default theme');
        const savedTheme = localStorage.getItem('docu-chain-theme') || 'green';
        setCurrentTheme(savedTheme);
        applyTheme(savedTheme);
      }
    } catch (error) {
      console.error('🎨 ThemeContext: Failed to load user theme directly:', error);
      const savedTheme = localStorage.getItem('docu-chain-theme') || 'green';
      setCurrentTheme(savedTheme);
      applyTheme(savedTheme);
    }
  };

  const changeTheme = async (themeName) => {
    if (!THEMES[themeName]) {
      throw new Error(`Invalid theme: ${themeName}`);
    }

    setIsLoading(true);
    
    try {
      applyTheme(themeName);
      setCurrentTheme(themeName);

      if (isAuthenticated && user) {
        await api.put('/users/theme', { theme: themeName });
      } else {
        localStorage.setItem('docu-chain-theme', themeName);
      }
    } catch (error) {
      console.error('Failed to save theme:', error);
      applyTheme(currentTheme);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('🎨 ThemeContext: useEffect triggered', { isAuthenticated, user: !!user });
    if (isAuthenticated && user) {
      console.log('🎨 ThemeContext: Loading user theme...');
      loadUserTheme();
    } else {
      // Check if there's a token but AuthContext hasn't finished loading
      const token = localStorage.getItem('token');
      if (token && !isAuthenticated) {
        console.log('🎨 ThemeContext: Token exists but not authenticated yet, trying to load theme directly');
        loadUserThemeDirectly();
      } else {
        console.log('🎨 ThemeContext: Using default/saved theme');
        const savedTheme = localStorage.getItem('docu-chain-theme') || 'green';
        setCurrentTheme(savedTheme);
        applyTheme(savedTheme);
      }
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  const contextValue = {
    currentTheme,
    availableThemes: Object.keys(THEMES),
    changeTheme,
    isLoading,
    themes: THEMES
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};