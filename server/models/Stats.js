import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const Stats = sequelize.define(
  "Stats",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    key_name: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      defaultValue: "global",
    },
    total_projects: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    total_env_profiles: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    total_env_vars: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    total_nodes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    active_builds: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    successful_builds: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    failed_builds: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "stats",
    timestamps: true,
    underscored: true,
    indexes: [{ unique: true, fields: ["key_name"], name: "uniq_stats_key_name" }],
  },
);

export default Stats;
