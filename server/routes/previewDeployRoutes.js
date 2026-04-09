import express from "express";
import { Op } from "sequelize";
import {
  Node,
  Project,
  User,
  Environment,
  NodeEnvVar,
  NodeBuild,
  ProjectEnvProfile,
} from "../models/index.js";
import {
  getDefaultEnvProfile,
  resolveProfileIdForNode,
} from "../utils/resolveProjectEnvProfile.js";
import { allocateNodePort } from "../utils/allocateNodePort.js";
import { deriveNodeDomainSlug } from "../utils/deriveNodeDomainSlug.js";
import { checkNodeServiceNameUniqueInProject } from "../utils/checkNodeServiceNameUniqueInProject.js";
import { refreshStatsAfterMutation } from "../services/statsService.js";

const router = express.Router();
router.use(refreshStatsAfterMutation);

const FE = { role: "frontend", is_deleted: false };
/** Web + API preview service nodes: same deploy/env/build/update/delete by id */
const PREVIEW_DEPLOY = {
  role: { [Op.in]: ["frontend", "api_service"] },
  is_deleted: false,
};

/** profileId from query/body must exist on this project */
async function resolveExplicitNodeEnvProfileId(node, requested) {
  if (requested == null || requested === "") return null;
  const id = Number(requested);
  if (!Number.isFinite(id)) return null;
  const row = await ProjectEnvProfile.findOne({
    where: { id, project_id: node.project_id },
  });
  return row?.id ?? null;
}

function withUrlConfigsJson(n) {
  if (!n) return n;
  const plain = n.get ? n.get({ plain: true }) : { ...n };
  const raw = plain.url_configs;
  plain.urlConfigs = Array.isArray(raw) ? raw : [];
  delete plain.url_configs;
  return plain;
}

// GET …/ — all web preview nodes
router.get("/", async (req, res) => {
  try {
    const services = await Node.findAll({
      where: FE,
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'tag'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    // Format response similar to backend nodes
    const response = {
      services,
      webServices: services,
      lastUpdated: new Date().toISOString(),
      version: "1.0",
      metadata: {
        description: "Web preview nodes",
        createdAt: services.length > 0 ? services[0].created_at : null,
        totalServices: services.length,
        totalBranches: services.length,
      }
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching web preview nodes:", error);
    res.status(500).json({ error: "Failed to fetch web preview nodes" });
  }
});

// GET …/:id/build-history
router.get("/:id/build-history", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid node id" });
    }
    const node = await Node.findOne({ where: { id, ...PREVIEW_DEPLOY } });
    if (!node) {
      return res.status(404).json({ error: "Preview node not found" });
    }

    const rows = await NodeBuild.findAll({
      where: { node_id: id },
      order: [["built_at", "DESC"]],
      limit: 100,
      attributes: [
        "id",
        "build_number",
        "jenkins_build_number",
        "built_at",
        "status",
      ],
    });

    res.json({
      builds: rows.map((r) => ({
        id: r.id,
        build_number: r.build_number,
        jenkins_build_number: r.jenkins_build_number ?? null,
        built_at: r.built_at,
        status: r.status ?? "success",
      })),
    });
  } catch (error) {
    const msg = error?.original?.sqlMessage || error?.message || "";
    if (
      typeof msg === "string" &&
      (msg.includes("node_builds") ||
        msg.includes("preview_node_web_builds") ||
        msg.includes("frontend_node_builds") ||
        msg.includes("Unknown table") ||
        msg.includes("doesn't exist"))
    ) {
      return res.json({ builds: [] });
    }
    if (
      typeof msg === "string" &&
      msg.includes("Unknown column") &&
      msg.includes("jenkins_build_number")
    ) {
      try {
        const id = parseInt(req.params.id, 10);
        const rows = await NodeBuild.findAll({
          where: { node_id: id },
          order: [["built_at", "DESC"]],
          limit: 100,
          attributes: ["id", "build_number", "built_at", "status"],
        });
        return res.json({
          builds: rows.map((r) => ({
            id: r.id,
            build_number: r.build_number,
            jenkins_build_number: null,
            built_at: r.built_at,
            status: r.status ?? "success",
          })),
        });
      } catch (errJ) {
        console.error("Error fetching build history (no jenkins col):", errJ);
      }
    }
    if (
      typeof msg === "string" &&
      msg.includes("Unknown column") &&
      msg.includes("status")
    ) {
      try {
        const id = parseInt(req.params.id, 10);
        const rows = await NodeBuild.findAll({
          where: { node_id: id },
          order: [["built_at", "DESC"]],
          limit: 100,
          attributes: ["id", "build_number", "built_at"],
        });
        return res.json({
          builds: rows.map((r) => ({
            id: r.id,
            build_number: r.build_number,
            built_at: r.built_at,
            status: "success",
          })),
        });
      } catch (err2) {
        console.error("Error fetching build history (fallback):", err2);
      }
    }
    console.error("Error fetching build history:", error);
    res.status(500).json({ error: "Failed to fetch build history" });
  }
});

