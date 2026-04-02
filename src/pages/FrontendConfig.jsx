"use client";
import { useState, useMemo } from "react";
import {
  Card,
  Typography,
  Layout,
  Space,
  Row,
  Col,
  Table,
  Button,
  Input,
  Form,
  message,
  Popconfirm,
  Tag,
  Collapse,
  Select,
  Checkbox,
  Skeleton,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  RocketOutlined,
  ReloadOutlined,
  RightOutlined,
  CopyOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import DeployProgressModal from "../components/DeployProgressModal";
import BuildProgressModal from "../components/BuildProgressModal";
import {
  useDeleteFrontendNode,
  useFrontendNode,
  useUpdateFrontendNode,
} from "../services/useFrontendNodes";
import { useAuth } from "../contexts/AuthContext";
import { useJenkins } from "../hooks/useJenkins";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "../contexts/ThemeContext";
import {
  jenkinsJobFolderUrl,
  JENKINS_JOB_FRONTEND_PREVIEW,
} from "../config/jenkins";

const { Title, Text } = Typography;
const { Content } = Layout;
const { Panel } = Collapse;

const buildUrlConfigsFromEnvVars = (envVars) => {
  const list = Array.isArray(envVars) ? envVars : [];
  return (
    list
      .filter((e) => typeof e?.key === "string")
      .map((e) => ({ key: e.key, value: String(e.value ?? "") }))
      // include either *_URL keys OR values that look like URLs
      .filter(
        (e) =>
          e.key.toUpperCase().endsWith("_URL") ||
          e.value.trim().startsWith("http://") ||
          e.value.trim().startsWith("https://"),
      )
      .map((e) => {
        let url = e.value.trim();
        // remove trailing slashes
        url = url.replace(/\/+$/, "");
        // preserve old behavior: append /api/v1 when it's an http(s) URL and not already ending with /api/v1
        if (
          (url.startsWith("http://") || url.startsWith("https://")) &&
          !url.endsWith("/api/v1")
        ) {
          url += "/api/v1";
        }
        return {
          name: e.key,
          url,
          description: `From env ${e.key}`,
          serviceType: "api",
          defaultUrl: null,
        };
      })
  );
};

const envVarsArrayToRecord = (envVars) => {
  const list = Array.isArray(envVars) ? envVars : [];
  const rec = {};
  for (const e of list) {
    if (typeof e?.key === "string") rec[e.key] = String(e.value ?? "");
  }
  return rec;
};

/** Plain `{ key, value }[]` for Jenkins (no wrapper object). */
const buildJenkinsUrlConfigPairs = (envVars) => {
  const list = Array.isArray(envVars) ? envVars : [];
  return list
    .filter((e) => typeof e?.key === "string")
    .map((e) => {
      const key = e.key;
      let value = String(e.value ?? "").trim();
      const isHttp =
        value.startsWith("http://") || value.startsWith("https://");
      if (isHttp) {
        value = value.replace(/\/+$/, "");
        if (!value.endsWith("/api/v1")) value += "/api/v1";
      }
      return { key, value };
    });
};

/** Jenkins `URL_CONFIGS` param: JSON array only, e.g. `[{"key":"A","value":"1"},…]`. */
const buildJenkinsUrlConfigsPayload = (envVars) =>
  JSON.stringify(buildJenkinsUrlConfigPairs(envVars));

// Skeleton Component for FrontendConfig
const FrontendConfigSkeleton = () => {
  return (
    <>
      <div style={{ marginBottom: "16px" }}>
        <Skeleton.Button
          active
          size="default"
          style={{ width: 60, height: 32 }}
        />
      </div>
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "22px",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Skeleton.Input
            active
            size="large"
            style={{ width: 250, height: 32 }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Skeleton.Button
              active
              size="default"
              style={{ width: 100, height: 32 }}
            />
            <Skeleton.Button
              active
              size="default"
              style={{ width: 150, height: 32 }}
            />
            <Skeleton.Button
              active
              size="default"
              style={{ width: 120, height: 32 }}
            />
          </div>
        </div>
      </div>

      <Content
        style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}
      >
        {/* Node Information Skeleton */}
        <Card
          title={
            <Skeleton.Input
              active
              size="default"
              style={{ width: 150, height: 24 }}
            />
          }
          bordered={false}
          style={{
            marginBottom: "24px",
            borderRadius: 8,
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
          }}
        >
          <Row gutter={[24, 16]}>
            {/* Left Column Skeleton */}
            <Col span={12}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div>
                  <Skeleton.Input
                    active
                    size="small"
                    style={{ width: 100, height: 16, marginBottom: "8px" }}
                  />
                  <Skeleton.Input
                    active
                    size="default"
                    style={{ width: 150, height: 20 }}
                  />
                </div>
                <div>
                  <Skeleton.Input
                    active
                    size="small"
                    style={{ width: 100, height: 16, marginBottom: "8px" }}
                  />
                  <Skeleton.Button
                    active
                    size="small"
                    style={{ width: 80, height: 24 }}
                  />
                </div>
                <div>
                  <Skeleton.Input
                    active
                    size="small"
                    style={{ width: 100, height: 16, marginBottom: "8px" }}
                  />
                  <Skeleton.Button
                    active
                    size="small"
                    style={{ width: 100, height: 24 }}
                  />
                </div>
                <div>
                  <Skeleton.Input
                    active
                    size="small"
                    style={{ width: 100, height: 16, marginBottom: "8px" }}
                  />
                  <Skeleton.Button
                    active
                    size="small"
                    style={{ width: 90, height: 24 }}
                  />
                </div>
              </div>
            </Col>

            {/* Right Column Skeleton */}
            <Col span={12}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {[1, 2, 3, 4, 5].map((item) => (
                  <div key={item}>
                    <Skeleton.Input
                      active
                      size="small"
                      style={{ width: 120, height: 16, marginBottom: "4px" }}
                    />
                    <Skeleton.Input
                      active
                      size="default"
                      style={{ width: "100%", height: 32 }}
                    />
                  </div>
                ))}
              </div>
            </Col>
          </Row>
        </Card>

        {/* Build history skeleton */}
        <Card
          title={
            <Skeleton.Input
              active
              size="default"
              style={{ width: 200, height: 24 }}
            />
          }
          bordered={false}
          style={{
            flex: 1,
            borderRadius: 12,
            backgroundColor: "#ffffff",
            boxShadow:
              "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            border: "1px solid #e2e8f0",
          }}
        >
          <Skeleton active paragraph={{ rows: 4 }} />
        </Card>
      </Content>
    </>
  );
};

export default function FrontendConfig() {
  const { id } = useParams();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { isDark } = useTheme();
  const [isDeployModalVisible, setIsDeployModalVisible] = useState(false);
  const [deployProgress, setDeployProgress] = useState({
    stage: "",
    message: "",
    buildNumber: null,
  });
  const [deploymentDetails, setDeploymentDetails] = useState({
    previewLink: null,
    portNumber: null,
  });
  const [selectedUrlConfigIds, setSelectedUrlConfigIds] = useState([]);
  const navigate = useNavigate();
  const {
    data: frontendNode,
    isLoading: isLoadingFrontendNodes,
    refetch: refetchFrontendNode,
  } = useFrontendNode(id);
  const deleteBranch = useDeleteFrontendNode();
  const updateFrontendNode = useUpdateFrontendNode();

  // Add Jenkins hook for rebuild functionality
  const {
    isBuildModalVisible,
    buildProgress,
    triggerJenkinsFrontBuild,
    handleBuildModalCancel,
  } = useJenkins();

  const selectedNode = frontendNode?.data;

  const invalidateNodeDetailQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["frontendNode", id] });
    queryClient.invalidateQueries({ queryKey: ["nodeBuildHistory", id] });
    refetchFrontendNode();
  };

  const { data: projectEnvVarsResp } = useQuery({
    queryKey: ["projectEnvVars", selectedNode?.project_id],
    enabled: !!selectedNode?.project_id,
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}projects/${selectedNode?.project_id}/env-vars`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    },
  });

  const { data: nodeEnvVarsResp } = useQuery({
    queryKey: ["nodeEnvVars", selectedNode?.id],
    enabled: !!selectedNode?.id,
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}frontendnodes/${selectedNode?.id}/env-vars`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    },
  });

  const { data: buildHistoryResp } = useQuery({
    queryKey: ["nodeBuildHistory", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}frontendnodes/${id}/build-history`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    staleTime: 30_000,
  });

  const projectEnvVars = Array.isArray(projectEnvVarsResp?.env_vars)
    ? projectEnvVarsResp.env_vars
    : [];
  const nodeEnvVars = Array.isArray(nodeEnvVarsResp?.env_vars)
    ? nodeEnvVarsResp.env_vars
    : [];

  const buildHistoryRows = useMemo(() => {
    const fromApi = Array.isArray(buildHistoryResp?.builds)
      ? buildHistoryResp.builds
      : [];
    if (fromApi.length > 0) return fromApi;
    const n = selectedNode?.build_number;
    const t = selectedNode?.updated_at ?? selectedNode?.updatedAt;
    if (n != null && t) {
      return [
        {
          id: `node-${n}-${t}`,
          build_number: n,
          built_at: t,
        },
      ];
    }
    return [];
  }, [
    buildHistoryResp,
    selectedNode?.build_number,
    selectedNode?.updated_at,
    selectedNode?.updatedAt,
  ]);

  const [overrideKey, setOverrideKey] = useState("");
  const [overrideValue, setOverrideValue] = useState("");
  const [editingOverrideKey, setEditingOverrideKey] = useState(null);
  const [savingOverride, setSavingOverride] = useState(false);

  const overrideKeySelectOptions = useMemo(() => {
    const proj = Array.isArray(projectEnvVarsResp?.env_vars)
      ? projectEnvVarsResp.env_vars
      : [];
    const node = Array.isArray(nodeEnvVarsResp?.env_vars)
      ? nodeEnvVarsResp.env_vars
      : [];
    const projectKeys = proj.map((e) => e.key).filter(Boolean);
    const overridden = new Set(node.map((e) => e.key));
    if (editingOverrideKey) {
      const set = new Set(projectKeys);
      if (editingOverrideKey) set.add(editingOverrideKey);
      return Array.from(set).map((k) => ({ value: k, label: k }));
    }
    return projectKeys
      .filter((k) => !overridden.has(k))
      .map((k) => ({ value: k, label: k }));
  }, [projectEnvVarsResp, nodeEnvVarsResp, editingOverrideKey]);

  const saveNodeOverride = async () => {
    const k = overrideKey.trim();
    const v = String(overrideValue ?? "").trim();
    if (!k) return message.error("Key is required");
    if (!v) return message.error("Value is required");
    const allowed = new Set(overrideKeySelectOptions.map((o) => o.value));
    if (!allowed.has(k)) return message.error("Choose a valid project env key");
    setSavingOverride(true);
    try {
      if (
        editingOverrideKey &&
        editingOverrideKey.toLowerCase() !== k.toLowerCase()
      ) {
        // rename: delete old then add new
        await fetch(
          `${import.meta.env.VITE_BACKEND_URL}frontendnodes/${selectedNode?.id}/env-vars/${encodeURIComponent(editingOverrideKey)}`,
          { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
        );
        await fetch(
          `${import.meta.env.VITE_BACKEND_URL}frontendnodes/${selectedNode?.id}/env-vars`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ key: k, value: v }),
          },
        );
      } else if (editingOverrideKey) {
        await fetch(
          `${import.meta.env.VITE_BACKEND_URL}frontendnodes/${selectedNode?.id}/env-vars/${encodeURIComponent(editingOverrideKey)}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ value: v }),
          },
        );
      } else {
        await fetch(
          `${import.meta.env.VITE_BACKEND_URL}frontendnodes/${selectedNode?.id}/env-vars`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ key: k, value: v }),
          },
        );
      }
      await queryClient.invalidateQueries({
        queryKey: ["nodeEnvVars", selectedNode?.id],
      });
      setOverrideKey("");
      setOverrideValue("");
      setEditingOverrideKey(null);
      message.success("Saved");
    } catch {
      message.error("Failed to save override");
    } finally {
      setSavingOverride(false);
    }
  };

  const startEditOverride = (row) => {
    setEditingOverrideKey(row.key);
    setOverrideKey(row.key);
    setOverrideValue(row.value ?? "");
  };

  const deleteOverride = async (key) => {
    setSavingOverride(true);
    try {
      await fetch(
        `${import.meta.env.VITE_BACKEND_URL}frontendnodes/${selectedNode?.id}/env-vars/${encodeURIComponent(key)}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
      );
      await queryClient.invalidateQueries({
        queryKey: ["nodeEnvVars", selectedNode?.id],
      });
      message.success("Deleted");
    } catch {
      message.error("Failed to delete override");
    } finally {
      setSavingOverride(false);
    }
  };

  const handleDeleteNode = async () => {
    try {
      // Find the branch to get its domain name
      const node = selectedNode;
      console.log(node, "node");

      if (!node || !node.domain_name) {
        message.error("Branch or domain name not found");
        return;
      }

      console.log(
        "Deleting branch:",
        node.name,
        "with domain:",
        node.domain_name,
      );

      // First, delete the branch from the database
      message.success(`Branch "${node.name}" deleted from database`);

      // Then, call Jenkins to delete the domain
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}jenkins/delete-preview-job`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              DOMAIN_NAME: node.domain_name,
            }),
          },
        );

        const result = await response.json();

        if (result.success) {
          message.success(
            `Domain "${node.domain_name}" deleted successfully from Jenkins`,
          );

          // After successful Jenkins deletion, call handleDeleteService
          await deleteBranch.mutateAsync(node.id);
        } else {
          message.warning(
            `Branch deleted from database but failed to delete domain: ${result.message}`,
          );
          // Even if Jenkins deletion fails, we still want to delete the service
          await deleteBranch.mutateAsync(node.id);
        }
      } catch (jenkinsError) {
        console.error("Jenkins deletion error:", jenkinsError);
        message.warning(
          `Branch deleted from database but failed to delete domain. Proceeding with service deletion.`,
        );
        // Continue with service deletion even if Jenkins fails
      }
    } catch (error) {
      console.error("Error deleting branch:", error);
      message.error("Failed to delete branch");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    message.success("URL copied to clipboard");
  };

  const handleDeploy = async () => {
    try {
      setIsDeployModalVisible(true);
      setDeployProgress({
        stage: "deploying",
        message: "Deploying frontend configuration...",
        buildNumber: null,
      });
      setDeploymentDetails({
        previewLink: null,
        portNumber: null,
      });

      // Fetch envs fresh (avoid empty arrays from not-yet-loaded queries)
      const [projRes, nodeRes] = await Promise.all([
        fetch(
          `${import.meta.env.VITE_BACKEND_URL}projects/${selectedNode?.project_id}/env-vars`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        ),
        fetch(
          `${import.meta.env.VITE_BACKEND_URL}frontendnodes/${selectedNode?.id}/env-vars`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        ),
      ]);

      const projJson = projRes.ok ? await projRes.json() : { env_vars: [] };
      const nodeJson = nodeRes.ok ? await nodeRes.json() : { env_vars: [] };

      const projectVars = Array.isArray(projJson?.env_vars)
        ? projJson.env_vars
        : [];
      const overrideVars = Array.isArray(nodeJson?.env_vars)
        ? nodeJson.env_vars
        : [];

      // Merge project env vars + node overrides (node overrides win)
      const mergedMap = new Map();
      projectVars.forEach((e) => mergedMap.set(e.key, e.value ?? ""));
      overrideVars.forEach((e) => mergedMap.set(e.key, e.value ?? ""));
      const envVars = Array.from(mergedMap.entries()).map(([key, value]) => ({
        key,
        value,
      }));
      const envUrlConfigs = buildUrlConfigsFromEnvVars(envVars);
      const envRecord = envVarsArrayToRecord(envVars);
      const jenkinsUrlConfigsParam = buildJenkinsUrlConfigsPayload(envVars);

      // Use node data for deployment parameters with random port
      let branchNumber = selectedNode?.branch_name.match(/\d+/)?.[0];
      if (!branchNumber) {
        branchNumber = Math.floor(1000 + Math.random() * 9000); // random 4-digit number
      }
      const domainName = `${selectedNode?.project?.short_code}-${branchNumber}-fe`;

      const deployParams = {
        ENV_NAME: selectedNode?.project?.env_name || selectedNode?.env_name,
        REPO_URL: selectedNode?.repo_url,
        BRANCH_NAME: selectedNode?.branch_name,
        PORT:
          selectedNode?.port_number ||
          Math.floor(Math.random() * (4000 - 3000 + 1)) + 3000, // Random port between 3000-4000
        DOMAIN_NAME: domainName,
        URL_CONFIGS: jenkinsUrlConfigsParam,
        ENV_VARS: JSON.stringify(envRecord),
        frontnode_id: selectedNode?.id, // Add frontend node ID for URL configs
        domain_name: domainName,
      };

      console.log("Deploying with params:", { deployParams });

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}jenkins/trigger-frontend-job`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(deployParams),
        },
      );

      const result = await response.json();
      console.log(result, "ressdfdfult");

      if (result.success) {
        setDeployProgress({
          stage: "completed",
          message: "Preview deployment completed successfully! 🎉",
          buildNumber: result.buildNumber,
        });

        // Store URL configurations in the database
        try {
          const response = await fetch(
            `${import.meta.env.VITE_BACKEND_URL}urlconfigs/create-from-deployment`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                urlConfigs: envUrlConfigs,
                frontnodeId: selectedNode?.id,
              }),
            },
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.warn("Failed to save URL configs to database:", errorText);
            message.warning(
              "Deployment succeeded but failed to save URL configurations",
            );
          } else {
            console.log("✅ URL configurations saved to database successfully");
            message.success("URL configurations saved successfully");
            // Refresh the frontend node data to get updated URL configs
            invalidateNodeDetailQueries();
          }
        } catch (error) {
          console.error("Error saving URL configs to database:", error);
          message.warning(
            "Deployment succeeded but failed to save URL configurations",
          );
        }

        // Update selectedNode with deployment results and urlConfigs
        if (selectedNode && result.artifactData) {
          // Update deployment details for modal display
          setDeploymentDetails({
            previewLink: result.artifactData.url,
            portNumber: result.artifactData.port,
          });

          // Update the node in the main storage
          try {
            const nodeForStorage = {
              ...selectedNode,
              service_name: selectedNode?.service_name,
              repository_name: selectedNode?.repository_name,
              branch_name: selectedNode?.branch_name,
              jenkins_job: selectedNode?.jenkins_job,
              build_status: result.buildStatus,
              build_url: selectedNode?.build_url,
              port: result.artifactData.port || deployParams.PORT,
              repo_url: selectedNode?.repo_url,
              build_number: result.buildNumber,
              preview_link: result.artifactData.url,
              env_name: selectedNode?.env_name,
              domain_name: deployParams.DOMAIN_NAME,
              project_id: selectedNode?.project_id,
            };
            updateFrontendNode.mutateAsync({
              id: selectedNode.id,
              data: nodeForStorage,
            });
          } catch (error) {
            console.error("Error updating node in storage:", error);
          }
        }

        message.success("Preview deployed successfully!");
        invalidateNodeDetailQueries();
      } else {
        setDeployProgress({
          stage: "failed",
          message: `Deployment failed: ${result.message}`,
          buildNumber: result.buildNumber,
        });

        message.error(`Deployment failed: ${result.message}`);
      }
    } catch (error) {
      console.error("Deployment error:", error);
      setDeployProgress({
        stage: "error",
        message: error.message || "Deployment failed. Please try again.",
        buildNumber: null,
      });

      message.error("Deployment failed. Please try again.");
    }
  };

  // Handle URL config selection
  const handleUrlConfigSelect = (configId, checked) => {
    if (checked) {
      setSelectedUrlConfigIds([...selectedUrlConfigIds, configId]);
    } else {
      setSelectedUrlConfigIds(
        selectedUrlConfigIds.filter((id) => id !== configId),
      );
    }
  };

  // Handle select all URL configs
  const handleSelectAllUrlConfigs = (checked) => {
    if (checked) {
      const allIds =
        selectedNode?.urlConfigs?.map((config, index) => config.id || index) ||
        [];
      setSelectedUrlConfigIds(allIds);
    } else {
      setSelectedUrlConfigIds([]);
    }
  };

  // Handle delete selected URL configs
  const handleDeleteSelectedUrlConfigs = async () => {
    if (selectedUrlConfigIds.length === 0) {
      message.warning("No URL configs selected");
      return;
    }

    try {
      // Delete each selected URL config
      const deletePromises = selectedUrlConfigIds.map(async (configId) => {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_BACKEND_URL}urlconfigs/${configId}`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (!response.ok) {
            throw new Error(`Failed to delete URL config ${configId}`);
          }
          return configId;
        } catch (error) {
          console.error(`Error deleting URL config ${configId}:`, error);
          throw error;
        }
      });

      await Promise.all(deletePromises);
      message.success(
        `Successfully deleted ${selectedUrlConfigIds.length} URL config(s)`,
      );
      setSelectedUrlConfigIds([]);

      // Refresh the frontend node data to get updated URL configs
      invalidateNodeDetailQueries();
    } catch (error) {
      console.error("Error deleting URL configs:", error);
      message.error("Failed to delete some URL configs. Please try again.");
    }
  };

  // Handle delete all URL configs
  const handleDeleteAllUrlConfigs = async () => {
    if (!selectedNode?.urlConfigs || selectedNode.urlConfigs.length === 0) {
      message.warning("No URL configs to delete");
      return;
    }

    try {
      const allIds = selectedNode.urlConfigs.map(
        (config, index) => config.id || index,
      );
      const deletePromises = allIds.map(async (configId) => {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_BACKEND_URL}urlconfigs/${configId}`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (!response.ok) {
            throw new Error(`Failed to delete URL config ${configId}`);
          }
          return configId;
        } catch (error) {
          console.error(`Error deleting URL config ${configId}:`, error);
          throw error;
        }
      });

      await Promise.all(deletePromises);
      message.success(`Successfully deleted all URL configs`);
      setSelectedUrlConfigIds([]);

      // Refresh the frontend node data to get updated URL configs
      invalidateNodeDetailQueries();
    } catch (error) {
      console.error("Error deleting all URL configs:", error);
      message.error("Failed to delete all URL configs. Please try again.");
    }
  };

  // Check if all URL configs are selected
  const isAllUrlConfigsSelected =
    selectedNode?.urlConfigs?.length > 0 &&
    selectedUrlConfigIds.length === selectedNode.urlConfigs.length;

  // Check if some URL configs are selected
  const hasSelectedUrlConfigs = selectedUrlConfigIds.length > 0;

  const handleRebuild = async () => {
    try {
      if (!selectedNode) {
        message.error("No frontend node selected for rebuild");
        return;
      }

      // Update node status to pending
      await updateFrontendNode.mutateAsync({
        id: selectedNode.id,
        data: {
          build_status: "pending",
        },
      });

      // Fetch envs fresh (avoid empty arrays from not-yet-loaded queries)
      const [projRes, nodeRes] = await Promise.all([
        fetch(
          `${import.meta.env.VITE_BACKEND_URL}projects/${selectedNode?.project_id}/env-vars`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        ),
        fetch(
          `${import.meta.env.VITE_BACKEND_URL}frontendnodes/${selectedNode?.id}/env-vars`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        ),
      ]);

      const projJson = projRes.ok ? await projRes.json() : { env_vars: [] };
      const nodeJson = nodeRes.ok ? await nodeRes.json() : { env_vars: [] };

      const projectVars = Array.isArray(projJson?.env_vars)
        ? projJson.env_vars
        : [];
      const overrideVars = Array.isArray(nodeJson?.env_vars)
        ? nodeJson.env_vars
        : [];

      // Merge project env vars + node overrides (node overrides win)
      const mergedMap = new Map();
      projectVars.forEach((e) => mergedMap.set(e.key, e.value ?? ""));
      overrideVars.forEach((e) => mergedMap.set(e.key, e.value ?? ""));
      const envVars = Array.from(mergedMap.entries()).map(([key, value]) => ({
        key,
        value,
      }));
      const envUrlConfigs = buildUrlConfigsFromEnvVars(envVars);
      const envRecord = envVarsArrayToRecord(envVars);
      const jenkinsUrlConfigsParam = buildJenkinsUrlConfigsPayload(envVars);

      // Use existing node data for deployment parameters
      let branchNumber = selectedNode?.branch_name.match(/\d+/)?.[0];
      if (!branchNumber) {
        branchNumber = Math.floor(1000 + Math.random() * 9000); // random 4-digit number
      }
      const domainName =
        selectedNode?.domain_name ||
        `${selectedNode?.project?.short_code}-${branchNumber}-fe`;
      console.log(selectedNode, "selectedNode");
      const rebuildParams = {
        ENV_NAME: selectedNode?.project?.env_name || selectedNode?.env_name,
        REPO_URL: selectedNode?.repo_url,
        BRANCH_NAME: selectedNode?.branch_name,
        PORT:
          selectedNode?.port ||
          Math.floor(Math.random() * (4000 - 3000 + 1)) + 3000,
        DOMAIN_NAME: domainName,
        URL_CONFIGS: jenkinsUrlConfigsParam,
        ENV_VARS: JSON.stringify(envRecord),
        frontnode_id: selectedNode?.id,
        domain_name: domainName,
      };

      console.log("Rebuilding with params:", rebuildParams);

      // Trigger Jenkins build with callbacks
      await triggerJenkinsFrontBuild(
        rebuildParams,
        // Success callback
        async (jenkinsData) => {
          try {
            console.log(jenkinsData, "jenkinsData success rebuild");

            // Store URL configurations in the database
            try {
              const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}urlconfigs/create-from-deployment`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    urlConfigs: envUrlConfigs,
                    frontnodeId: selectedNode?.id,
                  }),
                },
              );

              if (!response.ok) {
                const errorText = await response.text();
                console.warn(
                  "Failed to save URL configs to database:",
                  errorText,
                );
                message.warning(
                  "Rebuild succeeded but failed to save URL configurations",
                );
              } else {
                console.log(
                  "✅ URL configurations saved to database successfully",
                );
                message.success("URL configurations saved successfully");
                // Refresh the frontend node data to get updated URL configs
                invalidateNodeDetailQueries();
              }
            } catch (urlConfigError) {
              console.error(
                "Error saving URL configs to database:",
                urlConfigError,
              );
              message.warning(
                "Rebuild succeeded but failed to save URL configurations",
              );
            }

            // Update node with success data
            const updateData = {
              build_status: jenkinsData.result || "success",
              build_number: jenkinsData.buildNumber,
              preview_link: jenkinsData.artifactData?.url,
              port: jenkinsData.artifactData?.port || rebuildParams.PORT,
              jenkins_job_url:
                jenkinsData.jobUrl ||
                jenkinsJobFolderUrl(JENKINS_JOB_FRONTEND_PREVIEW),
            };

            await updateFrontendNode.mutateAsync({
              id: selectedNode.id,
              data: updateData,
            });

            invalidateNodeDetailQueries();
            message.success(`Rebuild completed successfully!`);
          } catch (updateError) {
            console.error(
              "Error updating node with success data:",
              updateError,
            );
            message.warning(
              "Rebuild completed but failed to update build status",
            );
          }
        },
        // Error callback
        async (error) => {
          try {
            console.error("Jenkins rebuild failed:", error);

            // Update node with failure data
            const updateData = {
              build_status: "failed",
              jenkins_job_url: jenkinsJobFolderUrl(
                JENKINS_JOB_FRONTEND_PREVIEW,
              ),
            };

            await updateFrontendNode.mutateAsync({
              id: selectedNode.id,
              data: updateData,
            });

            message.error(`Rebuild failed`);
          } catch (updateError) {
            console.error(
              "Error updating node with failure data:",
              updateError,
            );
            message.warning("Rebuild failed but failed to update build status");
          }
        },
      );

      message.success(`Rebuild started for "${selectedNode.service_name}"`);
    } catch (error) {
      console.error("Error starting rebuild:", error);
      message.error("Failed to start rebuild. Please try again.");
    }
  };

  // Show skeleton while loading
  if (isLoadingFrontendNodes) {
    return <FrontendConfigSkeleton />;
  }
  return (
    <>
      <div style={{ marginBottom: "16px" }}>
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/projects/${selectedNode?.project_id}`)}
          className={`${isDark ? "dark:!text-white" : "!text-black"} !font-semibold !text-lg`}
        >
          Back
        </Button>
      </div>
      <Card className="bg-white p-4 border-b border-[#e2e8f0]">
        {/* Back Link */}

        {/* Header with Title and Action Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Title level={2} className="user-select-none font-semibold ">
            Front-end Configuration
          </Title>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {selectedNode?.preview_link == null ? (
              <Button
                type="primary"
                icon={<RocketOutlined />}
                onClick={handleDeploy}
                disabled={false}
                style={{
                  backgroundColor: "#3b82f6",
                  borderColor: "#3b82f6",
                }}
              >
                Deploy Front-end
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={handleRebuild}
                disabled={false}
                style={{
                  backgroundColor: "#3b82f6",
                  borderColor: "#3b82f6",
                }}
              >
                Rebuild preview
              </Button>
            )}
            <Popconfirm
              title="Delete this service?"
              description={
                <div>
                  <p>
                    Are you sure you want to delete node "
                    {selectedNode?.service_name}"?
                  </p>
                  <p>
                    <strong>Domain:</strong>{" "}
                    {selectedNode?.domain_name || "Not specified"}
                  </p>
                  <p>
                    <strong>Branch:</strong> {selectedNode?.branch_name}
                  </p>
                  <p>
                    <strong>Environment:</strong> {selectedNode?.env_name}
                  </p>
                  <p style={{ color: "#ff4d4f", fontWeight: "bold" }}>
                    This action cannot be undone.
                  </p>
                </div>
              }
              onConfirm={() => handleDeleteNode()}
              okText="Yes, Delete"
              cancelText="Cancel"
            >
              <Button
                icon={<DeleteOutlined />}
                danger
                className="!text-white !bg-[#ef4444] "
              >
                Delete Node
              </Button>
            </Popconfirm>
          </div>
        </div>
      </Card>

      <Content
        style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}
      >
        {/* Node Information Section */}
        {selectedNode && (
          <Card
            title="Service details"
            bordered={false}
            style={{
              marginBottom: "24px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
            }}
          >
            <Row gutter={[24, 16]}>
              {/* Left Column */}
              <Col span={12}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  <div>
                    <Text
                      strong
                      style={{
                        fontSize: "12px",
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      Node Name:
                    </Text>
                    <Text style={{ fontSize: "14px", color: "#1e293b" }}>
                      {selectedNode.service_name}
                    </Text>
                  </div>
                  <div>
                    <Text
                      strong
                      style={{
                        fontSize: "12px",
                        color: "#64748b",
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      Node Type:
                    </Text>
                    <Tag
                      color="blue"
                      style={{
                        backgroundColor: "#e6f4ff",
                        color: "#1890ff",
                        border: "none",
                        borderRadius: "4px",
                      }}
                    >
                      {selectedNode.type}
                    </Tag>
                  </div>
                  <div>
                    <Text
                      strong
                      style={{
                        fontSize: "12px",
                        color: "#64748b",
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      Environment:
                    </Text>
                    <Tag
                      color="green"
                      style={{
                        backgroundColor: "#f0fdf4",
                        color: "#16a34a",
                        border: "none",
                        borderRadius: "4px",
                      }}
                    >
                      {selectedNode.env_name}
                    </Tag>
                  </div>
                  {selectedNode.build_status && (
                    <div>
                      <Text
                        strong
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                          display: "block",
                          marginBottom: "4px",
                        }}
                      >
                        Build Status:
                      </Text>
                      <Tag
                        color={
                          selectedNode.build_status === "success"
                            ? "green"
                            : selectedNode.build_status === "failed"
                              ? "red"
                              : "orange"
                        }
                        style={{
                          backgroundColor:
                            selectedNode.build_status === "success"
                              ? "#f0fdf4"
                              : selectedNode.build_status === "failed"
                                ? "#fef2f2"
                                : "#fff7ed",
                          color:
                            selectedNode.build_status === "success"
                              ? "#16a34a"
                              : selectedNode.build_status === "failed"
                                ? "#dc2626"
                                : "#ea580c",
                          border: "none",
                          borderRadius: "4px",
                        }}
                      >
                        {selectedNode.build_status}
                      </Tag>
                    </div>
                  )}
                </div>
              </Col>

              {/* Right Column */}
              <Col span={12}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {selectedNode.repository_name && (
                    <div>
                      <Text
                        strong
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                          display: "block",
                          marginBottom: "4px",
                        }}
                      >
                        Repository name:
                      </Text>
                      <Input
                        value={`URL: ${selectedNode.repo_url || selectedNode.repository_name}`}
                        readOnly
                        style={{
                          backgroundColor: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRadius: "6px",
                          fontSize: "12px",
                          color: "#64748b",
                        }}
                      />
                    </div>
                  )}
                  {selectedNode.repo_url && (
                    <div>
                      <Text
                        strong
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                          display: "block",
                          marginBottom: "4px",
                        }}
                      >
                        Repository URI:
                      </Text>
                      <Input
                        value={selectedNode.repo_url}
                        readOnly
                        style={{
                          backgroundColor: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRadius: "6px",
                          fontSize: "12px",
                          color: "#64748b",
                        }}
                      />
                    </div>
                  )}
                  {selectedNode.branch_name && (
                    <div>
                      <Text
                        strong
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                          display: "block",
                          marginBottom: "4px",
                        }}
                      >
                        Branch:
                      </Text>
                      <Input
                        value={selectedNode.branch_name}
                        readOnly
                        style={{
                          backgroundColor: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRadius: "6px",
                          fontSize: "12px",
                          color: "#64748b",
                        }}
                      />
                    </div>
                  )}
                  {selectedNode.preview_link && (
                    <div>
                      <Text
                        strong
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                          display: "block",
                          marginBottom: "4px",
                        }}
                      >
                        Preview Link:
                      </Text>
                      <Input.Group compact style={{ display: "flex" }}>
                        <Input
                          value={selectedNode.preview_link}
                          readOnly
                          style={{
                            backgroundColor: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: "6px 0 0 6px",
                            fontSize: "12px",
                            color: "#64748b",
                            flex: 1,
                          }}
                        />
                        <Button
                          icon={<CopyOutlined />}
                          onClick={() =>
                            copyToClipboard(selectedNode.preview_link)
                          }
                          style={{
                            borderRadius: "0 6px 6px 0",
                            borderLeft: "none",
                            backgroundColor: "#f8fafc",
                            borderColor: "#e2e8f0",
                            color: "#64748b",
                          }}
                        >
                          Copy
                        </Button>
                      </Input.Group>
                    </div>
                  )}
                  {selectedNode.port && (
                    <div>
                      <Text
                        strong
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                          display: "block",
                          marginBottom: "4px",
                        }}
                      >
                        Port:
                      </Text>
                      <Input
                        value={selectedNode.port}
                        readOnly
                        style={{
                          backgroundColor: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRadius: "6px",
                          fontSize: "12px",
                          color: "#64748b",
                        }}
                      />
                    </div>
                  )}
                </div>
              </Col>
            </Row>
            {/* URL Configurations Section */}
            {selectedNode.urlConfigs && selectedNode.urlConfigs.length > 0 && (
              <div
                style={{
                  marginTop: "24px",
                  paddingTop: "24px",
                  borderTop: "1px solid #e2e8f0",
                }}
              >
                <Collapse
                  bordered={false}
                  defaultActiveKey={[]}
                  style={{ backgroundColor: "transparent" }}
                  expandIcon={({ isActive }) => (
                    <RightOutlined
                      style={{
                        color: "#64748b",
                        fontSize: "12px",
                        transition: "transform 0.3s",
                        transform: isActive ? "rotate(90deg)" : "rotate(0deg)",
                      }}
                    />
                  )}
                >
                  <Panel
                    header={
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          justifyContent: "space-between",
                          width: "100%",
                        }}
                      >
                        <Text strong style={{ fontSize: "14px" }}>
                          URL Configuration
                        </Text>
                        <Tag color="blue" size="small" style={{ margin: 0 }}>
                          {selectedNode.urlConfigs.length}
                        </Tag>
                      </div>
                    }
                    key="url-configs"
                    style={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                  >
                    {/* Action buttons for URL configs */}
                    <div
                      style={{
                        marginBottom: "12px",
                        padding: "8px",
                        backgroundColor: hasSelectedUrlConfigs
                          ? "#fef3c7"
                          : "transparent",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        flexWrap: "wrap",
                      }}
                    >
                      <Checkbox
                        checked={isAllUrlConfigsSelected}
                        indeterminate={
                          hasSelectedUrlConfigs && !isAllUrlConfigsSelected
                        }
                        onChange={(e) =>
                          handleSelectAllUrlConfigs(e.target.checked)
                        }
                      >
                        Select All
                      </Checkbox>
                      {hasSelectedUrlConfigs && (
                        <>
                          <Text type="secondary" style={{ fontSize: "12px" }}>
                            {selectedUrlConfigIds.length} selected
                          </Text>
                          <Popconfirm
                            title="Delete selected URL configs?"
                            description={`Are you sure you want to delete ${selectedUrlConfigIds.length} selected URL configuration(s)? This action cannot be undone.`}
                            onConfirm={handleDeleteSelectedUrlConfigs}
                            okText="Yes, Delete"
                            cancelText="Cancel"
                          >
                            <Button
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                            >
                              Delete Selected ({selectedUrlConfigIds.length})
                            </Button>
                          </Popconfirm>
                        </>
                      )}
                      <Popconfirm
                        title="Delete all URL configs?"
                        description="Are you sure you want to delete all URL configurations? This action cannot be undone."
                        onConfirm={handleDeleteAllUrlConfigs}
                        okText="Yes, Delete All"
                        cancelText="Cancel"
                      >
                        <Button size="small" danger icon={<DeleteOutlined />}>
                          Delete All
                        </Button>
                      </Popconfirm>
                    </div>
                    <div style={{ marginTop: "8px" }}>
                      {selectedNode.urlConfigs.map((config, index) => {
                        const configId = config.id || index;
                        const isSelected =
                          selectedUrlConfigIds.includes(configId);
                        return (
                          <div
                            key={configId}
                            style={{
                              marginBottom: "8px",
                              padding: "8px",
                              backgroundColor: isSelected
                                ? "#dbeafe"
                                : "#f8fafc",
                              borderRadius: "4px",
                              border: isSelected
                                ? "2px solid #3b82f6"
                                : "1px solid #e2e8f0",
                              transition: "all 0.2s",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "8px",
                              }}
                            >
                              <Checkbox
                                checked={isSelected}
                                onChange={(e) =>
                                  handleUrlConfigSelect(
                                    configId,
                                    e.target.checked,
                                  )
                                }
                                style={{ marginTop: "4px" }}
                              />
                              <div style={{ flex: 1 }}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    marginBottom: "4px",
                                  }}
                                >
                                  <Text
                                    code
                                    style={{
                                      fontSize: "12px",
                                      color: "#3b82f6",
                                    }}
                                  >
                                    {config.name}
                                  </Text>
                                  {config.serviceType && (
                                    <Tag color="green" size="small">
                                      {config.serviceType}
                                    </Tag>
                                  )}
                                </div>
                                <Text
                                  code
                                  style={{
                                    fontSize: "11px",
                                    color: "#64748b",
                                    wordBreak: "break-all",
                                  }}
                                >
                                  {config.url}
                                </Text>
                                {config.description && (
                                  <div style={{ marginTop: "2px" }}>
                                    <Text
                                      type="secondary"
                                      style={{ fontSize: "10px" }}
                                    >
                                      {config.description}
                                    </Text>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Panel>
                </Collapse>
              </div>
            )}
          </Card>
        )}

        {/* Environment Variables Section */}
        <Card
          title="Environment Variables"
          bordered={false}
          style={{
            marginBottom: "24px",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
          }}
        >
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Text strong style={{ display: "block", marginBottom: 12 }}>
                Project Envs (read-only)
              </Text>
              <Table
                size="small"
                rowKey={(r) => r.key}
                dataSource={projectEnvVars}
                pagination={
                  projectEnvVars.length > 10 ? { pageSize: 10 } : false
                }
                columns={[
                  {
                    title: "Key",
                    dataIndex: "key",
                    key: "key",
                    render: (v) => (
                      <span style={{ fontFamily: "monospace" }}>{v}</span>
                    ),
                  },
                  {
                    title: "Value",
                    dataIndex: "value",
                    key: "value",
                    render: (v) => (
                      <span style={{ fontFamily: "monospace" }}>
                        {String(v ?? "")}
                      </span>
                    ),
                  },
                ]}
              />
            </Col>

            <Col xs={24} md={12}>
              <Text strong style={{ display: "block", marginBottom: 12 }}>
                Node Overrides (only this node)
              </Text>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 2fr auto",
                  gap: 12,
                  alignItems: "start",
                }}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  allowClear={!editingOverrideKey}
                  placeholder={
                    projectEnvVars.length === 0
                      ? "Add keys under Project Environments first"
                      : editingOverrideKey
                        ? "Project env key"
                        : "Choose project env key"
                  }
                  value={overrideKey || undefined}
                  onChange={(val) => setOverrideKey(val ?? "")}
                  options={overrideKeySelectOptions}
                  disabled={!editingOverrideKey && projectEnvVars.length === 0}
                  style={{ width: "100%" }}
                />
                <Input.TextArea
                  value={overrideValue}
                  onChange={(e) => setOverrideValue(e.target.value)}
                  placeholder="value"
                  rows={1}
                  autoSize={{ minRows: 1, maxRows: 4 }}
                />
                <Space>
                  {editingOverrideKey ? (
                    <Button
                      onClick={() => {
                        setEditingOverrideKey(null);
                        setOverrideKey("");
                        setOverrideValue("");
                      }}
                    >
                      Cancel
                    </Button>
                  ) : null}
                  <Button
                    type="primary"
                    loading={savingOverride}
                    onClick={saveNodeOverride}
                    disabled={
                      !editingOverrideKey &&
                      overrideKeySelectOptions.length === 0
                    }
                  >
                    {editingOverrideKey ? "Update" : "Add"}
                  </Button>
                </Space>
              </div>

              <div style={{ marginTop: 16 }}>
                <Table
                  size="small"
                  rowKey={(r) => r.key}
                  dataSource={nodeEnvVars}
                  pagination={
                    nodeEnvVars.length > 10 ? { pageSize: 10 } : false
                  }
                  columns={[
                    {
                      title: "Key",
                      dataIndex: "key",
                      key: "key",
                      render: (v) => (
                        <span style={{ fontFamily: "monospace" }}>{v}</span>
                      ),
                    },
                    {
                      title: "Value",
                      dataIndex: "value",
                      key: "value",
                      render: (v) => (
                        <span style={{ fontFamily: "monospace" }}>
                          {String(v ?? "")}
                        </span>
                      ),
                    },
                    {
                      title: "Action",
                      key: "action",
                      width: 110,
                      render: (_, record) => (
                        <Space size="small">
                          <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => startEditOverride(record)}
                          />
                          <Popconfirm
                            title="Delete override?"
                            okText="Delete"
                            okType="danger"
                            cancelText="Cancel"
                            onConfirm={() => deleteOverride(record.key)}
                          >
                            <Button
                              danger
                              type="text"
                              icon={<DeleteOutlined />}
                            />
                          </Popconfirm>
                        </Space>
                      ),
                    },
                  ]}
                />
              </div>
              <div style={{ marginTop: 8, color: "#64748b", fontSize: 12 }}>
                Overrides take precedence over project envs when
                deploying/rebuilding.
              </div>
            </Col>
          </Row>
        </Card>

        <Card
          title={
            <Space align="center">
              <HistoryOutlined className="text-blue-600" />
              <span>Build history</span>
            </Space>
          }
          bordered={false}
          style={{
            borderRadius: 12,
            boxShadow:
              "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            border: "1px solid #e2e8f0",
          }}
        >
          <Table
            size="small"
            rowKey={(r) => r.id ?? `${r.build_number}-${r.built_at}`}
            pagination={buildHistoryRows.length > 15 ? { pageSize: 15 } : false}
            dataSource={buildHistoryRows}
            locale={{
              emptyText:
                "No builds recorded yet. Successful deploys and rebuilds are listed here.",
            }}
            columns={[
              {
                title: "Build number",
                dataIndex: "build_number",
                key: "build_number",
                width: 160,
                render: (n) => (
                  <span style={{ fontFamily: "monospace" }}>{n}</span>
                ),
              },
              {
                title: "Build time",
                dataIndex: "built_at",
                key: "built_at",
                render: (d) =>
                  d ? dayjs(d).format("YYYY-MM-DD HH:mm:ss") : "—",
              },
            ]}
          />
        </Card>
      </Content>

      {/* Deploy Progress Modal */}
      <DeployProgressModal
        isVisible={isDeployModalVisible}
        deployProgress={deployProgress}
        previewLink={deploymentDetails?.previewLink}
        portNumber={deploymentDetails?.portNumber}
        onCancel={() => {
          setIsDeployModalVisible(false);
          setDeployProgress({
            stage: "",
            message: "",
            buildNumber: null,
          });
          setDeploymentDetails({
            previewLink: null,
            portNumber: null,
          });
        }}
        onSuccess={() => {
          setIsDeployModalVisible(false);
          setDeployProgress({
            stage: "",
            message: "",
            buildNumber: null,
          });
          setDeploymentDetails({
            previewLink: null,
            portNumber: null,
          });

          // For successful deployment, navigate to config page with updated node
          if (
            deployProgress.stage === "completed" &&
            !deployProgress.message.includes("deleted")
          ) {
            // Navigate to config page - the node data will be refreshed from the API
            navigate("/config", { replace: true });
          } else {
            // For delete operations, navigate to home page
            navigate("/");
          }
        }}
      />

      {/* Build Progress Modal for Rebuild */}
      <BuildProgressModal
        isVisible={isBuildModalVisible}
        buildProgress={buildProgress}
        onCancel={handleBuildModalCancel}
      />
    </>
  );
}
