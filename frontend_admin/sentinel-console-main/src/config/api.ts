import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/admin';

export const adminApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Add auth token to requests
adminApiClient.interceptors.request.use((config) => {
  const adminSession = sessionStorage.getItem('adminSession');
  if (adminSession) {
    try {
      const { token } = JSON.parse(adminSession);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error parsing admin session:', error);
    }
  }
  return config;
});

// Handle auth errors
adminApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('adminSession');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export const ADMIN_API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
  },
  MARKET: {
    DATA: '/market/data',
    SYMBOLS: '/market/symbols',
  },
  ORDERS: {
    BOOK: '/orders/book',
    HISTORY: '/orders/history',
  },
  TRADES: {
    HISTORY: '/trades/history',
    STATS: '/trades/stats',
  },
  ML: {
    PREDICTIONS: '/ml/predictions',
    METRICS: '/ml/metrics',
  },
  SURVEILLANCE: {
    ALERTS: '/surveillance/alerts',
    PATTERNS: '/surveillance/patterns',
  },
} as const;
