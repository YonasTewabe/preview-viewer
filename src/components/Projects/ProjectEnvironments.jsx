"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Button,
  Skeleton,
  Alert,
  Input,
  Space,
  Table,
  Popconfirm,
  message,
  Modal,
  Tabs,
  Typography,
} from "antd";
import {
  useParams,
  useNavigate,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftOutlined,
  EnvironmentOutlined,
  DeleteOutlined,
  EditOutlined,
  CloseOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { projectService } from "../../services/projectService";
import {
  invalidateAndRefetchActive,
  queryKeyPart,
} from "../../utils/invalidateQueries";
import { ENV_MANAGE_RETURN_STATE } from "../../utils/environmentsNavigation";
const KEY_PATTERN = /^[A-Z0-9_]+$/i;

const keyLc = (k) => String(k).trim().toLowerCase();

const stripOuterQuotes = (value) => {
  const s = String(value ?? "").trim();
  if (s.length >= 2) {
    const q = s[0];
    if ((q === '"' || q === "'") && s[s.length - 1] === q) {
      return s.slice(1, -1).replace(/\\n/g, "\n").replace(/\\"/g, '"');
    }
  }
  return s;
};

/** Dotenv-style lines: KEY=value, optional export, # comments */
const parseDotEnvText = (text) => {
  const entries = [];
  const lines = text.split(/\r?\n/);
  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    let rest = trimmed;
    const exportMatch = /^export\s+/i.exec(rest);
    if (exportMatch) rest = rest.slice(exportMatch[0].length).trim();

    const eq = rest.indexOf("=");
    if (eq === -1) continue;

    const key = rest.slice(0, eq).trim();
    const rawValue = rest.slice(eq + 1);
    const value = stripOuterQuotes(rawValue);
    if (key) entries.push({ key, value });
  }
  return entries;
};

const parseJsonEnvText = (text) => {
  const parsed = JSON.parse(text);
  if (Array.isArray(parsed)) {
    return parsed.map((item, i) => {
      if (!item || typeof item !== "object") {
        throw new Error(`Item ${i} must be an object with key and value`);
      }
      const k = item.key ?? item.name;
      if (k === undefined || k === null) {
        throw new Error(`Item ${i} is missing key (or name)`);
      }
      const v = item.value;
      return {
        key: String(k),
        value: v === null || v === undefined ? "" : String(v),
      };
    });
  }
  if (parsed && typeof parsed === "object") {
    return Object.entries(parsed).map(([key, value]) => ({
      key: String(key),
      value:
        value === null || value === undefined
          ? ""
          : typeof value === "object"
            ? JSON.stringify(value)
            : String(value),
    }));
  }
  throw new Error("JSON must be a plain object or an array of { key, value }");
};

const parsePastedEnvironments = (text) => {
  const trimmed = String(text ?? "")
    .replace(/^\uFEFF/, "")
    .trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return parseJsonEnvText(trimmed);
    } catch {
      /* fall through to .env parsing */
    }
  }
  return parseDotEnvText(text);
};

// Skeleton Component for ProjectEnvironments
const ProjectEnvironmentsSkeleton = () => {
  return (
    <div className="pb-8">
      <div className="mb-4 flex item-center gap-4">
        <Skeleton.Button
          active
          size="default"
          style={{ width: 60, height: 32 }}
        />
      </div>
      <Card>
        <Skeleton active paragraph={{ rows: 12 }} />
      </Card>
    </div>
  );
};

