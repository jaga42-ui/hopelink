import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'https://hopelink-api.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
});

// Attach Token to Outgoing Requests
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// 👉 THE FIX: Handle Expired Tokens globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Session expired or unauthorized. Logging out...");
      // Clear storage and redirect to login to prevent ghost sessions
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;