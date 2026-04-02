import { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Avatar,
  Upload,
  Row,
  Col,
  Card,
  message,
  Space,
  Divider,
  Spin
} from 'antd';
import {
  UserOutlined,
  CameraOutlined,
  SaveOutlined,
  UndoOutlined,
  MailOutlined,
  PhoneOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { useUser, useUpdateUser } from '../../hooks/useUsers';
import { useAuth } from '../../contexts/AuthContext';

const ProfileInfo = () => {
  const [form] = Form.useForm();
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  
  // Get current user from auth context
  const { user: currentUser } = useAuth();
  
  // Fetch user data using React Query
  const { 
    data: userData, 
    isLoading: userLoading, 
    isError,
    error 
  } = useUser(currentUser?.id);
  
  // If we don't have userData from API, fallback to currentUser from auth
  const displayUser = userData || currentUser;
  
  // Update user mutation
  const updateUserMutation = useUpdateUser();

  useEffect(() => {
    // Initialize form with user data when it loads
    if (displayUser) {
      form.setFieldsValue({
        first_name: displayUser.first_name || '',
        last_name: displayUser.last_name || '',
        email: displayUser.email || '',
        phone: displayUser.phone || '',
        username: displayUser.username || '',
        role: displayUser.role || ''
      });
      
      // Set avatar if available
      if (displayUser?.avatar) {
        setAvatarUrl(displayUser?.avatar);
      }
    }
  }, [form, displayUser]);

  const handleSave = async (values) => {
    const userId = displayUser?.id;
    if (!userId) {
      message.error('User ID not available');
      return;
    }

    updateUserMutation.mutate(
      { id: userId, ...values },
      {
        onSuccess: () => {
          message.success('Profile updated successfully!');
        },
        onError: (error) => {
          console.error('Error updating profile:', error);
          message.error('Failed to update profile');
        }
      }
    );
  };

  const handleReset = () => {
    if (displayUser) {
      form.setFieldsValue({
        first_name: displayUser.first_name || '',
        last_name: displayUser.last_name || '',
        email: displayUser.email || '',
        phone: displayUser.phone || '',
        username: displayUser.username || '',
        role: displayUser.role || ''
      });
      message.info('Form reset to original values');
    }
  };

  const handleAvatarChange = (info) => {
    if (info.file.status === 'uploading') {
      setUploading(true);
      return;
    }
    
    if (info.file.status === 'done') {
      // Get this url from response in real world.
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setAvatarUrl(reader.result);
        setUploading(false);
        message.success('Avatar uploaded successfully!');
      });
      reader.readAsDataURL(info.file.originFileObj);
    }
  };

  const beforeUpload = (file) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('You can only upload JPG/PNG files!');
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must smaller than 2MB!');
      return false;
    }
    return true;
  };

  const uploadButton = (
    <div className="flex flex-col items-center justify-center">
      <CameraOutlined className="text-2xl text-gray-400 mb-2" />
      <div className="text-sm text-gray-500">Upload Photo</div>
    </div>
  );

  // Handle loading and error states
  if (userLoading && !currentUser) {
    return (
      <div className="max-w-2xl mx-auto text-center py-8">
        <Spin size="large" />
        <p className="mt-4 text-gray-600">Loading profile information...</p>
      </div>
    );
  }

  if (isError && !currentUser) {
    return (
      <div className="max-w-2xl mx-auto text-center py-8">
        <p className="text-red-600">
          Error loading profile: {error?.message || 'Unknown error'}
        </p>
        <Button 
          type="primary" 
          onClick={() => window.location.reload()}
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!displayUser) {
    return (
      <div className="max-w-2xl mx-auto text-center py-8">
        <p className="text-gray-600">No user data available</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        className="space-y-6"
      >
        {/* Avatar Section */}
        <Card className="mb-6">
          <div className="text-center">
            <div className="mb-4">
              <div className="relative inline-block">
                <Avatar
                  size={120}
                  src={avatarUrl || userData?.avatar}
                  icon={!avatarUrl && !userData?.avatar ? <UserOutlined /> : null}
                  className="border-4 border-white shadow-lg"
                />
                <Upload
                  name="avatar"
                  listType="picture"
                  className="avatar-uploader absolute -bottom-2 -right-2"
                  showUploadList={false}
                  beforeUpload={beforeUpload}
                  onChange={handleAvatarChange}
                  customRequest={({ file, onSuccess }) => {
                    // Simulate upload
                    setTimeout(() => {
                      onSuccess("ok");
                    }, 1000);
                  }}
                >
                  <Button
                    shape="circle"
                    icon={<CameraOutlined />}
                    size="large"
                    className="bg-purple-600 hover:bg-purple-700 border-purple-600 hover:border-purple-700 text-white"
                    loading={uploading}
                  />
                </Upload>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">
              {displayUser.first_name} {displayUser.last_name}
            </h3>
            <p className="text-gray-500">{displayUser.role}</p>
          </div>
        </Card>

        {/* Personal Information */}
        <Card title="Personal Information" className="mb-6">
          <Row gutter={[24, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="First Name"
                name="first_name"
                rules={[
                  { required: true, message: 'Please enter your first name' },
                  { min: 2, message: 'First name must be at least 2 characters' }
                ]}
              >
                <Input
                  prefix={<UserOutlined className="text-gray-400" />}
                  placeholder="Enter your first name"
                  size="large"
                  className="rounded-lg"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Last Name"
                name="last_name"
                rules={[
                  { required: true, message: 'Please enter your last name' },
                  { min: 2, message: 'Last name must be at least 2 characters' }
                ]}
              >
                <Input
                  prefix={<UserOutlined className="text-gray-400" />}
                  placeholder="Enter your last name"
                  size="large"
                  className="rounded-lg"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Email Address"
                name="email"
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input
                  prefix={<MailOutlined className="text-gray-400" />}
                  placeholder="Enter your email"
                  size="large"
                  className="rounded-lg"
                  disabled // Email usually not editable
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Phone Number"
                name="phone"
                rules={[
                  { pattern: /^[\+]?[1-9][\d]{0,15}$/, message: 'Please enter a valid phone number' }
                ]}
              >
                <Input
                  prefix={<PhoneOutlined className="text-gray-400" />}
                  placeholder="Enter your phone number"
                  size="large"
                  className="rounded-lg"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Username"
                name="username"
                rules={[
                  { required: true, message: 'Please enter your username' },
                  { min: 3, message: 'Username must be at least 3 characters' }
                ]}
              >
                <Input
                  prefix={<UserOutlined className="text-gray-400" />}
                  placeholder="Enter your username"
                  size="large"
                  className="rounded-lg"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Role"
                name="role"
              >
                <Input
                  prefix={<TeamOutlined className="text-gray-400" />}
                  placeholder="Your role"
                  size="large"
                  className="rounded-lg"
                  disabled // Role usually managed by admin
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Action Buttons */}
        <Card className="text-center">
          <Space size="large">
            <Button
              type="default"
              icon={<UndoOutlined />}
              size="large"
              onClick={handleReset}
              className="min-w-[120px]"
            >
              Reset
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              size="large"
              loading={updateUserMutation.isPending}
              className="min-w-[120px] bg-purple-600 hover:bg-purple-700 border-purple-600 hover:border-purple-700"
            >
              Save Changes
            </Button>
          </Space>
        </Card>
      </Form>
    </div>
  );
};

export default ProfileInfo;