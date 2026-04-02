import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { BackendNode, Branch, Project, User } from "../models/index.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Path to the backendnodes JSON file
const BACKENDNODES_FILE_PATH = path.join(__dirname, "../../src/data/backendnodes.json");

// GET /api/backendnodes - Get all backend services
router.get("/", async (req, res) => {
  try {
    const data = await fs.readFile(BACKENDNODES_FILE_PATH, "utf8");
    const backendNodesData = JSON.parse(data);
    res.json(backendNodesData);
  } catch (error) {
    console.error("Error reading backendnodes file:", error);
    // Return empty structure if file doesn't exist
    res.json({
      backendServices: [],
      lastUpdated: null,
      version: "1.0",
      metadata: {
        description: "Backend services configuration for preview builder",
        createdAt: null,
        totalServices: 0,
        totalBranches: 0
      }
    });
  }
});

// GET /api/backendnodes/export - Export all backend services to JSON
router.get("/export", async (req, res) => {
  try {
    const backendNodes = await BackendNode.findAll({
      where: { is_deleted: false },
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
    
    const backendNodes = await BackendNode.findAll({
      where: { 
        project_id: projectId, 
        is_deleted: false 
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
        const existingService = await BackendNode.findOne({
          where: { 
            service_name: service.serviceName, 
            project_id: projectId,
            is_deleted: false
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
          // Create new service
          const newService = await BackendNode.create({
            service_name: service.serviceName,
            default_url: service.defaultUrl,
            type: service.type || 'api',
            repository_name: service.repo || service.repository_name,
            repo_url: service.repoUrl,
            env_name: service.envName,
            description: service.description,
            project_id: projectId,
            created_by: userId,
            status: 'active',
            environment: 'preview',
            is_deleted: false
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
        const existingService = await BackendNode.findOne({
          where: { 
            service_name: service.serviceName, 
            project_id: projectId,
            is_deleted: false
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
            const newService = await BackendNode.create({
              service_name: service.serviceName,
              default_url: service.defaultUrl,
              type: service.type || 'api',
              repository_name: service.repo || service.repository_name,
              repo_url: service.repoUrl,
              env_name: service.envName,
              description: service.description,
              project_id: projectId,
              created_by: userId,
              status: 'active',
              environment: 'preview',
              is_deleted: false
            });
            importedServices.push(newService);
          }
        } else {
          // Create new service
          const newService = await BackendNode.create({
            service_name: service.serviceName,
            default_url: service.defaultUrl,
            type: service.type || 'api',
            repository_name: service.repo || service.repository_name,
            repo_url: service.repoUrl,
            env_name: service.envName,
            description: service.description,
            project_id: projectId,
            created_by: userId,
            status: 'active',
            environment: 'preview',
            is_deleted: false
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
    const backendNodes = await BackendNode.findAll({
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
        {
          model: Branch,
          as: 'branches',
          where: { is_deleted: false }, // ✅ filter only non-deleted branches
          attributes: [
            'id',
            'name',
            'description',
            'status',
            'domain_name',
            'port',
            'build_result',
            'build_number',
            'preview_link',
            'jenkins_job_url',
            'created_at',
            'updated_at'
          ],
          required: false, // ✅ allows backendNode to be returned even if no branches match
        },
      ],
    });

    res.json(backendNodes);
  } catch (error) {
    console.error("Error fetching backend nodes by projectId:", error);
    res.status(500).json({ error: "Failed to fetch backend nodes" });
  }
});

// POST /api/backendnodes - Save backend services
router.post("/", async (req, res) => {
  try {
    const { data } = req.body;
    await BackendNode.create(data);
    res.json({ message: "Backend services saved successfully", data });
  } catch (error) {
    console.error("Error saving backend services:", error);
    res.status(500).json({ error: "Failed to save backend services" });
  }
});


// PUT /api/backendnodes - Update backend services
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const data = req.body;
    const backendNode = await BackendNode.findByPk(id);
    if (!backendNode) {
      return res.status(404).json({ error: "Backend node not found" });
    }
    if(!data){
      return res.status(400).json({ error: "Data is required" });
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
    const backendNode = await BackendNode.findByPk(req.params.id);
    if (!backendNode) {
      return res.status(404).json({ error: "Backend node not found" });
    }

    await backendNode.update({ is_deleted: true });
    res.json({ message: "Backend node deleted successfully" });
  } catch (error) {
    console.error("Error deleting backend node:", error);
    res.status(500).json({ error: "Failed to delete backend node" });
  }
});

export default router; 