import express from "express";
import { getSystemStats } from "../services/statsService.js";

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

export default router;
