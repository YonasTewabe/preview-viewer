import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'preview_builder',
  logging: false,
  define: {
    timestamps: true,
    underscored: true,
  },
});

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
  } catch (error) {
    console.error('Unable to connect to MySQL database:', error);
  }
};

export { sequelize, testConnection };