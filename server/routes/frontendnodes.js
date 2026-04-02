import express from "express";
import { FrontendNode, Project, UrlConfig, User, Environment, FrontendNodeEnvVar, FrontendNodeBuild } from "../models/index.js";

const router = express.Router();

// GET /api/frontendnodes - Get all frontend nodes
router.get("/", async (req, res) => {
  try {
    const frontendNodes = await FrontendNode.findAll({
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
      frontendServices: frontendNodes,
      lastUpdated: new Date().toISOString(),
      version: "1.0",
      metadata: {
        description: "Frontend services configuration for preview builder",
        createdAt: frontendNodes.length > 0 ? frontendNodes[0].created_at : null,
        totalServices: frontendNodes.length,
        totalBranches: frontendNodes.length,
      }
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching frontend nodes:", error);
    res.status(500).json({ error: "Failed to fetch frontend nodes" });
  }
});

// GET /api/frontendnodes/:id/build-history
router.get("/:id/build-history", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid node id" });
    }
    const node = await FrontendNode.findByPk(id);
    if (!node) {
      return res.status(404).json({ error: "Frontend node not found" });
    }

    const rows = await FrontendNodeBuild.findAll({
      where: { frontnode_id: id },
      order: [["built_at", "DESC"]],
      limit: 100,
      attributes: ["id", "build_number", "built_at"],
    });

    res.json({
      builds: rows.map((r) => ({
        id: r.id,
        build_number: r.build_number,
        built_at: r.built_at,
      })),
    });
  } catch (error) {
    const msg = error?.original?.sqlMessage || error?.message || "";
    if (
      typeof msg === "string" &&
      (msg.includes("frontend_node_builds") ||
        msg.includes("Unknown table") ||
        msg.includes("doesn't exist"))
    ) {
      return res.json({ builds: [] });
    }
    console.error("Error fetching build history:", error);
    res.status(500).json({ error: "Failed to fetch build history" });
  }
});

// GET /api/frontendnodes/:id - Get a specific frontend node
router.get("/:id", async (req, res) => {
  try {
    const baseInclude = [
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'name', 'tag', 'short_code'],
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'email'],
      },
      {
        model: UrlConfig,
        as: 'urlConfigs',
        attributes: { exclude: [] }, // include all attributes
        where: { is_deleted: false },
        required: false,
      },
    ];

    let frontendNode;
    try {
      frontendNode = await FrontendNode.findByPk(req.params.id, {
        include: [
          ...baseInclude,
          {
            model: FrontendNodeEnvVar,
            as: 'envOverrides',
            attributes: ['id', 'key', 'value', 'created_at', 'updated_at'],
            required: false,
          },
        ],
      });
    } catch (err) {
      // If the override table migration hasn't run yet, retry without envOverrides include.
      const msg = err?.original?.sqlMessage || err?.message || '';
      if (typeof msg === 'string' && msg.includes('frontend_node_env_vars') && msg.includes("doesn't exist")) {
        frontendNode = await FrontendNode.findByPk(req.params.id, { include: baseInclude });
      } else {
        throw err;
      }
    }
    if (!frontendNode) {
      return res.status(404).json({ error: "Frontend node not found" });
    }
    
    res.json(frontendNode);
  } catch (error) {
    console.error("❌ Error fetching frontend node:", error);
    console.error("🔍 Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: "Failed to fetch frontend node" });
  }
});

// --- Node env overrides CRUD ---
// GET /api/frontendnodes/:id/env-vars
router.get("/:id/env-vars", async (req, res) => {
  try {
    const rows = await FrontendNodeEnvVar.findAll({
      where: { frontnode_id: parseInt(req.params.id, 10) },
      order: [['created_at', 'DESC']],
    });
    res.json({ env_vars: rows.map(r => ({ id: r.id, key: r.key, value: r.value })) });
  } catch (error) {
    console.error("Error fetching node env vars:", error);
    res.status(500).json({ error: "Failed to fetch node env vars" });
  }
});

// POST /api/frontendnodes/:id/env-vars (upsert)
router.post("/:id/env-vars", async (req, res) => {
  try {
    const frontnode_id = parseInt(req.params.id, 10);
    const { key, value } = req.body || {};
    if (!key) return res.status(400).json({ error: "key is required" });
    const envKey = String(key).trim();
    if (!envKey) return res.status(400).json({ error: "key is required" });
    const envVal = String(value ?? "").trim();
    if (!envVal) return res.status(400).json({ error: "value is required" });

    const node = await FrontendNode.findByPk(frontnode_id, {
      include: [{ model: Project, as: "project", attributes: ["id", "env_name"] }],
    });
    if (!node?.project?.env_name) {
      return res.status(400).json({ error: "Project env_name is not set" });
    }
    const projectEnvRow = await Environment.findOne({
      where: { project_id: node.project_id, env_variable: envKey },
    });
    if (!projectEnvRow) {
      return res.status(400).json({ error: "key must match a project environment variable" });
    }

    const [row, created] = await FrontendNodeEnvVar.findOrCreate({
      where: { frontnode_id, key: envKey },
      defaults: { frontnode_id, key: envKey, value: envVal },
    });
    if (!created) {
      await row.update({ value: envVal });
    }
    res.status(created ? 201 : 200).json({ env_var: { id: row.id, key: row.key, value: row.value } });
  } catch (error) {
    console.error("Error saving node env var:", error);
    res.status(500).json({ error: "Failed to save node env var" });
  }
});

