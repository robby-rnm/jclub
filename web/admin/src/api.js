import axios from 'axios';

const api = axios.create({
  baseURL: 'https://jclubadmin.gsteknologi.com/api',
});

// Request interceptor for adding the auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
