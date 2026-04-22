import React from 'react';
import ReactDOM from 'react-dom/client';
// import App from './App';  // ✅ This should work if App.tsx exists
import App from './App';  // ✅ This should work if App.tsx exists

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles/App.css';

// Only run in development (not in Liferay)
if (process.env.NODE_ENV === 'development') {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
}


