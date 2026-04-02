import React from 'react';
import MyProjects from '../components/Projects/MyProjects';

const ProjectsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <MyProjects />
      </div>
    </div>
  );
};

export default ProjectsPage;