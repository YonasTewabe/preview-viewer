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

// Project API functions
export const projectService = {
  // Get all projects
  getProjects: async (params = {}) => {
    const response = await api.get('/projects', { params });
    return response.data;
  },

  // Get project by ID
  getProjectById: async (id) => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  // Create new project
  createProject: async (projectData) => {
    const response = await api.post('/projects', projectData);
    return response.data;
  },

  // Update project
  updateProject: async (id, projectData) => {
    const response = await api.put(`/projects/${id}`, projectData);
    return response.data;
  },

  // Delete project
  deleteProject: async (id) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },

  // Search projects (if you want to add this functionality)
  searchProjects: async (searchTerm) => {
    const response = await api.get('/projects/search', {
      params: { q: searchTerm }
    });
    return response.data;
  },

  // Get project statistics (could be useful for dashboard)
  getProjectStats: async () => {
    const response = await api.get('/projects/stats');
    return response.data;
  },

  // Update project status
  updateProjectStatus: async (id, status) => {
    const response = await api.patch(`/projects/${id}/status`, { status });
    return response.data;
  },

  // Get projects by user (if you want to filter by creator)
  getProjectsByUser: async (userId) => {
    const response = await api.get('/projects', {
      params: { created_by: userId }
    });
    return response.data;
  },

  // Get projects by tag
  getProjectsByTag: async (tag) => {
    const response = await api.get('/projects', {
      params: { tag }
    });
    return response.data;
  },

  // Get projects by status
  getProjectsByStatus: async (status) => {
    const response = await api.get('/projects', {
      params: { status }
    });
    return response.data;
  },

  // Update project environments
  updateProjectEnvironments: async (id, environments) => {
    const response = await api.put(`/projects/${id}/environments`, { environments });
    return response.data;
  },

  // Env vars CRUD (per project)
  listEnvVars: async (projectId) => {
    const response = await api.get(`/projects/${projectId}/env-vars`);
    return response.data;
  },
  addEnvVar: async (projectId, key, value) => {
    const response = await api.post(`/projects/${projectId}/env-vars`, { key, value });
    return response.data;
  },
  updateEnvVar: async (projectId, key, value) => {
    const response = await api.put(`/projects/${projectId}/env-vars/${encodeURIComponent(key)}`, { value });
    return response.data;
  },
  deleteEnvVar: async (projectId, key) => {
    const response = await api.delete(`/projects/${projectId}/env-vars/${encodeURIComponent(key)}`);
    return response.data;
  },
};

export default projectService;