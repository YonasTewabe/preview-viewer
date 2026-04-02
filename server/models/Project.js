import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

class Project extends Model {
  // Static method for associations
  static associate(models) {
    Project.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'creator',
    });

    Project.hasMany(models.BackendNode, {
      foreignKey: 'project_id',
      as: 'backendNodes',
    });

    Project.hasMany(models.FrontendNode, {
      foreignKey: 'project_id',
      as: 'frontendNodes',
    });

    Project.belongsToMany(models.Environment, {
      through: models.ProjectEnvironment,
      foreignKey: 'project_id',
      otherKey: 'environment_id',
      as: 'environments',
    });
  }
}

Project.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    short_code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        len: [2, 20],
        is: /^[A-Z0-9_-]+$/i, // Only alphanumeric, underscore, and hyphen
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    repository_url: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    jenkins_job: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    version: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'v1.0.0',
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'archived'),
      defaultValue: 'active',
    },
    tag: {
      type: DataTypes.ENUM('frontend', 'backend'),
      allowNull: false,
    },
    env_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
    last_build_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'Project',
    tableName: 'projects',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['name'] },
      { fields: ['short_code'] },
      { fields: ['status'] },
      { fields: ['tag'] },
      { fields: ['env_name'] },
      { fields: ['created_by'] },
    ],
  }
);

export default Project;