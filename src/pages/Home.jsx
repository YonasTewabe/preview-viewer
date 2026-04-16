"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, Layout, Button, Form, message, Empty } from "antd";
import { useNavigate } from "react-router-dom";
import WebNodesList from "../components/WebNodesList";
import ServiceNodeModal from "../components/ServiceNodeModal";
import {
  useCreatePreviewNode,
  useDeletePreviewNode,
  usePreviewNodesByProjectId,
  useUpdatePreviewNode,
} from "../services/usePreviewNodes";
import {
  useCreatePreviewService,
  useDeletePreviewService,
  usePreviewServicesByProjectId,
  useUpdatePreviewService,
} from "../services/usePreviewServices";
import { useAuth } from "../contexts/AuthContext";
import { useGitHub } from "../hooks/useGitHub";
import { isApiPreviewProject } from "../utils/projectServiceKind";
import { nodeHasCompletedBuild } from "../utils/nodeHasCompletedBuild";
import { projectDefaultEnvReady } from "../utils/projectDefaultEnvReady";

const { Content } = Layout;

function buildServiceNodeUpdatePayload(node, serviceName, branchName) {
  const br =
    branchName !== undefined && branchName !== null
      ? String(branchName)
      : node.branch_name;
  return {
    service_name: serviceName,
    repository_name: node.repository_name,
    build_status: node.build_status,
    build_number: node.build_number,
    branch_name: br,
    domain_name: node.domain_name,
    port: node.port,
    repo_url: node.repo_url,
    preview_link: node.preview_link,
    env_name: node.env_name,
    project_id: node.project_id,
  };
}

