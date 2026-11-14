import axios from 'axios';

// Create Axios instance with baseURL.
// In Vite dev, '/api' is proxied to 'http://localhost:5000'
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
});

// Request interceptor to attach JWT token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// NOTE: The 401 response interceptor is registered by AuthContext so it can
// call logout() and keep React state in sync.  Do NOT add a second one here —
// duplicate interceptors would race and leave the UI in an inconsistent state.

export default API;
