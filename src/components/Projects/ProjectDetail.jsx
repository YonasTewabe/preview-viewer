"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Card,
  Button,
  Skeleton,
  Alert,
  Tooltip,
  Dropdown,
  Popover,
  Space,
  Select,
  message,
} from "antd";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { useProjects } from "../../hooks/useProjects";
import AddProjectModal from "./AddProjectModal";
import Home from "../../pages/Home";
import { projectService } from "../../services/projectService";
import {
  invalidateAndRefetchActive,
  queryKeyPart,
} from "../../utils/invalidateQueries";

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
  const [, setEditingProject] = useState(null);
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const [deletePopoverOpen, setDeletePopoverOpen] = useState(false);
  const [settingDefaultProfile, setSettingDefaultProfile] = useState(false);
  const actionsWrapRef = useRef(null);
  const queryClient = useQueryClient();
  const { updateProject, getProjectById, deleteProject } = useProjects();
  const { data, isLoading, error } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProjectById(projectId),
  });

  const serverDefaultProfileId = useMemo(() => {
    const list = Array.isArray(data?.env_profiles) ? data.env_profiles : [];
    return list.find((p) => p.is_default)?.id ?? null;
  }, [data?.env_profiles]);

  const [draftDefaultProfileId, setDraftDefaultProfileId] = useState(null);

  useEffect(() => {
    if (data?.id == null) return;
    setDraftDefaultProfileId(serverDefaultProfileId);
  }, [data?.id, serverDefaultProfileId]);

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
    env_profiles: envProfilesRaw,
  } = data;

  const envProfiles = Array.isArray(envProfilesRaw) ? envProfilesRaw : [];

  const defaultProfileSelectValue =
    draftDefaultProfileId ?? serverDefaultProfileId ?? undefined;

  const defaultProfileDirty =
    String(defaultProfileSelectValue ?? "") !==
    String(serverDefaultProfileId ?? "");

  const saveDefaultProfile = async () => {
    const chosen = draftDefaultProfileId ?? serverDefaultProfileId ?? undefined;
    if (chosen == null || chosen === "") return;
    if (String(chosen) === String(serverDefaultProfileId ?? "")) return;
    setSettingDefaultProfile(true);
    try {
      await projectService.patchEnvProfile(projectId, chosen, {
        is_default: true,
      });
      const pidKey = queryKeyPart(projectId);
      await invalidateAndRefetchActive(
        queryClient,
        ["projects"],
        ...(pidKey != null ? [["project", pidKey]] : []),
        ...(pidKey != null ? [["envProfiles", pidKey]] : []),
        ...(pidKey != null ? [["envVars", pidKey]] : []),
        ...(pidKey != null ? [["projectEnvVars", pidKey]] : []),
        ...(pidKey != null ? [["projectDefaultEnvVars", pidKey]] : []),
      );
      message.success("Default environment profile updated");
    } catch (e) {
      message.error(
        e?.response?.data?.error ||
          e?.message ||
          "Failed to update default profile",
      );
    } finally {
      setSettingDefaultProfile(false);
    }
  };

  const handleModalSubmit = async (formData) => {
    try {
      await updateProject({ ...data, ...formData });
      setIsModalVisible(false);
      setEditingProject(null);
    } catch (error) {
      console.error("Error submitting project:", error);
      throw error;
    }
  };

  const runDeleteProject = async () => {
    try {
      await deleteProject(data.id);
      navigate("/projects");
    } catch {
      // error handled in hook
    }
  };

  return (
    <div className="pb-8">
      <div className="mb-4 flex item-center gap-4">
        <Button
          className="!text-black !font-semibold !text-base sm:!text-lg"
          type="link"
          onClick={() => navigate("/projects")}
          icon={<ArrowLeftOutlined />}
        >
          Back
        </Button>
      </div>
      <div className="grid md:grid-cols-12 gap-4">
        {/* Details Section */}
        <Card className="md:col-span-12 col-span-1">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="truncate text-xl sm:text-2xl font-semibold">
                {name}
              </h1>
              <h4 className="mt-1 break-words text-sm text-gray-500">
                {description}
              </h4>
            </div>

            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
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
              <Popover
                open={deletePopoverOpen}
                onOpenChange={setDeletePopoverOpen}
                placement="bottomRight"
                trigger={[]}
                arrow={false}
                getPopupContainer={() =>
                  actionsWrapRef.current ?? document.body
                }
                content={
                  <div style={{ maxWidth: 300 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>
                      Delete this project?
                    </div>
                    <p style={{ marginBottom: 12 }}>
                      Are you sure you want to delete <strong>{name}</strong>?
                    </p>
                    <Space
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        width: "100%",
                      }}
                    >
                      <Button
                        size="small"
                        onClick={() => setDeletePopoverOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="small"
                        type="primary"
                        danger
                        onClick={async () => {
                          setDeletePopoverOpen(false);
                          await runDeleteProject();
                        }}
                      >
                        Delete
                      </Button>
                    </Space>
                  </div>
                }
              >
                <span ref={actionsWrapRef} className="inline-flex">
                  <Dropdown
                    open={actionsMenuOpen}
                    onOpenChange={setActionsMenuOpen}
                    trigger={["click"]}
                    placement="bottomRight"
                    menu={{
                      items: [
                        {
                          key: "edit",
                          label: "Edit",
                          icon: <EditOutlined />,
                          onClick: () => {
                            setActionsMenuOpen(false);
                            setIsModalVisible(true);
                          },
                        },
                        {
                          key: "delete",
                          label: "Delete",
                          icon: <DeleteOutlined />,
                          danger: true,
                          onClick: () => {
                            setActionsMenuOpen(false);
                            window.setTimeout(
                              () => setDeletePopoverOpen(true),
                              0,
                            );
                          },
                        },
                      ],
                    }}
                  >
                    <Button
                      type="default"
                      icon={<MoreOutlined />}
                      aria-label="Project actions"
                    />
                  </Dropdown>
                </span>
              </Popover>
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
              className="w-full sm:w-auto"
            >
              Manage Environments
            </Button>
          }
        >
          {envProfiles.length > 0 ? (
            <div className="mb-4 flex max-w-2xl flex-col gap-2">
              <Space wrap align="start">
                <Select
                  style={{ minWidth: 220, width: "100%" }}
                  placeholder="Choose default profile"
                  disabled={settingDefaultProfile}
                  value={defaultProfileSelectValue}
                  options={envProfiles.map((p) => ({
                    value: p.id,
                    label: p.is_default ? `${p.name} (default)` : p.name,
                  }))}
                  onChange={(v) => setDraftDefaultProfileId(v)}
                />
                <Button
                  type="primary"
                  loading={settingDefaultProfile}
                  disabled={!defaultProfileDirty || settingDefaultProfile}
                  onClick={() => void saveDefaultProfile()}
                >
                  Update default
                </Button>
              </Space>
            </div>
          ) : null}
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
              maxHeight: "calc(13px * 1.5 * 6 + 24px)",
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
                No environments configured. Click &quot;Manage
                Environments&quot; to add environment variables.
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
