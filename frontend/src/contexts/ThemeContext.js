import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

const THEMES = {
  green: {
    name: 'Green',
    primary: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
  },
  blue: {
    name: 'Blue',
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
  },
  purple: {
    name: 'Purple',
    primary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7e22ce',
      800: '#6b21a8',
      900: '#581c87',
    },
  },
  red: {
    name: 'Red',
    primary: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
  },
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('green')
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'green'
    const savedDarkMode = localStorage.getItem('darkMode') === 'true'
    
    setTheme(savedTheme)
    setDarkMode(savedDarkMode)
    
    // Apply dark mode class
    if (savedDarkMode) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  const changeTheme = (newTheme) => {
    if (THEMES[newTheme]) {
      setTheme(newTheme)
      localStorage.setItem('theme', newTheme)
      
      // Apply theme colors to CSS variables
      const root = document.documentElement
      Object.entries(THEMES[newTheme].primary).forEach(([key, value]) => {
        root.style.setProperty(`--color-primary-${key}`, value)
      })
    }
  }

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem('darkMode', newDarkMode.toString())
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const value = {
    theme,
    darkMode,
    themes: THEMES,
    changeTheme,
    toggleDarkMode,
  }

  return React.createElement(ThemeContext.Provider, { value: value }, children)
}