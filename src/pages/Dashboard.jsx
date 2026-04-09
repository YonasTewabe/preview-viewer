import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Row, Col, Card, Tag, Typography } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ProjectOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import StatsCard from "../components/Dashboard/StatsCard";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/projectService";
import { useTheme } from "../contexts/ThemeContext";

const { Title, Text } = Typography;

function pickServices(payload) {
  if (!payload || typeof payload !== "object") return [];
  const list =
    payload.services ??
    payload.webServices ??
    payload.apiServices ??
    payload.backendServices ??
    payload.frontendServices ??
    [];
  return Array.isArray(list) ? list : [];
}

const Dashboard = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalNodes: 0,
    successfulBuilds: 0,
    failedBuilds: 0,
  });
  const [recentBuilds, setRecentBuilds] = useState([]);

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Unknown";
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const formatDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return "N/A";
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()))
      return "N/A";
    const diffInSeconds = Math.floor((end - start) / 1000);
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    const minutes = Math.floor(diffInSeconds / 60);
    const seconds = diffInSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      const [statsRes, webRes, apiRes] = await Promise.all([
        api.get("stats").catch(() => ({ data: null })),
        api.get("preview-nodes").catch(() => ({ data: {} })),
        api.get("preview-services/summary").catch(() => ({
          data: { services: [] },
        })),
      ]);

      const statsPayload =
        statsRes?.data && typeof statsRes.data === "object" ? statsRes.data : {};
      const webServices = pickServices(webRes.data).filter(
        (s) => !s.is_deleted,
      );
      const apiServices = pickServices(apiRes.data);

      setStats({
        totalProjects: Number(statsPayload.totalProjects) || 0,
        totalNodes: Number(statsPayload.totalNodes) || 0,
        successfulBuilds: Number(statsPayload.successfulBuilds) || 0,
        failedBuilds: Number(statsPayload.failedBuilds) || 0,
      });

      const recentBuildsList = [];

      apiServices.forEach((service, index) => {
        const buildDate =
          service.updated_at ||
          service.last_build_at ||
          service.last_build_date ||
          service.created_at;
        const t = buildDate ? new Date(buildDate).getTime() : 0;
        recentBuildsList.push({
          key: `api-${service.id ?? index}`,
          nodeId: service.id,
          projectId: service.project_id ?? service.projectId,
          service:
            service.service_name || service.serviceName || "Unknown service",
          branch: service.branch_name || service.branchName || "main",
          duration:
            service.created_at && (service.updated_at || service.last_build_at)
              ? formatDuration(
                  service.created_at,
                  service.updated_at || service.last_build_at,
                )
              : "N/A",
          timestamp: formatTimeAgo(buildDate),
          buildDate: t,
        });
      });

      webServices.forEach((service, index) => {
        const buildDate =
          service.updated_at ||
          service.last_build_at ||
          service.last_build_date ||
          service.created_at;
        const t = buildDate ? new Date(buildDate).getTime() : 0;
        recentBuildsList.push({
          key: `web-${service.id ?? index}`,
          nodeId: service.id,
          projectId: service.project_id ?? service.projectId,
          service:
            service.service_name || service.serviceName || "Unknown service",
          branch: service.branch_name || service.branchName || "main",
          duration: "N/A",
          timestamp: formatTimeAgo(buildDate),
          buildDate: t,
        });
      });

      recentBuildsList.sort((a, b) => b.buildDate - a.buildDate);
      setRecentBuilds(recentBuildsList.slice(0, 10));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setRecentBuilds([]);
      setStats({
        totalProjects: 0,
        totalNodes: 0,
        successfulBuilds: 0,
        failedBuilds: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="space-y-6 text-black dark:text-white">
      <div className="mb-6">
        <Title
          level={1}
          className="!mb-2 !text-blue-900 dark:!text-blue-400 !font-bold"
        >
          Dashboard
        </Title>
        <Text className="mb-1 block text-lg font-bold text-black dark:text-white">
          Welcome back, {user?.first_name || user?.username || "there"}
        </Text>
        <Text className="font-bold text-gray-700 dark:text-gray-300">
          Here&apos;s what&apos;s happening with your preview environments
          today.
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Total Preview Nodes"
            value={stats.totalNodes}
            icon={<AppstoreOutlined />}
            color="blue"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Successful Builds"
            value={stats.successfulBuilds}
            icon={<CheckCircleOutlined />}
            color="green"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Failed Builds"
            value={stats.failedBuilds}
            icon={<CloseCircleOutlined />}
            color="red"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Total Projects"
            value={stats.totalProjects}
            icon={<ProjectOutlined />}
            color="blue"
            loading={loading}
          />
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24}>
          <Card
            title={
              <span className="font-bold text-blue-900 dark:text-blue-400">
                Recent Builds
              </span>
            }
            className="border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            loading={loading}
          >
            {recentBuilds.length > 0 ? (
              <div className="space-y-3">
                {recentBuilds.map((build) => {
                  const canLink =
                    build.projectId != null &&
                    build.nodeId != null &&
                    String(build.projectId) !== "" &&
                    String(build.nodeId) !== "";
                  const detailPath = canLink
                    ? `/projects/${build.projectId}/nodes/${build.nodeId}`
                    : null;

                  const rowClass = `block rounded-lg border border-zinc-200/80 p-4 transition-all hover:shadow-md dark:border-zinc-800 ${isDark ? "dark:!bg-zinc-900" : "!bg-white"}`;
                  const rowInner = (
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <Text
                            strong
                            className="text-base text-black dark:text-white"
                          >
                            {build.service}
                          </Text>
                          <Tag color="blue" className="text-xs">
                            {build.branch}
                          </Tag>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          {build.duration !== "N/A" && (
                            <div className="flex items-center gap-1">
                              <ClockCircleOutlined className="text-gray-400" />
                              <Text type="secondary" className="text-xs">
                                {build.duration}
                              </Text>
                            </div>
                          )}
                          <Text type="secondary" className="text-xs">
                            {build.timestamp}
                          </Text>
                        </div>
                      </div>
                    </div>
                  );

                  return detailPath ? (
                    <Link
                      key={build.key}
                      to={detailPath}
                      className={`${rowClass} text-inherit no-underline hover:text-inherit focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900`}
                    >
                      {rowInner}
                    </Link>
                  ) : (
                    <div
                      key={build.key}
                      className={`${rowClass} cursor-default`}
                    >
                      {rowInner}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Text type="secondary" className="text-base">
                  No build activity yet.
                </Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
