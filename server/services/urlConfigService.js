import { UrlConfig, FrontendNode, Project } from '../models/index.js';

class UrlConfigService {
  /**
   * Create URL configs from deployment data
   * @param {Array} urlConfigs - Array of URL config objects
   * @param {number} frontnodeId - Frontend node ID
   * @returns {Promise<Array>} - Created URL configs
   */
  async createUrlConfigsFromDeployment(urlConfigs, frontnodeId) {
    try {
      const node = await FrontendNode.findByPk(frontnodeId, {
        include: [
          {
            model: Project,
            as: 'project',
            attributes: ['id', 'env_name', 'short_code'],
          },
        ],
      });
      const projectEnvName = node?.project?.env_name || node?.project?.short_code || null;

      const configsToCreate = urlConfigs.map(config => ({
        name: config.name,
        url: config.url,
        description: config.description || '',
        frontnode_id: frontnodeId,
        env_name: projectEnvName,
        service_type: config.serviceType || 'api',
        default_url: config.defaultUrl || null,
        created_at: new Date(),
        updated_at: new Date(),
        is_deleted: false
      }));
      const existingConfigs = await UrlConfig.findAll({
        where: {
          frontnode_id: frontnodeId,
          is_deleted: false
        }
      });
      let updatedConfigs;
      if (existingConfigs.length > 0) {
        // Update existing configs
        await Promise.all(
          configsToCreate.map(cfg => {
            return UrlConfig.update(
              {
                name: cfg.name,
                url: cfg.url,
                description: cfg.description,
                service_type: cfg.service_type,
                default_url: cfg.default_url,
                updated_at: new Date(),
                is_deleted: false
              },
              {
                where: {
                  frontnode_id: frontnodeId,
                  name: cfg.name
                }
              }
            );
          })
        );
        
        // Fetch the updated configs
        updatedConfigs = await UrlConfig.findAll({
          where: {
            frontnode_id: frontnodeId,
            is_deleted: false
          }
        });
      } else {
        // Create new configs if none exist
        updatedConfigs = await UrlConfig.bulkCreate(configsToCreate);
      }
      
      return updatedConfigs;
    } catch (error) {
      console.error('❌ Error creating URL configs:', error);
      throw error;
    }
  }

  /**
   * Get URL configs by frontend node ID
   * @param {number} frontnodeId - Frontend node ID
   * @returns {Promise<Array>} - URL configs
   */
  async getUrlConfigsByFrontendNode(frontnodeId) {
    try {
      const configs = await UrlConfig.findAll({
        where: {
          frontnode_id: frontnodeId,
          is_deleted: false
        },
        order: [['created_at', 'DESC']]
      });
      
      return configs;
    } catch (error) {
      console.error('❌ Error fetching URL configs:', error);
      throw error;
    }
  }

  /**
   * Update URL config
   * @param {number} id - URL config ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated URL config
   */
  async updateUrlConfig(id, updateData) {
    try {
      const config = await UrlConfig.findByPk(id);
      if (!config) {
        throw new Error('URL config not found');
      }

      const updatedConfig = await config.update({
        ...updateData,
        updated_at: new Date()
      });

      return updatedConfig;
    } catch (error) {
      console.error('❌ Error updating URL config:', error);
      throw error;
    }
  }

  /**
   * Soft delete URL config
   * @param {number} id - URL config ID
   * @returns {Promise<boolean>} - Success status
   */
  async deleteUrlConfig(id) {
    try {
      const config = await UrlConfig.findByPk(id);
      if (!config) {
        throw new Error('URL config not found');
      }

      await config.update({
        is_deleted: true,
        updated_at: new Date()
      });

      return true;
    } catch (error) {
      console.error('❌ Error deleting URL config:', error);
      throw error;
    }
  }

  /**
   * Get URL config by ID
   * @param {number} id - URL config ID
   * @returns {Promise<Object>} - URL config
   */
  async getUrlConfigById(id) {
    try {
      const config = await UrlConfig.findByPk(id);
      return config;
    } catch (error) {
      console.error('❌ Error fetching URL config:', error);
      throw error;
    }
  }

  /**
   * Soft delete all URL configs for a specific frontend node
   * @param {number} frontnodeId - Frontend node ID
   * @returns {Promise<number>} - Number of configs deleted
   */
  async deleteUrlConfigsByFrontendNode(frontnodeId) {
    try {
      const result = await UrlConfig.update(
        {
          is_deleted: true,
          updated_at: new Date()
        },
        {
          where: {
            frontnode_id: frontnodeId,
            is_deleted: false
          }
        }
      );
      
      return result[0];
    } catch (error) {
      console.error('❌ Error deleting URL configs by frontend node:', error);
      throw error;
    }
  }
}

export default new UrlConfigService();
