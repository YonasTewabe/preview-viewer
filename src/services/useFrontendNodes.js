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
const frontendService = {
  getAll: () => api.get('/frontendnodes'),
  getById: (id) => api.get(`/frontendnodes/${id}`),
  getByProjectId: (projectId) => api.get(`/frontendnodes/project/${projectId}`),
  create: (data) => api.post('/frontendnodes', { data }),
  update: (id, data) => api.put(`/frontendnodes/${id}`, data),
  deleteAll: () => api.delete('/frontendnodes'),
  deleteById: (id) => api.delete(`/frontendnodes/${id}`),
  // Node env override CRUD
  listEnvVars: (nodeId) => api.get(`/frontendnodes/${nodeId}/env-vars`),
  addEnvVar: (nodeId, key, value) => api.post(`/frontendnodes/${nodeId}/env-vars`, { key, value }),
  updateEnvVar: (nodeId, key, value) => api.put(`/frontendnodes/${nodeId}/env-vars/${encodeURIComponent(key)}`, { value }),
  deleteEnvVar: (nodeId, key) => api.delete(`/frontendnodes/${nodeId}/env-vars/${encodeURIComponent(key)}`),
};

// React Query hooks
export const useFrontendNodes = () => {
  return useQuery(['frontendNodes'], frontendService.getAll);
};

export const useFrontendNodesByProjectId = (projectId) => {
    const { message } = App.useApp();
    return useQuery({
        queryKey: ['frontendNodesByProjectId', projectId],
        queryFn: () => frontendService.getByProjectId(projectId),
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

export const useFrontendNode = (id) => {
  const { message } = App.useApp();
  return useQuery({
    queryKey: ['frontendNode', id],
    queryFn: () => frontendService.getById(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    onError: (error) => {
      console.error('Error fetching frontend nodes:', error);
      message.error('Failed to fetch frontend nodes');
    }
  });
};

export const useCreateFrontendNodes = () => {
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: frontendService.create,
    onSuccess: (_res, variables) => {
      const projectId = variables?.project_id;
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['frontendNodesByProjectId', projectId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['frontendNodesByProjectId'] });
      }
      message.success('Service created');
    },
    onError: (error) => {
      console.error('Error creating service:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to create service';
      message.error(errorMessage);
    }
  });
};

export const useUpdateFrontendNode = () => {
    const queryClient = useQueryClient();
    const { message } = App.useApp();
  
    return useMutation({
      mutationFn: ({id,data}) => frontendService.update(id,data),
      onSuccess: (newNode) => {
        queryClient.invalidateQueries({ queryKey:['frontendNodesByProjectId']});
        message.success('Service updated');
        
      },
      onError: (error) => {
        console.error('Error updating node:', error);
        const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to update service';
        message.error(errorMessage);
      }
    });
};

export const useDeleteFrontendNode = () => {
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: (id) => frontendService.deleteById(id),
    onSuccess: (newNode) => {
      queryClient.invalidateQueries({ queryKey: ['frontendNodesByProjectId'] });
      message.success('Service removed');
      
    },
    onError: (error) => {
          console.error('Error deleting node:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to remove service';
      message.error(errorMessage);
    }
  });
};

export const useDeleteAllFrontendNodes = () => {
  const queryClient = useQueryClient();
  return useMutation(frontendService.deleteAll, {
    onSuccess: () => {
      queryClient.invalidateQueries(['frontendNodes']);
    },
  });
};
