import React, { useState, useMemo } from "react";
import {
  Card,
  Button,
  Input,
  Space,
  Tooltip,
  Modal,
  Popconfirm,
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
  CheckSquareOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";
import StatsCard from "../Dashboard/StatsCard";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import AddProjectModal from "./AddProjectModal";
import ProjectCard from "../Profile/ProjectCard";
import { useProjects } from "../../hooks/useProjects";

dayjs.extend(relativeTime);

const { Search } = Input;
const { Text, Link } = Typography;

const MyProjects = () => {
  const {
    projects,
    loading,
    createProject,
    updateProject,
    deleteProject,
    projectStats,
  } = useProjects();

  const [searchTerm, setSearchTerm] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Filter projects based on search and filters
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        !searchTerm ||
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [projects, searchTerm]);

  const handleAddProject = () => {
    setEditingProject(null);
    setIsModalVisible(true);
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setIsModalVisible(true);
  };

  const handleDeleteProject = async (project) => {
    try {
      if (!project) {
        message.error("Project not found");
        return;
      }

      console.log("Deleting project:", project.name);

      // Show confirmation modal similar to FrontendConfig
      Modal.confirm({
        title: "Delete this project?",
        content: (
          <div>
            <p>Are you sure you want to delete project "{project.name}"?</p>
            {project.short_code && (
              <p>
                <strong>Short Code:</strong> {project.short_code}
              </p>
            )}
            {project.repository_url && (
              <p>
                <strong>Repository:</strong> {project.repository_url}
              </p>
            )}
            {project.status && (
              <p>
                <strong>Status:</strong> {project.status}
              </p>
            )}
            {project.tag && (
              <p>
                <strong>Tag:</strong> {project.tag}
              </p>
            )}
            <p
              style={{
                color: "#ff4d4f",
                fontWeight: "bold",
                marginTop: "12px",
              }}
            >
              This action cannot be undone.
            </p>
          </div>
        ),
        okText: "Yes, Delete",
        okType: "danger",
        cancelText: "Cancel",
        onOk: async () => {
          try {
            await deleteProject(project.id);
            message.success(`Project "${project.name}" deleted successfully`);
          } catch (error) {
            console.error("Error deleting project:", error);
            message.error("Failed to delete project. Please try again.");
          }
        },
      });
    } catch (error) {
      console.error("Error deleting project:", error);
      message.error("Failed to delete project");
    }
  };

  const handleModalSubmit = async (formData) => {
    try {
      if (editingProject) {
        await updateProject({ ...editingProject, ...formData });
      } else {
        await createProject(formData);
      }
      setIsModalVisible(false);
      setEditingProject(null);
    } catch (error) {
      console.error("Error submitting project:", error);
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

  // Calculate stats
  const totalProjects = projects.length;
  const activeProjects = projects.length;

  return (
    <div className="space-y-6 text-black dark:text-white">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-blue-900 dark:text-blue-400 mb-0">
            My Projects
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            Manage and monitor all your development projects
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddProject}
            className="!bg-blue-600 !border-blue-600 hover:!bg-blue-700"
            size="large"
          >
            Add New Project
          </Button>
        </div>
      </div>

      {/* Main Section Title */}

      {/* Statistics Cards */}
      <Row gutter={[24, 24]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Total Projects"
            value={totalProjects}
            icon={<DatabaseOutlined />}
            color="blue"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Active Projects"
            value={activeProjects}
            icon={<CheckSquareOutlined />}
            color="blue"
            loading={loading}
          />
        </Col>
      </Row>

      {/* Search and Filter Bar */}
      <Card className="shadow-sm mb-4 dark:bg-black dark:border-gray-800">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-1 gap-2 w-full sm:w-auto">
            <Search
              placeholder="search projects by name, description, or creator"
              allowClear
              size="large"
              className="flex-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onSearch={setSearchTerm}
            />
          </div>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <Card className="shadow-sm dark:bg-black dark:border-gray-800">
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
              <div className="flex justify-center mt-6">
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
