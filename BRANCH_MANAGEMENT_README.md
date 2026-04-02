# Branch Management with Database Storage

This document explains the new branch management functionality that stores branch information in the database and tracks Jenkins build statuses.

## Overview

The branch management system now provides:
- **Database Storage**: All branch information is stored in the `branches` table
- **Build Tracking**: Jenkins build statuses are tracked and updated in real-time
- **Status Management**: Branches can have different build results (pending, success, failed)
- **Preview Links**: Successful builds generate preview links for testing
- **Port Management**: Automatic port assignment for each branch

## Database Schema

### Branches Table Structure
```sql
CREATE TABLE branches (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  build_number INT,
  build_result VARCHAR(100),
  domain_name VARCHAR(255),
  jenkins_job_url VARCHAR(500),
  port INT,
  preview_link VARCHAR(500),
  status ENUM('active', 'inactive', 'deleted') DEFAULT 'active',
  is_approved BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT,
  node_id INT NOT NULL,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (node_id) REFERENCES backend_nodes(id)
);
```

### Key Fields
- **`name`**: Branch name (e.g., "feature/user-auth")
- **`build_result`**: Build status (pending, success, failed)
- **`domain_name`**: Generated domain for the branch
- **`port`**: Assigned port number (7000-8000 range)
- **`preview_link`**: URL for testing the deployed branch
- **`jenkins_job_url`**: Link to Jenkins build job

## API Endpoints

### Branch Management
- `GET /api/branches/node/:nodeId` - Get all branches for a backend node
- `GET /api/branches/:id` - Get a specific branch
- `POST /api/branches` - Create a new branch
- `PUT /api/branches/:id` - Update branch information
- `DELETE /api/branches/:id` - Soft delete a branch
- `GET /api/branches/:id/status` - Get branch build status

### Request/Response Examples

#### Create Branch
```json
POST /api/branches
{
  "name": "feature/new-feature",
  "description": "New feature implementation",
  "status": "active",
  "domain_name": "ppii-feature-new-feature",
  "port": 7001,
  "node_id": 123,
  "created_by": 1
}
```

#### Update Branch (After Build)
```json
PUT /api/branches/456
{
  "build_number": 789,
  "build_result": "success",
  "preview_link": "https://feature-new-feature.ienetworks.co",
  "jenkins_job_url": "https://jenkins.example.com/job/123/"
}
```

## Workflow

### 1. Branch Creation
1. User fills branch form with name and description
2. System generates unique domain name and port
3. Branch record is created in database with `build_result: 'pending'`
4. Jenkins build is triggered with branch parameters

### 2. Build Process
1. **Initial State**: Branch created with pending status
2. **During Build**: Jenkins processes the build
3. **Success**: Branch updated with success status, build number, and preview link
4. **Failure**: Branch updated with failed status and error information

### 3. Status Updates
- **Pending**: Build is in progress or not started
- **Success**: Build completed successfully, preview link available
- **Failed**: Build failed, no preview link available

## Frontend Integration

### Service Hooks
```javascript
import { 
  useCreateBranch, 
  useUpdateBranch, 
  useDeleteBranch, 
  useBranchesByNodeId 
} from '../services/useBackendNodes';

// Create branch
const createBranch = useCreateBranch();
const newBranch = await createBranch.mutateAsync(branchData);

// Update branch
const updateBranch = useUpdateBranch();
await updateBranch.mutateAsync({ id: branchId, data: updateData });

// Delete branch
const deleteBranch = useDeleteBranch();
await deleteBranch.mutateAsync(branchId);

// Get branches for a node
const { data: branches } = useBranchesByNodeId(nodeId);
```

### Branch Creation Flow
```javascript
const handleBranchModalOk = async (values) => {
  try {
    // 1. Create initial branch record
    const initialBranchData = {
      name: values.name,
      description: values.description,
      status: 'active',
      domain_name: generatedDomainName,
      port: assignedPort,
      node_id: selectedServiceId,
      created_by: currentUserId,
      build_result: 'pending'
    };

    const createdBranch = await createBranch.mutateAsync(initialBranchData);

    // 2. Trigger Jenkins build
    await triggerJenkinsBuild(jenkinsParams, 
      // Success callback
      async (jenkinsData) => {
        await updateBranch.mutateAsync({
          id: createdBranch.id,
          data: {
            build_number: jenkinsData.buildNumber,
            build_result: 'success',
            preview_link: jenkinsData.artifactData?.url
          }
        });
      },
      // Error callback
      async (error) => {
        await updateBranch.mutateAsync({
          id: createdBranch.id,
          data: { build_result: 'failed' }
        });
      }
    );
  } catch (error) {
    console.error('Error creating branch:', error);
  }
};
```

