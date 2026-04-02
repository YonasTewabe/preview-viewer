'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableExists = await queryInterface.tableExists('branches');
    if (tableExists) {
      console.log('Table branches already exists, skipping creation');
      return;
    }
    
    await queryInterface.createTable('branches', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      build_number: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      build_result: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      domain_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      jenkins_job_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      port: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      preview_link: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'deleted'),
        defaultValue: 'active',
      },
      is_approved: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      is_deleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      node_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'backend_nodes',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
    });

    // Add indexes
    await queryInterface.addIndex('branches', ['name'], { name: 'branches_name_idx' });
    await queryInterface.addIndex('branches', ['status'], { name: 'branches_status_idx' });
    await queryInterface.addIndex('branches', ['node_id'], { name: 'branches_node_id_idx' });
    await queryInterface.addIndex('branches', ['created_by'], { name: 'branches_created_by_idx' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('branches');
  }
};
