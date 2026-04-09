import {
  Environment,
  Node,
  NodeBuild,
  Project,
  ProjectEnvProfile,
  Stats,
} from "../models/index.js";

const GLOBAL_STATS_KEY = "global";

function normalizeBuildStatus(raw) {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (s === "success" || s === "successful") return "success";
  if (s === "failed" || s === "failure" || s === "fail" || s === "unstable") {
    return "failed";
  }
  if (s === "building" || s === "in_progress" || s === "in progress") {
    return "building";
  }
  if (s === "cancelled" || s === "canceled" || s === "aborted") {
    return "cancelled";
  }
  if (s === "not_built" || s === "not built") return "pending";
  if (!s) return "pending";
  return s;
}

function hasDeployedPreviewUrl(node) {
  const link =
    node.preview_link ??
    node.previewLink ??
    node.default_url ??
    node.defaultUrl ??
    node.deployment_url ??
    node.deploymentUrl;
  return link != null && String(link).trim() !== "";
}

function effectiveBuildStatus(node) {
  const status = normalizeBuildStatus(node?.build_status ?? node?.buildStatus);
  if (status === "pending" && hasDeployedPreviewUrl(node)) return "success";
  return status;
}

function toStatsPayload(snapshot) {
  return {
    key_name: GLOBAL_STATS_KEY,
    total_projects: snapshot.totalProjects,
    total_env_profiles: snapshot.totalEnvProfiles,
    total_env_vars: snapshot.totalEnvVars,
    total_nodes: snapshot.totalNodes,
    active_builds: snapshot.activeBuilds,
    successful_builds: snapshot.successfulBuilds,
    failed_builds: snapshot.failedBuilds,
  };
}

function toStatsDto(row) {
  const plain = row?.get ? row.get({ plain: true }) : row || {};
  return {
    totalProjects: Number(plain.total_projects) || 0,
    totalEnvProfiles: Number(plain.total_env_profiles) || 0,
    totalEnvVars: Number(plain.total_env_vars) || 0,
    totalNodes: Number(plain.total_nodes) || 0,
    activeBuilds: Number(plain.active_builds) || 0,
    successfulBuilds: Number(plain.successful_builds) || 0,
    failedBuilds: Number(plain.failed_builds) || 0,
    updatedAt: plain.updated_at ?? null,
  };
}

async function computeStatsSnapshot() {
  const [totalProjects, totalEnvProfiles, totalEnvVars, nodes, buildRows] = await Promise.all([
    Project.count(),
    ProjectEnvProfile.count(),
    Environment.count(),
    Node.findAll({
      where: { is_deleted: false },
      attributes: ["build_status", "preview_link", "default_url", "deployment_url"],
      raw: true,
    }),
    NodeBuild.findAll({
      attributes: ["status"],
      raw: true,
    }).catch(() => []),
  ]);

  let activeBuilds = 0;
  let successfulNodeStates = 0;
  let failedNodeStates = 0;

  for (const node of nodes) {
    const status = effectiveBuildStatus(node);
    if (status === "building") activeBuilds += 1;
    if (status === "success") successfulNodeStates += 1;
    if (status === "failed") failedNodeStates += 1;
  }

  const successfulBuildRuns = buildRows.reduce((acc, row) => {
    return normalizeBuildStatus(row?.status) === "success" ? acc + 1 : acc;
  }, 0);
  const failedBuildRuns = buildRows.reduce((acc, row) => {
    return normalizeBuildStatus(row?.status) === "failed" ? acc + 1 : acc;
  }, 0);

  const hasBuildHistory = buildRows.length > 0;

  return {
    totalProjects,
    totalEnvProfiles,
    totalEnvVars,
    totalNodes: nodes.length,
    activeBuilds,
    successfulBuilds: hasBuildHistory ? successfulBuildRuns : successfulNodeStates,
    failedBuilds: hasBuildHistory ? failedBuildRuns : failedNodeStates,
  };
}

export async function refreshSystemStats() {
  const snapshot = await computeStatsSnapshot();
  await Stats.upsert(toStatsPayload(snapshot));
  const latest = await Stats.findOne({ where: { key_name: GLOBAL_STATS_KEY } });
  return toStatsDto(latest);
}

export async function getSystemStats() {
  const existing = await Stats.findOne({ where: { key_name: GLOBAL_STATS_KEY } });
  if (existing) return toStatsDto(existing);
  return refreshSystemStats();
}

export function refreshStatsAfterMutation(req, res, next) {
  const isMutation =
    req.method === "POST" ||
    req.method === "PUT" ||
    req.method === "PATCH" ||
    req.method === "DELETE";

  if (isMutation) {
    res.on("finish", () => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        void refreshSystemStats().catch((error) => {
          console.error("Failed to refresh stats snapshot:", error);
        });
      }
    });
  }
  next();
}
