"use client";

import React, { useState } from "react";
import {
  Card,
  Tag,
  Button,
  Skeleton,
  Alert,
  Tooltip,
  Modal,
  Dropdown,
} from "antd";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftOutlined,
  EditOutlined,
  MoreOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useProjects } from "../../hooks/useProjects";
import AddProjectModal from "./AddProjectModal";
import Home from "../../pages/Home";

// Skeleton Component for ProjectDetail
const ProjectDetailSkeleton = () => {
  return (
    <div>
      <div className="mb-4 flex item-center gap-4">
        <Skeleton.Button
          active
          size="default"
          style={{ width: 60, height: 32 }}
        />
      </div>
      <div className="grid md:grid-cols-12 grid-cols-1 gap-4">
        {/* Details Section Skeleton */}
        <Card className="md:col-span-12 col-span-1">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <Skeleton.Input
                active
                size="large"
                style={{ width: 200, height: 32 }}
              />
              <Skeleton.Button
                active
                size="small"
                style={{ width: 80, height: 24 }}
              />
              <Skeleton.Button
                active
                size="small"
                style={{ width: 80, height: 24 }}
              />
              <Skeleton.Button
                active
                size="small"
                style={{ width: 60, height: 24 }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton.Button
                active
                size="default"
                style={{ width: 70, height: 32 }}
              />
              <Skeleton.Button
                active
                size="default"
                style={{ width: 32, height: 32 }}
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column Skeleton */}
              <div className="flex flex-col gap-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex gap-3 item-center">
                    <Skeleton.Input
                      active
                      size="small"
                      style={{ width: 120, height: 16 }}
                    />
                    <Skeleton.Button
                      active
                      size="default"
                      style={{ width: 140, height: 32 }}
                    />
                  </div>
                ))}
              </div>

              {/* Right Column Skeleton */}
              <div className="flex flex-col gap-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex gap-3 item-center">
                    <Skeleton.Input
                      active
                      size="small"
                      style={{ width: 100, height: 16 }}
                    />
                    <Skeleton.Input
                      active
                      size="default"
                      style={{ width: 150, height: 20 }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Home Component Card Skeleton */}
        <Card
          bodyStyle={{ padding: "0px" }}
          className="md:col-span-12 col-span-1"
        >
          <div style={{ padding: "24px" }}>
            <Skeleton active paragraph={{ rows: 6 }} />
          </div>
        </Card>
      </div>
    </div>
  );
};

const ProjectDetail = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const { updateProject, getProjectById, deleteProject } = useProjects();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProjectById(projectId),
  });

  if (isLoading) {
    return <ProjectDetailSkeleton />;
  }

  if (error) {
    return (
      <Alert
        type="error"
        message="Failed to load project"
        description={error?.message || String(error)}
        showIcon
      />
    );
  }

  if (!data) {
    return (
      <Alert type="warning" message="No project data available" showIcon />
    );
  }

  const {
    name,
    repository_url,
    description,
    environments: projectEnvironments,
  } = data;

  const handleModalSubmit = async (formData) => {
    try {
      await updateProject({ ...data, ...formData });
      await queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsModalVisible(false);
      setEditingProject(null);
    } catch (error) {
      console.error("Error submitting project:", error);
    }
  };

  const handleDelete = async () => {
    Modal.confirm({
      title: "Delete this project?",
      content: "This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await deleteProject(data.id);
          await queryClient.invalidateQueries({ queryKey: ["projects"] });
          navigate("/projects");
        } catch (err) {
          // error handled in hook
        }
      },
    });
  };

  return (
    <div className="pb-8">
      <div className="mb-4 flex item-center gap-4  ">
        <Button
          className="!text-black !font-semibold !text-lg"
          type="link"
          onClick={() => navigate("/projects")}
          icon={<ArrowLeftOutlined />}
        >
          Back
        </Button>
      </div>
      <div className="grid md:grid-cols-12 grid-cols-1 gap-4">
        {/* Details Section */}
        <Card className="md:col-span-12 col-span-1">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">{name}</h1>
              <h4 className="text-sm text-gray-500">{description}</h4>
            </div>

            <div className="flex items-center gap-2">
              {repository_url && (
                <Tooltip title="Open repository in new tab">
                  <a
                    href={repository_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button>Go to git Repository</Button>
                  </a>
                </Tooltip>
              )}
              <Dropdown
                menu={{
                  items: [
                    {
                      key: "edit",
                      label: "Edit",
                      onClick: () => setIsModalVisible(true),
                    },
                    {
                      key: "delete",
                      label: "Delete",
                      onClick: handleDelete,
                      danger: true,
                    },
                  ],
                }}
                trigger={["click"]}
              >
                <Button icon={<MoreOutlined />} />
              </Dropdown>
            </div>
          </div>
        </Card>

        {/* Environments Section - Link to dedicated page */}
        <Card
          className="md:col-span-12 col-span-1"
          title={
            <div className="flex items-center gap-2">
              <EnvironmentOutlined className="text-blue-600" />
              <span>Environments</span>
            </div>
          }
          extra={
            <Button
              type="primary"
              icon={<EnvironmentOutlined />}
              onClick={() => navigate(`/projects/${projectId}/environments`)}
            >
              Manage Environments
            </Button>
          }
        >
          <div
            style={{
              fontFamily: "monospace",
              fontSize: "13px",
              lineHeight: "1.5",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              padding: "12px",
              backgroundColor: "#f5f5f5",
              borderRadius: "4px",
              minHeight: "2.5em",
              maxHeight: "calc(13px * 1.5 * 10 + 24px)",
              overflowY: "auto",
              border: "1px solid #d9d9d9",
            }}
          >
            {projectEnvironments && projectEnvironments.length > 0 ? (
              projectEnvironments
                .map((env) => `${env.key}=${env.value || ""}`)
                .join("\n")
            ) : (
              <span style={{ color: "#999" }}>
                No environments configured. Click "Manage Environments" to add
                environment variables.
              </span>
            )}
          </div>
        </Card>

        <Card
          bodyStyle={{ padding: "0px" }}
          className="md:col-span-12 col-span-1"
        >
          <Home project={data} />
        </Card>
        <AddProjectModal
          visible={isModalVisible}
          project={data}
          onSubmit={handleModalSubmit}
          onCancel={() => {
            setIsModalVisible(false);
            setEditingProject(null);
          }}
          isEdit={true}
        />
      </div>
    </div>
  );
};

export default ProjectDetail;
