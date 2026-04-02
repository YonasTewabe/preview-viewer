'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableExists = await queryInterface.tableExists('environments');
    if (tableExists) {
      console.log('Table environments already exists, skipping creation');
      return;
    }
    
    await queryInterface.createTable('environments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
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

    // Add index on key
    await queryInterface.addIndex('environments', ['key'], {
      name: 'environments_key_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('environments');
  }
};
