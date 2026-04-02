import React, { useEffect } from 'react';
import { 
  Form, 
  Input, 
  Select, 
  Button, 
  Upload, 
  message, 
  Space,
  Divider 
} from 'antd';
import { 
  PlusOutlined, 
  UploadOutlined,
  SaveOutlined,
  CloseOutlined 
} from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;

const ProjectForm = ({ 
  project = null, 
  onSubmit, 
  onCancel, 
  loading = false,
  isEdit = false 
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (project && isEdit) {
      form.setFieldsValue({
        name: project.name,
        description: project.description,
        status: project.status,
        role: project.role,
        tags: project.tags || []
      });
    } else {
      form.resetFields();
    }
  }, [project, isEdit, form]);

  const handleSubmit = async (values) => {
    try {
      const formData = {
        ...values,
        id: isEdit ? project.id : undefined
      };
      await onSubmit(formData);
      if (!isEdit) {
        form.resetFields();
      }
    } catch (error) {
      console.error('Error submitting project form:', error);
    }
  };

  const statusOptions = [
    { label: 'Active', value: 'Active' },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'On Hold', value: 'On Hold' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Archived', value: 'Archived' }
  ];

  const roleOptions = [
    { label: 'Owner', value: 'Owner' },
    { label: 'Admin', value: 'Admin' },
    { label: 'Contributor', value: 'Contributor' },
    { label: 'Viewer', value: 'Viewer' }
  ];

  const uploadProps = {
    name: 'thumbnail',
    listType: 'picture-card',
    maxCount: 1,
    beforeUpload: (file) => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) {
        message.error('You can only upload JPG/PNG files!');
        return false;
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('Image must be smaller than 2MB!');
        return false;
      }
      return false; // Prevent auto upload, handle manually
    },
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      className="space-y-4"
      initialValues={{
        status: 'Active',
        role: 'Owner'
      }}
    >
      <Form.Item
        name="name"
        label="Project Name"
        rules={[
          { required: true, message: 'Please enter project name' },
          { min: 3, message: 'Project name must be at least 3 characters' },
          { max: 50, message: 'Project name cannot exceed 50 characters' }
        ]}
      >
        <Input 
          placeholder="Enter project name"
          className="rounded-lg"
        />
      </Form.Item>

      <Form.Item
        name="description"
        label="Description"
        rules={[
          { max: 500, message: 'Description cannot exceed 500 characters' }
        ]}
      >
        <TextArea
          rows={4}
          placeholder="Enter project description (optional)"
          className="rounded-lg"
          showCount
          maxLength={500}
        />
      </Form.Item>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Form.Item
          name="status"
          label="Project Status"
          rules={[{ required: true, message: 'Please select project status' }]}
        >
          <Select
            placeholder="Select status"
            className="rounded-lg"
          >
            {statusOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="role"
          label="Your Role"
          rules={[{ required: true, message: 'Please select your role' }]}
        >
          <Select
            placeholder="Select your role"
            className="rounded-lg"
          >
            {roleOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </div>

      <Form.Item
        name="tags"
        label="Tags"
      >
        <Select
          mode="tags"
          placeholder="Add tags (press Enter to add)"
          className="rounded-lg"
          tokenSeparators={[',']}
        />
      </Form.Item>

      <Form.Item
        name="thumbnail"
        label="Project Thumbnail"
      >
        <Upload {...uploadProps}>
          <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors">
            <UploadOutlined className="text-2xl text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">Click to upload</span>
            <span className="text-xs text-gray-400">PNG, JPG up to 2MB</span>
          </div>
        </Upload>
      </Form.Item>

      <Divider />

      <Form.Item className="mb-0">
        <Space className="w-full justify-end">
          <Button 
            onClick={onCancel}
            icon={<CloseOutlined />}
            className="rounded-lg"
          >
            Cancel
          </Button>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            icon={isEdit ? <SaveOutlined /> : <PlusOutlined />}
            className="rounded-lg bg-blue-600 hover:bg-blue-700"
          >
            {isEdit ? 'Update Project' : 'Create Project'}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default ProjectForm;