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
      last_login: null,
      email_verified: true,
      email_verification_token: null,
      reset_password_token: null,
      reset_password_expires: null,
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
