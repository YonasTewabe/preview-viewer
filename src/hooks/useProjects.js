import { useState, useEffect, useMemo } from 'react';
import { App } from 'antd';
import { projectService } from '../services/projectService';

export const useProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { message } = App.useApp();

  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await projectService.getProjects();
      setProjects(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch projects');
      message.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (projectData) => {
    setLoading(true);
    try {
      const newProject = await projectService.createProject(projectData);
      setProjects(prev => [newProject, ...prev]);
      message.success('Project created successfully!');
      return newProject;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to create project';
      message.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async (projectData) => {
    setLoading(true);
    try {
      const updatedProject = await projectService.updateProject(projectData.id, projectData);
      setProjects(prev => 
        prev.map(project => 
          project.id === projectData.id ? updatedProject : project
        )
      );
      message.success('Project updated successfully!');
      return updatedProject;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update project';
      message.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (projectId) => {
    setLoading(true);
    try {
      await projectService.deleteProject(projectId);
      setProjects(prev => prev.filter(project => project.id !== projectId));
      message.success('Project deleted successfully!');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to delete project';
      message.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getProjectById = async (id) => {
    try {
      const project = await projectService.getProjectById(id);
      return project;
    } catch (error) {
      message.error('Failed to fetch project details');
      throw error;
    }
  };

  const getProjectsByStatus = async (status) => {
    try {
      const projects = await projectService.getProjectsByStatus(status);
      return projects;
    } catch (error) {
      message.error('Failed to fetch projects by status');
      throw error;
    }
  };

  const getProjectsByTag = async (tag) => {
    try {
      const projects = await projectService.getProjectsByTag(tag);
      return projects;
    } catch (error) {
      message.error('Failed to fetch projects by tag');
      throw error;
    }
  };

  const searchProjects = async (searchTerm) => {
    if (!searchTerm) return projects;
    
    try {
      const results = await projectService.searchProjects(searchTerm);
      return results;
    } catch (error) {
      message.error('Failed to search projects');
      throw error;
    }
  };

  const updateProjectStatus = async (projectId, status) => {
    setLoading(true);
    try {
      const updatedProject = await projectService.updateProjectStatus(projectId, status);
      setProjects(prev => 
        prev.map(project => 
          project.id === projectId ? updatedProject : project
        )
      );
      message.success('Project status updated successfully!');
      return updatedProject;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update project status';
      message.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Project statistics
  const projectStats = useMemo(() => {
    const statusCounts = projects.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    }, {});

    const tagCounts = projects.reduce((acc, project) => {
      acc[project.tag] = (acc[project.tag] || 0) + 1;
      return acc;
    }, {});

    return {
      total: projects.length,
      statusCounts,
      tagCounts,
      activeProjects: projects.filter(p => p.status === 'Active').length,
      developmentProjects: projects.filter(p => p.tag === 'development').length,
      productionProjects: projects.filter(p => p.tag === 'production').length
    };
  }, [projects]);

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    getProjectById,
    getProjectsByStatus,
    getProjectsByTag,
    searchProjects,
    updateProjectStatus,
    projectStats,
    refetch: fetchProjects
  };
};