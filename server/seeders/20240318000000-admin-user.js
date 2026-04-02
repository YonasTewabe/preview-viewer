'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('%TGBnhy6', salt);

    // Create admin user
    await queryInterface.bulkInsert('users', [{
      username: 'admin',
      first_name: 'admin',
      last_name: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      status: 'active',
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date()
    }], {});
  },

  async down(queryInterface, Sequelize) {
    // Remove the admin user
    await queryInterface.bulkDelete('users', {
      email: 'admin@example.com'
    }, {});
  }
};
