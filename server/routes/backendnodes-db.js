import express from "express";
import { BackendNode, Project, User } from "../models/index.js";

const router = express.Router();

// GET /api/backendnodes - Get all backend nodes
router.get("/", async (req, res) => {
  try {
    const backendNodes = await BackendNode.findAll({
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

    // Format response to match existing JSON structure
    const response = {
      backendServices: backendNodes,
      lastUpdated: new Date().toISOString(),
      version: "1.0",
      metadata: {
        description: "Backend services configuration for preview builder",
        createdAt: backendNodes.length > 0 ? backendNodes[0].created_at : null,
        totalServices: backendNodes.length,
        totalBranches: backendNodes.length, // Assuming each service is a branch
      }
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching backend nodes:", error);
    res.status(500).json({ error: "Failed to fetch backend nodes" });
  }
});

// GET /api/backendnodes/:id - Get a specific backend node
router.get("/:id", async (req, res) => {
  try {
    const backendNode = await BackendNode.findByPk(req.params.id, {
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
    });
    
    if (!backendNode) {
      return res.status(404).json({ error: "Backend node not found" });
    }
    
    res.json(backendNode);
  } catch (error) {
    console.error("Error fetching backend node:", error);
    res.status(500).json({ error: "Failed to fetch backend node" });
  }
});

// POST /api/backendnodes - Create a new backend node
router.post("/", async (req, res) => {
  try {
    const { backendServices } = req.body;
    
    if (!Array.isArray(backendServices)) {
      return res.status(400).json({ error: "Backend services must be an array" });
    }

    const createdServices = [];
    
    for (const service of backendServices) {
      const backendNode = await BackendNode.create({
        service_name: service.serviceName || service.service_name,
        repository_name: service.repositoryName || service.repository_name,
        branch_name: service.branchName || service.branch_name,
        jenkins_job: service.jenkinsJob || service.jenkins_job,
        build_status: service.buildStatus || service.build_status || 'pending',
        build_number: service.buildNumber || service.build_number,
        build_url: service.buildUrl || service.build_url,
        deployment_url: service.deploymentUrl || service.deployment_url,
        port: service.port,
        environment: service.environment || 'preview',
        project_id: service.projectId || service.project_id,
        created_by: service.createdBy || service.created_by,
        created_at_build: service.createdAt || service.created_at_build,
      });
      
      createdServices.push(backendNode);
    }

    const response = {
      backendServices: createdServices,
      lastUpdated: new Date().toISOString(),
      version: "1.0",
      metadata: {
        description: "Backend services configuration for preview builder",
        createdAt: new Date().toISOString(),
        totalServices: createdServices.length,
        totalBranches: createdServices.length,
      }
    };

    res.status(201).json({ message: "Backend services saved successfully", data: response });
  } catch (error) {
    console.error("Error creating backend services:", error);
    res.status(500).json({ error: "Failed to create backend services" });
  }
});

// PUT /api/backendnodes/:id - Update a backend node
router.put("/:id", async (req, res) => {
  try {
    const {
      service_name,
      repository_name,
      branch_name,
      jenkins_job,
      build_status,
      build_number,
      build_url,
      deployment_url,
      port,
      environment,
      project_id,
    } = req.body;
    
    const backendNode = await BackendNode.findByPk(req.params.id);
    if (!backendNode) {
      return res.status(404).json({ error: "Backend node not found" });
    }

    await backendNode.update({
      service_name,
      repository_name,
      branch_name,
      jenkins_job,
      build_status,
      build_number,
      build_url,
      deployment_url,
      port,
      environment,
      project_id,
      last_build_date: build_status === 'success' ? new Date() : backendNode.last_build_date,
    });

    res.json({ message: "Backend node updated successfully", data: backendNode });
  } catch (error) {
    console.error("Error updating backend node:", error);
    res.status(500).json({ error: "Failed to update backend node" });
  }
});

// DELETE /api/backendnodes - Clear all backend nodes
router.delete("/", async (req, res) => {
  try {
    await BackendNode.destroy({ where: {} });
    
    const response = {
      backendServices: [],
      lastUpdated: new Date().toISOString(),
      version: "1.0",
      metadata: {
        description: "Backend services configuration for preview builder",
        createdAt: null,
        totalServices: 0,
        totalBranches: 0,
      }
    };

    res.json({ message: "All backend services cleared successfully", data: response });
  } catch (error) {
    console.error("Error clearing backend services:", error);
    res.status(500).json({ error: "Failed to clear backend services" });
  }
});

// DELETE /api/backendnodes/:id - Delete a specific backend node
router.delete("/:id", async (req, res) => {
  try {
    const backendNode = await BackendNode.findByPk(req.params.id);
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