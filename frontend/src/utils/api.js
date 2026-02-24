import axios from 'axios';

const baseURL = 'https://hopelink-api.onrender.com/api'; 

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  // 👉 THE FIX: Look inside the 'user' object for the token
  const userJSON = localStorage.getItem('user');
  
  if (userJSON) {
    const user = JSON.parse(userJSON);
    if (user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
  }
  
  return config;
});

export default api;