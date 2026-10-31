import axios from 'axios';

const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const baseURL = rawBase.endsWith('/api') || rawBase.endsWith('/api/')
  ? rawBase
  : `${rawBase.replace(/\/+$/, '')}/api`;


export const apiClient = axios.create({
  baseURL,
  withCredentials: true, // Enables sending and receiving secure httpOnly session cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token as backup if present
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('rentora_auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiry / unauthenticated state
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      if (
        currentPath !== '/login' &&
        currentPath !== '/register' &&
        currentPath !== '/intro' &&
        currentPath !== '/'
      ) {
        localStorage.removeItem('rentora_auth_token');
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
