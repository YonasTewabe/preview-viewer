import React, { useState, useMemo } from "react";
import {
  Card,
  Button,
  Input,
  Space,
  Tooltip,
  Typography,
  Row,
  Col,
  Statistic,
  Pagination,
  Empty,
  Badge,
  message,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  ProjectOutlined,
  AppstoreOutlined,
  CheckSquareOutlined,
} from "@ant-design/icons";
import StatsCard from "../Dashboard/StatsCard";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import AddProjectModal from "./AddProjectModal";
import ProjectCard from "../Profile/ProjectCard";
import { useProjects } from "../../hooks/useProjects";
import { useQuery } from "@tanstack/react-query";
import { projectService } from "../../services/projectService";

dayjs.extend(relativeTime);

const { Search } = Input;
const { Text, Link } = Typography;

const MyProjects = () => {
  const { projects, loading, createProject, updateProject, deleteProject } =
    useProjects();

  const [searchTerm, setSearchTerm] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const { data: stats = {} } = useQuery({
    queryKey: ["stats"],
    queryFn: () => projectService.getStats(),
  });

  const filteredProjects = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return projects;

    return projects.filter((project) => {
      const name = String(project.name ?? "").toLowerCase();
      const tag = String(project.tag ?? "").toLowerCase();
      return name.includes(q) || tag.includes(q);
    });
  }, [projects, searchTerm]);

  const handleAddProject = () => {
    setEditingProject(null);
    setIsModalVisible(true);
  };

  const handleEditProject = (projectFromCard) => {
    const id = projectFromCard?.id;
    const full =
      id != null
        ? (projects.find((p) => p.id === id) ?? projectFromCard)
        : projectFromCard;
    setEditingProject(full);
    setIsModalVisible(true);
  };

  const handleDeleteProject = async (project) => {
    if (!project) {
      message.error("Project not found");
      return;
    }
    try {
      await deleteProject(project.id);
      message.success(`Project "${project.name}" deleted successfully`);
    } catch (error) {
      console.error("Error deleting project:", error);
      message.error("Failed to delete project. Please try again.");
    }
  };

  const handleModalSubmit = async (formData) => {
    try {
      if (editingProject?.id != null) {
        await updateProject({
          id: editingProject.id,
          ...formData,
        });
      } else {
        await createProject(formData);
      }
      setIsModalVisible(false);
      setEditingProject(null);
    } catch (error) {
      console.error("Error submitting project:", error);
      throw error;
    }
  };

  // Calculate pagination for cards
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedProjects = filteredProjects.slice(startIndex, endIndex);

  // Transform project data to match ProjectCard expected format
  const transformProjectForCard = (project) => ({
    ...project,
    role: "Owner", // Default role, could be determined by user permissions
    createdAt: project.created_at,
    updatedAt: project.updated_at,
    memberCount: Math.floor(Math.random() * 10) + 1, // Placeholder for member count
  });

  return (
    <div className="space-y-6 text-black dark:text-white">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="mb-0 text-2xl sm:text-3xl font-bold text-blue-900 dark:text-blue-400">
            My Projects
          </h2>
          <p className="font-bold text-gray-700 dark:text-gray-300">
            Manage and monitor all your development projects
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:justify-end">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddProject}
            className="!bg-blue-600 !border-blue-600 hover:!bg-blue-700"
            size="large"
            block
            style={{ maxWidth: 220 }}
          >
            Add New Project
          </Button>
        </div>
      </div>

      <Row gutter={[24, 24]} className="mb-2">
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Projects"
            value={stats.totalProjects}
            icon={<ProjectOutlined />}
            color="blue"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Nodes"
            value={stats.totalNodes}
            icon={<AppstoreOutlined />}
            color="blue"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Environment profiles"
            value={stats.totalEnvProfiles}
            icon={<CheckSquareOutlined />}
            color="blue"
            loading={loading}
          />
        </Col>
      </Row>

      <Card className="mb-4 border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-1 gap-2 w-full sm:w-auto">
            <Search
              placeholder="Search by name or tag"
              allowClear
              size="large"
              className="flex-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onSearch={setSearchTerm}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <Card className="border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <Empty description="No projects found" className="py-12" />
          </Card>
        ) : (
          <>
            <Row className="mt-4" gutter={[24, 24]}>
              {paginatedProjects.map((project) => (
                <Col key={project.id} xs={24} sm={12} lg={8}>
                  <ProjectCard
                    project={transformProjectForCard(project)}
                    onEdit={handleEditProject}
                    onDelete={handleDeleteProject}
                    canEdit={true}
                    canDelete={true}
                  />
                </Col>
              ))}
            </Row>

            {filteredProjects.length > pageSize && (
              <div className="mt-6 overflow-x-auto">
                <Pagination
                  current={currentPage}
                  total={filteredProjects.length}
                  pageSize={pageSize}
                  showSizeChanger
                  showQuickJumper
                  showTotal={(total, range) =>
                    `${range[0]}-${range[1]} of ${total} projects`
                  }
                  onChange={(page, size) => {
                    setCurrentPage(page);
                    if (size !== pageSize) {
                      setPageSize(size);
                      setCurrentPage(1);
                    }
                  }}
                  pageSizeOptions={["12", "24", "36", "48"]}
                />
              </div>
            )}
          </>
        )}
      </Card>
      {/* Add/Edit Project Modal */}
      <AddProjectModal
        visible={isModalVisible}
        project={editingProject}
        onSubmit={handleModalSubmit}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingProject(null);
        }}
        isEdit={!!editingProject}
      />
    </div>
  );
};

export default MyProjects;
