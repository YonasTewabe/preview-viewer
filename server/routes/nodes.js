import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the nodes JSON file
const NODES_FILE_PATH = path.join(__dirname, "../../src/data/nodes.json");

// GET /api/nodes - Get all nodes
router.get("/", async (req, res) => {
  try {
    const data = await fs.readFile(NODES_FILE_PATH, "utf8");
    const nodesData = JSON.parse(data);
    res.json(nodesData);
  } catch (error) {
    console.error("Error reading nodes file:", error);
    // Return empty structure if file doesn't exist
    res.json({
      nodes: [],
      lastUpdated: null,
      version: "1.0"
    });
  }
});

// POST /api/nodes - Save nodes
router.post("/", async (req, res) => {
  try {
    const { nodes } = req.body;
    
    if (!Array.isArray(nodes)) {
      return res.status(400).json({ error: "Nodes must be an array" });
    }

    const data = {
      nodes: nodes,
      lastUpdated: new Date().toISOString(),
      version: "1.0"
    };

    await fs.writeFile(NODES_FILE_PATH, JSON.stringify(data, null, 2));
    res.json({ message: "Nodes saved successfully", data });
  } catch (error) {
    console.error("Error saving nodes:", error);
    res.status(500).json({ error: "Failed to save nodes" });
  }
});

// PUT /api/nodes - Update nodes
router.put("/", async (req, res) => {
  try {
    const { nodes } = req.body;
    
    if (!Array.isArray(nodes)) {
      return res.status(400).json({ error: "Nodes must be an array" });
    }

    const data = {
      nodes: nodes,
      lastUpdated: new Date().toISOString(),
      version: "1.0"
    };

    await fs.writeFile(NODES_FILE_PATH, JSON.stringify(data, null, 2));
    res.json({ message: "Nodes updated successfully", data });
  } catch (error) {
    console.error("Error updating nodes:", error);
    res.status(500).json({ error: "Failed to update nodes" });
  }
});

// DELETE /api/nodes - Clear all nodes
router.delete("/", async (req, res) => {
  try {
    const data = {
      nodes: [],
      lastUpdated: new Date().toISOString(),
      version: "1.0"
    };

    await fs.writeFile(NODES_FILE_PATH, JSON.stringify(data, null, 2));
    res.json({ message: "All nodes cleared successfully" });
  } catch (error) {
    console.error("Error clearing nodes:", error);
    res.status(500).json({ error: "Failed to clear nodes" });
  }
});

export default router; 