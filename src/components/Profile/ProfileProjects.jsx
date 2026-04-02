import React, { useState, useMemo } from 'react';
import { 
  Card, 
  Button, 
  Input, 
  Select, 
  Tabs, 
  Modal, 
  Empty, 
  Spin, 
  Row, 
  Col,
  Space,
  Statistic,
  Badge
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  FilterOutlined,
  ProjectOutlined,
  TeamOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import ProjectCard from './ProjectCard';
import ProjectForm from './ProjectForm';
import { useProjects } from '../../hooks/useProjects';

const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const ProfileProjects = () => {
  const {
    projects,
    loading,
    createProject,
    updateProject,
    deleteProject,
    searchProjects,
    projectStats
  } = useProjects();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Filter and search projects
  const filteredProjects = useMemo(() => {
    let filtered = searchProjects(searchTerm);
    
    if (statusFilter !== 'All') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }
    
    if (roleFilter !== 'All') {
      filtered = filtered.filter(project => project.role === roleFilter);
    }
    
    return filtered;
  }, [projects, searchTerm, statusFilter, roleFilter, searchProjects]);

  // Group projects by status for tabs
  const projectsByStatus = useMemo(() => {
    const groups = {
      'All': filteredProjects,
      'Active': filteredProjects.filter(p => p.status === 'Active'),
      'In Progress': filteredProjects.filter(p => p.status === 'In Progress'),
      'Completed': filteredProjects.filter(p => p.status === 'Completed'),
      'Archived': filteredProjects.filter(p => p.status === 'Archived')
    };
    return groups;
  }, [filteredProjects]);

  const handleCreateProject = () => {
    setEditingProject(null);
    setIsModalVisible(true);
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setIsModalVisible(true);
  };

  const handleDeleteProject = (project) => {
    Modal.confirm({
      title: 'Delete Project',
      content: `Are you sure you want to delete "${project.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => deleteProject(project.id),
    });
  };

  const handleModalSubmit = async (formData) => {
    setModalLoading(true);
    try {
      if (editingProject) {
        await updateProject({ ...editingProject, ...formData });
      } else {
        await createProject(formData);
      }
      setIsModalVisible(false);
      setEditingProject(null);
    } catch (error) {
      console.error('Error submitting project:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingProject(null);
  };

  const canEditProject = (project) => {
    return ['Owner', 'Admin'].includes(project.role);
  };

  const canDeleteProject = (project) => {
    return project.role === 'Owner';
  };

  const statusOptions = [
    { label: 'All Projects', value: 'All' },
    { label: 'Active', value: 'Active' },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'Completed', value: 'Completed' },
    { label: 'On Hold', value: 'On Hold' },
    { label: 'Archived', value: 'Archived' }
  ];

  const roleOptions = [
    { label: 'All Roles', value: 'All' },
    { label: 'Owner', value: 'Owner' },
    { label: 'Admin', value: 'Admin' },
    { label: 'Contributor', value: 'Contributor' },
    { label: 'Viewer', value: 'Viewer' }
  ];

  const renderProjectGrid = (projectList) => (
    <div className="min-h-[400px]">
      {projectList.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No projects found"
          />
        </div>
      ) : (
        <Row gutter={[24, 24]}>
          {projectList.map(project => (
            <Col key={project.id} xs={24} sm={12} lg={8} xl={6}>
              <ProjectCard
                project={project}
                onEdit={handleEditProject}
                onDelete={handleDeleteProject}
                canEdit={canEditProject(project)}
                canDelete={canDeleteProject(project)}
              />
            </Col>
          ))}
        </Row>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <ProjectOutlined className="mr-3 text-blue-600" />
              My Projects
            </h2>
            <p className="text-gray-600 mt-1">
              Manage and track all your projects in one place
            </p>
          </div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleCreateProject}
            className="bg-blue-600 hover:bg-blue-700 rounded-lg h-10 px-6"
            size="large"
          >
            Add Project
          </Button>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[24, 16]} className="mb-6">
          <Col xs={24} sm={8} md={6}>
            <Card className="text-center border-blue-200 bg-blue-50">
              <Statistic
                title="Total Projects"
                value={projectStats.total}
                prefix={<ProjectOutlined className="text-blue-600" />}
                valueStyle={{ color: '#1890ff', fontSize: '24px', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Card className="text-center border-green-200 bg-green-50">
              <Statistic
                title="Active Projects"
                value={projectStats.statusCounts['Active'] || 0}
                prefix={<TrophyOutlined className="text-green-600" />}
                valueStyle={{ color: '#52c41a', fontSize: '24px', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Card className="text-center border-purple-200 bg-purple-50">
              <Statistic
                title="Team Members"
                value={projectStats.totalMembers}
                prefix={<TeamOutlined className="text-purple-600" />}
                valueStyle={{ color: '#722ed1', fontSize: '24px', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Card className="text-center border-orange-200 bg-orange-50">
              <Statistic
                title="Completed"
                value={projectStats.statusCounts['Completed'] || 0}
                prefix={<TrophyOutlined className="text-orange-600" />}
                valueStyle={{ color: '#fa8c16', fontSize: '24px', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Filters and Search */}
      <Card className="border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <Search
              placeholder="Search projects by name, description, or tags..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              className="max-w-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onSearch={setSearchTerm}
            />
            
            <Space size="middle" className="flex-wrap">
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                className="w-40"
                size="large"
                suffixIcon={<FilterOutlined />}
              >
                {statusOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
              
              <Select
                value={roleFilter}
                onChange={setRoleFilter}
                className="w-36"
                size="large"
              >
                {roleOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Space>
          </div>
        </div>
      </Card>

      {/* Projects Tabs */}
      <Card className="border border-gray-200">
        <Spin spinning={loading}>
          <Tabs
            defaultActiveKey="All"
            size="large"
            className="project-tabs"
            tabBarStyle={{ marginBottom: '24px' }}
          >
            {Object.entries(projectsByStatus).map(([status, projectList]) => (
              <TabPane
                key={status}
                tab={
                  <Badge count={projectList.length} offset={[8, -2]} size="small">
                    <span className="px-2">{status}</span>
                  </Badge>
                }
              >
                {renderProjectGrid(projectList)}
              </TabPane>
            ))}
          </Tabs>
        </Spin>
      </Card>

      {/* Project Form Modal */}
      <Modal
        title={editingProject ? 'Edit Project' : 'Create New Project'}
        open={isModalVisible}
        onCancel={handleModalCancel}
        footer={null}
        width={600}
        className="project-modal"
      >
        <ProjectForm
          project={editingProject}
          onSubmit={handleModalSubmit}
          onCancel={handleModalCancel}
          loading={modalLoading}
          isEdit={!!editingProject}
        />
      </Modal>
    </div>
  );
};

export default ProfileProjects;