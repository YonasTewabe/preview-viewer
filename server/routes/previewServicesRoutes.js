import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { Node, Project, User, ProjectEnvProfile } from "../models/index.js";
import { getDefaultEnvProfile } from "../utils/resolveProjectEnvProfile.js";
import { checkNodeServiceNameUniqueInProject } from "../utils/checkNodeServiceNameUniqueInProject.js";
import { allocateNodePort } from "../utils/allocateNodePort.js";
import { deriveNodeDomainSlug } from "../utils/deriveNodeDomainSlug.js";
import { refreshStatsAfterMutation } from "../services/statsService.js";

const router = express.Router();
router.use(refreshStatsAfterMutation);

const API_SVC = { role: "api_service", is_deleted: false };

const branchInclude = {
  model: Node,
  as: "branches",
  where: { role: "api_branch", is_deleted: false },
  attributes: [
    "id",
    "service_name",
    "description",
    "status",
    "domain_name",
    "port",
    "build_result",
    "build_number",
    "preview_link",
    "jenkins_job_url",
    "parent_node_id",
    "created_at",
    "updated_at",
  ],
  required: false,
};

function mapApiNodeBranches(row) {
  if (!row) return row;
  const p = row.get ? row.get({ plain: true }) : { ...row };
  if (Array.isArray(p.branches)) {
    p.branches = p.branches.map((b) => ({
      ...b,
      name: b.service_name,
      node_id: b.parent_node_id,
    }));
  }
  return p;
}

const PORT_CREATE_RETRIES = 12;

/**
 * Create an api_service row with a fresh preview port (never recycled while the
 * old row still holds a port) and a derived domain_name.
 */
async function createApiServiceWithAllocatedPort(rawPayload) {
  const project = await Project.findByPk(rawPayload.project_id);
  if (!project) {
    const err = new Error("Project not found");
    err.statusCode = 404;
    throw err;
  }
  const {
    port: _ignorePort,
    domain_name: _ignoreDomain,
    role: _ignoreRole,
    project_env_profile_id: _ignoreProf,
    projectEnvProfileId: _ignoreProf2,
    ...rest
  } = rawPayload;

  for (let attempt = 0; attempt < PORT_CREATE_RETRIES; attempt++) {
    const assignedPort = await allocateNodePort();
    const domain_name = deriveNodeDomainSlug({
      shortCode: project.short_code,
      branchName: rest.branch_name,
      port: assignedPort,
      projectTag: project.tag,
    });
    try {
      const defProf = await getDefaultEnvProfile(project.id);
      const bodyPid = rawPayload.project_env_profile_id ?? rawPayload.projectEnvProfileId;
      let profileId = defProf?.id ?? null;
      if (bodyPid != null && bodyPid !== "") {
        const p = await ProjectEnvProfile.findOne({
          where: { id: Number(bodyPid), project_id: project.id },
        });
        if (p) profileId = p.id;
      }
      return await Node.create({
        role: "api_service",
        ...rest,
        port: assignedPort,
        domain_name,
        is_deleted: false,
        status: rawPayload.status ?? "active",
        environment: rawPayload.environment ?? "preview",
        project_env_profile_id: profileId,
      });
    } catch (createErr) {
      if (
        createErr?.name === "SequelizeUniqueConstraintError" &&
        attempt < PORT_CREATE_RETRIES - 1
      ) {
        continue;
      }
      throw createErr;
    }
  }
  throw new Error("Could not create API service with a unique port");
}
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PREVIEW_API_NODES_SAMPLE_PATH = path.join(
  __dirname,
  "../../src/data/previewApiNodes.json",
);

// GET …/ — sample JSON when present; live lists use /project/:id and GET /:id.
router.get("/", async (req, res) => {
  try {
    const data = await fs.readFile(PREVIEW_API_NODES_SAMPLE_PATH, "utf8");
    const parsed = JSON.parse(data);
    const services = parsed.apiServices ?? parsed.backendServices ?? [];
    res.json({ ...parsed, services, apiServices: services });
  } catch (error) {
    console.error("Error reading preview API nodes sample file:", error);
    res.json({
      services: [],
      apiServices: [],
      backendServices: [],
      lastUpdated: null,
      version: "1.0",
      metadata: {
        description: "API preview nodes (sample file missing)",
        createdAt: null,
        totalServices: 0,
        totalBranches: 0
      }
    });
  }
});

