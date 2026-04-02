'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableExists = await queryInterface.tableExists('url_configs');
    if (!tableExists) {
      console.log('Table url_configs does not exist, skipping');
      return;
    }

    const cols = await queryInterface.describeTable('url_configs');
    if (!cols.env_name) {
      await queryInterface.addColumn('url_configs', 'env_name', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
      await queryInterface.addIndex('url_configs', ['env_name']);
    }
  },

  async down(queryInterface, Sequelize) {
    const tableExists = await queryInterface.tableExists('url_configs');
    if (!tableExists) return;

    const cols = await queryInterface.describeTable('url_configs');
    if (cols.env_name) {
      try {
        await queryInterface.removeIndex('url_configs', ['env_name']);
      } catch (_) {}
      await queryInterface.removeColumn('url_configs', 'env_name');
    }
  },
};

