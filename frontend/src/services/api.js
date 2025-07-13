import axios from 'axios';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const API_TIMEOUT = parseInt(process.env.REACT_APP_API_TIMEOUT) || 30000;

// Create axios instance with default config
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For cookie-based auth
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() };
    
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and logging
api.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const duration = new Date() - response.config.metadata.startTime;
    
    // Log slow requests in development
    if (process.env.NODE_ENV === 'development' && duration > 2000) {
      console.warn(`Slow API request: ${response.config.url} took ${duration}ms`);
    }
    
    return response;
  },
  (error) => {
    const { response, request, config } = error;
    
    // Enhanced error logging
    if (response) {
      // Server responded with error
      console.error('API Response Error:', {
        status: response.status,
        statusText: response.statusText,
        url: config?.url,
        data: response.data
      });
      
      // Handle specific error cases
      if (response.status === 401) {
        // Unauthorized - clear auth tokens
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
        
        // Redirect to login if not already on auth page
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          window.location.href = '/login';
        }
      } else if (response.status === 429) {
        // Rate limited
        console.warn('Rate limited. Please slow down requests.');
      }
    } else if (request) {
      // Network error
      console.error('Network Error:', {
        url: config?.url,
        message: 'No response received from server'
      });
    } else {
      // Request setup error
      console.error('Request Setup Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// ===== QUIZ API METHODS =====

export const quizAPI = {
  // Get enhanced quiz questions
  getQuestions: async () => {
    try {
      const response = await api.get('/quiz/questions');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch quiz questions:', error);
      throw error;
    }
  },

  // Get basic quiz questions (fallback)
  getBasicQuestions: async () => {
    try {
      const response = await api.get('/quiz/questions/basic');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch basic quiz questions:', error);
      throw error;
    }
  },

  // Submit quiz with semantic processing
  submitSemantic: async (quizData) => {
    try {
      console.log('🧬 Submitting semantic quiz:', quizData);
      
      const response = await api.post('/quiz/submit-semantic', quizData);
      
      console.log('✅ Semantic quiz response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Semantic quiz submission failed:', error);
      
      // Enhanced error handling for quiz submission
      if (error.response?.status === 400) {
        throw new Error(error.response.data.message || 'Invalid quiz data');
      } else if (error.response?.status === 429) {
        throw new Error('Too many quiz submissions. Please wait before trying again.');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error processing quiz. Please try again later.');
      }
      
      throw error;
    }
  },

  // Submit basic quiz (fallback)
  submit: async (quizData) => {
    try {
      const response = await api.post('/quiz/submit', quizData);
      return response.data;
    } catch (error) {
      console.error('Basic quiz submission failed:', error);
      throw error;
    }
  },

  // Quick guest analysis
  analyzeGuest: async (analysisData) => {
    try {
      const response = await api.post('/quiz/analyze-guest', analysisData);
      return response.data;
    } catch (error) {
      console.error('Guest analysis failed:', error);
      throw error;
    }
  },

  // Get quiz history (authenticated users)
  getHistory: async () => {
    try {
      const response = await api.get('/quiz/history');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch quiz history:', error);
      throw error;
    }
  },

  // Get current user profile
  getProfile: async () => {
    try {
      const response = await api.get('/quiz/profile');
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return { success: false, message: 'No profile found' };
      }
      console.error('Failed to fetch user profile:', error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/quiz/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  },

  // Delete user profile
  deleteProfile: async () => {
    try {
      const response = await api.delete('/quiz/profile');
      return response.data;
    } catch (error) {
      console.error('Failed to delete profile:', error);
      throw error;
    }
  },

  // Request quiz retake
  requestRetake: async () => {
    try {
      const response = await api.post('/quiz/retake');
      return response.data;
    } catch (error) {
      console.error('Failed to request retake:', error);
      throw error;
    }
  },

  // Get quiz statistics
  getStats: async () => {
    try {
      const response = await api.get('/quiz/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch quiz stats:', error);
      throw error;
    }
  },

  // Reload ontology (debug)
  reloadOntology: async () => {
    try {
      const response = await api.post('/quiz/ontology/reload');
      return response.data;
    } catch (error) {
      console.error('Failed to reload ontology:', error);
      throw error;
    }
  }
};

// ===== PRODUCT API METHODS =====

export const productAPI = {
  // Get all products with filtering
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/products', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch products:', error);
      throw error;
    }
  },

  // Get single product by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch product ${id}:`, error);
      throw error;
    }
  },

  // Search products
  search: async (query, filters = {}) => {
    try {
      const params = { q: query, ...filters };
      const response = await api.get('/products/search', { params });
      return response.data;
    } catch (error) {
      console.error('Product search failed:', error);
      throw error;
    }
  },

  // Get semantic recommendations
  getRecommendations: async (options = {}) => {
    try {
      const response = await api.get('/products/recommendations', { params: options });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      throw error;
    }
  },

  // Analyze product compatibility
  analyzeCompatibility: async (productId) => {
    try {
      const response = await api.post(`/products/${productId}/analyze`);
      return response.data;
    } catch (error) {
      console.error(`Failed to analyze product ${productId}:`, error);
      throw error;
    }
  },

  // Get product categories
  getCategories: async () => {
    try {
      const response = await api.get('/products/categories');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      throw error;
    }
  },

  // Get product brands
  getBrands: async () => {
    try {
      const response = await api.get('/products/brands');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch brands:', error);
      throw error;
    }
  }
};

