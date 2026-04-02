import React from 'react';
import { Modal, Form, Input, Select, message, Row, Col } from 'antd';
import { useParams } from 'react-router-dom';

const { Option } = Select;

// Backend service types
const backendTypes = [
  { value: "api", label: "API Service" },
  { value: "database", label: "Database" },
  { value: "cache", label: "Cache Service" },
  { value: "queue", label: "Message Queue" },
  { value: "auth", label: "Authentication" },
  { value: "storage", label: "File Storage" }
];

export default function BackendServiceModal({ 
  isVisible, 
  editingService, 
  backendServices, 
  onOk, 
  onCancel, 
  form,
  projectId: projectIdProp,
}) {
  const { id: idFromRoute } = useParams();
  const projectId = projectIdProp ?? idFromRoute;
  console.log(editingService,"editingService");
  const handleModalOk = () => {
    form.validateFields().then((values) => {
      if (editingService) {
        // Edit existing service
        console.log(values,"gghghghgf");
        onOk(values);
        message.success("Service updated");
      } else {
        // Check if service key already exists
        const existingService = backendServices?.data.find(service => service.service_name === values.service_name);
        if (existingService) {
          message.error(`Service name "${values.service_name}" already exists. Please choose a different service name.`);
          return;
        }
        
        // Check if repository name already exists
        const existingRepoName = backendServices?.data.find(service => service.repo_url === values.repo_url);
        if (existingRepoName) {
          message.error(`Repository name "${values.repo_url}" already exists. Please choose a different repository name.`);
          return;
        }
        
        // Check if repository URL already exists
          const existingRepoUrl = backendServices?.data.find(service => service.repo_url === values.repo_url);
        if (existingRepoUrl) {
          message.error(`Repository URL "${values.repo_url}" already exists. Please choose a different repository URL.`);
          return;
        }
        
        // Add new service
        const newService = { 
          ...values, 
          project_id: projectId,
        };
        onOk(newService);
        message.success("Service created");
      }
      onCancel();
    });
  };

  // Custom validation function to check for duplicates excluding current service
  const validateUniqueField = (fieldName) => {
    return (_, value) => {
      if (!value) {
        return Promise.resolve();
      }
      
      // Check if value already exists in other services (excluding current service being edited)
      const existingService = backendServices?.data.find(service => 
        service[fieldName] === value && 
        (!editingService || service.id !== editingService.id)
      );
      
      if (existingService) {
          return Promise.reject(new Error(`${fieldName === 'repo_url' ? 'Repository name' : fieldName === 'repo_url' ? 'Repository URL' : fieldName === 'env_name' ? 'Environment name' : fieldName} "${value}" already exists`));
      }
      
      return Promise.resolve();
    };
  };

  return (
    <Modal
      title={editingService ? "Edit Backend Service" : "Add New Backend Service"}
      open={isVisible}
      onOk={handleModalOk}
      onCancel={onCancel}
      width={800}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={editingService || { type: "api" }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="service_name"
              label="Service Name"
              rules={[
                { required: true, message: "Please enter a service name" },
                { min: 2, message: "Service name must be at least 2 characters" },
              
              ]}
            >
              <Input 
                placeholder="Enter service name"
                onChange={(e) => {
                  const value = e.target.value;
                  form.setFieldsValue({
                    service_name: value,
                    repo_url: undefined,
                    default_url: undefined
                  });
                }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="type"
              label="Service Type"
              rules={[{ required: true, message: "Please select a service type" }]}
            >
              <Select 
                placeholder="Select service type"
              >
                {backendTypes.map(type => (
                  <Option key={type.value} value={type.value}>
                    {type.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="repository_name"
              label="Repository Name"
              rules={[
                { required: true, message: "Repository name is required" },
              ]}
            >
              <Input 
                placeholder="Enter repository name"
                onChange={(e) => {
                  const value = e.target.value;
                  form.setFieldsValue({
                    repository_name: value
                  });
                }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="env_name"
              label="Environment Name"
              rules={[
                { required: true, message: "Environment name is required" },
                { min: 2, message: "Environment name must be at least 2 characters" },
              ]}
            >
              <Input 
                placeholder="Enter environment name (e.g., development, staging, production)"
                onChange={(e) => {
                  const value = e.target.value;
                  form.setFieldsValue({
                      env_name: value
                  });
                }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="default_url"
              label="Default URL"
              rules={[
                { required: true, message: 'Please enter the default URL' },
                { type: "url", message: "Please enter a valid URL" }
              ]}
            >
              <Input 
                placeholder="https://example.com/api/v1"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="repo_url"
              label="Repository URL"
              rules={[
                { required: true, message: "Repository URL is required" },
                { type: "url", message: "Please enter a valid URL" },
              ]}
            >
              <Input 
                placeholder="Enter repository URL (e.g., https://github.com/username/repo)"
                onChange={(e) => {
                  const value = e.target.value;
                  form.setFieldsValue({
                    repo_url: value
                  });
                }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="description"
              label="Description (Optional)"
            >
              <Input.TextArea 
                placeholder="Brief description of the backend service"
                rows={3}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
} 