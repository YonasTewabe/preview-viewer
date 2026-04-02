import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const FrontendNode = sequelize.define('FrontendNode', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
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
    type: DataTypes.ENUM('api', 'service', 'database', 'cache', 'queue', 'storage'),
    defaultValue: 'api',
  },
  repository_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  repo_url: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  branch_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'main',
  },
  env_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  port: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  build_number: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  build_status: {
    type: DataTypes.ENUM('pending', 'building', 'success', 'failed', 'cancelled'),
    defaultValue: 'pending',
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
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'projects',
      key: 'id',
    },
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  tableName: 'frontend_nodes',
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
      fields: ['status'],
    },
    {
      fields: ['project_id'],
    },
    {
      fields: ['created_by'],
    },
  ],
});

// Define associations
FrontendNode.associate = (models) => {
  FrontendNode.belongsTo(models.Project, {
    foreignKey: 'project_id',
    as: 'project',
  });
  FrontendNode.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'creator',
  });
};

export default FrontendNode;
