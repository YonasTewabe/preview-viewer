'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableExists = await queryInterface.tableExists('project_environments');
    if (tableExists) {
      console.log('Table project_environments already exists, skipping creation');
      return;
    }
    
    await queryInterface.createTable('project_environments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'projects',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      environment_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'environments',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    // Add indexes
    await queryInterface.addIndex('project_environments', ['project_id'], {
      name: 'project_environments_project_id_idx'
    });
    await queryInterface.addIndex('project_environments', ['environment_id'], {
      name: 'project_environments_environment_id_idx'
    });
    
    // Add unique constraint on project_id and environment_id combination
    await queryInterface.addIndex('project_environments', ['project_id', 'environment_id'], {
      unique: true,
      name: 'unique_project_environment'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('project_environments');
  }
};
