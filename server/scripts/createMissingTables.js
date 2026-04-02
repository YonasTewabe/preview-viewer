import dotenv from 'dotenv';
import { sequelize, Environment, ProjectEnvironment, initAssociations } from '../models/index.js';
import { testConnection } from '../config/database.js';

dotenv.config();

const createMissingTables = async () => {
  try {
    console.log('🔌 Testing database connection...');
    // Initialize associations
    initAssociations();
    
    // Test connection
    await testConnection();
    console.log('✅ Database connection successful');
    
    console.log('📦 Creating missing tables...');
    
    // Sync only the missing models (this will create tables if they don't exist)
    console.log('  Creating environments table...');
    await Environment.sync({ alter: false });
    console.log('  ✅ environments table ready');
    
    console.log('  Creating project_environments table...');
    await ProjectEnvironment.sync({ alter: false });
    console.log('  ✅ project_environments table ready');
    
    console.log('\n✅ All missing tables created successfully!');
    console.log('  - environments');
    console.log('  - project_environments');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    console.error(error);
    await sequelize.close();
    process.exit(1);
  }
};

createMissingTables();
