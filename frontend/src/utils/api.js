import axios from 'axios';

// 👉 FORCED PRODUCTION URL: No more localhost fallback.
// Make sure this matches your exact Render URL.
const baseURL = 'https://hopelink-api.onrender.com/api'; 

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;