import express from "express";
import { Op, fn, col, literal } from "sequelize";
import { getSystemStats } from "../services/statsService.js";
import { NodeBuild } from "../models/index.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const stats = await getSystemStats();
    res.json(stats);
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

export default router;
