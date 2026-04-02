import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Branch = sequelize.define('Branch', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  build_number: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  build_result: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  domain_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  jenkins_job_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  port: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  preview_link: {
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
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  node_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'backend_nodes',
      key: 'id',
    },
  },
}, {
  tableName: 'branches',
  indexes: [
    {
      fields: ['name'],
    },
    {
      fields: ['status'],
    },
    {
      fields: ['node_id'],
    },
    {
      fields: ['created_by'],
    },
  ],
});

export default Branch;