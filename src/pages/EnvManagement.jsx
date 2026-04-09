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
  Row,
  Col,
} from "antd";
import {
  LinkOutlined,
  PlusOutlined,
  StarOutlined,
  CloudOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import StatsCard from "../components/Dashboard/StatsCard";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  invalidateAndRefetchActive,
  queryKeyPart,
} from "../utils/invalidateQueries";
import { projectService } from "../services/projectService";
import { ENV_MANAGE_RETURN_STATE } from "../utils/environmentsNavigation";

const { Search } = Input;
const { Text } = Typography;

/** @param {{ env_profiles?: Array<{ id: number; name?: string; is_default?: boolean }> }} record */
function profilesFor(record) {
  return Array.isArray(record.env_profiles) ? record.env_profiles : [];
}

const ADD_AS_EXTRA = "extra";
const ADD_AS_DEFAULT = "default";

const EnvManagementSkeleton = () => (
  <div className="space-y-6 text-black dark:text-white">
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <Skeleton active title={{ width: 280 }} paragraph={{ rows: 1 }} />
      <Skeleton.Button active size="large" style={{ width: 160 }} />
    </div>
    <Row gutter={[24, 24]}>
      <Col xs={24} sm={12} lg={6}>
        <Skeleton active paragraph={{ rows: 2 }} />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Skeleton active paragraph={{ rows: 2 }} />
      </Col>
    </Row>
    <Card className="border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
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
  const { data: stats = {} } = useQuery({
    queryKey: ["stats"],
    queryFn: () => projectService.getStats(),
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

  const totalProducts = Number(stats.totalProjects) || projects.length;
  const totalProfiles =
    Number(stats.totalEnvProfiles) ||
    projects.reduce((n, p) => n + profilesFor(p).length, 0);

  if (isLoading) {
    return <EnvManagementSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6 text-black dark:text-white">
        <div className="mb-6">
          <h2 className="mb-0 text-3xl font-bold text-blue-900 dark:text-blue-400">
            Env management
          </h2>
          <p className="font-bold text-gray-700 dark:text-gray-300">
            Environment profiles and defaults for each product
          </p>
        </div>
        <Alert
          type="error"
          message="Failed to load environments"
          description={error?.message || String(error)}
          showIcon
          className="border-red-200 dark:border-red-800"
        />
      </div>
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
        ["stats"],
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
        ["stats"],
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
      width: 350,
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
    <div className="space-y-6 text-black dark:text-white">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="mb-0 text-3xl font-bold text-blue-900 dark:text-blue-400">
            Env management
          </h2>
          <p className="font-bold text-gray-700 dark:text-gray-300">
            Environment profiles and defaults for each product
          </p>
          <p className="mt-2 max-w-3xl text-sm text-gray-600 dark:text-gray-400">
            Each row is a product. Profiles shown as tags —{" "}
            <span className="font-medium">(default)</span> is used for new nodes
            unless another is chosen on the node screen. Click a profile to edit
            variables; use <span className="font-medium">Set default</span> in
            Actions to change the default profile.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="large" onClick={() => navigate("/projects")}>
            Go to Projects
          </Button>
        </div>
      </div>

      <Row gutter={[24, 24]} className="mb-2">
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Products"
            value={totalProducts}
            icon={<AppstoreOutlined />}
            color="blue"
            loading={false}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Environment profiles"
            value={totalProfiles}
            icon={<CloudOutlined />}
            color="blue"
            loading={false}
          />
        </Col>
      </Row>

      <Card className="mb-4 border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex w-full flex-1 gap-2 sm:w-auto">
            <Search
              allowClear
              size="large"
              className="flex-1 max-w-xl"
              placeholder="Search by product or profile name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onSearch={setSearch}
            />
          </div>
        </div>

        <Table
          className="mt-4"
          rowKey="id"
          size="middle"
          columns={columns}
          dataSource={sorted}
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            showTotal: (n) => `${n} product(s)`,
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
