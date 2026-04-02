import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const UrlConfig = sequelize.define('UrlConfig', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  url: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  frontnode_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'frontend_nodes',
      key: 'id',
    },
  },
  service_type: {
    type: DataTypes.ENUM('api', 'service', 'database', 'cache', 'queue', 'storage', 'other'),
    defaultValue: 'api',
  },
  default_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  env_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
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
  is_deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'url_configs',
  indexes: [
    {
      fields: ['name'],
    },
    {
      fields: ['frontnode_id'],
    },
    {
      fields: ['env_name'],
    },
    {
      fields: ['service_type'],
    },
    {
      fields: ['is_deleted'],
    },
  ],
});

// Define associations
UrlConfig.associate = (models) => {
  UrlConfig.belongsTo(models.FrontendNode, {
    foreignKey: 'frontnode_id',
    as: 'frontendNode',
  });
};

export default UrlConfig;
