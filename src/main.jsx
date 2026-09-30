import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initAnalytics } from './utils/analytics';

// Initialize analytics (Firebase + Mixpanel)
initAnalytics();

// Apply saved theme immediately to avoid flash of wrong theme
const savedTheme = localStorage.getItem('finagent-theme') ||
  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
document.documentElement.setAttribute('data-theme', savedTheme);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
