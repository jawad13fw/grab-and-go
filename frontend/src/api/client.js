import axios from 'axios';
import { parseApiError } from '../utils/errorHelpers';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,  // send httpOnly cookies on every request
});

// Add Authorization header from localStorage token (fallback for cross-origin cookie issues)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// No request interceptor needed - the browser sends the cookie automatically

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Handle network errors (no response at all)
    if (!err.response) {
      err.friendlyMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
      err.parsedError = parseApiError(err);
      return Promise.reject(err);
    }

    // Auto-logout on 401
    if (err.response?.status === 401) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('auth:logout'));
    }

    // Attach parsed error for easy consumption by stores / components
    err.parsedError = parseApiError(err);
    return Promise.reject(err);
  }
);

export const apiUrl = (path) => `${BASE_URL}${path}`;

