import { useState, useEffect, useCallback } from "react";
import { Row, Col, Typography } from "antd";
import { LayoutGrid, CheckCircle2, XCircle, FolderKanban } from "lucide-react";
import StatsCard from "../components/Dashboard/StatsCard";
import BuildActivityChart from "../components/Dashboard/BuildActivityChart";
import RecentBuildsPanel from "../components/Dashboard/RecentBuildsPanel";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/projectService";

const { Title, Text } = Typography;

function pickServices(payload) {
  if (!payload || typeof payload !== "object") return [];
  const list =
    payload.data ??
    payload.services ??
    payload.webServices ??
    payload.apiServices ??
    payload.backendServices ??
    payload.frontendServices ??
    [];
  return Array.isArray(list) ? list : [];
}

function normalizeBuildStatus(raw) {
  const value = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (!value) return null;
  if (["success", "successful", "passed", "completed"].includes(value)) {
    return "success";
  }
  if (["failed", "failure", "error", "errored"].includes(value)) {
    return "failed";
  }
  return null;
}

function countBuildOutcomes(items) {
  return items.reduce(
    (acc, item) => {
      const status =
        normalizeBuildStatus(item?.build_status) ??
        normalizeBuildStatus(item?.buildStatus) ??
        normalizeBuildStatus(item?.status) ??
        normalizeBuildStatus(item?.last_build_status) ??
        normalizeBuildStatus(item?.result);

      if (status === "success") acc.success += 1;
      if (status === "failed") acc.failed += 1;
      return acc;
    },
    { success: 0, failed: 0 },
  );
}

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalNodes: 0,
    successfulBuilds: 0,
    failedBuilds: 0,
    trends: { nodes: null, successful: null, failed: null, projects: null },
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      const [statsRes, nodesRes, projectsRes] = await Promise.all([
        api.get("stats").catch(() => ({ data: null })),
        api.get("nodes/summary").catch(() => ({ data: { data: [] } })),
        api.get("projects").catch(() => ({ data: [] })),
      ]);

      const statsPayload =
        statsRes?.data && typeof statsRes.data === "object"
          ? statsRes.data
          : {};
      const services = pickServices(nodesRes.data).filter((s) => !s.is_deleted);
      const computedOutcomes = countBuildOutcomes(services);

      const payloadTotalProjects = Number(statsPayload.totalProjects) || 0;
      const payloadTotalNodes = Number(statsPayload.totalNodes) || 0;
      const payloadSuccessfulBuilds = Number(statsPayload.successfulBuilds) || 0;
      const payloadFailedBuilds = Number(statsPayload.failedBuilds) || 0;

      setStats({
        totalProjects: payloadTotalProjects,
        totalNodes: Math.max(payloadTotalNodes, services.length),
        successfulBuilds: Math.max(payloadSuccessfulBuilds, computedOutcomes.success),
        failedBuilds: Math.max(payloadFailedBuilds, computedOutcomes.failed),
        trends: statsPayload.trends ?? { nodes: null, successful: null, failed: null, projects: null },
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setStats({ totalProjects: 0, totalNodes: 0, successfulBuilds: 0, failedBuilds: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="space-y-6" style={{ color: "var(--app-text)" }}>
      <div className="mb-2">
        <Title
          level={1}
          className="!mb-1 !text-3xl sm:!text-4xl !text-blue-900 dark:!text-blue-400"
        >
          Dashboard
        </Title>
        <Text
          className="mb-1 block text-base font-bold sm:text-lg"
          style={{ color: "var(--app-text)" }}
        >
          Welcome back, {user?.name}
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Preview Nodes"
            value={stats.totalNodes}
            subtitle="Active infrastructure"
            icon={<LayoutGrid size={18} />}
            color="blue"
            trend={stats.trends.nodes ? (stats.trends.nodes.startsWith("+") ? "up" : "down") : null}
            trendValue={stats.trends.nodes ?? "0%"}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Successful Builds"
            value={stats.successfulBuilds}
            subtitle="Passing checks"
            icon={<CheckCircle2 size={18} />}
            color="green"
            trend={stats.trends.successful ? (stats.trends.successful.startsWith("+") ? "up" : "down") : null}
            trendValue={stats.trends.successful ?? "0%"}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Failed Builds"
            value={stats.failedBuilds}
            subtitle="Build errors"
            icon={<XCircle size={18} />}
            color="red"
            trend={stats.trends.failed ? (stats.trends.failed.startsWith("+") ? "up" : "down") : null}
            trendValue={stats.trends.failed ?? "0%"}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Projects"
            value={stats.totalProjects}
            subtitle="Managed repositories"
            icon={<FolderKanban size={18} />}
            color="blue"
            trend={stats.trends.projects ? (stats.trends.projects.startsWith("+") ? "up" : "down") : null}
            trendValue={stats.trends.projects ?? "0%"}
            loading={loading}
          />
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24}>
          <BuildActivityChart />
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24}>
          <RecentBuildsPanel />
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
