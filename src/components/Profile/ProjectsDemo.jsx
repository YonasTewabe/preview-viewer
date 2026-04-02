import React from 'react';
import { Alert, Typography, List, Tag } from 'antd';
import { 
  CheckCircleOutlined, 
  InfoCircleOutlined,
  ProjectOutlined,
  FilterOutlined,
  EditOutlined,
  PlusOutlined
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const ProjectsDemo = () => {
  const features = [
    {
      title: 'Project Grid Display',
      description: 'Responsive grid layout showing project cards with thumbnails, descriptions, and metadata',
      icon: <ProjectOutlined className="text-blue-500" />
    },
    {
      title: 'Advanced Filtering',
      description: 'Filter projects by status (Active, In Progress, Completed, etc.) and role (Owner, Admin, Contributor, Viewer)',
      icon: <FilterOutlined className="text-green-500" />
    },
    {
      title: 'Search Functionality',
      description: 'Search projects by name, description, or tags with real-time results',
      icon: <InfoCircleOutlined className="text-purple-500" />
    },
    {
      title: 'Project Management',
      description: 'Create, edit, and delete projects with role-based permissions',
      icon: <EditOutlined className="text-orange-500" />
    },
    {
      title: 'Statistics Dashboard',
      description: 'Overview cards showing total projects, active projects, team members, and completed projects',
      icon: <CheckCircleOutlined className="text-teal-500" />
    },
    {
      title: 'Tabbed Organization',
      description: 'Organize projects by status with badge counts for easy navigation',
      icon: <PlusOutlined className="text-red-500" />
    }
  ];

  const projectStatuses = [
    { name: 'Active', color: 'green', description: 'Currently active projects' },
    { name: 'In Progress', color: 'blue', description: 'Projects under development' },
    { name: 'Completed', color: 'purple', description: 'Successfully completed projects' },
    { name: 'On Hold', color: 'orange', description: 'Temporarily paused projects' },
    { name: 'Archived', color: 'default', description: 'Archived or inactive projects' }
  ];

  const userRoles = [
    { name: 'Owner', color: 'gold', description: 'Full control over the project' },
    { name: 'Admin', color: 'red', description: 'Administrative permissions' },
    { name: 'Contributor', color: 'blue', description: 'Can contribute to the project' },
    { name: 'Viewer', color: 'default', description: 'Read-only access' }
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="text-center mb-8">
        <Title level={2}>Profile Projects Feature Demo</Title>
        <Paragraph className="text-lg text-gray-600">
          A comprehensive project management section for user profiles
        </Paragraph>
      </div>

      <Alert
        message="Feature Overview"
        description="This Profile Projects section provides a complete project management experience integrated into the user profile page. It includes project visualization, filtering, search, and CRUD operations."
        type="info"
        showIcon
        className="mb-6"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <Title level={3}>✨ Key Features</Title>
          <List
            itemLayout="horizontal"
            dataSource={features}
            renderItem={item => (
              <List.Item>
                <List.Item.Meta
                  avatar={item.icon}
                  title={<Text strong>{item.title}</Text>}
                  description={item.description}
                />
              </List.Item>
            )}
          />
        </div>

        <div className="space-y-6">
          <div>
            <Title level={3}>📊 Project Statuses</Title>
            <div className="space-y-2">
              {projectStatuses.map(status => (
                <div key={status.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <Tag color={status.color}>{status.name}</Tag>
                    <Text>{status.description}</Text>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Title level={3}>👥 User Roles</Title>
            <div className="space-y-2">
              {userRoles.map(role => (
                <div key={role.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <Tag color={role.color}>{role.name}</Tag>
                    <Text>{role.description}</Text>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-lg">
        <Title level={4}>🎯 Usage Instructions</Title>
        <List size="small">
          <List.Item>• Navigate to Profile Settings → My Projects tab</List.Item>
          <List.Item>• Use the "Add Project" button to create new projects</List.Item>
          <List.Item>• Filter projects using the status and role dropdowns</List.Item>
          <List.Item>• Search projects by typing in the search box</List.Item>
          <List.Item>• Click the three dots on project cards for edit/delete options</List.Item>
          <List.Item>• Use tabs to quickly filter by project status</List.Item>
          <List.Item>• View project statistics in the overview cards</List.Item>
        </List>
      </div>

      <Alert
        message="Technical Implementation"
        description="Built with React, Ant Design components, Tailwind CSS for styling, and includes custom hooks for state management. Features responsive design, role-based permissions, and mock data for demonstration."
        type="success"
        showIcon
      />
    </div>
  );
};

export default ProjectsDemo;