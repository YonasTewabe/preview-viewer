import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';

// Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API functions
const backendService = {
  getAll: () => api.get('/backendnodes'),
  getById: (id) => api.get(`/backendnodes/${id}`),
  getByProjectId: (projectId) => api.get(`/backendnodes/project/${projectId}`),
  create: (data) => api.post('/backendnodes', { data }),
  update: (id, data) => api.put(`/backendnodes/${id}`, data),
  deleteAll: () => api.delete('/backendnodes'),
  deleteById: (id) => api.delete(`/backendnodes/${id}`),
};

// React Query hooks
export const useBackendNodes = () => {
  return useQuery({
    queryKey: ['backendNodes'],
    queryFn: backendService.getAll,
  });
};

export const useBackendNodesByProjectId = (projectId) => {
    const { message } = App.useApp();
    return useQuery({
        queryKey: ['backendNodesByProjectId', projectId],
        queryFn: () => backendService.getByProjectId(projectId),
        enabled: !!projectId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
        retry: 2,
        onError: (error) => {
          console.error('Error fetching services:', error);
          message.error('Failed to load services');
        }
      });
};

export const useBackendNode = (id) => {
  return useQuery({
    queryKey: ['backendNode', id],
    queryFn: () => backendService.getById(id),
    enabled: !!id,
  });
};

export const useCreateBackendNodes = () => {
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  
  return useMutation({
    mutationFn: backendService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: 'backendNodesByProjectId' });
      message.success('Service created');
    },
    onError: (error) => {
      console.error('Error creating backend node:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to create service';
      message.error(errorMessage);
    }
  });
};

export const useUpdateBackendNode = () => {
    const queryClient = useQueryClient();
    const { message } = App.useApp();
  
    return useMutation({
      mutationFn: ({id,data}) => backendService.update(id,data),
      onSuccess: (newNode) => {
        // Invalidate and refetch backend nodes list
        queryClient.invalidateQueries({ queryKey:'backendNodesByProjectId'});
        message.success('Service updated');
        
      },
      onError: (error) => {
        console.error('Error updating backend node:', error);
        const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to update service';
        message.error(errorMessage);
      }
    });
};

export const useDeleteBackendNode = () => {
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  
  return useMutation({
    mutationFn: (id) => backendService.deleteById(id),
    onSuccess: (newNode) => {
      // Invalidate and refetch backend nodes list
      queryClient.invalidateQueries({ queryKey: 'backendNodesByProjectId' });
      message.success('Backend node deleted successfully');
      
    },
    onError: (error) => {
      console.error('Error deleting backend node:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to delete backend node';
      message.error(errorMessage);
    }
  });
};

export const useDeleteAllBackendNodes = () => {
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  
  return useMutation({
    mutationFn: backendService.deleteAll,
    onSuccess: () => {
      queryClient.invalidateQueries(['backendNodes']);
      message.success('All backend nodes deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting all backend nodes:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to delete all backend nodes';
      message.error(errorMessage);
    }
  });
};

// Import backend services from JSON
export const useImportBackendServices = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ backendServices, projectId, userId, conflictResolution = 'skip' }) => {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}backendnodes/import/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          backendServices,
          projectId,
          userId,
          conflictResolution
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import backend services');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch backend services for the project
      queryClient.invalidateQueries(['backendNodes', variables.projectId]);
      queryClient.invalidateQueries(['backendNodes']);
    },
  });
};

// Export backend services to JSON
export const useExportBackendServices = () => {
  return useMutation({
    mutationFn: async ({ projectId = null } = {}) => {
      const url = projectId 
        ? `${import.meta.env.VITE_BACKEND_URL}backendnodes/export/project/${projectId}`
        : `${import.meta.env.VITE_BACKEND_URL}backendnodes/export`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to export backend services');
      }

      const data = await response.json();
      
      // Create and download the file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url_blob = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url_blob;
      a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'backend-services.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url_blob);
      document.body.removeChild(a);
      
      return data;
    },
  });
};

// Create a new branch
export const useCreateBranch = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (branchData) => {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}branches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(branchData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create branch');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch branches for the node
      queryClient.invalidateQueries(['branches', variables.node_id]);
      queryClient.invalidateQueries(['backendNodes']);
    },
  });
};

// Update a branch
export const useUpdateBranch = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}branches/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update branch');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch branches for the node
      queryClient.invalidateQueries(['branches', variables.data.node_id]);
      queryClient.invalidateQueries(['backendNodes']);
    },
  });
};

// Delete a branch
export const useDeleteBranch = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (branchId) => {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}branches/${branchId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete branch');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch branches
      queryClient.invalidateQueries(['branches']);
      queryClient.invalidateQueries(['backendNodes']);
    },
  });
};

// Get branches for a node
export const useBranchesByNodeId = (nodeId) => {
  return useQuery({
    queryKey: ['branches', nodeId],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}branches/node/${nodeId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch branches');
      }
      return response.json();
    },
    enabled: !!nodeId,
  });
};
