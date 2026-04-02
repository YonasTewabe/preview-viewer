'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableExists = await queryInterface.tableExists('frontend_node_env_vars');
    if (tableExists) {
      console.log('Table frontend_node_env_vars already exists, skipping creation');
      return;
    }

    await queryInterface.createTable('frontend_node_env_vars', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      frontnode_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'frontend_nodes',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      key: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      value: {
        type: Sequelize.TEXT,
        allowNull: true,
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

    await queryInterface.addIndex('frontend_node_env_vars', ['frontnode_id']);
    await queryInterface.addIndex('frontend_node_env_vars', ['key']);
    await queryInterface.addIndex('frontend_node_env_vars', ['frontnode_id', 'key'], {
      unique: true,
      name: 'unique_frontnode_key',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('frontend_node_env_vars');
  },
};

