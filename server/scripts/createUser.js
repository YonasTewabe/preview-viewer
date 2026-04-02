import dotenv from 'dotenv';
import { User } from '../models/index.js';
import { testConnection } from '../config/database.js';
import { initAssociations } from '../models/index.js';

dotenv.config();

const createUser = async () => {
  try {
    // Initialize associations
    initAssociations();
    
    // Test connection
    await testConnection();
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email: 'surafel@ienetworks.co' } });
    
    if (existingUser) {
      console.log('❌ User with email surafel@ienetworks.co already exists');
      process.exit(1);
    }
    
    // Create the user
    // The User model has hooks that will automatically hash the password
    const user = await User.create({
      username: 'surafel',
      email: 'surafel@ienetworks.co',
      first_name: 'surafel',
      last_name: 'kifle',
      password: '@%TGBnhy6', // Will be automatically hashed by the model hook
      role: 'user', // Default role
      status: 'active',
    });
    
    console.log('✅ User created successfully!');
    console.log('User details:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Name: ${user.first_name} ${user.last_name}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Username: ${user.username}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Status: ${user.status}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating user:', error);
    process.exit(1);
  }
};

createUser();
