import { sequelize } from '../config/database.js';
import Node from './Node.js';
import NodeBuild from './NodeBuild.js';
import NodeEnvVar from './NodeEnvVar.js';
import Project from './Project.js';
import User from './User.js';
import Environment from './Environment.js';
import ProjectEnvProfile from './ProjectEnvProfile.js';
import Stats from "./Stats.js";

let associationsInitialized = false;
const initAssociations = () => {
  if (associationsInitialized) return;

  Project.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
  User.hasMany(Project, { foreignKey: 'created_by', as: 'projects' });

  Node.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
  Project.hasMany(Node, { foreignKey: 'project_id', as: 'nodes' });

  Node.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
  User.hasMany(Node, { foreignKey: 'created_by', as: 'nodes' });

  Node.hasMany(Node, { foreignKey: 'parent_node_id', as: 'branches' });
  Node.belongsTo(Node, { foreignKey: 'parent_node_id', as: 'parentApiService' });

  Node.hasMany(NodeBuild, { foreignKey: 'node_id', as: 'buildHistory' });
  NodeBuild.belongsTo(Node, { foreignKey: 'node_id', as: 'node' });

  Node.hasMany(NodeEnvVar, { foreignKey: 'node_id', as: 'envOverrides' });
  NodeEnvVar.belongsTo(Node, { foreignKey: 'node_id', as: 'node' });

  Project.hasMany(Environment, {
    foreignKey: "project_id",
    as: "environments",
  });
  Environment.belongsTo(Project, {
    foreignKey: "project_id",
    as: "project",
  });

  Project.hasMany(ProjectEnvProfile, {
    foreignKey: "project_id",
    as: "envProfiles",
  });
  ProjectEnvProfile.belongsTo(Project, {
    foreignKey: "project_id",
    as: "project",
  });
  ProjectEnvProfile.hasMany(Environment, {
    foreignKey: "profile_id",
    as: "variables",
  });
  Environment.belongsTo(ProjectEnvProfile, {
    foreignKey: "profile_id",
    as: "profile",
  });
  Node.belongsTo(ProjectEnvProfile, {
    foreignKey: "project_env_profile_id",
    as: "envProfile",
  });

  associationsInitialized = true;
};

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

export {
  Node,
  NodeBuild,
  NodeEnvVar,
  Project,
  User,
  Environment,
  ProjectEnvProfile,
  Stats,
  sequelize,
  syncDatabase,
  initAssociations,
  testConnection,
};

const syncDatabase = async (force = false) => {
  try {
    initAssociations();
    await sequelize.sync({ force });
    return true;
  } catch (error) {
    console.error('Error synchronizing the database:', error);
    throw error;
  }
};

export default {
  Node,
  NodeBuild,
  NodeEnvVar,
  Project,
  User,
  Environment,
  ProjectEnvProfile,
  Stats,
  sequelize,
  syncDatabase,
  testConnection,
};
