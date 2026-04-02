import { Layout, Button, Dropdown, Avatar, Space } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Header } = Layout;

const AppHeader = ({ title = "Preview Builder" }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => {
        // Navigate to profile page when implemented
        console.log('Profile clicked');
      }
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => {
        // Navigate to settings page when implemented
        console.log('Settings clicked');
      }
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  return (
    <Header className="bg-white shadow-sm border-b border-gray-200 px-6 flex items-center justify-between">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold text-gray-800 mb-0">
          {title}
        </h1>
      </div>
      
      <div className="flex items-center">
        <Space size="middle">
          <span className="text-gray-600">
            Welcome, <strong>{user?.first_name || user?.username}</strong>
          </span>
          
          <Dropdown
            menu={{ items: userMenuItems }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Button type="text" className="flex items-center">
              <Avatar 
                size="small" 
                icon={<UserOutlined />} 
                className="bg-blue-500"
              />
              <span className="ml-2 text-gray-700">
                {user?.username}
              </span>
            </Button>
          </Dropdown>
        </Space>
      </div>
    </Header>
  );
};

export default AppHeader;