# Backend Services Import/Export Functionality

This document explains how to use the new import and export functionality for backend services in the Preview Builder application.

## Overview

The application now supports importing and exporting backend services to/from JSON format, making it easy to:
- Migrate services between projects
- Backup and restore service configurations
- Share service configurations with team members
- Bulk import services from external sources

## Features

### 1. Import Backend Services
- **File Format**: JSON files with a `backendServices` array
- **Conflict Resolution**: Three strategies available:
  - **Skip**: Ignore existing services (default)
  - **Update**: Update existing services with new data
  - **Overwrite**: Delete existing services and create new ones
- **Validation**: Automatic validation of JSON structure and data
- **Error Handling**: Detailed error reporting for failed imports

### 2. Export Backend Services
- **Project-specific Export**: Export services for a specific project
- **Global Export**: Export all services across all projects
- **File Download**: Automatic file download with descriptive filenames
- **Metadata**: Includes creation dates, counts, and version information

## API Endpoints

### Import
- `POST /api/backendnodes/import` - Basic import with update/insert logic
- `POST /api/backendnodes/import/bulk` - Bulk import with conflict resolution

### Export
- `GET /api/backendnodes/export` - Export all backend services
- `GET /api/backendnodes/export/project/:projectId` - Export services for specific project

## Usage Instructions

### Importing Services

1. **Prepare JSON File**: Ensure your JSON file has the correct structure:
   ```json
   {
     "backendServices": [
       {
         "serviceName": "SERVICE_NAME",
         "defaultUrl": "https://example.com/api/v1",
         "type": "api",
         "repo": "repository-name",
         "repoUrl": "https://github.com/username/repo.git",
         "envName": ".env-name",
         "description": "Service description"
       }
     ],
     "version": "1.0"
   }
   ```

2. **Access Import Modal**: Click the "Import Services" button in the Backend Tab

3. **Select Conflict Resolution**: Choose how to handle existing services:
   - **Skip**: Best for initial imports
   - **Update**: Best for updating existing configurations
   - **Overwrite**: Best for complete replacements

4. **Upload File**: Drag and drop or click to select your JSON file

5. **Review and Import**: The system will validate the file and show you how many services were found

6. **Complete Import**: Click "Import Services" to process the import

### Exporting Services

1. **Export Project Services**: Click "Export Project Services" to download services for the current project
2. **Export All Services**: Click "Export All Services" to download all services across all projects
3. **File Download**: Files are automatically downloaded with descriptive names

## JSON Schema

### Service Object Structure
```json
{
  "serviceName": "string (required)",
  "defaultUrl": "string (required, valid URL)",
  "type": "string (optional, default: 'api')",
  "repo": "string (optional)",
  "repoUrl": "string (optional, valid URL)",
  "envName": "string (optional)",
  "description": "string (optional)"
}
```

### Supported Service Types
- `api` - API services
- `database` - Database services
- `cache` - Cache services
- `queue` - Message queue services
- `storage` - File storage services
- `web` - Web applications

## Conflict Resolution Strategies

### Skip (Default)
- **Behavior**: Existing services are left unchanged
- **Use Case**: Initial imports, avoiding data loss
- **Result**: Only new services are added

### Update
- **Behavior**: Existing services are updated with new data
- **Use Case**: Updating configurations, maintaining IDs
- **Result**: Existing services updated, new services added

### Overwrite
- **Behavior**: Existing services are deleted and recreated
- **Use Case**: Complete replacement, fresh start
- **Result**: All services recreated with new IDs

## Error Handling

### Common Import Errors
- **Invalid JSON**: Malformed JSON files
- **Missing Fields**: Required fields not present
- **Invalid URLs**: Malformed URL formats
- **Duplicate Services**: Services with same name in same project

### Error Reporting
- **Summary**: Total counts of imported, updated, skipped, and failed services
- **Details**: Specific error messages for each failed service
- **Logging**: Console logs for debugging

## Best Practices

### Import
1. **Backup First**: Export existing services before importing
2. **Test with Small Files**: Start with a few services to test the process
3. **Review Conflicts**: Use appropriate conflict resolution strategy
4. **Validate Data**: Ensure your JSON data is correct before importing

### Export
1. **Regular Backups**: Export services regularly for backup purposes
2. **Version Control**: Include exports in your project version control
3. **Documentation**: Use exports to document service configurations

## Sample Files

### Complete Sample
See `sample-backend-services.json` for a complete example with 15 services.

### Minimal Sample
```json
{
  "backendServices": [
    {
      "serviceName": "EXAMPLE_API",
      "defaultUrl": "https://api.example.com/v1",
      "type": "api",
      "repo": "example-api",
      "repoUrl": "https://github.com/username/example-api.git",
      "envName": ".example-env",
      "description": "Example API service"
    }
  ],
  "version": "1.0"
}
```

## Troubleshooting

### Import Issues
- **File Not Loading**: Check JSON syntax and file format
- **Services Not Importing**: Verify required fields are present
- **Permission Errors**: Ensure you have access to the project

### Export Issues
- **Download Not Starting**: Check browser download settings
- **Empty Files**: Verify there are services to export
- **Format Issues**: Ensure proper JSON structure

## Security Considerations

- **File Validation**: All uploaded files are validated for structure and content
- **Project Isolation**: Services can only be imported to projects you have access to
- **Data Sanitization**: Input data is sanitized before database insertion
- **Audit Trail**: Import/export activities are logged for audit purposes

## Support

For issues or questions regarding the import/export functionality:
1. Check the console for error messages
2. Verify your JSON file structure
3. Ensure you have proper project permissions
4. Contact the development team with specific error details
