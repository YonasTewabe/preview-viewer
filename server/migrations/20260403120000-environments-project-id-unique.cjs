"use strict";

/**
 * Scope environment rows by project_id and enforce unique (project_id, env_variable).
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = "environments";
    let desc;
    try {
      desc = await queryInterface.describeTable(table);
    } catch {
      return;
    }

    if (desc.project_id) {
      return;
    }

    await queryInterface.addColumn(table, "project_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.sequelize.query(`
      UPDATE environments AS e
      INNER JOIN projects AS p ON p.env_name = e.env_name
      SET e.project_id = p.id
    `);

    await queryInterface.sequelize.query(`
      DELETE FROM environments WHERE project_id IS NULL
    `);

    await queryInterface.sequelize.query(
      "ALTER TABLE environments MODIFY project_id INT NOT NULL",
    );

    await queryInterface.addConstraint(table, {
      fields: ["project_id"],
      type: "foreign key",
      name: "environments_project_id_fk",
      references: {
        table: "projects",
        field: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    try {
      await queryInterface.removeIndex(table, "unique_env_name_variable");
    } catch {
      try {
        await queryInterface.removeIndex(table, ["env_name", "env_variable"]);
      } catch {
        /* ignore */
      }
    }

    await queryInterface.addIndex(table, ["project_id", "env_variable"], {
      unique: true,
      name: "unique_project_env_variable",
    });
  },

  async down(queryInterface, Sequelize) {
    const desc = await queryInterface.describeTable("environments");
    if (!desc.project_id) return;

    try {
      await queryInterface.removeIndex("environments", "unique_project_env_variable");
    } catch {
      /* ignore */
    }
    try {
      await queryInterface.removeConstraint(
        "environments",
        "environments_project_id_fk",
      );
    } catch {
      /* ignore */
    }
    await queryInterface.removeColumn("environments", "project_id");
    await queryInterface.addIndex("environments", ["env_name", "env_variable"], {
      unique: true,
      name: "unique_env_name_variable",
    });
  },
};
