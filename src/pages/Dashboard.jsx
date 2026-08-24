import { Row, Col, Typography } from "antd";
import { useQuery } from "@tanstack/react-query";
import { LayoutGrid, CheckCircle2, XCircle, FolderKanban } from "lucide-react";
import StatsCard from "../components/Dashboard/StatsCard";
import BuildActivityChart from "../components/Dashboard/BuildActivityChart";
import RecentBuildsPanel from "../components/Dashboard/RecentBuildsPanel";
import PageHeader from "../components/Layout/PageHeader";
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
  const value = String(raw ?? "").trim().toLowerCase();
  if (!value) return null;
  if (["success", "successful", "passed", "completed"].includes(value)) return "success";
  if (["failed", "failure", "error", "errored"].includes(value)) return "failed";
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

function trendDir(val) {
  if (!val) return null;
  return val.startsWith("+") ? "up" : "down";
}

const Dashboard = () => {
  const { user } = useAuth();

  // Fetch stats — always fresh, refetch when the tab is focused
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: () => api.get("stats").then((r) => r.data),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Fetch node summary for live node count
  const { data: nodesData, isLoading: nodesLoading } = useQuery({
    queryKey: ["dashboardNodes"],
    queryFn: () => api.get("nodes/summary").then((r) => r.data),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const loading = statsLoading || nodesLoading;

  const statsPayload = statsData && typeof statsData === "object" ? statsData : {};
  const services = pickServices(nodesData).filter((s) => !s.is_deleted);
  const computedOutcomes = countBuildOutcomes(services);
  const trends = statsPayload.trends ?? { nodes: null, successful: null, failed: null, projects: null };

  const totalNodes    = Math.max(Number(statsPayload.totalNodes)       || 0, services.length);
  const successBuilds = Math.max(Number(statsPayload.successfulBuilds) || 0, computedOutcomes.success);
  const failedBuilds  = Math.max(Number(statsPayload.failedBuilds)     || 0, computedOutcomes.failed);
  const totalProjects = Number(statsPayload.totalProjects) || 0;

  return (
    <div className="space-y-6" style={{ color: "var(--app-text)" }}>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${user?.name}`}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Preview Nodes"
            value={totalNodes}
            subtitle="Active infrastructure"
            icon={<LayoutGrid size={18} />}
            color="blue"
            trend={trendDir(trends.nodes)}
            trendValue={trends.nodes ?? "0%"}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Successful Builds"
            value={successBuilds}
            subtitle="Passing checks"
            icon={<CheckCircle2 size={18} />}
            color="green"
            trend={trendDir(trends.successful)}
            trendValue={trends.successful ?? "0%"}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Failed Builds"
            value={failedBuilds}
            subtitle="Build errors"
            icon={<XCircle size={18} />}
            color="red"
            trend={trendDir(trends.failed)}
            trendValue={trends.failed ?? "0%"}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Projects"
            value={totalProjects}
            subtitle="Managed repositories"
            icon={<FolderKanban size={18} />}
            color="blue"
            trend={trendDir(trends.projects)}
            trendValue={trends.projects ?? "0%"}
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
