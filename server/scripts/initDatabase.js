import { testConnection, syncDatabase, User } from '../models/index.js';

const initializeDatabase = async () => {
  // Test connection
  await testConnection();
  
  // Sync database (create tables)
  await syncDatabase(false); // Set to true to force recreate tables
  
  // Create default admin user
  try {
    const existingAdmin = await User.findOne({ where: { username: 'admin' } });
    
    if (!existingAdmin) {
      const adminUser = await User.create({
        username: 'admin',
        email: 'admin@preview-builder.local',
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
        status: 'active',
        password: 'admin' // Note: In production, this should be properly hashed
      });
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  }
  
  process.exit(0);
};

initializeDatabase().catch(error => {
  console.error('Database initialization failed:', error);
  process.exit(1);
});