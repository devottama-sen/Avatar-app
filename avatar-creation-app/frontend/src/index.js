import React from 'react';
import ReactDOM from 'react-dom/client';
import './assets/styles/index.css';
import App from './app';
import ErrorBoundary from './pages/ErrorBoundary';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
