import express from "express";
import { Environment, Project, ProjectEnvProfile } from "../models/index.js";
import { resolveProfileIdForProject } from "../utils/resolveProjectEnvProfile.js";
import { refreshStatsAfterMutation } from "../services/statsService.js";

const router = express.Router();
router.use(refreshStatsAfterMutation);

const toDto = (row) => ({
  id: row.id,
  key: row.env_variable,
  value: row.env,
  profile_id: row.profile_id,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

async function profileSummary(projectId, profileId) {
  const p = await ProjectEnvProfile.findOne({
    where: { id: profileId, project_id: projectId },
    attributes: ["id", "name", "slug", "is_default"],
  });
  if (!p) return null;
  const row = p.get ? p.get({ plain: true }) : p;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    is_default: row.is_default,
  };
}

// GET /api/projects/:projectId/env-vars
router.get("/projects/:projectId/env-vars", async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const qProfile =
      req.query.profileId ?? req.query.profile_id ?? req.query.env_profile_id;
    const profileId = await resolveProfileIdForProject(
      project.id,
      qProfile != null && qProfile !== "" ? qProfile : null,
    );

    if (!profileId) {
      const profiles = await ProjectEnvProfile.findAll({
        where: { project_id: project.id },
        attributes: ["id", "name", "slug", "is_default"],
        order: [
          ["is_default", "DESC"],
          ["name", "ASC"],
        ],
      });
      return res.json({
        profile_id: null,
        profile: null,
        env_name: null,
        env_vars: [],
        env_profiles: profiles.map((x) => {
          const r = x.get ? x.get({ plain: true }) : x;
          return {
            id: r.id,
            name: r.name,
            slug: r.slug,
            is_default: r.is_default,
          };
        }),
      });
    }

    const rows = await Environment.findAll({
      where: { project_id: project.id, profile_id: profileId },
      order: [["created_at", "DESC"]],
    });

    const prof = await profileSummary(project.id, profileId);
    const profiles = await ProjectEnvProfile.findAll({
      where: { project_id: project.id },
      attributes: ["id", "name", "slug", "is_default"],
      order: [
        ["is_default", "DESC"],
        ["name", "ASC"],
      ],
    });

    return res.json({
      profile_id: profileId,
      profile: prof,
      env_name: prof?.name ?? null,
      env_vars: rows.map(toDto),
      env_profiles: profiles.map((x) => {
        const r = x.get ? x.get({ plain: true }) : x;
        return {
          id: r.id,
          name: r.name,
          slug: r.slug,
          is_default: r.is_default,
        };
      }),
    });
  } catch (error) {
    console.error("Error listing env vars:", error);
    res.status(500).json({ error: "Failed to list environment variables" });
  }
});

// POST /api/projects/:projectId/env-vars
router.post("/projects/:projectId/env-vars", async (req, res) => {
  try {
    const { key, value, profileId: bodyProfileId, profile_id } =
      req.body || {};
    const profileId = await resolveProfileIdForProject(
      req.params.projectId,
      bodyProfileId ?? profile_id ?? null,
    );
    if (!key) return res.status(400).json({ error: "key is required" });
    if (!profileId) {
      return res
        .status(400)
        .json({ error: "No environment profile for this project" });
    }

    const project = await Project.findByPk(req.params.projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const env_variable = String(key).trim();
    if (!env_variable) return res.status(400).json({ error: "key is required" });

    const env = String(value ?? "").trim();
    if (!env) return res.status(400).json({ error: "value is required" });

    const existing = await Environment.findOne({
      where: { profile_id: profileId, env_variable },
    });
    if (existing) {
      return res.status(409).json({
        error:
          "An environment variable with this key already exists for this profile. Use edit to change its value.",
      });
    }

    const row = await Environment.create({
      project_id: project.id,
      profile_id: profileId,
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
          "An environment variable with this key already exists for this profile.",
      });
    }
    console.error("Error adding env var:", error);
    res.status(500).json({ error: "Failed to add environment variable" });
  }
});

// PUT /api/projects/:projectId/env-vars/:key
router.put("/projects/:projectId/env-vars/:key", async (req, res) => {
  try {
    const { value, profileId: bodyProfileId, profile_id } = req.body || {};
    const profileId = await resolveProfileIdForProject(
      req.params.projectId,
      bodyProfileId ?? profile_id ?? null,
    );
    if (!profileId) {
      return res
        .status(400)
        .json({ error: "No environment profile for this project" });
    }

    const project = await Project.findByPk(req.params.projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const env_variable = String(req.params.key || "").trim();
    if (!env_variable) return res.status(400).json({ error: "key param is required" });

    const row = await Environment.findOne({
      where: { project_id: project.id, profile_id: profileId, env_variable },
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

// DELETE /api/projects/:projectId/env-vars/:key
router.delete("/projects/:projectId/env-vars/:key", async (req, res) => {
  try {
    const qProfile =
      req.query.profileId ?? req.query.profile_id ?? req.query.env_profile_id;
    const profileId = await resolveProfileIdForProject(
      req.params.projectId,
      qProfile != null && qProfile !== "" ? qProfile : null,
    );
    if (!profileId) {
      return res
        .status(400)
        .json({ error: "No environment profile for this project" });
    }

    const project = await Project.findByPk(req.params.projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const env_variable = String(req.params.key || "").trim();
    if (!env_variable) return res.status(400).json({ error: "key param is required" });

    const deleted = await Environment.destroy({
      where: { project_id: project.id, profile_id: profileId, env_variable },
    });

    if (!deleted)
      return res.status(404).json({ error: "Environment variable not found" });
    res.json({ message: "Environment variable deleted" });
  } catch (error) {
    console.error("Error deleting env var:", error);
    res.status(500).json({ error: "Failed to delete environment variable" });
  }
});

export default router;
