import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const FrontendNodeEnvVar = sequelize.define('FrontendNodeEnvVar', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  frontnode_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'frontend_nodes',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  key: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  value: {
    type: DataTypes.TEXT,
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
}, {
  tableName: 'frontend_node_env_vars',
  timestamps: false,
  indexes: [
    { fields: ['frontnode_id'] },
    { fields: ['key'] },
    { fields: ['frontnode_id', 'key'], unique: true, name: 'unique_frontnode_key' },
  ],
});

FrontendNodeEnvVar.associate = (models) => {
  FrontendNodeEnvVar.belongsTo(models.FrontendNode, { foreignKey: 'frontnode_id', as: 'frontendNode' });
};

export default FrontendNodeEnvVar;

