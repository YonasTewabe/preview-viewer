import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL, // This will use the proxy configured in vite.config.js
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// User API functions
export const userService = {
  // Get all users with optional pagination and filters
  getUsers: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  // Get user by ID
  getUserById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Create new user
  createUser: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  // Update user
  updateUser: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  // Delete user
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // Update user status
  updateUserStatus: async (id, status) => {
    const response = await api.patch(`/users/${id}/status`, { status });
    return response.data;
  },

  // Search users
  searchUsers: async (searchTerm) => {
    const response = await api.get('/users/search', {
      params: { q: searchTerm }
    });
    return response.data;
  },

  // Email services
  resendWelcomeEmail: async (userId) => {
    const response = await api.post(`/emails/resend-welcome/${userId}`);
    return response.data;
  },

  testEmail: async (email) => {
    const response = await api.post('/emails/test', { email });
    return response.data;
  },

  getEmailStatus: async () => {
    const response = await api.get('/emails/status');
    return response.data;
  },

  // Password change
  changePassword: async (userId, passwordData) => {
    const response = await api.put(`/users/${userId}/change-password`, passwordData);
    return response.data;
  }
};

export default userService;