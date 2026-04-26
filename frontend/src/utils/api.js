import axios from 'axios';

// Automatically routes to your live Render backend
const API_URL = import.meta.env.VITE_BACKEND_URL || 'https://hopelink-api.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
});

// Intercept requests to attach the secure authorization token
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;