const ProjectEnvironments = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const profileParam = searchParams.get("profile");
  const queryClient = useQueryClient();

  const fromEnvManagement =
    location.state?.returnTo === ENV_MANAGE_RETURN_STATE.returnTo;
  const environmentsBackPath = fromEnvManagement
    ? ENV_MANAGE_RETURN_STATE.returnTo
    : `/projects/${projectId}`;
  const environmentsBackLabel = fromEnvManagement
    ? "Back to Env management"
    : "Back to project";

  const [rows, setRows] = useState([]);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [editingKey, setEditingKey] = useState(null);
  const [isSavingEnvironments, setIsSavingEnvironments] = useState(false);
  const [pastedBulk, setPastedBulk] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [deletingProfile, setDeletingProfile] = useState(false);

  const {
    data: profilesPayload,
    isLoading: loadingProfiles,
    error: profilesError,
  } = useQuery({
    queryKey: ["envProfiles", queryKeyPart(projectId)],
    queryFn: () => projectService.listEnvProfiles(projectId),
  });

  const profiles = useMemo(
    () => Array.isArray(profilesPayload?.env_profiles) ? profilesPayload.env_profiles : [],
    [profilesPayload?.env_profiles],
  );

  const activeProfileLabel = useMemo(() => {
    if (activeProfileId == null) return null;
    const p = profiles.find((x) => String(x.id) === String(activeProfileId));
    if (!p) return null;
    const name = String(p.name ?? "").trim() || "Unnamed";
    return p.is_default ? `${name} (default)` : name;
  }, [profiles, activeProfileId]);

  const activeProfileIsDefault = useMemo(() => {
    if (activeProfileId == null) return false;
    const p = profiles.find((x) => String(x.id) === String(activeProfileId));
    return Boolean(p?.is_default);
  }, [profiles, activeProfileId]);

  useEffect(() => {
    if (!profiles.length) {
      setActiveProfileId(null);
      return;
    }
    const fromUrl =
      profileParam != null && profileParam !== "" ? String(profileParam) : null;
    if (
      fromUrl != null &&
      profiles.some((p) => String(p.id) === fromUrl)
    ) {
      setActiveProfileId(fromUrl);
      return;
    }
    setActiveProfileId((prev) => {
      if (prev != null && profiles.some((p) => String(p.id) === String(prev))) {
        return prev;
      }
      const def = profiles.find((p) => p.is_default);
      return def?.id ?? profiles[0]?.id ?? null;
    });
  }, [profiles, profileParam]);

  const {
    data,
    isLoading: loadingVars,
    error: varsError,
  } = useQuery({
    queryKey: [
      "envVars",
      queryKeyPart(projectId),
      queryKeyPart(activeProfileId),
    ],
    queryFn: () => projectService.listEnvVars(projectId, activeProfileId),
    enabled: Boolean(projectId) && activeProfileId != null,
  });

  const isLoading = loadingProfiles || (activeProfileId != null && loadingVars);
  const error = profilesError || varsError;

  // Convert environments array to text format
  // Initialize environments state when data loads
  useEffect(() => {
    if (data && Array.isArray(data.env_vars)) {
      setRows(
        data.env_vars.map((e) => ({
          env_variable: e.key,
          env: e.value ?? "",
        })),
      );
      const valid = new Set(data.env_vars.map((e) => e.key));
      setSelectedRowKeys((prev) => prev.filter((k) => valid.has(k)));
    } else if (!data?.env_vars) {
      setSelectedRowKeys([]);
    }
  }, [data]);

  if (isLoading) {
    return <ProjectEnvironmentsSkeleton />;
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

  if (!loadingProfiles && profiles.length === 0) {
    return (
      <Alert
        type="warning"
        showIcon
        message="No environment profiles"
        description="Run database migrations or recreate the project. Each project needs at least one profile (e.g. Development)."
      />
    );
  }

  if (activeProfileId != null && !loadingVars && !data) {
    return (
      <Alert
        type="warning"
        message="Could not load variables for this profile"
        showIcon
      />
    );
  }

  const pidKey = queryKeyPart(projectId);
  const invalidateEnvRelatedQueries = () =>
    invalidateAndRefetchActive(
      queryClient,
      ...(pidKey != null ? [["envVars", pidKey]] : []),
      ...(pidKey != null ? [["envProfiles", pidKey]] : []),
      ...(pidKey != null ? [["projectEnvVars", pidKey]] : []),
      ...(pidKey != null ? [["projectDefaultEnvVars", pidKey]] : []),
      ...(pidKey != null ? [["project", pidKey]] : []),
      ["projects"],
    );

  const handleAddOrUpdate = () => {
    const key = newKey.trim();
    const value = String(newValue ?? "").trim();
    if (!key) return message.error("Key is required");
    if (!value) return message.error("Value is required");
    if (!KEY_PATTERN.test(key))
      return message.error(
        "Key can only contain letters, numbers, and underscore",
      );

    const normalizedNewKey = key;
    const normalizedOldKey = editingKey ? String(editingKey).trim() : null;
    const dupMsg =
      "An environment variable with this key already exists for this profile. Use edit to change its value.";

    if (!editingKey) {
      if (rows.some((r) => keyLc(r.env_variable) === keyLc(normalizedNewKey))) {
        return message.error(dupMsg);
      }
    } else if (
      keyLc(normalizedNewKey) !== keyLc(normalizedOldKey) &&
      rows.some(
        (r) =>
          keyLc(r.env_variable) === keyLc(normalizedNewKey) &&
          keyLc(r.env_variable) !== keyLc(normalizedOldKey),
      )
    ) {
      return message.error(dupMsg);
    }

    setIsSavingEnvironments(true);

    let action;
    if (!editingKey) {
      action = projectService.addEnvVar(
        projectId,
        normalizedNewKey,
        value,
        activeProfileId,
      );
    } else if (
      normalizedOldKey &&
      normalizedNewKey.toLowerCase() === normalizedOldKey.toLowerCase()
    ) {
      action = projectService.updateEnvVar(
        projectId,
        normalizedOldKey,
        value,
        activeProfileId,
      );
    } else {
      action = projectService
        .deleteEnvVar(projectId, normalizedOldKey, activeProfileId)
        .then(() =>
          projectService.addEnvVar(
            projectId,
            normalizedNewKey,
            value,
            activeProfileId,
          ),
        );
    }

    Promise.resolve(action)
      .then(() => invalidateEnvRelatedQueries())
      .then(() => {
        setNewKey("");
        setNewValue("");
        setEditingKey(null);
        message.success("Saved");
      })
      .catch((error) => {
        const msg =
          error?.response?.data?.error || "Failed to save environment variable";
        message.error(msg);
      })
      .finally(() => setIsSavingEnvironments(false));
  };

  const handleBulkImport = async () => {
    const entries = parsePastedEnvironments(pastedBulk);

    if (entries.length === 0) {
      message.warning("No key–value pairs found. Paste .env lines or JSON.");
      return;
    }

    const seen = new Map();
    for (const { key, value } of entries) {
      const k = String(key ?? "").trim();
      if (!k) continue;
      seen.set(keyLc(k), { key: k, value: String(value ?? "") });
    }
    const deduped = [...seen.values()];

    const invalidKeys = deduped
      .filter((e) => !KEY_PATTERN.test(e.key))
      .map((e) => e.key);
    if (invalidKeys.length) {
      message.error(
        `Invalid key names (letters, numbers, underscore only): ${invalidKeys.slice(0, 8).join(", ")}${invalidKeys.length > 8 ? "…" : ""}`,
      );
      return;
    }

    const existingByLc = new Map(
      rows.map((r) => [keyLc(r.env_variable), r.env_variable]),
    );

    let added = 0;
    let updated = 0;
    let skippedEmpty = 0;
    const rowErrors = [];

    setIsSavingEnvironments(true);
    try {
      for (const { key, value } of deduped) {
        const v = String(value ?? "").trim();
        if (!v) {
          skippedEmpty++;
          continue;
        }
        const lc = keyLc(key);
        const canonicalKey = existingByLc.get(lc);
        try {
          if (canonicalKey) {
            await projectService.updateEnvVar(
              projectId,
              canonicalKey,
              v,
              activeProfileId,
            );
            updated++;
          } else {
            await projectService.addEnvVar(projectId, key, v, activeProfileId);
            existingByLc.set(lc, key);
            added++;
          }
        } catch (error) {
          const errText =
            error?.response?.data?.error || error?.message || "Request failed";
          rowErrors.push(`${key}: ${errText}`);
        }
      }

      await invalidateEnvRelatedQueries();

      if (added || updated) {
        const okParts = [];
        if (added) okParts.push(`${added} added`);
        if (updated) okParts.push(`${updated} updated`);
        message.success(okParts.join(", "));
      }
      if (skippedEmpty) {
        message.warning(`${skippedEmpty} line(s) skipped (empty value)`);
      }
      if (rowErrors.length) {
        message.error(
          rowErrors.slice(0, 3).join(" · ") + (rowErrors.length > 3 ? "…" : ""),
        );
      } else if (!added && !updated && !skippedEmpty) {
        message.warning("Nothing was saved.");
      }

      setPastedBulk("");
      setNewKey("");
      setNewValue("");
      setEditingKey(null);
      setSelectedRowKeys([]);
    } finally {
      setIsSavingEnvironments(false);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedRowKeys.length === 0) return;
    Modal.confirm({
      title: `Delete ${selectedRowKeys.length} environment variable(s)?`,
      content: "This cannot be undone.",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          for (const key of selectedRowKeys) {
            await projectService.deleteEnvVar(projectId, key, activeProfileId);
          }
          setSelectedRowKeys([]);
          invalidateEnvRelatedQueries();
          message.success("Selected variables deleted");
        } catch (e) {
          message.error(
            e?.response?.data?.error ||
              e?.message ||
              "Failed to delete variables",
          );
          throw e;
        }
      },
    });
  };

  const startEditRow = (record) => {
    setEditingKey(record.env_variable);
    setNewKey(record.env_variable);
    setNewValue(record.env ?? "");
  };

  const cancelRowEdit = () => {
    setEditingKey(null);
    setNewKey("");
    setNewValue("");
  };

  const handleDeleteRow = (key) => {
    setIsSavingEnvironments(true);
    projectService
      .deleteEnvVar(projectId, key, activeProfileId)
      .then(() => {
        setSelectedRowKeys((prev) => prev.filter((k) => k !== key));
        return invalidateEnvRelatedQueries();
      })
      .then(() => message.success("Deleted"))
      .catch((error) => {
        const msg =
          error?.response?.data?.error ||
          "Failed to delete environment variable";
        message.error(msg);
      })
      .finally(() => setIsSavingEnvironments(false));
  };

  const handleDeleteProfile = async () => {
    if (!activeProfileId || profiles.length <= 1 || activeProfileIsDefault)
      return;
    const remaining = profiles.filter(
      (p) => String(p.id) !== String(activeProfileId),
    );
    const nextProfile =
      remaining.find((p) => p.is_default) ?? remaining[0] ?? null;

    setDeletingProfile(true);
    try {
      await projectService.deleteEnvProfile(projectId, activeProfileId);
      await invalidateEnvRelatedQueries();
      message.success("Environment profile deleted");
      if (nextProfile != null) {
        navigate(
          `/projects/${projectId}/environments?profile=${encodeURIComponent(nextProfile.id)}`,
          { replace: true, state: location.state },
        );
      } else {
        navigate(`/projects/${projectId}/environments`, {
          replace: true,
          state: location.state,
        });
      }
    } catch (e) {
      message.error(
        e?.response?.data?.error || e?.message || "Failed to delete profile",
      );
    } finally {
      setDeletingProfile(false);
    }
  };

  const handleSetDefaultProfile = async () => {
    if (!activeProfileId) return;
    try {
      await projectService.patchEnvProfile(projectId, activeProfileId, {
        is_default: true,
      });
      await invalidateEnvRelatedQueries();
      message.success("Default profile updated");
    } catch (e) {
      message.error(
        e?.response?.data?.error || e?.message || "Failed to update default",
      );
    }
  };

  const columns = [
    {
      title: "Key",
      dataIndex: "env_variable",
      key: "env_variable",
      width: "28%",
      ellipsis: true,
      render: (v) => <span style={{ fontFamily: "monospace" }}>{v}</span>,
    },
    {
      title: "Value",
      dataIndex: "env",
      key: "env",
      ellipsis: false,
      render: (v) => (
        <span
          style={{
            display: "block",
            fontFamily: "monospace",
            fontSize: 12,
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
            wordBreak: "break-word",
          }}
        >
          {String(v ?? "")}
        </span>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => startEditRow(record)}
          />
          <Popconfirm
            title="Delete this env var?"
            okText="Delete"
            okType="danger"
            cancelText="Cancel"
            onConfirm={() => handleDeleteRow(record.env_variable)}
          >
            <Button danger type="text" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="pb-8">
      <div className="mb-4 flex items-center gap-4">
        <Button
          className="!font-semibold !text-lg"
          style={{ color: "var(--app-text)" }}
          type="link"
          onClick={() => navigate(environmentsBackPath)}
          icon={<ArrowLeftOutlined />}
        >
          {environmentsBackLabel}
        </Button>
      </div>

      <Card
        className="!pt-3"
        title={
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <EnvironmentOutlined className="text-blue-600" />
              <span
                className="text-base font-semibold"
                style={{ color: "var(--app-text)" }}
              >
                {activeProfileLabel ?? "—"}
              </span>
            </div>
            <Typography.Text type="secondary" className="text-sm">
              Add profiles from Env management. Switch profile from there or the
              sidebar. Nodes use default profile; overrides still apply per
              node.
            </Typography.Text>
          </div>
        }
        extra={
          <Space wrap>
            <Popconfirm
              title="Delete this environment profile?"
              description="All variables in this profile are removed. Nodes that used it are moved to the project default profile. This cannot be undone."
              okText="Delete profile"
              okType="danger"
              cancelText="Cancel"
              disabled={
                !activeProfileId ||
                profiles.length <= 1 ||
                activeProfileIsDefault
              }
              onConfirm={() => void handleDeleteProfile()}
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                loading={deletingProfile}
                disabled={
                  !activeProfileId ||
                  profiles.length <= 1 ||
                  activeProfileIsDefault ||
                  deletingProfile
                }
              >
                Delete profile
              </Button>
            </Popconfirm>
            <Button
              icon={<StarOutlined />}
              disabled={
                !activeProfileId ||
                profiles.find((p) => String(p.id) === String(activeProfileId))
                  ?.is_default
              }
              onClick={handleSetDefaultProfile}
            >
              Make default
            </Button>
          </Space>
        }
      >
        <Tabs
          defaultActiveKey="one"
          items={[
            {
              key: "one",
              label: "Manual entry",
              children: (
                <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-[1fr_2fr_auto]">
                  <Input
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="key"
                    autoComplete="off"
                  />
                  <Input.TextArea
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="value"
                    rows={1}
                    autoSize={{ minRows: 1, maxRows: 4 }}
                  />
                    <Space wrap>
                    {editingKey ? (
                      <>
                        <Button
                          onClick={cancelRowEdit}
                          icon={<CloseOutlined />}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="primary"
                          loading={isSavingEnvironments}
                          onClick={handleAddOrUpdate}
                        >
                          Update
                        </Button>
                        <Button
                          danger
                          icon={<DeleteOutlined />}
                          disabled={
                            !rows.length || selectedRowKeys.length === 0
                          }
                          onClick={handleDeleteSelected}
                        >
                          Delete selected
                          {selectedRowKeys.length > 0
                            ? ` (${selectedRowKeys.length})`
                            : ""}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          type="primary"
                          loading={isSavingEnvironments}
                          onClick={handleAddOrUpdate}
                        >
                          Add
                        </Button>
                        <Button
                          danger
                          icon={<DeleteOutlined />}
                          disabled={
                            !rows.length || selectedRowKeys.length === 0
                          }
                          onClick={handleDeleteSelected}
                        >
                          Delete selected
                          {selectedRowKeys.length > 0
                            ? ` (${selectedRowKeys.length})`
                            : ""}
                        </Button>
                      </>
                    )}
                  </Space>
                </div>
              ),
            },
            {
              key: "bulk",
              label: "Bulk import",
              children: (
                <div>
                  <Typography.Paragraph
                    type="secondary"
                    style={{ marginBottom: 8 }}
                  >
                    Use <Typography.Text code>.env</Typography.Text> lines (
                    <Typography.Text code>KEY=value</Typography.Text>, optional{" "}
                    <Typography.Text code>export</Typography.Text>) or a JSON
                    object like{" "}
                    <Typography.Text code>
                      {'{ "KEY": "value" }'}
                    </Typography.Text>
                    . You can also paste a JSON array of{" "}
                    <Typography.Text code>
                      {'{ "key": "…", "value": "…" }'}
                    </Typography.Text>{" "}
                    objects. Duplicate keys keep the last entry; variables that
                    already exist are updated. Rows with empty values are
                    skipped (same as manual entry).
                  </Typography.Paragraph>
                  <Input.TextArea
                    value={pastedBulk}
                    onChange={(e) => setPastedBulk(e.target.value)}
                    placeholder={
                      'DATABASE_URL=postgres://localhost/mydb\nAPI_KEY=secret\n\n# or\n{\n  "DATABASE_URL": "postgres://localhost/mydb",\n  "API_KEY": "secret"\n}'
                    }
                    rows={12}
                    style={{ fontFamily: "monospace", fontSize: 12 }}
                  />
                  <div className="mt-3">
                    <Space wrap>
                      <Button
                        type="primary"
                        loading={isSavingEnvironments}
                        onClick={handleBulkImport}
                      >
                        Parse and save all
                      </Button>
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        disabled={!rows.length || selectedRowKeys.length === 0}
                        onClick={handleDeleteSelected}
                      >
                        Delete selected
                        {selectedRowKeys.length > 0
                          ? ` (${selectedRowKeys.length})`
                          : ""}
                      </Button>
                    </Space>
                  </div>
                </div>
              ),
            },
          ]}
        />

        <div style={{ marginTop: 24, minWidth: 0 }}>
          <Table
            rowKey="env_variable"
            size="small"
            tableLayout="fixed"
            columns={columns}
            dataSource={rows}
            pagination={false}
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
            locale={{
              emptyText: (
                <div
                  style={{
                    color: "#999",
                    textAlign: "center",
                    padding: "40px",
                  }}
                >
                  <EnvironmentOutlined
                    style={{ fontSize: "48px", marginBottom: "16px" }}
                  />
                  <p>No environments configured.</p>
                  <p>Add variables in the tabs above.</p>
                </div>
              ),
            }}
            scroll={{ x: 760 }}
          />
        </div>
      </Card>
    </div>
  );
};

export default ProjectEnvironments;
