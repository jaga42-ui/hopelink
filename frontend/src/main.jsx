import React from 'react';
import 'leaflet/dist/leaflet.css';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { GoogleOAuthProvider } from '@react-oauth/google';

// 👉 IMPORT THE NEW SEO & ANALYTICS ENGINES
import { HelmetProvider } from 'react-helmet-async';
import posthog from 'posthog-js';

// 👉 INITIALIZE POSTHOG (Heatmaps & Analytics)
// Note: You can replace 'YOUR_POSTHOG_API_KEY' with a real key from posthog.com later!
posthog.init('YOUR_POSTHOG_API_KEY', { api_host: 'https://app.posthog.com' });

console.log("My Google ID is:", import.meta.env.VITE_GOOGLE_CLIENT_ID);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 👉 WRAP EVERYTHING IN HELMET PROVIDER FOR SEO */}
    <HelmetProvider>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <App />
      </GoogleOAuthProvider>
    </HelmetProvider>
  </React.StrictMode>,
)