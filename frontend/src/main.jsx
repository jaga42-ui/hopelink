import React from 'react';
import 'leaflet/dist/leaflet.css';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { GoogleOAuthProvider } from '@react-oauth/google';

// 👉 IMPORT THE NEW SEO ENGINE
import { HelmetProvider } from 'react-helmet-async';

// 🛑 Temporarily disabled PostHog to stop the 404/401 console errors
// import posthog from 'posthog-js';
// posthog.init('YOUR_POSTHOG_API_KEY', { api_host: 'https://app.posthog.com' });

// You can also comment this out if you don't want your Google ID showing in the console!
// console.log("My Google ID is:", import.meta.env.VITE_GOOGLE_CLIENT_ID);

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