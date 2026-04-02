'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if short_code column already exists
    const tableDescription = await queryInterface.describeTable('projects');
    if (tableDescription.short_code) {
      console.log('Column short_code already exists in projects table, skipping');
      return;
    }
    
    // Add short_code column to projects table
    await queryInterface.addColumn('projects', 'short_code', {
      type: Sequelize.STRING(20),
      allowNull: false,
      unique: true,
      after: 'name' // MySQL specific - places column after name column
    });

    // Add index for short_code column
    await queryInterface.addIndex('projects', ['short_code'], {
      unique: true,
      name: 'projects_short_code_unique'
    });

    // Generate unique short codes for existing projects
    // This will create short codes based on project names
    const projects = await queryInterface.sequelize.query(
      'SELECT id, name FROM projects WHERE short_code IS NULL',
      { type: Sequelize.QueryTypes.SELECT }
    );

    for (const project of projects) {
      // Generate a unique short code from the project name
      let shortCode = project.name
        .replace(/[^a-zA-Z0-9]/g, '') // Remove special characters
        .substring(0, 15) // Limit to 15 chars to leave room for uniqueness
        .toUpperCase();

      // Ensure uniqueness by adding a number if needed
      let counter = 1;
      let finalShortCode = shortCode;
      
      while (true) {
        const existing = await queryInterface.sequelize.query(
          'SELECT id FROM projects WHERE short_code = ?',
          {
            replacements: [finalShortCode],
            type: Sequelize.QueryTypes.SELECT
          }
        );
        
        if (existing.length === 0) {
          break; // Found unique code
        }
        
        finalShortCode = `${shortCode}${counter}`;
        counter++;
      }

      // Update the project with the generated short code
      await queryInterface.sequelize.query(
        'UPDATE projects SET short_code = ? WHERE id = ?',
        {
          replacements: [finalShortCode, project.id],
          type: Sequelize.QueryTypes.UPDATE
        }
      );
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove the index first
    await queryInterface.removeIndex('projects', 'projects_short_code_unique');
    
    // Remove the short_code column
    await queryInterface.removeColumn('projects', 'short_code');
  }
};
