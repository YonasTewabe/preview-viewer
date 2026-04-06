import React, { useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Space,
  Divider,
  Row,
  Col,
  Select,
  message,
} from "antd";
import {
  ProjectOutlined,
  BranchesOutlined,
  SaveOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { TextArea } = Input;

const DUPLICATE_FIELD_NAMES = new Set([
  "name",
  "short_code",
  "env_name",
  "repository_url",
]);

/**
 * Map API 400 duplicate response to { name, errors } for Form.setFields.
 */
function duplicateFieldFeedback(data) {
  if (!data) return null;
  let field = data.field;
  const msg = data.error ? String(data.error) : "This value is already in use.";
  if (!field || !DUPLICATE_FIELD_NAMES.has(field)) {
    const low = msg.toLowerCase();
    if (low.includes("short code")) field = "short_code";
    else if (
      low.includes("repository url") ||
      low.includes("repository url is already")
    )
      field = "repository_url";
    else if (
      low.includes("environment name") ||
      (low.includes("another project") && low.includes("environment"))
    )
      field = "env_name";
    else if (
      low.includes("name already") ||
      low.includes("with this name")
    )
      field = "name";
  }
  if (!field || !DUPLICATE_FIELD_NAMES.has(field)) return null;
  return { name: field, errors: [msg] };
}

const AddProjectModal = ({ visible, project, onSubmit, onCancel, isEdit }) => {
  const [form] = Form.useForm();
  const authUser = JSON.parse(window.localStorage.getItem("user"));

  const createdBy = Number.parseInt(authUser?.id, 10);

  useEffect(() => {
    if (!visible) return;

    const clearDuplicateErrors = () => {
      form.setFields(
        [...DUPLICATE_FIELD_NAMES].map((name) => ({ name, errors: [] })),
      );
    };

    if (isEdit && project) {
      const tag =
        project.tag === "web"
          ? "frontend"
          : project.tag === "api"
            ? "backend"
            : project.tag || "frontend";
      form.setFieldsValue({
        name: project.name,
        short_code: project.short_code,
        env_name: project.env_name,
        tag,
        description: project.description,
        repository_url: project.repository_url,
        created_at: project.created_at ? dayjs(project.created_at) : null,
        updated_at: project.updated_at ? dayjs(project.updated_at) : null,
      });
      clearDuplicateErrors();
    } else {
      form.resetFields();
      clearDuplicateErrors();
    }
  }, [visible, isEdit, project, form]);

  const handleSubmit = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    const formattedValues = {
      ...values,
      created_by: Number.isFinite(createdBy) ? createdBy : 1,
      created_at: values.created_at?.toISOString(),
      updated_at: dayjs().toISOString(),
      short_code: String(values.short_code ?? "")
        .trim()
        .toLowerCase(),
    };

    try {
      await onSubmit(formattedValues);
    } catch (error) {
      const data = error?.response?.data;
      const feedback = duplicateFieldFeedback(data);
      if (feedback) {
        form.setFields([feedback]);
        return;
      }
      const low = String(data?.error || "").toLowerCase();
      const looksDuplicate =
        low.includes("already exists") ||
        low.includes("already in use") ||
        low.includes("already linked");
      if (error?.response?.status === 400 && data?.error && looksDuplicate) {
        message.error(String(data.error));
      } else if (!error?.response) {
        console.error("Project submit failed:", error);
      }
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center">
          {isEdit ? "Edit Project" : "Add New Project"}
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
        <Row gutter={[16, 0]} align="top">
          <Col xs={24} md={16}>
            <Form.Item
              name="name"
              label={<span className="flex items-center">Project Name</span>}
              rules={[
                { required: true, message: "Please enter project name" },
                {
                  min: 3,
                  message: "Project name must be at least 3 characters",
                },
                {
                  max: 50,
                  message: "Project name cannot exceed 50 characters",
                },
              ]}
            >
              <Input placeholder="Enter project name" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="short_code"
              label="Short code"
              extra="Used in preview domains (e.g. acme-1234-fe). Letters, numbers, -, _."
              rules={[
                { required: true, message: "Please enter a short code" },
                {
                  min: 2,
                  max: 10,
                  message: "Short code must be 2–10 characters",
                },
                {
                  pattern: /^[a-z0-9-]+$/i,
                  message:
                    "Use only letters, numbers, and hyphen (no spaces)",
                },
              ]}
            >
              <Input placeholder="e.g., acme-portal" autoComplete="off" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 0]}>
          <Col xs={24} md={12}>
            <Form.Item
              name="env_name"
              label="Environment Name"
              rules={[
                { required: true, message: "Please enter environment name" },
                {
                  min: 2,
                  message: "Environment name must be at least 2 characters",
                },
                {
                  max: 50,
                  message: "Environment name cannot exceed 50 characters",
                },
                {
                  pattern: /^[a-z0-9_-]+$/i,
                  message: "Use only letters, numbers, underscore, and hyphen",
                },
              ]}
            >
              <Input placeholder="e.g., org-structure-dev" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="tag"
              label="Tag"
              rules={[
                {
                  required: true,
                  message: "Please select Frontend or Backend",
                },
              ]}
            >
              <Select
                placeholder="Select tag"
                options={[
                  { value: "frontend", label: "Frontend" },
                  { value: "backend", label: "Backend" },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="description"
          label="Description"
          rules={[
            { max: 500, message: "Description cannot exceed 500 characters" },
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
          <Col span={24}>
            <Form.Item
              name="repository_url"
              label={
                <span className="flex items-center">
                  <BranchesOutlined className="mr-1" />
                  Repository URL
                </span>
              }
              rules={[
                { required: true, message: "Please enter repository URL" },
                { type: "url", message: "Please enter a valid URL" },
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
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isEdit ? "Update Project" : "Create Project"}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddProjectModal;
