import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

class ProjectEnvironment extends Model {
  static associate(models) {
    // Associations are handled through the many-to-many relationship
  }
}

ProjectEnvironment.init(
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
    },
    environment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'environments',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
  },
  {
    sequelize,
    modelName: 'ProjectEnvironment',
    tableName: 'project_environments',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['project_id'] },
      { fields: ['environment_id'] },
      { 
        fields: ['project_id', 'environment_id'],
        unique: true,
        name: 'unique_project_environment'
      },
    ],
  }
);

export default ProjectEnvironment;

