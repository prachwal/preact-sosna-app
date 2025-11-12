import { useState, useEffect } from 'preact/hooks';
import QdrantGUI from './components/QdrantGUI';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastContainer } from './utils/toast';
import './App.scss';

// Theme detection and management
type Theme = 'light' | 'dark' | 'system';

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

function getStoredTheme(): Theme {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('app-theme') as Theme;
    return stored && ['light', 'dark', 'system'].includes(stored) ? stored : 'system';
  }
  return 'system';
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const actualTheme = theme === 'system' ? getSystemTheme() : theme;

  root.setAttribute('data-theme', actualTheme);

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('app-theme', theme);
  }
}

// Pre-render theme injection to avoid flash
if (typeof document !== 'undefined') {
  const storedTheme = getStoredTheme();
  const actualTheme = storedTheme === 'system' ? getSystemTheme() : storedTheme;
  document.documentElement.setAttribute('data-theme', actualTheme);
}

function App() {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);

  useEffect(() => {
    applyTheme(theme);

    // Listen for system theme changes when using system theme
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const cycleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex]!;
    setTheme(nextTheme);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return '☀️';
      case 'dark': return '🌙';
      case 'system': return '💻';
      default: return '☀️';
    }
  };

  const getThemeTitle = () => {
    switch (theme) {
      case 'light': return 'Jasny motyw';
      case 'dark': return 'Ciemny motyw';
      case 'system': return 'Motyw systemowy';
      default: return 'Przełącz motyw';
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Hello, Preact with SCSS!</h1>
        <button
          className="theme-toggle"
          onClick={cycleTheme}
          title={getThemeTitle()}
        >
          {getThemeIcon()}
        </button>
      </header>
      <ErrorBoundary>
        <QdrantGUI />
      </ErrorBoundary>
      <ToastContainer />
    </div>
  );
}

export default App;
