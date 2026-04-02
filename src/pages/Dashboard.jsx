import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Tag, Button, Typography } from 'antd';
import { 
  ProjectOutlined,
  TeamOutlined,
  PauseCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  RocketOutlined
} from '@ant-design/icons';
import StatsCard from '../components/Dashboard/StatsCard';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext';
const { Title, Text } = Typography;

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeBuilds: 0,
    successfulBuilds: 0,
    failedBuilds: 0
  });
  const [recentBuilds, setRecentBuilds] = useState([]);
  const [systemStatus, setSystemStatus] = useState([]);
  const { isDark } = useTheme();
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Utility function to format time ago
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  // Utility function to format duration
  const formatDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 'N/A';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffInSeconds = Math.floor((end - start) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    const minutes = Math.floor(diffInSeconds / 60);
    const seconds = diffInSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data from backend
      const [projectsRes, backendNodesRes, frontendNodesRes, jenkinsStatusRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_BACKEND_URL}projects`).catch(() => ({ data: [] })),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}backendnodes`).catch(() => ({ data: { backendServices: [] } })),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}frontendnodes`).catch(() => ({ data: { frontendServices: [] } })),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}jenkins/test-connection`).catch(() => ({ data: { connected: false } }))
      ]);

      const projects = projectsRes.data || [];
      const backendServices = backendNodesRes.data?.backendServices || [];
      const frontendServices = frontendNodesRes.data?.frontendServices || [];
      
      // Filter out deleted services
      const activeBackendServices = backendServices.filter(s => !s.is_deleted);
      const activeFrontendServices = frontendServices.filter(s => !s.is_deleted);
      const allServices = [...activeBackendServices, ...activeFrontendServices];
      
      // Calculate stats
      const activeBuilds = allServices.filter(s => s.build_status === 'building').length;
      const successfulBuilds = allServices.filter(s => s.build_status === 'success').length;
      const failedBuilds = allServices.filter(s => s.build_status === 'failed').length;

      setStats({
        totalProjects: projects.length,
        activeBuilds,
        successfulBuilds,
        failedBuilds
      });

      // Create recent builds list from actual data
      const recentBuildsList = [];
      
      // Add backend services with build info
      activeBackendServices.forEach((service, index) => {
        if (service.build_status && service.build_status !== 'pending') {
          const buildDate = service.last_build_date || service.created_at || service.updated_at;
          recentBuildsList.push({
            key: `backend-${service.id || index}`,
            service: service.service_name || service.serviceName || 'Unknown Service',
            branch: service.branch_name || service.branchName || 'main',
            status: service.build_status,
            duration: service.last_build_date && service.created_at_build 
              ? formatDuration(service.created_at_build, service.last_build_date)
              : 'N/A',
            timestamp: formatTimeAgo(buildDate),
            buildDate: buildDate ? new Date(buildDate).getTime() : 0
          });
        }
      });
      
      // Add frontend services with build info
      activeFrontendServices.forEach((service, index) => {
        if (service.build_status && service.build_status !== 'pending') {
          const buildDate = service.updated_at || service.created_at;
          recentBuildsList.push({
            key: `frontend-${service.id || index}`,
            service: service.service_name || 'Unknown Service',
            branch: service.branch_name || 'main',
            status: service.build_status,
            duration: 'N/A', // Frontend nodes don't have build duration tracked
            timestamp: formatTimeAgo(buildDate),
            buildDate: buildDate ? new Date(buildDate).getTime() : 0
          });
        }
      });
      
      // Sort by most recent and limit to 10
      recentBuildsList.sort((a, b) => b.buildDate - a.buildDate);
      setRecentBuilds(recentBuildsList.slice(0, 10));

      // Create build status list from backend and frontend services
      const buildStatusList = [];
      
      // Add backend services
      activeBackendServices.slice(0, 5).forEach((service) => {
        const buildDate = service.last_build_date || service.created_at || service.updated_at;
        const statusColor = service.build_status === 'success' ? 'green' :
                          service.build_status === 'building' ? 'blue' :
                          service.build_status === 'failed' ? 'red' : 'orange';
        const statusText = service.build_status === 'success' ? 'Success' :
                          service.build_status === 'building' ? 'Building' :
                          service.build_status === 'failed' ? 'Failed' : 'Pending';
        
        buildStatusList.push({
          id: service.id,
          title: service.service_name || service.serviceName || 'Unknown Service',
          kind: 'api',
          projectId: service.project_id ?? service.projectId,
          status: statusText,
          color: statusColor,
          time: formatTimeAgo(buildDate),
          buildDate: buildDate ? new Date(buildDate).getTime() : 0
        });
      });
      
      // Add frontend services
      activeFrontendServices.slice(0, 5).forEach((service) => {
        const buildDate = service.updated_at || service.created_at;
        const statusColor = service.build_status === 'success' ? 'green' :
                          service.build_status === 'building' ? 'blue' :
                          service.build_status === 'failed' ? 'red' : 'orange';
        const statusText = service.build_status === 'success' ? 'Success' :
                          service.build_status === 'building' ? 'Building' :
                          service.build_status === 'failed' ? 'Failed' : 'Pending';
        
        buildStatusList.push({
          id: service.id,
          title: service.service_name || 'Unknown Service',
          kind: 'web',
          projectId: service.project_id ?? service.projectId,
          status: statusText,
          color: statusColor,
          time: formatTimeAgo(buildDate),
          buildDate: buildDate ? new Date(buildDate).getTime() : 0
        });
      });
      
      // Sort by most recent and limit to 8 items
      buildStatusList.sort((a, b) => b.buildDate - a.buildDate);
      setSystemStatus(buildStatusList.slice(0, 8));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set empty state on error
      setSystemStatus([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-black dark:text-white">
      {/* Header Section */}
      <div className="mb-6">
        <Title level={1} className="!mb-2 !text-blue-900 dark:!text-blue-400 !font-bold">
          Dashboard
        </Title>
        <Text className="text-lg font-semibold text-black dark:text-white block mb-1">
          Welcome back, {user?.first_name || user?.username || 'Yonas'}
        </Text>
        <Text className="text-gray-700 dark:text-gray-300">
          Here's what's happening with your preview environments today.
        </Text>
      </div>

      {/* Stats Cards */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Active Builds"
            value={stats.activeBuilds}
            icon={<ClockCircleOutlined />}
            color="blue"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Successful Builds"
            value={stats.successfulBuilds}
            icon={<CheckCircleOutlined />}
            color="green"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Failed Builds"
            value={stats.failedBuilds}
            icon={<CloseCircleOutlined />}
            color="red"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Total Projects"
            value={stats.totalProjects}
            icon={<ProjectOutlined />}
            color="blue"
            loading={loading}
          />
        </Col>
      </Row>

      {/* Main Content */}
      <Row gutter={[24, 24]}>
        {/* Recent Builds */}
        <Col xs={24} lg={16}>
          <Card 
            title={<span className="font-bold text-blue-900 dark:text-blue-400">Recent Builds</span>} 
            className="shadow-sm dark:bg-black dark:border-gray-800"
            loading={loading}
          >
            {recentBuilds.length > 0 ? (
              <div className="space-y-3">
                {recentBuilds.map((build) => {
                  const getStatusConfig = () => {
                    switch (build.status) {
                      case 'success':
                        return { 
                          color: 'success', 
                          text: 'SUCCESS', 
                          icon: <CheckCircleOutlined className="text-green-500" />,
                          bgColor: 'bg-green-50 dark:bg-green-900/20',
                          borderColor: 'border-green-200 dark:border-green-800'
                        };
                      case 'building':
                        return { 
                          color: 'processing', 
                          text: 'BUILDING', 
                          icon: <ClockCircleOutlined className="text-blue-500" />,
                          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
                          borderColor: 'border-blue-200 dark:border-blue-800'
                        };
                      case 'failed':
                        return { 
                          color: 'error', 
                          text: 'FAILED', 
                          icon: <CloseCircleOutlined className="text-red-500" />,
                          bgColor: 'bg-red-50 dark:bg-red-900/20',
                          borderColor: 'border-red-200 dark:border-red-800'
                        };
                      default:
                        return { 
                          color: 'default', 
                          text: 'PENDING', 
                          icon: <PauseCircleOutlined className="text-orange-500" />,
                          bgColor: 'bg-orange-50 dark:bg-orange-900/20',
                          borderColor: 'border-orange-200 dark:border-orange-800'
                        };
                    }
                  };

                  const statusConfig = getStatusConfig();

                  return (
                    <div
                      key={build.key}
                      className={`p-4 rounded-lg border transition-all hover:shadow-md ${isDark ? 'dark:!bg-black' : '!bg-white'} dark:border-gray-800  cursor-pointer`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="mt-1 text-xl">
                            {statusConfig.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <Text strong className="text-base text-black dark:text-white">
                                {build.service}
                              </Text>
                              <Tag color="blue" className="text-xs">
                                {build.branch}
                              </Tag>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap text-sm">
                              {build.duration !== 'N/A' && (
                                <div className="flex items-center gap-1">
                                  <ClockCircleOutlined className="text-gray-400" />
                                  <Text type="secondary" className="text-xs">
                                    {build.duration}
                                  </Text>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Text type="secondary" className="text-xs">
                                  {build.timestamp}
                                </Text>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Tag color={statusConfig.color} className="font-semibold shrink-0">
                          {statusConfig.text}
                        </Tag>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Text type="secondary" className="text-base">No recent builds available</Text>
              </div>
            )}
          </Card>
        </Col>

        {/* Build Status */}
        <Col xs={24} lg={8}>
          <Card title={<span className="font-bold text-blue-900 dark:text-blue-400">Build Status</span>} className="shadow-sm dark:bg-black dark:border-gray-800">
            <div className="space-y-4">
              {systemStatus.length > 0 ? (
                systemStatus.map((item, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 p-2 rounded transition-colors"
                    onClick={() => {
                      if (!item.id) return;
                      if (item.kind === 'web') {
                        navigate(`/config/${item.id}`);
                      } else if (item.projectId) {
                        navigate(`/projects/${item.projectId}`);
                      }
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        item.color === 'green' ? 'bg-green-500' :
                        item.color === 'blue' ? 'bg-blue-500' :
                        item.color === 'red' ? 'bg-red-500' :
                        item.color === 'orange' ? 'bg-orange-500' : 'bg-gray-500'
                      }`}></div>
                      <div>
                        <Text strong className="text-black dark:text-white">{item.title}</Text>
                        <br />
                        <Text type="secondary" className="text-sm">
                          Service • {item.time}
                        </Text>
                      </div>
                    </div>
                    <Tag color={item.color} className="capitalize">{item.status}</Tag>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <Text type="secondary">No builds available</Text>
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Card title={<span className="font-bold text-blue-900 dark:text-blue-400">Quick Actions</span>} className="shadow-sm dark:bg-black dark:border-gray-800">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Button 
              type="primary" 
              block 
              size="large" 
              icon={<RocketOutlined />}
              className="!h-28 !bg-blue-600 !border-blue-600 hover:!bg-blue-700"
              onClick={() => navigate('/projects')}
            >
              <div className="flex flex-col items-center">
                <span>Projects &amp; services</span>
              </div>
            </Button>
          </Col>
          <Col xs={24} sm={12}>
            <Button 
              block 
              size="large" 
              icon={<TeamOutlined />}
              className="!h-28 !border-blue-600 !text-blue-600 hover:!border-blue-700 hover:!text-blue-700"
              onClick={() => navigate('/users')}
            >
              <div className="flex flex-col items-center">
                <span>Manage users</span>
              </div>
            </Button>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Dashboard;