## Build Status Tracking

### Status Values
- **`pending`**: Build not started or in progress
- **`success`**: Build completed successfully
- **`failed`**: Build failed with errors

### Status Updates
1. **Initial**: `pending` when branch is created
2. **Success**: Updated with build number, preview link, and `success` status
3. **Failure**: Updated with `failed` status and error details

## Domain Name Generation

### Pattern
```
ppii-{branch-name-with-numbers-only}
```

### Examples
- Branch: `feature/user-auth` → Domain: `ppii-featureuserauth`
- Branch: `bugfix/123-validation` → Domain: `ppii-bugfix123validation`
- Branch: `hotfix/security-456` → Domain: `ppii-hotfixsecurity456`

## Port Assignment

### Range
- **Port Range**: 7000-8000
- **Assignment**: Random port within range
- **Uniqueness**: Each branch gets a unique port

### Port Management
```javascript
const assignedPort = Math.floor(Math.random() * (8000 - 7000 + 1)) + 7000;
```

## Error Handling

### Common Scenarios
1. **Branch Creation Failed**: Database error during initial creation
2. **Build Status Update Failed**: Network error during status update
3. **Duplicate Branch Names**: Validation error for existing branches
4. **Invalid Service**: Service not found during branch creation

### Error Recovery
- **Partial Failures**: Branch created but status not updated
- **Retry Mechanisms**: Automatic retry for failed operations
- **User Notifications**: Clear error messages for different failure types

## Best Practices

### Branch Naming
- Use descriptive names (e.g., `feature/user-authentication`)
- Follow consistent patterns (feature/, bugfix/, hotfix/)
- Avoid special characters that might cause domain generation issues

### Build Monitoring
- Monitor build statuses regularly
- Set up notifications for failed builds
- Clean up failed branches that are no longer needed

### Database Maintenance
- Regular cleanup of deleted branches
- Monitor branch table size and performance
- Archive old successful branches if needed

## Testing

### Sample Data
Use `sample-branch-data.json` for testing branch operations:
```json
{
  "branches": [
    {
      "name": "feature/user-authentication",
      "description": "User authentication features",
      "status": "active",
      "domain_name": "ppii-feature-user-authentication",
      "port": 7001,
      "build_result": "success"
    }
  ]
}
```

### Test Scenarios
1. **Create Branch**: Test branch creation with valid data
2. **Build Success**: Test status update after successful build
3. **Build Failure**: Test status update after failed build
4. **Update Branch**: Test branch information updates
5. **Delete Branch**: Test soft deletion functionality

## Troubleshooting

### Common Issues
1. **Branch Not Created**: Check database connection and permissions
2. **Status Not Updated**: Verify Jenkins callback URLs and network connectivity
3. **Duplicate Domain**: Ensure domain name generation is unique
4. **Port Conflicts**: Check port availability in the assigned range

### Debug Information
- Check browser console for JavaScript errors
- Monitor network requests in browser dev tools
- Review server logs for API errors
- Verify database table structure and constraints

## Security Considerations

- **User Authentication**: Verify user permissions before branch operations
- **Input Validation**: Sanitize all user inputs
- **SQL Injection**: Use parameterized queries
- **Access Control**: Ensure users can only access their project branches

## Performance Optimization

- **Database Indexes**: Proper indexing on frequently queried fields
- **Query Optimization**: Efficient queries for branch listings
- **Caching**: Consider caching for frequently accessed branch data
- **Connection Pooling**: Optimize database connections

## Future Enhancements

- **Build History**: Track multiple build attempts for each branch
- **Auto-cleanup**: Automatic cleanup of old failed branches
- **Build Notifications**: Email/Slack notifications for build status changes
- **Branch Templates**: Predefined branch configurations for common use cases
- **Metrics Dashboard**: Build success rates and performance metrics
