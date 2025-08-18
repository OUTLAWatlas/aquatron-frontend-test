import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Log the baseURL for debugging
console.log('🔍 API baseURL:', api.defaults.baseURL);

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Log all API requests
  console.log('🔍 API Request:', config.method?.toUpperCase(), config.url, config.data);
  
  return config;
});

// Log all API responses
api.interceptors.response.use(
  (response) => {
    console.log('🔍 API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('🔍 API Error:', error.response?.status, error.config?.url, error.message);
    return Promise.reject(error);
  }
);

export default api;