// GET …/:id — single web preview node
router.get("/:id", async (req, res) => {
  try {
    const baseInclude = [
      {
        model: Project,
        as: "project",
        attributes: ["id", "name", "tag", "short_code"],
      },
      {
        model: User,
        as: "creator",
        attributes: ["id", "username", "email"],
      },
      {
        model: ProjectEnvProfile,
        as: "envProfile",
        attributes: ["id", "name", "slug", "is_default"],
        required: false,
      },
    ];

    let webNode;
    try {
      webNode = await Node.findOne({
        where: { id: req.params.id, ...PREVIEW_DEPLOY },
        include: [
          ...baseInclude,
          {
            model: NodeEnvVar,
            as: "envOverrides",
            attributes: [
              "id",
              "key",
              "value",
              "project_env_profile_id",
              "created_at",
              "updated_at",
            ],
            required: false,
          },
        ],
      });
    } catch (err) {
      const msg = err?.original?.sqlMessage || err?.message || '';
      if (
        typeof msg === 'string' &&
        (msg.includes('node_env_vars') || msg.includes('preview_node_web_env_vars') || msg.includes('frontend_node_env_vars')) &&
        msg.includes("doesn't exist")
      ) {
        webNode = await Node.findOne({
          where: { id: req.params.id, ...PREVIEW_DEPLOY },
          include: baseInclude,
        });
      } else {
        throw err;
      }
    }
    if (!webNode) {
      return res.status(404).json({ error: "Preview node not found" });
    }

    const plain = withUrlConfigsJson(webNode);
    const resolvedProfile = await resolveProfileIdForNode(webNode);
    if (Array.isArray(plain.envOverrides) && resolvedProfile != null) {
      plain.envOverrides = plain.envOverrides.filter(
        (e) => Number(e.project_env_profile_id) === Number(resolvedProfile),
      );
    }

    res.json(plain);
  } catch (error) {
    console.error("❌ Error fetching web preview node:", error);
    console.error("🔍 Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: "Failed to fetch web preview node" });
  }
});

// --- Node env overrides CRUD ---
// GET …/:id/env-vars?profileId=optional
router.get("/:id/env-vars", async (req, res) => {
  try {
    const node_id = parseInt(req.params.id, 10);
    if (!Number.isFinite(node_id)) {
      return res.status(400).json({ error: "Invalid node id" });
    }
    const node = await Node.findOne({
      where: { id: node_id, ...PREVIEW_DEPLOY },
      attributes: ["id", "project_id", "project_env_profile_id"],
    });
    if (!node) {
      return res.status(404).json({ error: "Preview node not found" });
    }
    let profileId;
    if (req.query.profileId != null && req.query.profileId !== "") {
      profileId = await resolveExplicitNodeEnvProfileId(node, req.query.profileId);
      if (profileId == null) {
        return res.status(400).json({ error: "Invalid profileId for this project" });
      }
    } else {
      profileId = await resolveProfileIdForNode(node);
      if (profileId == null) {
        return res
          .status(400)
          .json({ error: "No environment profile for this node" });
      }
    }
    const rows = await NodeEnvVar.findAll({
      where: { node_id, project_env_profile_id: profileId },
      order: [["created_at", "DESC"]],
    });
    res.json({
      env_vars: rows.map((r) => ({
        id: r.id,
        key: r.key,
        value: r.value,
        project_env_profile_id: r.project_env_profile_id,
      })),
    });
  } catch (error) {
    console.error("Error fetching node env vars:", error);
    res.status(500).json({ error: "Failed to fetch node env vars" });
  }
});

// POST …/:id/env-vars (upsert)
router.post("/:id/env-vars", async (req, res) => {
  try {
    const node_id = parseInt(req.params.id, 10);
    const { key, value } = req.body || {};
    if (!key) return res.status(400).json({ error: "key is required" });
    const envKey = String(key).trim();
    if (!envKey) return res.status(400).json({ error: "key is required" });
    const envVal = String(value ?? "").trim();
    if (!envVal) return res.status(400).json({ error: "value is required" });

    const node = await Node.findOne({
      where: { id: node_id, ...PREVIEW_DEPLOY },
      include: [
        { model: Project, as: "project", attributes: ["id", "env_name"] },
        {
          model: ProjectEnvProfile,
          as: "envProfile",
          attributes: ["id"],
          required: false,
        },
      ],
    });
    let profileId;
    if (req.body?.profileId != null && req.body.profileId !== "") {
      profileId = await resolveExplicitNodeEnvProfileId(node, req.body.profileId);
      if (profileId == null) {
        return res.status(400).json({ error: "Invalid profileId for this project" });
      }
    } else {
      profileId = await resolveProfileIdForNode(node);
      if (profileId == null) {
        return res.status(400).json({ error: "No environment profile for this project" });
      }
    }

    const inSelected = await Environment.findOne({
      where: {
        project_id: node.project_id,
        profile_id: profileId,
        env_variable: envKey,
      },
    });

    const existingNodeKey = await NodeEnvVar.findOne({
      where: { node_id, key: envKey, project_env_profile_id: profileId },
    });

    const keyAllowed = !!inSelected || !!existingNodeKey;

    if (!keyAllowed) {
      return res.status(400).json({
        error:
          "Key must exist on this environment profile or already be an override on this node for this profile.",
      });
    }

    const [row, created] = await NodeEnvVar.findOrCreate({
      where: { node_id, key: envKey, project_env_profile_id: profileId },
      defaults: {
        node_id,
        key: envKey,
        value: envVal,
        project_env_profile_id: profileId,
      },
    });
    if (!created) {
      await row.update({ value: envVal });
    }
    res
      .status(created ? 201 : 200)
      .json({
        env_var: {
          id: row.id,
          key: row.key,
          value: row.value,
          project_env_profile_id: row.project_env_profile_id,
        },
      });
  } catch (error) {
    console.error("Error saving node env var:", error);
    res.status(500).json({ error: "Failed to save node env var" });
  }
});

// PUT …/:id/env-vars/:key?profileId=
router.put("/:id/env-vars/:key", async (req, res) => {
  try {
    const node_id = parseInt(req.params.id, 10);
    const envKey = String(req.params.key || '').trim();
    if (!envKey) return res.status(400).json({ error: "key param is required" });
    const { value } = req.body || {};

    const node = await Node.findOne({
      where: { id: node_id, ...PREVIEW_DEPLOY },
      attributes: ["id", "project_id", "project_env_profile_id"],
    });
    if (!node) {
      return res.status(404).json({ error: "Preview node not found" });
    }
    let profileId;
    if (req.query.profileId != null && req.query.profileId !== "") {
      profileId = await resolveExplicitNodeEnvProfileId(node, req.query.profileId);
      if (profileId == null) {
        return res.status(400).json({ error: "Invalid profileId for this project" });
      }
    } else {
      profileId = await resolveProfileIdForNode(node);
      if (profileId == null) {
        return res.status(400).json({ error: "No environment profile for this node" });
      }
    }

    const row = await NodeEnvVar.findOne({
      where: { node_id, key: envKey, project_env_profile_id: profileId },
    });
    if (!row) return res.status(404).json({ error: "Env var not found" });
    const envVal = String(value ?? "").trim();
    if (!envVal) return res.status(400).json({ error: "value is required" });
    await row.update({ value: envVal });
    res.json({ env_var: { id: row.id, key: row.key, value: row.value } });
  } catch (error) {
    console.error("Error updating node env var:", error);
    res.status(500).json({ error: "Failed to update node env var" });
  }
});

// DELETE …/:id/env-vars/:key?profileId=
router.delete("/:id/env-vars/:key", async (req, res) => {
  try {
    const node_id = parseInt(req.params.id, 10);
    const envKey = String(req.params.key || '').trim();
    if (!envKey) return res.status(400).json({ error: "key param is required" });

    const node = await Node.findOne({
      where: { id: node_id, ...PREVIEW_DEPLOY },
      attributes: ["id", "project_id", "project_env_profile_id"],
    });
    if (!node) {
      return res.status(404).json({ error: "Preview node not found" });
    }
    let profileId;
    if (req.query.profileId != null && req.query.profileId !== "") {
      profileId = await resolveExplicitNodeEnvProfileId(node, req.query.profileId);
      if (profileId == null) {
        return res.status(400).json({ error: "Invalid profileId for this project" });
      }
    } else {
      profileId = await resolveProfileIdForNode(node);
      if (profileId == null) {
        return res.status(400).json({ error: "No environment profile for this node" });
      }
    }

    const deleted = await NodeEnvVar.destroy({
      where: { node_id, key: envKey, project_env_profile_id: profileId },
    });
    if (!deleted) return res.status(404).json({ error: "Env var not found" });
    res.json({ message: "Env var deleted" });
  } catch (error) {
    console.error("Error deleting node env var:", error);
    res.status(500).json({ error: "Failed to delete node env var" });
  }
});
// GET …/project/:projectId
router.get("/project/:projectId", async (req, res) => {
  try {
    const rows = await Node.findAll({
      where: { project_id: req.params.projectId, ...FE },
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'tag','short_code'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    

    res.json(rows);
  } catch (error) {
    console.error("Error fetching web preview nodes by projectId:", error);
    res.status(500).json({ error: "Failed to fetch web preview nodes" });
  }
});

// POST …/ — create web preview node
router.post("/", async (req, res) => {
  try {
    const bodyData = req.body?.data ?? {};
    const {
      type,
      repository_name,
      repo_url,
      env_name,
      description,
      service_name,
      project_id,
      created_by,
      branch_name,
    } = bodyData;

    // Gate node creation until project has environments configured
    const project = await Project.findByPk(project_id);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    const defaultProf = await getDefaultEnvProfile(project.id);
    if (!defaultProf) {
      return res.status(400).json({
        error:
          "Project has no environment profiles. Please configure environments first.",
      });
    }
    const envCount = await Environment.count({
      where: { project_id: project.id, profile_id: defaultProf.id },
    });
    if (envCount === 0) {
      return res.status(400).json({
        error:
          "Default environment profile has no variables. Add at least one variable before adding nodes.",
      });
    }

    const bodyProfileId =
      req.body?.data?.project_env_profile_id ??
      req.body?.data?.projectEnvProfileId;
    let resolvedProfileId = defaultProf.id;
    if (bodyProfileId != null && bodyProfileId !== "") {
      const p = await ProjectEnvProfile.findOne({
        where: {
          id: Number(bodyProfileId),
          project_id: project.id,
        },
      });
      if (p) resolvedProfileId = p.id;
    }

    const nameCheck = await checkNodeServiceNameUniqueInProject(
      project_id,
      service_name,
      null,
      branch_name,
    );
    if (!nameCheck.ok) {
      return res.status(400).json({ error: nameCheck.error, field: nameCheck.field });
    }

    const PORT_RETRIES = 12;
    let createdWebNode;
    for (let attempt = 0; attempt < PORT_RETRIES; attempt++) {
      const assignedPort = await allocateNodePort();
      const domain_name = deriveNodeDomainSlug({
        shortCode: project.short_code,
        branchName: branch_name,
        port: assignedPort,
        projectTag: project.tag,
      });
      try {
        createdWebNode = await Node.create({
          role: "frontend",
          type,
          repository_name,
          repo_url,
          env_name,
          description,
          service_name,
          project_id,
          created_by,
          branch_name,
          port: assignedPort,
          domain_name,
          is_deleted: false,
          project_env_profile_id: resolvedProfileId,
        });
        break;
      } catch (createErr) {
        if (
          createErr?.name === "SequelizeUniqueConstraintError" &&
          attempt < PORT_RETRIES - 1
        ) {
          continue;
        }
        throw createErr;
      }
    }
    res.status(201).json({ message: "Web preview node saved successfully", data: createdWebNode });
  } catch (error) {
    console.error("Error creating web preview node:", error);
    res.status(500).json({ error: "Failed to create web preview node" });
  }
});


// PUT …/:id — update web preview node
router.put("/:id", async (req, res) => {
  try {
    const {
      service_name,
      repository_name,
      jenkins_job,
      build_status,
      build_number,
      build_url,
      branch_name,
      domain_name,
      port,
      repo_url,
      preview_link,
      env_name,
      project_id,
      project_env_profile_id,
    } = req.body;
    
    const webNode = await Node.findOne({ where: { id: req.params.id, ...PREVIEW_DEPLOY } });
    if (!webNode) {
      return res.status(404).json({ error: "Preview node not found" });
    }

    const targetProjectId =
      project_id !== undefined && project_id !== null
        ? project_id
        : webNode.project_id;
    const nextServiceName =
      service_name !== undefined && service_name !== null
        ? service_name
        : webNode.service_name;
    const nextBranch =
      branch_name !== undefined && branch_name !== null
        ? branch_name
        : webNode.branch_name;
    const nameCheck = await checkNodeServiceNameUniqueInProject(
      targetProjectId,
      nextServiceName,
      webNode.id,
      nextBranch,
    );
    if (!nameCheck.ok) {
      return res.status(400).json({ error: nameCheck.error, field: nameCheck.field });
    }

    const updatePayload = {
      service_name,
      repository_name,
      jenkins_job,
      build_status,
      build_number,
      build_url,
      branch_name,
      domain_name,
      port,
      repo_url,
      preview_link,
      env_name,
      project_id,
    };
    if (project_env_profile_id !== undefined) {
      const pid = Number(project_env_profile_id);
      if (Number.isFinite(pid)) {
        const prof = await ProjectEnvProfile.findOne({
          where: {
            id: pid,
            project_id:
              project_id !== undefined && project_id !== null
                ? project_id
                : webNode.project_id,
          },
        });
        updatePayload.project_env_profile_id = prof ? prof.id : null;
      } else if (project_env_profile_id === null) {
        updatePayload.project_env_profile_id = null;
      }
    }

    await webNode.update(updatePayload);

    res.json({ message: "Web preview node updated successfully", data: withUrlConfigsJson(webNode) });
  } catch (error) {
    console.error("Error updating web preview node:", error);
    res.status(500).json({ error: "Failed to update web preview node" });
  }
});

// DELETE …/ — clear all web preview nodes
router.delete("/", async (req, res) => {
  try {
    await Node.destroy({ where: { role: "frontend" } });
    
    const response = {
      services: [],
      webServices: [],
      lastUpdated: new Date().toISOString(),
      version: "1.0",
      metadata: {
        description: "Web preview nodes",
        createdAt: null,
        totalServices: 0,
        totalBranches: 0,
      }
    };

    res.json({ message: "All web preview nodes cleared successfully", data: response });
  } catch (error) {
    console.error("Error clearing web preview nodes:", error);
    res.status(500).json({ error: "Failed to clear web preview nodes" });
  }
});

// DELETE …/:id — hard delete (child rows with ON DELETE CASCADE: builds, env vars, branches)
router.delete("/:id", async (req, res) => {
  try {
    const webNode = await Node.findOne({ where: { id: req.params.id, ...PREVIEW_DEPLOY } });
    if (!webNode) {
      return res.status(404).json({ error: "Preview node not found" });
    }

    await webNode.destroy();
    res.json({ message: "Preview node deleted successfully" });
  } catch (error) {
    console.error("Error deleting preview node:", error);
    res.status(500).json({ error: "Failed to delete preview node" });
  }
});

export default router;