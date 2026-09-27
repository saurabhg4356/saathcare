import axios from 'axios';

let accessToken = localStorage.getItem('saathcare_access_token') || null;

export const setStoredAccessToken = (token) => {
  accessToken = token;
  if (token) {
    localStorage.setItem('saathcare_access_token', token);
  } else {
    localStorage.removeItem('saathcare_access_token');
  }
};

export const getStoredAccessToken = () => accessToken;

const apiBaseUrl = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api`
  : '/api';

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach JWT Access Token
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Auto-refresh on 401 TOKEN_EXPIRED
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // If 401 received and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't loop on login/register/refresh itself
      if (
        originalRequest.url.includes('/auth/login') ||
        originalRequest.url.includes('/auth/register') ||
        originalRequest.url.includes('/auth/refresh')
      ) {
        return Promise.reject(error.response?.data?.error || error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshRes = await axios.post(`${apiBaseUrl}/auth/refresh`, {}, { withCredentials: true });
        const newAccessToken = refreshRes.data?.data?.accessToken;
        
        if (newAccessToken) {
          setStoredAccessToken(newAccessToken);
          api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        setStoredAccessToken(null);
        window.dispatchEvent(new CustomEvent('saathcare:auth:unauthorized'));
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    const errorPayload = error.response?.data?.error || {
      message: error.message || 'Network error occurred'
    };
    return Promise.reject(errorPayload);
  }
);

export default api;