/** All API-service preview nodes with build fields — used by dashboard (not the static sample `GET /`). */
router.get("/summary", async (req, res) => {
  try {
    const rows = await Node.findAll({
      where: { ...API_SVC },
      attributes: [
        "id",
        "project_id",
        "service_name",
        "branch_name",
        "build_status",
        "build_result",
        "build_number",
        "preview_link",
        "updated_at",
        "created_at",
      ],
      order: [["updated_at", "DESC"]],
    });
    res.json({
      services: rows.map((r) => r.get({ plain: true })),
    });
  } catch (error) {
    console.error("Error fetching preview-services summary:", error);
    res.status(500).json({ error: "Failed to fetch preview services summary" });
  }
});

// GET …/export — export from database
router.get("/export", async (req, res) => {
  try {
    const backendNodes = await Node.findAll({
      where: { ...API_SVC },
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

    // Transform database records to match the expected JSON format
    const backendServices = backendNodes.map(node => ({
      serviceName: node.service_name,
      defaultUrl: node.default_url,
      type: node.type,
      repo: node.repository_name,
      repoUrl: node.repo_url,
      envName: node.env_name,
      description: node.description,
      projectId: node.project_id,
      createdAt: node.created_at,
      status: node.status,
      environment: node.environment
    }));

    const exportData = {
      backendServices,
      lastUpdated: new Date().toISOString(),
      version: "1.0",
      metadata: {
        description: "Backend services configuration for preview builder",
        createdAt: backendNodes.length > 0 ? backendNodes[0].created_at : null,
        totalServices: backendServices.length,
        totalBranches: backendServices.length,
        exportedAt: new Date().toISOString()
      }
    };

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="backend-services-${new Date().toISOString().split('T')[0]}.json"`);
    
    res.json(exportData);
  } catch (error) {
    console.error("Error exporting backend services:", error);
    res.status(500).json({ error: "Failed to export backend services" });
  }
});

// GET /api/backendnodes/export/project/:projectId - Export backend services for a specific project
router.get("/export/project/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const backendNodes = await Node.findAll({
      where: { 
        project_id: projectId, 
        ...API_SVC,
      },
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

    // Transform database records to match the expected JSON format
    const backendServices = backendNodes.map(node => ({
      serviceName: node.service_name,
      defaultUrl: node.default_url,
      type: node.type,
      repo: node.repository_name,
      repoUrl: node.repo_url,
      envName: node.env_name,
      description: node.description,
      projectId: node.project_id,
      createdAt: node.created_at,
      status: node.status,
      environment: node.environment
    }));

    const exportData = {
      backendServices,
      lastUpdated: new Date().toISOString(),
      version: "1.0",
      metadata: {
        description: `Backend services configuration for project ${projectId}`,
        createdAt: backendNodes.length > 0 ? backendNodes[0].created_at : null,
        totalServices: backendServices.length,
        totalBranches: backendServices.length,
        exportedAt: new Date().toISOString(),
        projectId: parseInt(projectId)
      }
    };

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="backend-services-project-${projectId}-${new Date().toISOString().split('T')[0]}.json"`);
    
    res.json(exportData);
  } catch (error) {
    console.error("Error exporting backend services for project:", error);
    res.status(500).json({ error: "Failed to export backend services for project" });
  }
});

// POST /api/backendnodes/import - Import backend services from JSON
router.post("/import", async (req, res) => {
  try {
    const { backendServices, projectId, userId } = req.body;
    
    if (!Array.isArray(backendServices)) {
      return res.status(400).json({ error: "Backend services must be an array" });
    }

    if (!projectId) {
      return res.status(400).json({ error: "Project ID is required for import" });
    }

    const importedServices = [];
    const errors = [];

    for (const service of backendServices) {
      try {
        // Check if service already exists (by service name and project)
        const existingService = await Node.findOne({
          where: { 
            service_name: service.serviceName, 
            project_id: projectId,
            ...API_SVC,
          }
        });

        if (existingService) {
          // Update existing service
          await existingService.update({
            default_url: service.defaultUrl,
            type: service.type || 'api',
            repository_name: service.repo || service.repository_name,
            repo_url: service.repoUrl,
            env_name: service.envName,
            description: service.description,
            updated_at: new Date()
          });
          importedServices.push(existingService);
        } else {
          const newService = await createApiServiceWithAllocatedPort({
            service_name: service.serviceName,
            default_url: service.defaultUrl,
            type: service.type || "api",
            repository_name: service.repo || service.repository_name,
            repo_url: service.repoUrl,
            env_name: service.envName,
            description: service.description,
            branch_name: service.branchName ?? service.branch_name ?? "main",
            project_id: projectId,
            created_by: userId,
            status: "active",
            environment: "preview",
          });
          importedServices.push(newService);
        }
      } catch (serviceError) {
        console.error(`Error processing service ${service.serviceName}:`, serviceError);
        errors.push({
          serviceName: service.serviceName,
          error: serviceError.message
        });
      }
    }

    const response = {
      message: `Successfully imported ${importedServices.length} backend services`,
      importedCount: importedServices.length,
      totalCount: backendServices.length,
      errors: errors.length > 0 ? errors : undefined,
      importedServices: importedServices.map(service => ({
        id: service.id,
        serviceName: service.service_name,
        defaultUrl: service.default_url,
        type: service.type,
        repo: service.repository_name,
        repoUrl: service.repo_url,
        envName: service.env_name,
        description: service.description
      }))
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error importing backend services:", error);
    res.status(500).json({ error: "Failed to import backend services", details: error.message });
  }
});

// POST /api/backendnodes/import/bulk - Bulk import with conflict resolution
router.post("/import/bulk", async (req, res) => {
  try {
    const { backendServices, projectId, userId, conflictResolution = 'skip' } = req.body;
    
    if (!Array.isArray(backendServices)) {
      return res.status(400).json({ error: "Backend services must be an array" });
    }

    if (!projectId) {
      return res.status(400).json({ error: "Project ID is required for import" });
    }

    const importedServices = [];
    const skippedServices = [];
    const updatedServices = [];
    const errors = [];

    for (const service of backendServices) {
      try {
        // Check if service already exists
        const existingService = await Node.findOne({
          where: { 
            service_name: service.serviceName, 
            project_id: projectId,
            ...API_SVC,
          }
        });

        if (existingService) {
          if (conflictResolution === 'skip') {
            skippedServices.push({
              serviceName: service.serviceName,
              reason: 'Service already exists'
            });
            continue;
          } else if (conflictResolution === 'update') {
            // Update existing service
            await existingService.update({
              default_url: service.defaultUrl,
              type: service.type || 'api',
              repository_name: service.repo || service.repository_name,
              repo_url: service.repoUrl,
              env_name: service.envName,
              description: service.description,
              updated_at: new Date()
            });
            updatedServices.push(existingService);
          } else if (conflictResolution === 'overwrite') {
            // Delete existing and create new
            await existingService.update({ is_deleted: true });
            const newService = await createApiServiceWithAllocatedPort({
              service_name: service.serviceName,
              default_url: service.defaultUrl,
              type: service.type || "api",
              repository_name: service.repo || service.repository_name,
              repo_url: service.repoUrl,
              env_name: service.envName,
              description: service.description,
              branch_name: service.branchName ?? service.branch_name ?? "main",
              project_id: projectId,
              created_by: userId,
              status: "active",
              environment: "preview",
            });
            importedServices.push(newService);
          }
        } else {
          const newService = await createApiServiceWithAllocatedPort({
            service_name: service.serviceName,
            default_url: service.defaultUrl,
            type: service.type || "api",
            repository_name: service.repo || service.repository_name,
            repo_url: service.repoUrl,
            env_name: service.envName,
            description: service.description,
            branch_name: service.branchName ?? service.branch_name ?? "main",
            project_id: projectId,
            created_by: userId,
            status: "active",
            environment: "preview",
          });
          importedServices.push(newService);
        }
      } catch (serviceError) {
        console.error(`Error processing service ${service.serviceName}:`, serviceError);
        errors.push({
          serviceName: service.serviceName,
          error: serviceError.message
        });
      }
    }

    const response = {
      message: `Import completed successfully`,
      summary: {
        imported: importedServices.length,
        updated: updatedServices.length,
        skipped: skippedServices.length,
        errors: errors.length
      },
      details: {
        importedServices: importedServices.map(service => ({
          id: service.id,
          serviceName: service.service_name,
          defaultUrl: service.default_url,
          type: service.type,
          repo: service.repository_name,
          repoUrl: service.repo_url,
          envName: service.env_name,
          description: service.description
        })),
        updatedServices: updatedServices.map(service => ({
          id: service.id,
          serviceName: service.service_name,
          defaultUrl: service.default_url,
          type: service.type,
          repo: service.repository_name,
          repoUrl: service.repo_url,
          envName: service.env_name,
          description: service.description
        })),
        skippedServices,
        errors: errors.length > 0 ? errors : undefined
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error bulk importing backend services:", error);
    res.status(500).json({ error: "Failed to bulk import backend services", details: error.message });
  }
});

router.get("/project/:projectId", async (req, res) => {
  try {
    const backendNodes = await Node.findAll({
      where: { project_id: req.params.projectId, ...API_SVC },
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
        branchInclude,
      ],
    });

    res.json(backendNodes.map((n) => mapApiNodeBranches(n)));
  } catch (error) {
    console.error("Error fetching backend nodes by projectId:", error);
    res.status(500).json({ error: "Failed to fetch backend nodes" });
  }
});

// GET /api/backendnodes/:id — single node (for detail page & legacy redirects). Must stay after /project/:projectId.
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }
    const backendNode = await Node.findOne({
      where: { id, ...API_SVC },
      include: [
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
        branchInclude,
      ],
    });
    if (!backendNode)
      return res.status(404).json({ error: "Backend node not found" });
    res.json(mapApiNodeBranches(backendNode));
  } catch (error) {
    console.error("Error fetching backend node:", error);
    res.status(500).json({ error: "Failed to fetch backend node" });
  }
});

