import express from "express";
import { Project, User, Environment } from "../models/index.js";

const router = express.Router();

const isUnknownColumnError = (error, columnName) => {
  const msg = error?.original?.sqlMessage || error?.parent?.sqlMessage || error?.message || '';
  return typeof msg === 'string' && msg.includes('Unknown column') && msg.includes(columnName);
};

const sanitizeProject = (projectInstanceOrJson) => {
  const json = typeof projectInstanceOrJson?.toJSON === 'function'
    ? projectInstanceOrJson.toJSON()
    : { ...(projectInstanceOrJson || {}) };

  // Removed from API surface
  delete json.jenkins_job;
  delete json.status;
  // Keep environment payload in API; required by environment management UI

  if (Array.isArray(json.environments)) {
    // Present consistent API shape to frontend
    json.environments = json.environments.map((e) => ({
      id: e.id,
      key: e.env_variable,
      value: e.env,
    }));
  }

  return json;
};

// GET /api/projects - Get all projects
router.get("/", async (req, res) => {
  try {
    const projects = await Project.findAll({
      attributes: { exclude: ['jenkins_job', 'status'] },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email','first_name','last_name'],
        },
        {
          model: Environment,
          as: 'environments',
          attributes: ['id', 'env_variable', 'env'],
          required: false,
        },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json(projects.map(sanitizeProject));
  } catch (error) {
    // Backward-compatible fallback when DB schema hasn't been updated yet.
    if (isUnknownColumnError(error, 'Project.env_name')) {
      try {
        const projects = await Project.findAll({
          attributes: { exclude: ['jenkins_job', 'status', 'env_name'] },
          include: [
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'username', 'email', 'first_name', 'last_name'],
            },
          ],
          order: [['created_at', 'DESC']],
        });
        return res.json(projects.map(sanitizeProject));
      } catch (fallbackError) {
        console.error("Error fetching projects (fallback):", fallbackError);
      }
    }
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// GET /api/projects/:id - Get a specific project
router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      attributes: { exclude: ['jenkins_job', 'status'] },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email','first_name','last_name'],
        },
        {
          model: Environment,
          as: 'environments',
          attributes: ['id', 'env_variable', 'env'],
          required: false,
        },
      ],
    });
    
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    res.json(sanitizeProject(project));
  } catch (error) {
    if (isUnknownColumnError(error, 'Project.env_name') || isUnknownColumnError(error, 'env_name')) {
      try {
        const project = await Project.findByPk(req.params.id, {
          attributes: { exclude: ['jenkins_job', 'status', 'env_name'] },
          include: [
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'username', 'email', 'first_name', 'last_name'],
            },
          ],
        });

        if (!project) {
          return res.status(404).json({ error: "Project not found" });
        }

        return res.json(sanitizeProject(project));
      } catch (fallbackError) {
        console.error("Error fetching project (fallback):", fallbackError);
      }
    }
    console.error("Error fetching project:", error);
    res.status(500).json({ error: "Failed to fetch project" });
  }
});

// POST /api/projects - Create a new project
router.post("/", async (req, res) => {
  try {
    const { name, description, repository_url, created_by, short_code, env_name, tag: tagRaw } = req.body;
  
    if (!name || !repository_url || !short_code || !env_name) {
      return res.status(400).json({ error: "Name, repository_url, short_code, and env_name are required" });
    }

    const tag = tagRaw === 'backend' ? 'backend' : 'frontend';

    const project = await Project.create({
      name,
      description,
      repository_url,
      tag,
      env_name,
      created_by: Number.parseInt(created_by, 10) || 1,
      short_code,
    });

    res.status(201).json(sanitizeProject(project));
  } catch (error) {
    console.error("Error creating project:", error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: "Project name already exists" });
    }
    res.status(500).json({ error: "Failed to create project" });
  }
});

// PUT /api/projects/:id - Update a project
router.put("/:id", async (req, res) => {
  try {
    const { name, description, repository_url, short_code, tag: tagRaw } = req.body;
    
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const updates = {
      name,
      description,
      repository_url,
      short_code,
    };
    if (tagRaw === 'frontend' || tagRaw === 'backend') {
      updates.tag = tagRaw;
    }

    await project.update(updates);

    res.json(sanitizeProject(project));
  } catch (error) {
    console.error("Error updating project:", error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: "Project name already exists" });
    }
    res.status(500).json({ error: "Failed to update project" });
  }
});

// DELETE /api/projects/:id - Delete a project
router.delete("/:id", async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    await project.destroy();
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

// PUT /api/projects/:id/environments - Update environments for a project
router.put("/:id/environments", async (req, res) => {
  try {
    let project;
    try {
      project = await Project.findByPk(req.params.id);
    } catch (e) {
      if (isUnknownColumnError(e, 'Project.env_name') || isUnknownColumnError(e, 'env_name')) {
        project = await Project.findByPk(req.params.id, {
          attributes: { exclude: ['env_name'] },
        });
      } else {
        throw e;
      }
    }
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const { environments } = req.body; // Array of { key, value } objects (preferred) or string format

    // Parse environments if it's a string (text format)
    let environmentArray = [];
    if (typeof environments === 'string') {
      // Parse text format: KEY1=value1\nKEY2=value2
      const lines = environments.split('\n').filter(line => line.trim());
      environmentArray = lines.map(line => {
        const [key, ...valueParts] = line.split('=');
        return {
          env_variable: key?.trim() || '',
          env: valueParts.join('=').trim() || ''
        };
      }).filter(env => env.env_variable); // Filter out empty keys
    } else if (Array.isArray(environments)) {
      environmentArray = environments
        .map((item) => {
          // Accept either { key, value } or legacy { env_variable, env }
          const env_variable = (item?.key ?? item?.env_variable ?? '').trim?.() ?? '';
          const env = item?.value ?? item?.env ?? '';
          return { env_variable, env };
        })
        .filter((env) => env.env_variable);
    }

    const missingValue = environmentArray.find(
      (row) => !String(row.env ?? "").trim(),
    );
    if (missingValue) {
      return res.status(400).json({
        error: "Each environment variable must have a non-empty value",
      });
    }

    const envKeys = environmentArray.map((row) => row.env_variable);
    if (new Set(envKeys).size !== envKeys.length) {
      return res.status(400).json({
        error: "Duplicate environment variable keys are not allowed for a project",
      });
    }

    // Ensure env_name exists on project (used as relational key)
    const envName = project.env_name || project.short_code || String(project.id);
    if (!project.env_name) {
      await project.update({ env_name: envName });
    }

    // Replace all existing env vars for this project (scoped by project_id)
    await Environment.destroy({ where: { project_id: project.id } });
    if (environmentArray.length > 0) {
      await Environment.bulkCreate(
        environmentArray.map((env) => ({
          project_id: project.id,
          env_name: envName,
          env_variable: env.env_variable,
          env: String(env.env ?? "").trim(),
        })),
        { validate: true }
      );
    }

    // Fetch updated project with environments
    const updatedProject = await Project.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email','first_name','last_name'],
        },
        {
          model: Environment,
          as: 'environments',
          attributes: ['id', 'env_variable', 'env'],
          required: false,
        },
      ],
    });

    res.json(sanitizeProject(updatedProject));
  } catch (error) {
    console.error("Error updating project environments:", error);
    res.status(500).json({ error: "Failed to update project environments" });
  }
});

export default router;