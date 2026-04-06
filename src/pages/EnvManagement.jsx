"use client";

import React, { useMemo, useState } from "react";
import {
  Card,
  Table,
  Input,
  Button,
  Typography,
  Space,
  Tag,
  Alert,
  Skeleton,
  Modal,
  Radio,
  message,
  Dropdown,
} from "antd";
import { LinkOutlined, PlusOutlined, StarOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  invalidateAndRefetchActive,
  queryKeyPart,
} from "../utils/invalidateQueries";
import { projectService } from "../services/projectService";
import { ENV_MANAGE_RETURN_STATE } from "../utils/environmentsNavigation";

const { Search } = Input;
const { Text, Title } = Typography;

/** @param {{ env_profiles?: Array<{ id: number; name?: string; is_default?: boolean }> }} record */
function profilesFor(record) {
  return Array.isArray(record.env_profiles) ? record.env_profiles : [];
}

const ADD_AS_EXTRA = "extra";
const ADD_AS_DEFAULT = "default";

const EnvManagementSkeleton = () => (
  <div className="pb-8">
    <Skeleton active title={{ width: "40%" }} paragraph={{ rows: 1 }} />
    <Card>
      <Skeleton active paragraph={{ rows: 10 }} />
    </Card>
  </div>
);

const EnvManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [addProfileTarget, setAddProfileTarget] = useState(null);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileRole, setNewProfileRole] = useState(ADD_AS_EXTRA);
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [settingDefaultForProjectId, setSettingDefaultForProjectId] =
    useState(null);

  const {
    data: projects = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectService.getProjects(),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;

    return projects.filter((p) => {
      const product = String(p.name ?? "").toLowerCase();
      const profileNames = profilesFor(p)
        .map((x) => String(x.name ?? "").toLowerCase())
        .join(" ");
      return product.includes(q) || profileNames.includes(q);
    });
  }, [projects, search]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) =>
      String(a.name ?? "").localeCompare(String(b.name ?? ""), undefined, {
        sensitivity: "base",
      }),
    );
    return list;
  }, [filtered]);

  if (isLoading) {
    return <EnvManagementSkeleton />;
  }

  if (error) {
    return (
      <Alert
        type="error"
        message="Failed to load environments"
        description={error?.message || String(error)}
        showIcon
      />
    );
  }

  const openAddProfileModal = (record) => {
    setAddProfileTarget({ id: record.id, name: record.name });
    setNewProfileName("");
    setNewProfileRole(ADD_AS_EXTRA);
  };

  const closeAddProfileModal = () => {
    setAddProfileTarget(null);
    setNewProfileName("");
    setNewProfileRole(ADD_AS_EXTRA);
  };

  const submitNewProfile = async () => {
    const name = newProfileName.trim();
    if (!addProfileTarget?.id) return;
    if (!name) {
      message.error("Enter a profile name");
      return;
    }
    setCreatingProfile(true);
    try {
      await projectService.createEnvProfile(addProfileTarget.id, {
        name,
        is_default: newProfileRole === ADD_AS_DEFAULT,
      });
      message.success(`Profile "${name}" created`);
      const pid = queryKeyPart(addProfileTarget.id);
      closeAddProfileModal();
      await invalidateAndRefetchActive(
        queryClient,
        ["projects"],
        ...(pid != null ? [["project", pid]] : []),
        ...(pid != null ? [["envProfiles", pid]] : []),
        ...(pid != null ? [["envVars", pid]] : []),
        ...(pid != null ? [["projectEnvVars", pid]] : []),
        ...(pid != null ? [["projectDefaultEnvVars", pid]] : []),
      );
    } catch (e) {
      message.error(
        e?.response?.data?.error || e?.message || "Failed to create profile",
      );
    } finally {
      setCreatingProfile(false);
    }
  };

  const handleSetDefaultProfile = async (projectId, profileId) => {
    setSettingDefaultForProjectId(projectId);
    try {
      await projectService.patchEnvProfile(projectId, profileId, {
        is_default: true,
      });
      message.success("Default profile updated");
      const pid = queryKeyPart(projectId);
      await invalidateAndRefetchActive(
        queryClient,
        ["projects"],
        ...(pid != null ? [["project", pid]] : []),
        ...(pid != null ? [["envProfiles", pid]] : []),
        ...(pid != null ? [["envVars", pid]] : []),
        ...(pid != null ? [["projectEnvVars", pid]] : []),
        ...(pid != null ? [["projectDefaultEnvVars", pid]] : []),
      );
    } catch (e) {
      message.error(
        e?.response?.data?.error ||
          e?.message ||
          "Failed to update default profile",
      );
    } finally {
      setSettingDefaultForProjectId(null);
    }
  };

  const columns = [
    {
      title: "Product",
      key: "product",
      width: "22%",
      ellipsis: true,
      render: (_, record) => (
        <Text className="font-medium">{record.name || "—"}</Text>
      ),
    },
    {
      title: "Environment profiles",
      key: "profiles",
      render: (_, record) => {
        const list = profilesFor(record);
        if (!list.length) {
          return (
            <Text type="secondary">
              None yet — add a profile, then click it to edit variables.
            </Text>
          );
        }
        const ordered = [...list].sort((a, b) => {
          if (a.is_default !== b.is_default) return a.is_default ? -1 : 1;
          return String(a.name ?? "").localeCompare(
            String(b.name ?? ""),
            undefined,
            { sensitivity: "base" },
          );
        });
        return (
          <Space size={[6, 6]} wrap className="max-w-xl">
            {ordered.map((p) => (
              <Tag
                key={p.id}
                role="button"
                tabIndex={0}
                color={p.is_default ? "blue" : "default"}
                className="m-0 cursor-pointer transition-opacity hover:opacity-85"
                onClick={() =>
                  navigate(
                    `/projects/${record.id}/environments?profile=${encodeURIComponent(p.id)}`,
                    { state: ENV_MANAGE_RETURN_STATE },
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(
                      `/projects/${record.id}/environments?profile=${encodeURIComponent(p.id)}`,
                      { state: ENV_MANAGE_RETURN_STATE },
                    );
                  }
                }}
              >
                {p.name?.trim() || "Unnamed"}
                {p.is_default ? " (default)" : ""}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 400,
      align: "left",
      render: (_, record) => {
        const profs = profilesFor(record);
        return (
          <Space wrap size="small">
            <Button
              size="small"
              icon={<PlusOutlined />}
              onClick={() => openAddProfileModal(record)}
            >
              Add profile
            </Button>
            <Dropdown
              menu={{
                items: profs.map((p) => ({
                  key: String(p.id),
                  disabled: Boolean(p.is_default),
                  label: (
                    <Space size="small">
                      {p.is_default ? (
                        <Tag color="blue" className="m-0">
                          default
                        </Tag>
                      ) : null}
                      <span>{p.name?.trim() || "Unnamed"}</span>
                    </Space>
                  ),
                })),
                onClick: ({ key }) => {
                  void handleSetDefaultProfile(record.id, Number(key));
                },
              }}
              disabled={!profs.length}
              trigger={["click"]}
            >
              <Button
                size="small"
                icon={<StarOutlined />}
                loading={settingDefaultForProjectId === record.id}
                disabled={
                  !profs.length || settingDefaultForProjectId === record.id
                }
              >
                Set default
              </Button>
            </Dropdown>
            <Button
              size="small"
              icon={<LinkOutlined />}
              onClick={() => navigate(`/projects/${record.id}`)}
            >
              Project
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="pb-8">
      <div className="mb-6">
        <Title level={4} className="!mb-1">
          Env management
        </Title>
        <Text type="secondary">
          Each product lists its profiles; the tag marked{" "}
          <Text type="secondary" className="font-medium">
            (default)
          </Text>{" "}
          is used for new nodes unless you pick another on the node screen.
          Click a profile to edit its variables, or use{" "}
          <Text type="secondary" className="font-medium">
            Set default
          </Text>{" "}
          in Actions to change which profile is default.
        </Text>
      </div>

      <Card>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Search
            allowClear
            placeholder="Search by product or profile name"
            onSearch={setSearch}
            onChange={(e) => setSearch(e.target.value)}
            value={search}
            style={{ maxWidth: 400 }}
          />
        </div>

        <Table
          rowKey="id"
          size="middle"
          columns={columns}
          dataSource={sorted}
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            showTotal: (total) => `${total} product(s)`,
          }}
          locale={{
            emptyText: "No projects yet. Create a project under Projects.",
          }}
        />
      </Card>

      <Modal
        title={
          addProfileTarget
            ? `New environment profile — ${addProfileTarget.name}`
            : "New environment profile"
        }
        open={Boolean(addProfileTarget)}
        onCancel={closeAddProfileModal}
        onOk={submitNewProfile}
        confirmLoading={creatingProfile}
        okText="Create profile"
        destroyOnClose
      >
        <Typography.Paragraph type="secondary" className="!mb-3 text-sm">
          Open the profile from the list after creating it to add variables.
        </Typography.Paragraph>
        <Input
          placeholder="Profile name"
          value={newProfileName}
          onChange={(e) => setNewProfileName(e.target.value)}
          onPressEnter={submitNewProfile}
          autoFocus
        />
        <div className="mt-4">
          <Text className="mb-2 block text-sm font-medium">
            How should new nodes use this profile?
          </Text>
          <Radio.Group
            value={newProfileRole}
            onChange={(e) => setNewProfileRole(e.target.value)}
            className="flex flex-col gap-2"
          >
            <Radio value={ADD_AS_EXTRA}>
              Keep current default — add as an extra profile
            </Radio>
            <Radio value={ADD_AS_DEFAULT}>
              Make this the default for new nodes (replace previous default)
            </Radio>
          </Radio.Group>
        </div>
      </Modal>
    </div>
  );
};

export default EnvManagement;
