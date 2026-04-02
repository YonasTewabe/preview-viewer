import { sequelize } from '../config/database.js';
import BackendNode from './BackendNode.js';
import Branch from './Branch.js';
import FrontendNode from './FrontendNode.js';
import Project from './Project.js';
import User from './User.js';
import UrlConfig from './UrlConfig.js';
import Environment from './Environment.js';
import ProjectEnvironment from './ProjectEnvironment.js';
import FrontendNodeEnvVar from './FrontendNodeEnvVar.js';
import FrontendNodeBuild from './FrontendNodeBuild.js';

// Guarded association initializer to avoid duplicate registration
let associationsInitialized = false;
const initAssociations = () => {
  if (associationsInitialized) return;

  // User <-> Project
  Project.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
  User.hasMany(Project, { foreignKey: 'created_by', as: 'projects' });

  // Project <-> BackendNode
  BackendNode.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
  Project.hasMany(BackendNode, { foreignKey: 'project_id', as: 'backendNodes' });

  // Project <-> FrontendNode
  FrontendNode.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
  Project.hasMany(FrontendNode, { foreignKey: 'project_id', as: 'frontendNodes' });

  // BackendNode <-> Branch
  Branch.belongsTo(BackendNode, { foreignKey: 'node_id', as: 'node' });
  BackendNode.hasMany(Branch, { foreignKey: 'node_id', as: 'branches' });

  // User <-> FrontendNode and BackendNode creators
  FrontendNode.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
  BackendNode.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
  User.hasMany(FrontendNode, { foreignKey: 'created_by', as: 'createdFrontendNodes' });
  User.hasMany(BackendNode, { foreignKey: 'created_by', as: 'createdBackendNodes' });

  // User <-> Branch creator
  Branch.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
  User.hasMany(Branch, { foreignKey: 'created_by', as: 'createdBranches' });

  // FrontendNode <-> UrlConfig
  UrlConfig.belongsTo(FrontendNode, { foreignKey: 'frontnode_id', as: 'frontendNode' });
  FrontendNode.hasMany(UrlConfig, { foreignKey: 'frontnode_id', as: 'urlConfigs' });

  // FrontendNode <-> Node env overrides
  FrontendNodeEnvVar.belongsTo(FrontendNode, { foreignKey: 'frontnode_id', as: 'frontendNode' });
  FrontendNode.hasMany(FrontendNodeEnvVar, { foreignKey: 'frontnode_id', as: 'envOverrides' });

  FrontendNode.hasMany(FrontendNodeBuild, {
    foreignKey: 'frontnode_id',
    as: 'buildHistory',
  });
  FrontendNodeBuild.belongsTo(FrontendNode, {
    foreignKey: 'frontnode_id',
    as: 'frontendNode',
  });

  // Project <-> Environment (1:N via project_id; env_name kept denormalized on each row)
  Project.hasMany(Environment, {
    foreignKey: 'project_id',
    as: 'environments',
  });
  Environment.belongsTo(Project, {
    foreignKey: 'project_id',
    as: 'project',
  });

  associationsInitialized = true;
};

// Test database connection
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
  BackendNode,
  Branch,
  FrontendNode,
  Project,
  User,
  UrlConfig,
  Environment,
  ProjectEnvironment,
  FrontendNodeEnvVar,
  FrontendNodeBuild,
  sequelize,
  syncDatabase,
  initAssociations,
  testConnection,
};

// Database synchronization function
const syncDatabase = async (force = false) => {
  try {
    // Ensure associations are initialized before sync
    initAssociations();

    // Sync all models with the database
    // Prefer migrations via sequelize-cli. Keep sync in "create missing tables" mode only.
    await sequelize.sync({ force });
    return true;
  } catch (error) {
    console.error('Error synchronizing database:', error);
    throw error;
  }
};

export default {
  BackendNode,
  Branch,
  FrontendNode,
  Project,
  User,
  UrlConfig,
  Environment,
  ProjectEnvironment,
  FrontendNodeEnvVar,
  FrontendNodeBuild,
  sequelize,
  syncDatabase,
  testConnection,
};