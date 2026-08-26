import express from "express";
import { Op } from "sequelize";
import { getSystemStats } from "../services/statsService.js";
import { NodeBuild, Node, Project } from "../models/index.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const stats = await getSystemStats();

    // ── Daily change calculations ─────────────────────────────────────────────
    // Compares: how many exist now vs how many existed before today (start of today UTC)
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setUTCHours(0, 0, 0, 0);

    function pct(total, createdToday) {
      const previous = total - createdToday;
      if (previous === 0 && createdToday === 0) return null;  // nothing at all
      if (previous === 0) return "+100%";                      // everything is new today
      const change = (createdToday / previous) * 100;
      const rounded = Math.round(change);
      return rounded >= 0 ? `+${rounded}%` : `${rounded}%`;
    }

    // Successful builds: total vs created today
    const [successTotal, successToday] = await Promise.all([
      NodeBuild.count({ where: { status: { [Op.in]: ["success","successful","passed","completed"] } } }),
      NodeBuild.count({ where: { status: { [Op.in]: ["success","successful","passed","completed"] }, built_at: { [Op.gte]: startOfToday } } }),
    ]);

    // Failed builds: total vs created today
    const [failedTotal, failedToday] = await Promise.all([
      NodeBuild.count({ where: { status: { [Op.in]: ["failed","failure","fail","error","unstable"] } } }),
      NodeBuild.count({ where: { status: { [Op.in]: ["failed","failure","fail","error","unstable"] }, built_at: { [Op.gte]: startOfToday } } }),
    ]);

    // Nodes: total vs created today
    const [nodesTotal, nodesToday] = await Promise.all([
      Node.count({ where: { is_deleted: false } }),
      Node.count({ where: { is_deleted: false, created_at: { [Op.gte]: startOfToday } } }),
    ]);

    // Projects: total vs created today
    const [projectsTotal, projectsToday] = await Promise.all([
      Project.count({ where: { is_deleted: false } }),
      Project.count({ where: { is_deleted: false, created_at: { [Op.gte]: startOfToday } } }),
    ]);

    res.json({
      ...stats,
      trends: {
        nodes:      pct(nodesTotal,    nodesToday),
        successful: pct(successTotal,  successToday),
        failed:     pct(failedTotal,   failedToday),
        projects:   pct(projectsTotal, projectsToday),
      },
    });
  } catch (error) {
    console.error("Error fetching stats snapshot:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

/**
 * GET /api/stats/build-activity?range=24h|7d|30d|all
 *
 * Returns time-bucketed build counts grouped by date and status.
 * Response shape:
 *   {
 *     range: "7d",
 *     summary: { total, successful, failed, successRate, activeBuilds },
 *     series: [
 *       { date: "2026-08-18", total: 12, successful: 10, failed: 2 },
 *       ...
 *     ]
 *   }
 */
router.get("/build-activity", async (req, res) => {
  try {
    const range = req.query.range ?? "7d";

    // Compute the start date based on range
    let startDate = null;
    const now = new Date();

    if (range === "24h") {
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (range === "7d") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === "30d") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    // "all" → no date filter

    const whereClause = startDate ? { built_at: { [Op.gte]: startDate } } : {};

    // Fetch all matching rows (status + built_at) — lightweight query
    const rows = await NodeBuild.findAll({
      where: whereClause,
      attributes: ["status", "built_at"],
      raw: true,
      order: [["built_at", "ASC"]],
    });

    // Normalise statuses
    function normalise(raw) {
      const s = String(raw ?? "").trim().toLowerCase();
      if (["success", "successful", "passed", "completed"].includes(s)) return "success";
      if (["failed", "failure", "fail", "error", "errored", "unstable"].includes(s)) return "failed";
      if (["building", "in_progress", "in progress"].includes(s)) return "building";
      return "other";
    }

    // For 24h range bucket by hour, otherwise bucket by day
    const useHourly = range === "24h";

    const bucketKey = (builtAt) => {
      const d = new Date(builtAt);
      if (useHourly) {
        // Format: "2026-08-24 14:00"
        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:00`;
      }
      // Format: "2026-08-24"
      const pad = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };

    // Build a map of bucket → { total, successful, failed }
    const buckets = new Map();

    for (const row of rows) {
      const key = bucketKey(row.built_at);
      if (!buckets.has(key)) {
        buckets.set(key, { date: key, total: 0, successful: 0, failed: 0 });
      }
      const b = buckets.get(key);
      b.total += 1;
      const norm = normalise(row.status);
      if (norm === "success") b.successful += 1;
      if (norm === "failed") b.failed += 1;
    }

    // Fill in empty buckets so the chart has a continuous x-axis
    if (startDate) {
      const fillStart = new Date(startDate);
      const step = useHourly ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      const fillEnd = new Date(now);

      for (let t = fillStart.getTime(); t <= fillEnd.getTime(); t += step) {
        const key = bucketKey(new Date(t));
        if (!buckets.has(key)) {
          buckets.set(key, { date: key, total: 0, successful: 0, failed: 0 });
        }
      }
    }

    // Sort series chronologically
    const series = Array.from(buckets.values()).sort((a, b) =>
      a.date < b.date ? -1 : 1,
    );

    // Compute summary totals
    const total = rows.length;
    const successful = rows.filter((r) => normalise(r.status) === "success").length;
    const failed = rows.filter((r) => normalise(r.status) === "failed").length;
    const activeBuilds = rows.filter((r) => normalise(r.status) === "building").length;
    const successRate = total > 0 ? Math.round((successful / total) * 1000) / 10 : 0;

    res.json({
      range,
      summary: { total, successful, failed, successRate, activeBuilds },
      series,
    });
  } catch (error) {
    console.error("Error fetching build activity:", error);
    res.status(500).json({ error: "Failed to fetch build activity" });
  }
});

/**
 * GET /api/stats/recent-builds?page=1&limit=6&status=all|passed|failed&q=search
 *
 * Returns paginated recent build runs from NodeBuild joined with Node and Project.
 */
router.get("/recent-builds", async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page  ?? "1",  10));
    const limit  = Math.min(50, Math.max(1, parseInt(req.query.limit ?? "6", 10)));
    const offset = (page - 1) * limit;
    const statusFilter = String(req.query.status ?? "all").toLowerCase();
    const q = String(req.query.q ?? "").trim().toLowerCase();

    // Build NodeBuild where clause
    const buildWhere = {};
    if (statusFilter === "passed") {
      buildWhere.status = { [Op.in]: ["success", "successful", "passed", "completed"] };
    } else if (statusFilter === "failed") {
      buildWhere.status = { [Op.in]: ["failed", "failure", "fail", "error", "unstable"] };
    }

    const { count, rows } = await NodeBuild.findAndCountAll({
      where: buildWhere,
      include: [
        {
          model: Node,
          as: "node",
          required: true,
          where: { is_deleted: false },
          attributes: ["id", "service_name", "branch_name", "project_id", "preview_link", "jenkins_job_url"],
          include: [
            {
              model: Project,
              as: "project",
              attributes: ["id", "name"],
            },
          ],
        },
      ],
      order: [["built_at", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    function normaliseStatus(raw) {
      const s = String(raw ?? "").trim().toLowerCase();
      if (["success", "successful", "passed", "completed"].includes(s)) return "success";
      if (["failed", "failure", "fail", "error", "errored", "unstable"].includes(s)) return "failed";
      if (["building", "in_progress", "in progress"].includes(s)) return "building";
      return s || "unknown";
    }

    let builds = rows.map((r) => {
      const plain = r.get({ plain: true });
      return {
        id:                   plain.id,
        build_number:         plain.build_number,
        jenkins_build_number: plain.jenkins_build_number ?? null,
        built_at:             plain.built_at,
        status:               normaliseStatus(plain.status),
        node_id:              plain.node?.id ?? null,
        service_name:         plain.node?.service_name ?? "Unknown service",
        branch_name:          plain.node?.branch_name ?? "main",
        project_id:           plain.node?.project_id ?? null,
        project_name:         plain.node?.project?.name ?? "Unknown project",
        preview_link:         plain.node?.preview_link ?? null,
        jenkins_job_url:      plain.node?.jenkins_job_url ?? null,
      };
    });

    // Client-side text search across service_name, branch_name, project_name
    if (q) {
      builds = builds.filter(
        (b) =>
          b.service_name.toLowerCase().includes(q) ||
          b.branch_name.toLowerCase().includes(q) ||
          b.project_name.toLowerCase().includes(q),
      );
    }

    res.json({
      builds,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error("Error fetching recent builds:", error);
    res.status(500).json({ error: "Failed to fetch recent builds" });
  }
});

export default router;
