import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const BackendNode = sequelize.define('BackendNode', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  service_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  repository_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM('api', 'service', 'database', 'cache', 'queue', 'storage'),
    defaultValue: 'api',
  },
  default_url: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  env_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  repo_url: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  branch_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  jenkins_job: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  jenkins_job_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  build_status: {
    type: DataTypes.ENUM('pending', 'building', 'success', 'failed', 'cancelled'),
    defaultValue: 'pending',
  },
  build_number: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  build_result: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  build_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  deployment_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  domain_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  preview_link: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  port: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  environment: {
    type: DataTypes.ENUM('development', 'staging', 'production', 'preview'),
    defaultValue: 'preview',
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'deleted'),
    defaultValue: 'active',
  },
  is_approved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  is_deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  last_build_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  created_at_build: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'projects',
      key: 'id',
    },
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  tableName: 'backend_nodes',
  indexes: [
    {
      fields: ['service_name'],
    },
    {
      fields: ['repository_name'],
    },
    {
      fields: ['branch_name'],
    },
    {
      fields: ['build_status'],
    },
    {
      fields: ['environment'],
    },
    {
      fields: ['project_id'],
    },
  ],
});

// Define associations
BackendNode.associate = (models) => {
  BackendNode.belongsTo(models.Project, {
    foreignKey: 'project_id',
    as: 'project',
  });
  BackendNode.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'creator',
  });
  BackendNode.hasMany(models.Branch, {
    foreignKey: 'node_id',
    as: 'branches',
  });
};

// Remove the associate method from the model definition
delete BackendNode.associate;

export default BackendNode;
