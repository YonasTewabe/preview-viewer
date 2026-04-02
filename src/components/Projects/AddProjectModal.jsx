import React, { useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Space,
  Divider,
  DatePicker,
  Row,
  Col,
  Select,
} from 'antd';
import {
  ProjectOutlined,
  BranchesOutlined,
  SaveOutlined,
  CloseOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { TextArea } = Input;

const AddProjectModal = ({ visible, project, onSubmit, onCancel, isEdit }) => {
  const [form] = Form.useForm();
  const authUser=JSON.parse(window.localStorage.getItem('user'))
  console.log(authUser,"OOOO")

  const createdBy = Number.parseInt(authUser?.id, 10);

  useEffect(() => {
    if (visible) {
      if (isEdit && project) {
        form.setFieldsValue({
          ...project,
          tag: project.tag || 'frontend',
          last_build_date: project.last_build_date ? dayjs(project.last_build_date) : null,
          created_at: project.created_at ? dayjs(project.created_at) : null,
          updated_at: project.updated_at ? dayjs(project.updated_at) : null
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          version: 'v1.0.0',
          tag: 'frontend',
        });
      }
    }
  }, [visible, isEdit, project, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // Format dates
      const formattedValues = {
        ...values,
        created_by: Number.isFinite(createdBy) ? createdBy : 1,
        last_build_date: values.last_build_date?.toISOString(),
        created_at: values.created_at?.toISOString(),
        updated_at: dayjs().toISOString(), // Always update the updated_at to now
        short_code: values.name.length < 5
          ? values.name.toLowerCase().replace(/\s+/g, '-')
          : values.name
              .split(' ')
              .map(word => word[0])
              .join('') 
              .toLowerCase(),
      };
      await onSubmit(formattedValues);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center">
          <ProjectOutlined className="mr-2 text-blue-600" />
          {isEdit ? 'Edit Project' : 'Add New Project'}
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      className="project-modal"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="space-y-4"
      >
        <Row gutter={[16, 0]}>
          <Col xs={24} md={24}>
            <Form.Item
              name="name"
              label={
                <span className="flex items-center">
                  <ProjectOutlined className="mr-1" />
                  Project Name
                </span>
              }
              rules={[
                { required: true, message: 'Please enter project name' },
                { min: 3, message: 'Project name must be at least 3 characters' },
                { max: 50, message: 'Project name cannot exceed 50 characters' }
              ]}
            >
              <Input placeholder="Enter project name" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 0]}>
          <Col xs={24} md={12}>
            <Form.Item
              name="env_name"
              label="Environment Name"
              rules={[
                { required: true, message: 'Please enter environment name' },
                { min: 2, message: 'Environment name must be at least 2 characters' },
                { max: 50, message: 'Environment name cannot exceed 50 characters' },
                { pattern: /^[a-z0-9_-]+$/i, message: 'Use only letters, numbers, underscore, and hyphen' },
              ]}
            >
              <Input placeholder="e.g., org-structure-dev" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="tag"
              label="Tag"
              rules={[{ required: true, message: 'Please select frontend or backend' }]}
            >
              <Select
                placeholder="Select tag"
                options={[
                  { value: 'frontend', label: 'Frontend' },
                  { value: 'backend', label: 'Backend' },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="description"
          label="Description"
          rules={[
            { required: true, message: 'Please enter project description' },
            { max: 500, message: 'Description cannot exceed 500 characters' }
          ]}
        >
          <TextArea
            rows={3}
            placeholder="Enter project description"
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Row gutter={[16, 0]}>
          <Col xs={24} md={12}>
            <Form.Item
              name="repository_url"
              label={
                <span className="flex items-center">
                  <BranchesOutlined className="mr-1" />
                  Repository URL
                </span>
              }
              rules={[
                { required: true, message: 'Please enter repository URL' },
                { type: 'url', message: 'Please enter a valid URL' }
              ]}
            >
              <Input placeholder="https://github.com/username/repo" />
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        <Form.Item className="mb-0">
          <Space className="w-full justify-end">
            <Button onClick={onCancel} icon={<CloseOutlined />}>
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              icon={<SaveOutlined />}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isEdit ? 'Update Project' : 'Create Project'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddProjectModal;