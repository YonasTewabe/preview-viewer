'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableExists = await queryInterface.tableExists('url_configs');
    if (tableExists) {
      console.log('Table url_configs already exists, skipping creation');
      return;
    }
    
    await queryInterface.createTable('url_configs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      url: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      frontnode_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'frontend_nodes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      service_type: {
        type: Sequelize.ENUM('api', 'service', 'database', 'cache', 'queue', 'storage', 'other'),
        defaultValue: 'api'
      },
      default_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      is_deleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      }
    });

    // Add indexes
    await queryInterface.addIndex('url_configs', ['name']);
    await queryInterface.addIndex('url_configs', ['frontnode_id']);
    await queryInterface.addIndex('url_configs', ['service_type']);
    await queryInterface.addIndex('url_configs', ['is_deleted']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('url_configs');
  }
};
