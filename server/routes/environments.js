import express from "express";
import { Environment, Project } from "../models/index.js";

const router = express.Router();

const toDto = (row) => ({
  id: row.id,
  key: row.env_variable,
  value: row.env,
  env_name: row.env_name,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

// GET /api/projects/:projectId/env-vars - list env vars for project
router.get("/projects/:projectId/env-vars", async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (!project.env_name) return res.json({ env_name: null, env_vars: [] });

    const rows = await Environment.findAll({
      where: { project_id: project.id },
      order: [["created_at", "DESC"]],
    });

    return res.json({ env_name: project.env_name, env_vars: rows.map(toDto) });
  } catch (error) {
    console.error("Error listing env vars:", error);
    res.status(500).json({ error: "Failed to list environment variables" });
  }
});

// POST /api/projects/:projectId/env-vars - add env var to project
router.post("/projects/:projectId/env-vars", async (req, res) => {
  try {
    const { key, value } = req.body || {};
    if (!key) return res.status(400).json({ error: "key is required" });

    const project = await Project.findByPk(req.params.projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (!project.env_name) return res.status(400).json({ error: "Project env_name is not set" });

    const env_variable = String(key).trim();
    if (!env_variable) return res.status(400).json({ error: "key is required" });

    const env = String(value ?? "").trim();
    if (!env) return res.status(400).json({ error: "value is required" });

    const existing = await Environment.findOne({
      where: { project_id: project.id, env_variable },
    });
    if (existing) {
      return res.status(409).json({
        error:
          "An environment variable with this key already exists for this project. Use edit to change its value.",
      });
    }

    const row = await Environment.create({
      project_id: project.id,
      env_name: project.env_name,
      env_variable,
      env,
    });

    res.status(201).json({ env_var: toDto(row) });
  } catch (error) {
    const dup =
      error?.name === "SequelizeUniqueConstraintError" ||
      error?.parent?.code === "ER_DUP_ENTRY";
    if (dup) {
      return res.status(409).json({
        error:
          "An environment variable with this key already exists for this project.",
      });
    }
    console.error("Error adding env var:", error);
    res.status(500).json({ error: "Failed to add environment variable" });
  }
});

// PUT /api/projects/:projectId/env-vars/:key - update env var value
router.put("/projects/:projectId/env-vars/:key", async (req, res) => {
  try {
    const { value } = req.body || {};

    const project = await Project.findByPk(req.params.projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (!project.env_name) return res.status(400).json({ error: "Project env_name is not set" });

    const env_variable = String(req.params.key || "").trim();
    if (!env_variable) return res.status(400).json({ error: "key param is required" });

    const row = await Environment.findOne({
      where: { project_id: project.id, env_variable },
    });
    if (!row) return res.status(404).json({ error: "Environment variable not found" });

    const env = String(value ?? "").trim();
    if (!env) return res.status(400).json({ error: "value is required" });

    await row.update({ env });
    res.json({ env_var: toDto(row) });
  } catch (error) {
    console.error("Error updating env var:", error);
    res.status(500).json({ error: "Failed to update environment variable" });
  }
});

// DELETE /api/projects/:projectId/env-vars/:key - delete env var
router.delete("/projects/:projectId/env-vars/:key", async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (!project.env_name) return res.status(400).json({ error: "Project env_name is not set" });

    const env_variable = String(req.params.key || "").trim();
    if (!env_variable) return res.status(400).json({ error: "key param is required" });

    const deleted = await Environment.destroy({
      where: { project_id: project.id, env_variable },
    });

    if (!deleted) return res.status(404).json({ error: "Environment variable not found" });
    res.json({ message: "Environment variable deleted" });
  } catch (error) {
    console.error("Error deleting env var:", error);
    res.status(500).json({ error: "Failed to delete environment variable" });
  }
});

export default router;

