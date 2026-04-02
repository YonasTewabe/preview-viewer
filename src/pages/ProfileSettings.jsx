import { useState } from 'react';
import { 
  Card, 
  Tabs, 
  Typography, 
  Row, 
  Col,
  Breadcrumb
} from 'antd';
import { 
  UserOutlined, 
  SecurityScanOutlined, 
  BellOutlined,
  HomeOutlined,
  ProjectOutlined
} from '@ant-design/icons';
import ProfileInfo from '../components/Profile/ProfileInfo';
import SecuritySettings from '../components/Profile/SecuritySettings';
import NotificationSettings from '../components/Profile/NotificationSettings';
import ProfileProjects from '../components/Profile/ProfileProjects';

const { Title } = Typography;

const ProfileSettings = () => {
  const [activeTab, setActiveTab] = useState('profile');

  const tabItems = [
    {
      key: 'profile',
      label: (
        <span className="flex items-center">
          <UserOutlined className="mr-2" />
          Profile Info
        </span>
      ),
      children: <ProfileInfo />,
    },
   
    {
      key: 'security',
      label: (
        <span className="flex items-center">
          <SecurityScanOutlined className="mr-2" />
          Security
        </span>
      ),
      children: <SecuritySettings />,
    },
    // {
    //   key: 'notifications',
    //   label: (
    //     <span className="flex items-center">
    //       <BellOutlined className="mr-2" />
    //       Notifications
    //     </span>
    //   ),
    //   children: <NotificationSettings />,
    // },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black p-6 text-black dark:text-white">
      <div className={`mx-auto ${activeTab === 'projects' ? 'max-w-7xl' : 'max-w-4xl'}`}>
        {/* Page Header */}
        <div className="mb-6">
          <Title level={2} className="!mb-2 !text-black dark:!text-white">
            Profile Settings
          </Title>
          <p className="text-gray-700 dark:text-gray-300">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Main Content */}
        <div className={activeTab === 'projects' ? '' : 'bg-white dark:bg-black rounded-lg shadow-sm border dark:border-gray-800'}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="large"
            className={`profile-settings-tabs ${activeTab === 'projects' ? 'projects-tab' : ''}`}
            tabBarStyle={activeTab === 'projects' ? { 
              background: 'white', 
              margin: 0, 
              padding: '0 24px',
              borderRadius: '8px 8px 0 0',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            } : {}}
          />
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;