import axios from 'axios';

const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const baseURL = rawBase.endsWith('/api') || rawBase.endsWith('/api/')
  ? rawBase
  : `${rawBase.replace(/\/+$/, '')}/api`;


export const apiClient = axios.create({
  baseURL,
  withCredentials: true, // Enables sending and receiving secure httpOnly session cookies
  timeout: 35000, // 35 seconds to accommodate Render free tier cold-starts gracefully
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

// Response interceptor to handle token expiry / unauthenticated state and cold-start errors
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

    // Enhance error message for Render cold-starts or network drops
    if (error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout')) {
      error.message = 'The server took longer than expected to respond. On cloud free tiers (e.g., Render), the instance may be spinning up from sleep. Please try again.';
    } else if (!error.response && (error.message?.includes('Network Error') || !navigator.onLine)) {
      error.message = 'Unable to establish a connection with the server. Please check your network connection or verify that the server is online.';
    } else if (error.response?.data?.message) {
      error.message = error.response.data.message;
    }

    return Promise.reject(error);
  }
);

export default apiClient;