export default function Home({ project }) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingNode, setEditingNode] = useState(null);
  const [deletingNodeId, setDeletingNodeId] = useState(null);
  const { user } = useAuth();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const createdBy = String(user?.id ?? "").trim();
  const isApi = isApiPreviewProject(project?.tag);

  const { githubBranches, loadingGithubBranches, fetchGithubBranches } =
    useGitHub();

  const { data: webNodesResponse, isLoading: isLoadingWebNodes } =
    usePreviewNodesByProjectId(!isApi ? project?.id : undefined);
  const { data: serviceNodesResponse, isLoading: isLoadingServiceNodes } =
    usePreviewServicesByProjectId(isApi ? project?.id : undefined);

  const { mutate: createWebNode, isPending: isCreatingWebNode } =
    useCreatePreviewNode();
  const { mutate: updateWebNode, isPending: isUpdatingWebNode } =
    useUpdatePreviewNode();
  const deleteWebNode = useDeletePreviewNode();

  const createServiceNode = useCreatePreviewService();
  const updateServiceNode = useUpdatePreviewService();
  const deleteServiceNode = useDeletePreviewService();
  const isSavingServiceNode =
    createServiceNode.isPending || updateServiceNode.isPending;

  const serviceRows = useMemo(() => {
    const raw = serviceNodesResponse?.data;
    if (!Array.isArray(raw)) return [];
    return raw.map((s) => ({
      ...s,
      branch_name: s.branch_name || s.branches?.[0]?.name || undefined,
    }));
  }, [serviceNodesResponse?.data]);

  const listForUi = useMemo(() => {
    if (isApi) return { data: serviceRows };
    return webNodesResponse;
  }, [isApi, serviceRows, webNodesResponse]);

  const listLoading = isApi ? isLoadingServiceNodes : isLoadingWebNodes;

  const repoUrl = project?.repository_url
    ? project.repository_url.split("/").slice(4).join("/")
    : "";

  useEffect(() => {
    if (!project?.id || !project?.repository_url || !repoUrl) return;
    void fetchGithubBranches(project.repository_url, repoUrl);
  }, [project?.id, project?.repository_url, repoUrl, fetchGithubBranches]);

  const handleAddNode = () => {
    if (!projectDefaultEnvReady(project)) {
      message.warning(
        "Set this project's environments before adding services.",
      );
      navigate(`/projects/${project.id}/environments`);
      return;
    }
    setEditingNode(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditNode = (node) => {
    setEditingNode(node);
    form.resetFields();
    form.setFieldsValue({
      service_name: node.service_name,
      branch_name: node.branch_name,
    });
    setIsModalVisible(true);
  };

  const handleDeleteNode = useCallback(
    async (node) => {
      if (!node?.id) return;
      setDeletingNodeId(node.id);
      try {
        const shouldRemoveFromJenkins =
          nodeHasCompletedBuild(node) && Boolean(node.domain_name);
        if (shouldRemoveFromJenkins) {
          try {
            const response = await fetch(
              `${import.meta.env.VITE_BACKEND_URL}jenkins/delete-preview-job`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ DOMAIN_NAME: node.domain_name }),
              },
            );
            const result = await response.json();
            if (result.success) {
              message.success(
                `Domain "${node.domain_name}" removed from Jenkins`,
              );
            } else {
              message.warning(
                result.message || "Jenkins domain cleanup may have failed",
              );
            }
          } catch (jenkinsError) {
            console.error("Jenkins deletion error:", jenkinsError);
            message.warning(
              "Could not reach Jenkins to delete preview domain; removing node record.",
            );
          }
        }
        try {
          if (isApi) {
            await deleteServiceNode.mutateAsync(node.id);
          } else {
            await deleteWebNode.mutateAsync(node.id);
          }
        } catch (error) {
          const msg =
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message;
          if (msg) message.error(msg);
        }
      } finally {
        setDeletingNodeId(null);
      }
    },
    [isApi, deleteServiceNode, deleteWebNode],
  );

  const handleModalOk = () => {
    form.validateFields().then(async (values) => {
      if (!createdBy) {
        message.error("Session is stale. Please log in again.");
        return;
      }
      const name = String(values.service_name ?? "").trim();
      const branch = String(values.branch_name ?? "").trim() || "main";

      if (isApi) {
        if (!project?.repository_url || !projectDefaultEnvReady(project)) {
          message.warning(
            "This project is missing a repository URL or default environment variables.",
          );
          return;
        }
        const repoSlug = project.repository_url.split("/").slice(4).join("/");
        const selfId = editingNode?.id;
        const lc = (s) =>
          String(s ?? "")
            .trim()
            .toLowerCase();
        const dupName = serviceRows.find(
          (s) =>
            lc(s.service_name) === lc(name) &&
            (!selfId || String(s.id) !== String(selfId)),
        );
        if (dupName) {
          message.error(
            `Service name "${name}" already exists. Choose a different name.`,
          );
          return;
        }
        const dupBranch = serviceRows.find(
          (s) =>
            lc(s.branch_name) === lc(branch) &&
            (!selfId || String(s.id) !== String(selfId)),
        );
        if (dupBranch) {
          message.error(
            `Branch "${branch}" is already used by another node in this project.`,
          );
          return;
        }
        try {
          if (editingNode) {
            await updateServiceNode.mutateAsync({
              id: editingNode.id,
              data: { service_name: name, branch_name: branch },
            });
          } else {
            const defaultProf = project.env_profiles?.find((p) => p.is_default);
            await createServiceNode.mutateAsync({
              service_name: name,
              branch_name: branch,
              repository_name: repoSlug || name,
              repo_url: project.repository_url,
              env_name: project.env_name,
              project_env_profile_id: defaultProf?.id,
              default_url: project.repository_url,
              type: "api",
              description: null,
              project_id: project.id,
              created_by: createdBy,
            });
          }
          setIsModalVisible(false);
          form.resetFields();
        } catch (e) {
          console.error(e);
        }
        return;
      }

      const webRows = Array.isArray(webNodesResponse?.data)
        ? webNodesResponse.data
        : [];
      const selfWebId = editingNode?.id;
      const lcw = (s) =>
        String(s ?? "")
          .trim()
          .toLowerCase();
      const dupWebName = webRows.find(
        (n) =>
          lcw(n.service_name) === lcw(name) &&
          (!selfWebId || String(n.id) !== String(selfWebId)),
      );
      if (dupWebName) {
        message.error(`Service name "${name}" already exists in this project.`);
        return;
      }
      const dupWebBranch = webRows.find(
        (n) =>
          lcw(n.branch_name) === lcw(branch) &&
          (!selfWebId || String(n.id) !== String(selfWebId)),
      );
      if (dupWebBranch) {
        message.error(
          `Branch "${branch}" is already used by another node in this project.`,
        );
        return;
      }

      if (editingNode) {
        const payload = buildServiceNodeUpdatePayload(
          editingNode,
          name,
          branch,
        );
        updateWebNode(
          {
            id: editingNode.id,
            data: payload,
          },
          {
            onSuccess: () => {
              setIsModalVisible(false);
              form.resetFields();
            },
            onError: (error) => {
              message.error(
                error.response?.data?.message ||
                  error.response?.data?.error ||
                  "Update failed",
              );
            },
          },
        );
      } else {
        createWebNode(
          {
            type: "api",
            repository_name: project.repository_url,
            repo_url: project.repository_url,
            env_name: project.env_name,
            project_env_profile_id: project.env_profiles?.find(
              (p) => p.is_default,
            )?.id,
            description: null,
            service_name: name,
            project_id: project.id,
            branch_name: branch,
            created_by: createdBy,
          },
          {
            onSuccess: () => {
              setIsModalVisible(false);
              form.resetFields();
            },
            onError: (error) => {
              message.error(
                error.response?.data?.message ||
                  error.response?.data?.error ||
                  "Create failed",
              );
            },
          },
        );
      }
    });
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleNodeClick = (node) => {
    navigate(`/projects/${project.id}/nodes/${node.id}`);
  };

  if (!project?.id) {
    return (
      <Content style={{ padding: 24 }}>
        <Card>
          <Empty description="Open a project from the Projects page to manage its services.">
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
          className="border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900"
          title={
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold">Nodes</span>
            </div>
          }
        >
          <WebNodesList
            nodesData={listForUi}
            isLoadingNodes={listLoading}
            onAddNode={handleAddNode}
            onEditNode={handleEditNode}
            onDeleteNode={handleDeleteNode}
            onNodeClick={handleNodeClick}
            deletingNodeId={deletingNodeId}
          />
        </Card>
      </Content>

      <ServiceNodeModal
        open={isModalVisible}
        onCancel={handleModalCancel}
        onSubmit={handleModalOk}
        form={form}
        editingItem={editingNode}
        githubBranches={githubBranches}
        loadingGithubBranches={loadingGithubBranches}
        submitLoading={
          isApi
            ? isSavingServiceNode
            : isCreatingWebNode || isUpdatingWebNode
        }
      />
    </div>
  );
}