// PUT /api/frontendnodes/:id/env-vars/:key
router.put("/:id/env-vars/:key", async (req, res) => {
  try {
    const frontnode_id = parseInt(req.params.id, 10);
    const envKey = String(req.params.key || '').trim();
    if (!envKey) return res.status(400).json({ error: "key param is required" });
    const { value } = req.body || {};

    const row = await FrontendNodeEnvVar.findOne({ where: { frontnode_id, key: envKey } });
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

// DELETE /api/frontendnodes/:id/env-vars/:key
router.delete("/:id/env-vars/:key", async (req, res) => {
  try {
    const frontnode_id = parseInt(req.params.id, 10);
    const envKey = String(req.params.key || '').trim();
    if (!envKey) return res.status(400).json({ error: "key param is required" });
    const deleted = await FrontendNodeEnvVar.destroy({ where: { frontnode_id, key: envKey } });
    if (!deleted) return res.status(404).json({ error: "Env var not found" });
    res.json({ message: "Env var deleted" });
  } catch (error) {
    console.error("Error deleting node env var:", error);
    res.status(500).json({ error: "Failed to delete node env var" });
  }
});
// GET /api/frontendnodes/project/:projectId - Get all frontend nodes by projectId
router.get("/project/:projectId", async (req, res) => {
  try {
    const frontendNodes = await FrontendNode.findAll({
      where: { project_id: req.params.projectId, is_deleted: false },
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

    

    res.json(frontendNodes);
  } catch (error) {
    console.error("Error fetching frontend nodes by projectId:", error);
    res.status(500).json({ error: "Failed to fetch frontend nodes" });
  }
});

// POST /api/frontendnodes - Create a new frontend node
router.post("/", async (req, res) => {
  try {
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
     } = req.body?.data;

    // Gate node creation until project has environments configured
    const project = await Project.findByPk(project_id);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    if (!project.env_name) {
      return res.status(400).json({ error: "Project environment name is not set. Please configure environments first." });
    }
    const envCount = await Environment.count({ where: { project_id: project.id } });
    if (envCount === 0) {
      return res.status(400).json({ error: "Project environments are empty. Please add at least one environment variable before adding nodes." });
    }

    const frontendNode = await FrontendNode.create({
      type,
      repository_name,
      repo_url,
      env_name,
      description,
      service_name,
      project_id,
      created_by,
      branch_name,
      is_deleted: false,
      });
    res.status(201).json({ message: "Frontend service saved successfully", data: frontendNode });
  } catch (error) {
    console.error("Error creating frontend service:", error);
    res.status(500).json({ error: "Failed to create frontend service" });
  }
});


// PUT /api/frontendnodes/:id - Update a frontend node
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
    } = req.body;
    
    const frontendNode = await FrontendNode.findByPk(req.params.id);
    if (!frontendNode) {
      return res.status(404).json({ error: "Frontend node not found" });
    }

    await frontendNode.update({
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
    });

    res.json({ message: "Frontend node updated successfully", data: frontendNode });
  } catch (error) {
    console.error("Error updating frontend node:", error);
    res.status(500).json({ error: "Failed to update frontend node" });
  }
});

// DELETE /api/frontendnodes - Clear all frontend nodes
router.delete("/", async (req, res) => {
  try {
    await FrontendNode.destroy({ where: {} });
    
    const response = {
      frontendServices: [],
      lastUpdated: new Date().toISOString(),
      version: "1.0",
      metadata: {
        description: "Frontend services configuration for preview builder",
        createdAt: null,
        totalServices: 0,
        totalBranches: 0,
      }
    };

    res.json({ message: "All frontend services cleared successfully", data: response });
  } catch (error) {
    console.error("Error clearing frontend services:", error);
    res.status(500).json({ error: "Failed to clear frontend services" });
  }
});

// DELETE /api/frontendnodes/:id - Delete a specific frontend node
router.delete("/:id", async (req, res) => {
  try {
    const frontendNode = await FrontendNode.findByPk(req.params.id);
    if (!frontendNode) {
      return res.status(404).json({ error: "Frontend node not found" });
    }

    await frontendNode.update({ is_deleted: true });
    res.json({ message: "Frontend node deleted successfully" });
  } catch (error) {
    console.error("Error deleting frontend node:", error);
    res.status(500).json({ error: "Failed to delete frontend node" });
  }
});

export default router;