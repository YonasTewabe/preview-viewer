import express from 'express';
import urlConfigService from '../services/urlConfigService.js';

const router = express.Router();

// Create URL configs from deployment data
router.post('/create-from-deployment', async (req, res) => {
  try {
    const { urlConfigs, frontnodeId } = req.body;
    
    if (!urlConfigs || !Array.isArray(urlConfigs) || !frontnodeId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data. urlConfigs array and frontnodeId are required.'
      });
    }

    // First, soft delete existing URL configs for this frontend node
    await urlConfigService.deleteUrlConfigsByFrontendNode(frontnodeId);
    
    // Create new URL configs from deployment data
    console.log(urlConfigs, "urlConfigs");
    const createdConfigs = await urlConfigService.createUrlConfigsFromDeployment(urlConfigs, frontnodeId);
    
    res.json({
      success: true,
      data: createdConfigs,
      message: `Successfully created ${createdConfigs.length} URL configurations`,
      count: createdConfigs.length
    });
  } catch (error) {
    console.error('Error creating URL configs from deployment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create URL configs from deployment',
      error: error.message
    });
  }
});

// Get URL configs by frontend node ID
router.get('/frontend-node/:frontnodeId', async (req, res) => {
  try {
    const { frontnodeId } = req.params;
    const configs = await urlConfigService.getUrlConfigsByFrontendNode(parseInt(frontnodeId));
    
    res.json({
      success: true,
      data: configs,
      count: configs.length
    });
  } catch (error) {
    console.error('Error fetching URL configs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch URL configs',
      error: error.message
    });
  }
});

// Get URL config by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const config = await urlConfigService.getUrlConfigById(parseInt(id));
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'URL config not found'
      });
    }
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error fetching URL config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch URL config',
      error: error.message
    });
  }
});

// Update URL config
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedConfig = await urlConfigService.updateUrlConfig(parseInt(id), updateData);
    
    res.json({
      success: true,
      data: updatedConfig,
      message: 'URL config updated successfully'
    });
  } catch (error) {
    console.error('Error updating URL config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update URL config',
      error: error.message
    });
  }
});

// Delete URL config (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await urlConfigService.deleteUrlConfig(parseInt(id));
    
    res.json({
      success: true,
      message: 'URL config deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting URL config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete URL config',
      error: error.message
    });
  }
});

export default router;
