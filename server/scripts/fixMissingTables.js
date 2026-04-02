import dotenv from 'dotenv';
import { sequelize, syncDatabase, initAssociations, testConnection } from '../models/index.js';

dotenv.config();

const fixMissingTables = async () => {
  try {
    console.log('🔌 Testing database connection...');
    await testConnection();
    console.log('✅ Database connection successful\n');
    
    console.log('📦 Syncing database models (creating missing tables)...');
    initAssociations();
    await syncDatabase(false); // false = don't force recreate, just create missing
    
    console.log('\n✅ Database sync completed!');
    console.log('All tables including environments and project_environments should now exist.');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error syncing database:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    await sequelize.close().catch(() => {});
    process.exit(1);
  }
};

fixMissingTables();
