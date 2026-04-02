"use client";
import { useState, useEffect } from "react";
import { 
  Card, 
  Layout, 
  Row, 
  Col, 
  Button, 
  Input, 
  Modal, 
  Form, 
  message,
  Select,
  Tag,
  Empty,
} from "antd";
import { useNavigate } from "react-router-dom";
import BackendTab from "../components/BackendTab";
import FrontendNodes from "../components/FrontendNodes";
import { useCreateFrontendNodes, useDeleteFrontendNode, useFrontendNodesByProjectId, useUpdateFrontendNode } from "../services/useFrontendNodes";
import { useAuth } from "../contexts/AuthContext";
import { useGitHub } from "../hooks/useGitHub";
import {
  isApiPreviewProject,
  previewKindShortLabel,
} from "../utils/projectServiceKind";

const { Content } = Layout;
const { Option } = Select;

// Node types for configuration
const nodeTypes = [
  { value: "api", label: "API Endpoint" },
  { value: "service", label: "Service" },
  { value: "database", label: "Database" },
  { value: "cache", label: "Cache" },
  { value: "queue", label: "Queue" },
  { value: "storage", label: "Storage" }
];

export default function Home({ project }) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingNode, setEditingNode] = useState(null);
  const { user } = useAuth();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const createdBy = Number.parseInt(user?.id, 10);
  
  // Use the GitHub hook for branch management
  const { githubBranches, loadingGithubBranches, fetchGithubBranches } = useGitHub();
  
  const generateNodeName = () => "Service";

  const { data: frontendNodes, isLoading: isLoadingFrontendNodes } =
    useFrontendNodesByProjectId(project?.id);
  const { mutate: createFrontendNodes,isLoading: isLoadingCreateFrontendNodes } = useCreateFrontendNodes();
  const { mutate: updateFrontendNodes,isLoading: isLoadingUpdateFrontendNodes } = useUpdateFrontendNode();
  const { mutate:deleteFrontendNodes,isLoading: isLoadingDeleteFrontendNodes } = useDeleteFrontendNode();
  const repoUrl = project?.repository_url
    ? project.repository_url.split("/").slice(4).join("/")
    : "";
  // Fetch branches on component mount using the GitHub hook
  useEffect(() => {
    if (project?.repository_url && repoUrl) {
      fetchGithubBranches(project.repository_url, repoUrl);
    }
  }, [project?.repository_url, repoUrl]);

  const handleAddNode = () => {
    if (!project?.env_name || !project?.environments || project.environments.length === 0) {
      message.warning("Set this project's environments before adding services.");
      navigate(`/projects/${project.id}/environments`);
      return;
    }
    setEditingNode(null);
    form.resetFields();
    form.setFieldsValue({
      service_name: generateNodeName(),
      type: "api",
      project_id: project.id,
      repository_name : project.repository_url,
      repo_url: project.repository_url,
      created_by: Number.isFinite(createdBy) ? createdBy : 1,
    });
    setIsModalVisible(true);
  };

  const handleEditNode = (node) => {
    setEditingNode(node);
    form.setFieldsValue(node);
    setIsModalVisible(true);
  };

  const handleDeleteNode = (id) => {
    deleteFrontendNodes(id,{
      onSuccess:()=>{},
      onError:(error)=>{
        message.error(error.response.data.message);
      }
    });
  };

  const handleDeleteWithConfirm = (node) => {
    Modal.confirm({
      title: 'Delete this service?',
      content: 'Are you sure you want to delete this service?',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: () => handleDeleteNode(node.id),
    });
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      const valueupdate={...values,project_id:project.id,branch_name:values.branch_name || "main"}
      if (editingNode) {
        updateFrontendNodes({
          id: editingNode.id,
          data: valueupdate
        },{
          onSuccess:()=>{
            setIsModalVisible(false);
            form.resetFields();
          },
          onError:(error)=>{
            message.error(error.response.data.message);
          }
        });
      } else {
        // Add new node
        createFrontendNodes({
          ...values,
          project_id: project.id,
          branch_name:values.branch_name || "main",
          created_by: Number.isFinite(createdBy) ? createdBy : 1,
        },{
          onSuccess:()=>{
            setIsModalVisible(false);
            form.resetFields();
          },
          onError:(error)=>{
            message.error(error.response.data.message);
          }
        });
      }
      
    });
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };


  const handleNodeClick = (node) => {
    navigate(`/config/${node.id}`, { state: { selectedNode: node } });
  };

  const footer = (
    <div className="flex justify-end gap-2">
      <Button type="default" onClick={handleModalCancel}>Cancel</Button>
      <Button type="primary" onClick={handleModalOk} loading={isLoadingCreateFrontendNodes || isLoadingUpdateFrontendNodes}>{editingNode ? "Update" : "Add"} service</Button>
    </div>
  );
  const showApiStyleServices = isApiPreviewProject(project?.tag);

  if (!project?.id) {
    return (
      <Content style={{ padding: 24 }}>
        <Card>
          <Empty
            description="Open a project from the Projects page to manage its services."
          >
            <Button type="primary" onClick={() => navigate("/projects")}>
              Go to projects
            </Button>
          </Empty>
        </Card>
      </Content>
    );
  }

  return (
    <div>
      <Content style={{ padding: "0px" }}>
        <Card
          bordered={false}
          className="dark:border-gray-700 dark:!bg-neutral-900/50"
          title={
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold">Services</span>
              <Tag color="blue">{previewKindShortLabel(project?.tag)}</Tag>
            </div>
          }
        >
          {showApiStyleServices ? (
            <BackendTab project={project} />
          ) : (
            <FrontendNodes
              frontendNodes={frontendNodes}
              isLoadingFrontendNodes={isLoadingFrontendNodes}
              onAddNode={handleAddNode}
              onEditNode={handleEditNode}
              onDeleteNode={handleDeleteWithConfirm}
              onNodeClick={handleNodeClick}
            />
          )}
        </Card>
      </Content>

      {!showApiStyleServices && (
      <Modal
  title={editingNode ? "Edit service" : "Add service"}
  open={isModalVisible}
  footer={footer}
  width={600}
  onCancel={handleModalCancel}
>
  <Form
    form={form}
    layout="vertical"
    initialValues={editingNode || { type: "api" }}
  >
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          name="service_name"
          label="Service name"
          rules={[{ required: true, message: "Please enter the service name" }]}
        >
          <Input placeholder="e.g., Main app" />
        </Form.Item>
      </Col>

      <Col span={12}>
        <Form.Item
          name="type"
          label="Service type"
          rules={[{ required: true, message: "Please select a type" }]}
        >
          <Select placeholder="Select type">
            {nodeTypes.map((type) => (
              <Option key={type.value} value={type.value}>
                {type.label}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Col>

      <Col span={12}>
        <Form.Item
          name="branch_name"
          label="Branch"
          // rules={[{ required: true, message: "Please select a branch" }]}
        >
          <Select
            placeholder="Select a branch"
            loading={loadingGithubBranches}
            showSearch
            filterOption={(input, option) => {
              const optionText = typeof option.children === 'string' 
                ? option.children 
                : String(option.children);
              return optionText.toLowerCase().indexOf(input.toLowerCase()) >= 0;
            }}
          >
            {githubBranches.map((branch, index) => (
              <Option key={index} value={branch}>
                {index + 1}. {branch}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Col>

      <Col span={12}>
        <Form.Item
          name="repository_name"
          label="Repository Name"
          rules={[{ required: true, message: "Please enter the repository name" }]}
        >
          <Input disabled placeholder="e.g., my-project-frontend" />
        </Form.Item>
      </Col>

      <Col span={12}>
        <Form.Item
          name="repo_url"
          label="Repository URL"
          rules={[
            { required: true, message: "Please enter the repository URL" },
            { type: "url", message: "Please enter a valid URL" }
          ]}
        >
          <Input disabled placeholder="e.g., https://github.com/username/repository" />
        </Form.Item>
      </Col>

      <Col span={12}>
        <Form.Item
          name="env_name"
          label="Environment Name"
          rules={[{ required: true, message: "Please enter the environment name" }]}
        >
          <Input placeholder="e.g., development, staging, production" />
        </Form.Item>
      </Col>
    </Row>

    {/* Description spans full width */}
    <Form.Item
      name="description"
      label="Description (Optional)"
    >
      <Input.TextArea
        placeholder="Brief description of the service"
        rows={3}
      />
    </Form.Item>
  </Form>
</Modal>
      )}

    </div>
  );
}
