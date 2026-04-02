import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

class Environment extends Model {
  static associate(models) {
    Environment.belongsTo(models.Project, {
      foreignKey: 'project_id',
      as: 'project',
    });
  }
}

Environment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    env_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      references: {
        model: 'projects',
        key: 'env_name',
      },
      onDelete: 'CASCADE',
    },
    env_variable: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    env: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Environment',
    tableName: 'environments',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['env_name'] },
      { fields: ['env_variable'] },
      { fields: ['project_id'] },
      {
        fields: ['project_id', 'env_variable'],
        unique: true,
        name: 'unique_project_env_variable',
      },
    ],
  }
);

export default Environment;