// ===== INGREDIENT API METHODS =====

export const ingredientAPI = {
  // Get all ingredients
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/ingredients', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch ingredients:', error);
      throw error;
    }
  },

  // Get single ingredient by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/ingredients/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch ingredient ${id}:`, error);
      throw error;
    }
  },

  // Search ingredients
  search: async (query) => {
    try {
      const response = await api.get('/ingredients/search', { params: { q: query } });
      return response.data;
    } catch (error) {
      console.error('Ingredient search failed:', error);
      throw error;
    }
  },

  // Get ingredient interactions
  getInteractions: async (ingredientIds) => {
    try {
      const response = await api.post('/ingredients/interactions', { ingredientIds });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch interactions:', error);
      throw error;
    }
  },

  // Get semantic ingredient analysis
  getSemanticAnalysis: async (ingredientName) => {
    try {
      const response = await api.get(`/ingredients/semantic/${encodeURIComponent(ingredientName)}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get semantic analysis for ${ingredientName}:`, error);
      throw error;
    }
  }
};

// ===== USER API METHODS =====

export const userAPI = {
  // Register new user
  register: async (userData) => {
    try {
      const response = await api.post('/users/register', userData);
      
      // Store auth token if provided
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
      }
      
      return response.data;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post('/users/login', credentials);
      
      // Store auth token
      if (response.data.token) {
        if (credentials.rememberMe) {
          localStorage.setItem('authToken', response.data.token);
        } else {
          sessionStorage.setItem('authToken', response.data.token);
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  // Logout user
  logout: async () => {
    try {
      await api.post('/users/logout');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // Always clear tokens
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/users/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw error;
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      const response = await api.put('/users/change-password', passwordData);
      return response.data;
    } catch (error) {
      console.error('Failed to change password:', error);
      throw error;
    }
  },

  // Get user favorites
  getFavorites: async () => {
    try {
      const response = await api.get('/users/favorites');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
      throw error;
    }
  },

  // Add to favorites
  addFavorite: async (productId) => {
    try {
      const response = await api.post('/users/favorites', { productId });
      return response.data;
    } catch (error) {
      console.error('Failed to add favorite:', error);
      throw error;
    }
  },

  // Remove from favorites
  removeFavorite: async (productId) => {
    try {
      const response = await api.delete(`/users/favorites/${productId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      throw error;
    }
  }
};

// ===== UTILITY FUNCTIONS =====

export const apiUtils = {
  // Check if user is authenticated
  isAuthenticated: () => {
    return !!(localStorage.getItem('authToken') || sessionStorage.getItem('authToken'));
  },

  // Get auth token
  getAuthToken: () => {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  },

  // Clear auth tokens
  clearAuth: () => {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
  },

  // Handle API errors consistently
  handleError: (error, defaultMessage = 'An error occurred') => {
    if (error.response?.data?.message) {
      return error.response.data.message;
    } else if (error.message) {
      return error.message;
    } else {
      return defaultMessage;
    }
  },

  // Format API response for consistent handling
  formatResponse: (response) => {
    return {
      success: response.success || true,
      data: response.data || response,
      message: response.message || null,
      metadata: response.metadata || null
    };
  },

  // Retry failed requests with exponential backoff
  retryRequest: async (requestFunction, maxRetries = 3, baseDelay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFunction();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Don't retry on client errors (4xx)
        if (error.response?.status >= 400 && error.response?.status < 500) {
          throw error;
        }
        
        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        console.log(`Retrying request (attempt ${attempt + 1}/${maxRetries}) after ${delay}ms`);
      }
    }
  }
};

// Export main API object for backward compatibility
export const apiMethods = {
  quiz: quizAPI,
  products: productAPI,
  ingredients: ingredientAPI,
  users: userAPI,
  utils: apiUtils
};

// Default export
export default {
  quiz: quizAPI,
  products: productAPI,
  ingredients: ingredientAPI,
  users: userAPI,
  utils: apiUtils
};