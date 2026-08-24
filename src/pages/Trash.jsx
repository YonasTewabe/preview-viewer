import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { App, Button, Input, Popconfirm, Space, Table, Tabs, Tag } from "antd";
import { projectService } from "../services/projectService";
import PageHeader from "../components/Layout/PageHeader";

function stripDeletedToken(value) {
  return String(value ?? "")
    .replace(/\s*\[deleted[^\]]*\]\s*/gi, " ")
    .replace(/#deleted-[a-z0-9]+/gi, "")
    .replace(/-deleted-[a-z0-9]+/gi, "")
    .replace(/-d-[a-z0-9]+/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const Trash = () => {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const {
    data: trashedProjects = [],
    isLoading: projectsLoading,
    refetch: refetchProjects,
  } = useQuery({
    queryKey: ["trash", "projects"],
    queryFn: projectService.getTrashedProjects,
  });

  const {
    data: trashedNodes = [],
    isLoading: nodesLoading,
    refetch: refetchNodes,
  } = useQuery({
    queryKey: ["trash", "nodes"],
    queryFn: projectService.getTrashedNodes,
  });

  const restoreProjectMutation = useMutation({
    mutationFn: (id) => projectService.restoreProject(id),
    onSuccess: async () => {
      message.success("Project restored");
      await Promise.all([
        refetchProjects(),
        queryClient.invalidateQueries({ queryKey: ["projects"] }),
      ]);
    },
  });

  const permanentDeleteProjectMutation = useMutation({
    mutationFn: (id) => projectService.permanentlyDeleteProject(id),
    onSuccess: async () => {
      message.success("Project permanently deleted");
      await Promise.all([
        refetchProjects(),
        queryClient.invalidateQueries({ queryKey: ["projects"] }),
      ]);
    },
  });

  const restoreNodeMutation = useMutation({
    mutationFn: (id) => projectService.restoreNode(id),
    onSuccess: async () => {
      message.success("Node restored");
      await Promise.all([
        refetchNodes(),
        queryClient.invalidateQueries({ queryKey: ["previewNodesByProject"] }),
        queryClient.invalidateQueries({
          queryKey: ["previewServicesByProject"],
        }),
      ]);
    },
  });

  const permanentDeleteNodeMutation = useMutation({
    mutationFn: (id) => projectService.permanentlyDeleteNode(id),
    onSuccess: async () => {
      message.success("Node permanently deleted");
      await Promise.all([
        refetchNodes(),
        queryClient.invalidateQueries({ queryKey: ["previewNodesByProject"] }),
        queryClient.invalidateQueries({
          queryKey: ["previewServicesByProject"],
        }),
      ]);
    },
  });

  const projectColumns = useMemo(
    () => [
      {
        title: "Project",
        dataIndex: "name",
        key: "name",
        render: (value) => stripDeletedToken(value) || "-",
      },
      {
        title: "Short code",
        dataIndex: "short_code",
        key: "short_code",
        render: (value) => stripDeletedToken(value) || "-",
      },
      {
        title: "Repository",
        dataIndex: "repository_url",
        key: "repository_url",
        render: (value) => stripDeletedToken(value) || "-",
      },
      {
        title: "Actions",
        key: "actions",
        render: (_, row) => (
          <Space>
            <Button
              onClick={() => restoreProjectMutation.mutate(row.id)}
              loading={restoreProjectMutation.isPending}
            >
              Restore
            </Button>
            <Popconfirm
              title="Permanently delete this project?"
              description="This cannot be undone."
              okText="Delete permanently"
              okButtonProps={{ danger: true }}
              onConfirm={() => permanentDeleteProjectMutation.mutate(row.id)}
            >
              <Button danger loading={permanentDeleteProjectMutation.isPending}>
                Delete permanently
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [permanentDeleteProjectMutation, restoreProjectMutation],
  );

  const nodeColumns = useMemo(
    () => [
      {
        title: "Node Name",
        dataIndex: "service_name",
        key: "service_name",
        render: (value) => stripDeletedToken(value) || "-",
      },
      {
        title: "Node Branch",
        dataIndex: "branch_name",
        key: "branch_name",
        render: (value) => stripDeletedToken(value) || "-",
      },
      {
        title: "Project",
        dataIndex: "project_name",
        key: "project_name",
        render: (_, row) => stripDeletedToken(row.project?.name) || "-",
      },
      {
        title: "Actions",
        key: "actions",
        render: (_, row) => (
          <Space>
            <Button
              onClick={() => restoreNodeMutation.mutate(row.id)}
              loading={restoreNodeMutation.isPending}
            >
              Restore
            </Button>
            <Popconfirm
              title="Permanently delete this node?"
              okText="Delete permanently"
              okButtonProps={{ danger: true }}
              onConfirm={() => permanentDeleteNodeMutation.mutate(row.id)}
            >
              <Button danger loading={permanentDeleteNodeMutation.isPending}>
                Delete permanently
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [permanentDeleteNodeMutation, restoreNodeMutation],
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Trash" subtitle="Restore or permanently delete items" />

      <Tabs
        defaultActiveKey="nodes"
        tabBarGutter={8}
        items={[
          {
            key: "nodes",
            label: `Nodes (${trashedNodes.length})`,
            children: (
              <div className="space-y-3">
                <Table
                  rowKey="id"
                  dataSource={trashedNodes}
                  columns={nodeColumns}
                  loading={nodesLoading}
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 860 }}
                />
              </div>
            ),
          },
          {
            key: "projects",
            label: `Projects (${trashedProjects.length})`,
            children: (
              <Table
                rowKey="id"
                dataSource={trashedProjects}
                columns={projectColumns}
                loading={projectsLoading}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 860 }}
              />
            ),
          },
        ]}
      />
    </div>
  );
};

export default Trash;