// POST /api/backendnodes - Save backend services
router.post("/", async (req, res) => {
  try {
    const { data } = req.body;
    const svcName = data?.service_name ?? data?.serviceName;
    const nameCheck = await checkNodeServiceNameUniqueInProject(
      data?.project_id,
      svcName,
      null,
      data?.branch_name,
    );
    if (!nameCheck.ok) {
      return res.status(400).json({ error: nameCheck.error, field: nameCheck.field });
    }
    const created = await createApiServiceWithAllocatedPort({
      ...data,
      role: "api_service",
    });
    res.json({ message: "Backend services saved successfully", data: created });
  } catch (error) {
    console.error("Error saving backend services:", error);
    if (error.statusCode === 404) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to save backend services" });
  }
});


// PUT /api/backendnodes - Update backend services
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const data = req.body;
    const backendNode = await Node.findOne({ where: { id, ...API_SVC } });
    if (!backendNode) {
      return res.status(404).json({ error: "Backend node not found" });
    }
    if(!data){
      return res.status(400).json({ error: "Data is required" });
    }
    const mergedProjectId =
      data.project_id !== undefined ? data.project_id : backendNode.project_id;
    const mergedName =
      data.service_name !== undefined
        ? data.service_name
        : data.serviceName !== undefined
          ? data.serviceName
          : backendNode.service_name;
    const mergedBranch =
      data.branch_name !== undefined
        ? data.branch_name
        : backendNode.branch_name;
    const nameCheck = await checkNodeServiceNameUniqueInProject(
      mergedProjectId,
      mergedName,
      backendNode.id,
      mergedBranch,
    );
    if (!nameCheck.ok) {
      return res.status(400).json({ error: nameCheck.error, field: nameCheck.field });
    }
    await backendNode.update(data);

    res.json({ message: "Backend services updated successfully", data });
  } catch (error) {
    console.error("Error updating backend services:", error);
    res.status(500).json({ error: "Failed to update backend services" });
  }
});

// DELETE /api/backendnodes - Delete a specific backend node  
router.delete("/:id", async (req, res) => {
  try {
    const backendNode = await Node.findOne({ where: { id: req.params.id, ...API_SVC } });
    if (!backendNode) {
      return res.status(404).json({ error: "Backend node not found" });
    }

    await backendNode.destroy();
    res.json({ message: "Backend node deleted successfully" });
  } catch (error) {
    console.error("Error deleting backend node:", error);
    res.status(500).json({ error: "Failed to delete backend node" });
  }
});

export default router; 