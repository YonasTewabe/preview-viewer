import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

/** Unified preview node: frontend (web) service, API service, or API branch row. */
const Node = sequelize.define(
  "Node",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "projects", key: "id" },
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    parent_node_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "nodes", key: "id" },
      onDelete: "CASCADE",
    },
    role: {
      type: DataTypes.ENUM("frontend", "api_service", "api_branch"),
      allowNull: false,
    },
    service_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM(
        "api",
        "service",
        "database",
        "cache",
        "queue",
        "storage",
      ),
      defaultValue: "api",
    },
    repository_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    repo_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    branch_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    env_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    project_env_profile_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "project_env_profiles", key: "id" },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    },
    port: {
      type: DataTypes.INTEGER,
      allowNull: true,
      unique: true,
    },
    build_number: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    build_status: {
      type: DataTypes.ENUM("pending", "building", "success", "failed", "cancelled"),
      defaultValue: "pending",
    },
    build_result: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    preview_link: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    domain_name: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive", "deleted"),
      defaultValue: "active",
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    default_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    jenkins_job_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    environment: {
      type: DataTypes.ENUM("development", "staging", "production", "preview"),
      defaultValue: "preview",
    },
    /** Set when a Jenkins preview build finishes (success or failure) for this node. */
    last_build_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "nodes",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["project_id"] },
      { fields: ["parent_node_id"] },
      { fields: ["role"] },
      { fields: ["is_deleted"] },
      { fields: ["service_name"] },
      { fields: ["project_env_profile_id"] },
    ],
  },
);

export default Node;
