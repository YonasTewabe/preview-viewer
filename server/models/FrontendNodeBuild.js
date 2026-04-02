import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const FrontendNodeBuild = sequelize.define(
  'FrontendNodeBuild',
  {
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
    build_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    built_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: 'frontend_node_builds',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['frontnode_id'] },
      { fields: ['built_at'] },
    ],
  },
);

FrontendNodeBuild.associate = (models) => {
  FrontendNodeBuild.belongsTo(models.FrontendNode, {
    foreignKey: 'frontnode_id',
    as: 'frontendNode',
  });
};

export default FrontendNodeBuild;
