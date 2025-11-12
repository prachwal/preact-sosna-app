import { useState, useEffect } from 'preact/hooks';
import QdrantGUI from './components/QdrantGUI';
import './App.scss';

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    // Load theme from localStorage or default to dark
    return (localStorage.getItem('app-theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    // Save theme to localStorage
    localStorage.setItem('app-theme', theme);
    // Apply theme class to body
    document.body.className = theme === 'light' ? 'light-theme' : '';
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Hello, Preact with SCSS!</h1>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </header>
      <QdrantGUI />
    </div>
  );
}

export default App;
