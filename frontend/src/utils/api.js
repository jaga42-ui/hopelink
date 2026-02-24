import axios from 'axios';

const baseURL = 'https://hopelink-api.onrender.com/api'; 

const api = axios.create({
  baseURL,
  // 👉 STRIPPED: We removed the hardcoded JSON header. 
  // Now it will automatically allow image uploads!
});

api.interceptors.request.use((config) => {
  // Look inside the 'user' object for the token
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