# My Projects Component

A comprehensive project management interface built with React, Ant Design, and Tailwind CSS.

## Features

### ✅ Complete Data Structure
- **id** - Unique identifier (hidden, used as key)
- **name** - Project name (clickable link to repository)
- **description** - Project description (truncated if long)
- **repository_url** - Clickable GitHub repository link
- **jenkins_job** - Clickable Jenkins build job link
- **tag** - Environment/category tag (development, production, etc.)
- **status** - Project status (Active, Inactive, Development, etc.)
- **version** - Semantic version (v1.2.0 format)
- **last_build_date** - Last build timestamp (formatted with dayjs)
- **created_by** - Creator name/email
- **created_at** - Creation timestamp
- **updated_at** - Last update timestamp

### ✅ User Interface Features
- **Responsive Table** - Full-width table with horizontal scrolling
- **Add New Project** - Modal form for creating projects
- **Edit/Delete Actions** - Row-level actions with confirmations
- **Search & Filter** - Search by name, description, creator, tag
- **Advanced Filtering** - Filter by status and tag
- **Pagination** - Configurable page size with quick jumper
- **Statistics** - Overview cards showing project metrics
- **Sorting** - Sortable columns for dates and names

### ✅ Technical Implementation
- **Modular Components** - Clean separation of concerns
- **Custom Hooks** - Centralized data management
- **Responsive Design** - Mobile-first approach
- **Loading States** - Proper loading indicators
- **Error Handling** - User-friendly error messages
- **Form Validation** - Comprehensive input validation

## Usage

### Standalone Page
```jsx
import ProjectsPage from './pages/ProjectsPage';

// Use as a standalone page
<ProjectsPage />
```

### As Component
```jsx
import MyProjects from './components/Projects/MyProjects';

// Use within existing layout
<MyProjects />
```

### Add to Router
```jsx
import ProjectsPage from './pages/ProjectsPage';

// Add to your routes
<Route path="/projects" element={<ProjectsPage />} />
```

## Components Structure

```
src/
├── components/
│   └── Projects/
│       ├── MyProjects.jsx          # Main table component
│       ├── AddProjectModal.jsx     # Add/Edit modal form
│       └── README.md              # This file
├── hooks/
│   └── useProjects.js             # Data management hook
└── pages/
    └── ProjectsPage.jsx           # Standalone page wrapper
```

## Data Management

The `useProjects` hook provides:
- **projects** - Array of project data
- **loading** - Loading state
- **createProject(data)** - Create new project
- **updateProject(data)** - Update existing project
- **deleteProject(id)** - Delete project
- **searchProjects(term)** - Search functionality
- **projectStats** - Statistics object

## Styling

The component uses:
- **Ant Design** - UI components and icons
- **Tailwind CSS** - Utility classes for layout
- **Custom CSS** - Table-specific styles in App.css

## Mock Data

The component includes 8 sample projects with realistic data:
- E-commerce Platform
- Task Management App
- Analytics Dashboard
- Mobile Banking App
- Learning Management System
- API Gateway Service
- Frontend Component Library
- Legacy Migration Tool

## Customization

### Adding New Fields
1. Update mock data in `useProjects.js`
2. Add form field in `AddProjectModal.jsx`
3. Add table column in `MyProjects.jsx`

### Changing Filters
1. Update filter options in `MyProjects.jsx`
2. Modify filter logic in component state

### API Integration
Replace the mock data and simulate functions in `useProjects.js` with real API calls.

## Dependencies

Required packages:
- `react`
- `antd`
- `dayjs`
- `@ant-design/icons`

The component is fully self-contained and ready to use!