"use strict";

async function tableExists(queryInterface, table) {
  const [rows] = await queryInterface.sequelize.query(
    `SELECT TABLE_NAME FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    { replacements: [table] },
  );
  return rows.length > 0;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    if (await tableExists(queryInterface, "stats")) return;

    await queryInterface.createTable("stats", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      key_name: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true,
        defaultValue: "global",
      },
      total_projects: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      total_env_profiles: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      total_env_vars: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      total_nodes: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      active_builds: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      successful_builds: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      failed_builds: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        ),
      },
    });

    await queryInterface.addIndex("stats", ["key_name"], {
      unique: true,
      name: "uniq_stats_key_name",
    });
  },

  async down(queryInterface) {
    if (await tableExists(queryInterface, "stats")) {
      await queryInterface.dropTable("stats");
    }
  },
};
