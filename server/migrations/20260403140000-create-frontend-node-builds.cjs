"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = "frontend_node_builds";
    if (await queryInterface.tableExists(table)) {
      return;
    }

    await queryInterface.createTable(table, {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      frontnode_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "frontend_nodes",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      build_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      built_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex(table, ["frontnode_id"], {
      name: "frontend_node_builds_frontnode_id_idx",
    });
    await queryInterface.addIndex(table, ["built_at"], {
      name: "frontend_node_builds_built_at_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("frontend_node_builds");
  },
};
