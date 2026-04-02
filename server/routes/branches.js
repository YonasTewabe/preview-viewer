import express from 'express';
import { Branch } from '../models/index.js';
// import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all branches for a node
router.get('/node/:nodeId', async (req, res) => {
  try {
    const branches = await Branch.findAll({
      where: {
        node_id: req.params.nodeId,
        is_deleted: false
      },
      order: [['created_at', 'DESC']]
    });
    res.json(branches);
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ error: 'Failed to fetch branches' });
  }
});

// Get a single branch
router.get('/:id', async (req, res) => {
  try {
    const branch = await Branch.findOne({
      where: {
        id: req.params.id,
        is_deleted: false
      }
    });
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    res.json(branch);
  } catch (error) {
    console.error('Error fetching branch:', error);
    res.status(500).json({ error: 'Failed to fetch branch' });
  }
});

// Create a new branch
router.post('/', async (req, res) => {
  try {
    const branchData = {
      ...req.body,
      created_by: req.body.created_by || 1, // Default to user ID 1 if not provided
      created_at: new Date(),
      updated_at: new Date()
    };

    const branch = await Branch.create(branchData);
    res.status(201).json(branch);
  } catch (error) {
    console.error('Error creating branch:', error);
    res.status(500).json({ error: 'Failed to create branch', details: error.message });
  }
});

// Update a branch
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updated_at: new Date()
    };

    const branch = await Branch.findByPk(id);
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    await branch.update(updateData);
    res.json({ message: 'Branch updated successfully', data: branch });
  } catch (error) {
    console.error('Error updating branch:', error);
    res.status(500).json({ error: 'Failed to update branch', details: error.message });
  }
});

// Delete a branch (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await Branch.findByPk(id);
    
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    await branch.update({ 
      is_deleted: true, 
      updated_at: new Date() 
    });
    
    res.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('Error deleting branch:', error);
    res.status(500).json({ error: 'Failed to delete branch', details: error.message });
  }
});

// Get branch build status
router.get('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await Branch.findByPk(id, {
      attributes: ['id', 'name', 'build_number', 'build_result', 'status', 'preview_link', 'jenkins_job_url']
    });
    
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    
    res.json({
      id: branch.id,
      name: branch.name,
      buildNumber: branch.build_number,
      buildResult: branch.build_result,
      status: branch.status,
      previewLink: branch.preview_link,
      jenkinsJobUrl: branch.jenkins_job_url
    });
  } catch (error) {
    console.error('Error fetching branch status:', error);
    res.status(500).json({ error: 'Failed to fetch branch status', details: error.message });
  }
});

export default router;
