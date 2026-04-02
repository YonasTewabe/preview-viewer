import { useEffect } from 'react';
import { Modal, Form, Input, Select, Switch, Row, Col } from 'antd';
import { UserOutlined, MailOutlined } from '@ant-design/icons';

const { Option } = Select;

const UserFormModal = ({ 
  visible, 
  onCancel, 
  onSubmit, 
  initialValues, 
  loading 
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      if (initialValues) {
        // Editing existing user
        form.setFieldsValue({
          ...initialValues,
          status: initialValues.status === 'Active'
        });
      } else {
        // Creating new user
        form.resetFields();
        form.setFieldsValue({
          status: true // Default to active
        });
      }
    }
  }, [visible, initialValues, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      // Convert status boolean back to string
      const formattedValues = {
        ...values,
        status: values.status ? 'Active' : 'Inactive'
      };
      onSubmit(formattedValues);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={
        <div className="flex items-center">
          <UserOutlined className="mr-2 text-blue-600" />
          <span className="text-lg font-semibold">
            {initialValues ? 'Edit User' : 'Create New User'}
          </span>
        </div>
      }
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={600}
      okText={initialValues ? 'Update User' : 'Create User'}
      cancelText="Cancel"
      className="user-form-modal"
      okButtonProps={{
        className: ' !rounded-lg'
      }}
    >
      <div className="py-4">
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          className="space-y-4"
        >
          <Row gutter={16}>
            <Col span={24}>
              {/* <Form.Item
                name="username"
                label={
                  <span className="text-gray-700 font-medium">
                    Username
                  </span>
                }
                rules={[
                  { 
                    required: true, 
                    message: 'Please enter a username' 
                  },
                  { 
                    min: 3, 
                    message: 'Username must be at least 3 characters' 
                  },
                  {
                    pattern: /^[a-zA-Z0-9_.-]+$/,
                    message: 'Username can only contain letters, numbers, dots, hyphens, and underscores'
                  }
                ]}
              >
                <Input
                  prefix={<UserOutlined className="text-gray-400" />}
                  placeholder="Enter username"
                  size="large"
                  className="rounded-lg"
                />
              </Form.Item> */}
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="first_name"
                label={
                  <span className="text-gray-700 font-medium">
                    First Name
                  </span>
                }
                rules={[
                  { 
                    required: true, 
                    message: 'Please enter the first name' 
                  },
                  { 
                    min: 2, 
                    message: 'First name must be at least 2 characters' 
                  },
                  {
                    pattern: /^[a-zA-Z\s]+$/,
                    message: 'First name can only contain letters and spaces'
                  }
                ]}
              >
                <Input
                  placeholder="Enter first name"
                  size="large"
                  className="rounded-lg"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="last_name"
                label={
                  <span className="text-gray-700 font-medium">
                    Last Name
                  </span>
                }
                rules={[
                  { 
                    required: true, 
                    message: 'Please enter the last name' 
                  },
                  { 
                    min: 2, 
                    message: 'Last name must be at least 2 characters' 
                  },
                  {
                    pattern: /^[a-zA-Z\s]+$/,
                    message: 'Last name can only contain letters and spaces'
                  }
                ]}
              >
                <Input
                  placeholder="Enter last name"
                  size="large"
                  className="rounded-lg"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="email"
                label={
                  <span className="text-gray-700 font-medium">
                    Email Address
                  </span>
                }
                rules={[
                  { 
                    required: true, 
                    message: 'Please enter the email address' 
                  },
                  { 
                    type: 'email', 
                    message: 'Please enter a valid email address' 
                  }
                ]}
              >
                <Input
                  prefix={<MailOutlined className="text-gray-400" />}
                  placeholder="Enter email address"
                  size="large"
                  className="!rounded-lg"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="role"
                label={
                  <span className="text-gray-700 font-medium">
                    Role
                  </span>
                }
                rules={[
                  { 
                    required: true, 
                    message: 'Please select a role' 
                  }
                ]}
              >
                <Select
                  placeholder="Select role"
                  size="large"
                  className="w-full"
                >
                  <Option value="Admin">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      Admin
                    </div>
                  </Option>
                  <Option value="Developer">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                      Developer
                    </div>
                  </Option>
                  <Option value="Viewer">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                      Viewer
                    </div>
                  </Option>
                </Select>
              </Form.Item>
            </Col>

            
          </Row>

          {initialValues && (
            <div className="bg-gray-50 p-4 rounded-lg mt-6">
              <div className="text-sm text-gray-600">
                <div className="flex justify-between items-center">
                  <span>User ID:</span>
                  <span className="font-medium">#{initialValues.id}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span>Created:</span>
                  <span className="font-medium">
                    {new Date(initialValues.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </Form>
      </div>
    </Modal>
  );
};

export default UserFormModal;