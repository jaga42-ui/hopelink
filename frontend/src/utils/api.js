import axios from 'axios';

// 👉 Auto-switches between your local laptop and the live internet!
const API_URL = import.meta.env.MODE === 'development' 
  ? 'http://localhost:5000/api' 
  : 'https://hopelink-api.onrender.com/api'; // We will change this to your actual Render URL when we deploy!

const api = axios.create({
  baseURL: API_URL,
});

// 👉 THE LIFESAVER: Automatically attaches the user's JWT Token to EVERY request.
// You never have to manually write `headers: { Authorization: Bearer... }` again!
api.interceptors.request.use(
  (config) => {
    // Grab the user token from local storage
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;