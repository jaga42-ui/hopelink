import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// 👉 STARTUP CHECK: Ensure critical env variables are present
if (!import.meta.env.VITE_BACKEND_URL || !import.meta.env.VITE_MAPBOX_TOKEN) {
  console.error("🚨 SAHAYAM FATAL ERROR: Missing required environment variables (VITE_BACKEND_URL or VITE_MAPBOX_TOKEN). Application features may fail.");
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);