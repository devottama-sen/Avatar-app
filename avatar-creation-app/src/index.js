import React from 'react';
import ReactDOM from 'react-dom';
import './assets/styles/index.css';
import App from './app';
import ErrorBoundary from './pages/ErrorBoundary';

ReactDOM.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
  document.getElementById('root')
);

