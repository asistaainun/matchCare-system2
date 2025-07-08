import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const apiMethods = {
  products: {
    getAll: (params) => api.get('/api/products', { params }),
    getById: (id) => api.get(`/api/products/${id}`),
    getByCategory: () => api.get('/api/products/categories'),
  },
  recommendations: {
    getTrending: (params) => api.get('/api/products/trending', { params }),
  },
  images: {
    optimize: (filename, params) => api.get(`/api/images/optimize/${filename}`, { params }),
  }
};

export default api;