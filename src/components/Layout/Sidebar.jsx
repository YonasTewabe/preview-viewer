import { Layout, Menu, Typography, Button } from 'antd';
import {
  AppstoreOutlined,
  UnorderedListOutlined,
  SafetyOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { FaCodeBranch } from "react-icons/fa6";
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const { Sider } = Layout;
const { Text } = Typography;

const Sidebar = ({ collapsed, onCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { isDark } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Determine selected keys for menu
  const getSelectedKeys = () => {
    const path = location.pathname;
    if (path === '/' || path.startsWith('/dashboard')) return ['/'];
    if (path.startsWith('/projects')) return ['/projects'];
    if (path.startsWith('/users')) return ['/users'];
    if (path.startsWith('/system')) return ['/system'];
    return [];
  };

  const menuItems = [
    {
      key: '/',
      icon: <AppstoreOutlined style={{ fontSize: '18px' }} />,
      label: 'Dashboard',
      onClick: () => navigate('/')
    },
    {
      key: '/projects',
      icon: <UnorderedListOutlined style={{ fontSize: '18px' }} />,
      label: 'Projects',
      onClick: () => navigate('/projects')
    },
    {
      key: 'admin',
      icon: <SafetyOutlined style={{ fontSize: '18px' }} />,
      label: 'Administration',
      children: [
        {
          key: '/users',
          label: 'User Management',
          onClick: () => navigate('/users')
        },
        {
          key: '/system',
          label: 'System Settings',
          onClick: () => navigate('/system')
        }
      ]
    }
  ];
console.log(isDark,"isDark")
  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={280}
      className={`${isDark ? 'dark:!bg-black' : '!bg-white'} border-r border-gray-200 flex flex-col`}
      style={{
        overflow: 'hidden',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        boxShadow: 'none',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Logo and Brand */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center">
            <FaCodeBranch className="text-blue-600 dark:text-blue-400" style={{ fontSize: '32px' }} />
          </div>
          {!collapsed && (
            <Text className="text-base font-bold text-blue-600 dark:text-blue-400 tracking-wide uppercase">
              PREVIEW BUILDER
            </Text>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="py-4 px-3 flex-1 overflow-auto">
        <Menu
          mode="inline"
          selectedKeys={getSelectedKeys()}
          items={menuItems}
          className="sidebar-menu !border-none !bg-transparent"
          style={{
            backgroundColor: 'transparent',
          }}
          theme="light"
        />
      </div>

      {/* Logout Button */}
      <div className="px-3 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
        <Button
          type="text"
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          className="w-full flex items-center justify-start h-11 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium"
          style={{
            color: isDark ? '#ffffff' : '#374151',
          }}
        >
          {!collapsed && <span className="ml-2">Logout</span>}
        </Button>
      </div>

      <style>{`
        .sidebar-menu .ant-menu-item {
          height: 44px !important;
          line-height: 44px !important;
          margin: 4px 0 !important;
          border-radius: 6px !important;
          color: #374151 !important;
          font-weight: 500 !important;
          padding-left: 16px !important;
          transition: all 0.2s ease !important;
        }

        .dark .sidebar-menu .ant-menu-item {
          color: #ffffff !important;
        }

        .sidebar-menu .ant-menu-item:hover {
          background-color: #f3f4f6 !important;
          color: #000000 !important;
        }

        .dark .sidebar-menu .ant-menu-item:hover {
          background-color: #1a1a1a !important;
          color: #ffffff !important;
        }

        .sidebar-menu .ant-menu-item-selected {
          background-color: #1890ff !important;
          color: #ffffff !important;
        }

        .sidebar-menu .ant-menu-item-selected .anticon {
          color: #ffffff !important;
        }

        .sidebar-menu .ant-menu-item-selected::after {
          display: none !important;
        }

        .sidebar-menu .ant-menu-submenu {
          margin: 4px 0 !important;
        }

        .sidebar-menu .ant-menu-submenu-title {
          height: 44px !important;
          line-height: 44px !important;
          border-radius: 6px !important;
          color: #374151 !important;
          font-weight: 500 !important;
          padding-left: 16px !important;
          transition: all 0.2s ease !important;
        }

        .dark .sidebar-menu .ant-menu-submenu-title {
          color: #ffffff !important;
        }

        .sidebar-menu .ant-menu-submenu-title:hover {
          background-color: #f3f4f6 !important;
          color: #000000 !important;
        }

        .dark .sidebar-menu .ant-menu-submenu-title:hover {
          background-color: #1a1a1a !important;
          color: #ffffff !important;
        }

        .sidebar-menu .ant-menu-submenu-open > .ant-menu-submenu-title {
          color: #000000 !important;
        }

        .dark .sidebar-menu .ant-menu-submenu-open > .ant-menu-submenu-title {
          color: #ffffff !important;
        }

        .sidebar-menu .ant-menu-submenu-title .anticon {
          color: #000000 !important;
        }

        .dark .sidebar-menu .ant-menu-submenu-title .anticon {
          color: #ffffff !important;
        }

        .sidebar-menu .ant-menu-submenu-title .ant-menu-submenu-arrow {
          color: #6b7280 !important;
        }

        .dark .sidebar-menu .ant-menu-submenu-title .ant-menu-submenu-arrow {
          color: #9ca3af !important;
        }

        .sidebar-menu .ant-menu-inline .ant-menu-item {
          padding-left: 48px !important;
        }

        .sidebar-menu .ant-menu-inline .ant-menu-item:hover {
          background-color: #f3f4f6 !important;
        }

        .dark .sidebar-menu .ant-menu-inline .ant-menu-item:hover {
          background-color: #374151 !important;
        }

        .sidebar-menu .ant-menu-inline .ant-menu-item-selected {
          background-color: #e6f7ff !important;
          color: #1890ff !important;
          font-weight: 600 !important;
        }

        .dark .sidebar-menu .ant-menu-inline .ant-menu-item-selected {
          background-color: #1e3a8a !important;
          color: #60a5fa !important;
        }

        .sidebar-menu .ant-menu-inline .ant-menu-item-selected::after {
          display: none !important;
        }
      `}</style>
    </Sider>
  );
};

export default Sidebar;