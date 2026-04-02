# Authentication System for Preview Builder

This document describes the complete authentication system implemented for the Preview Builder application.

## 🔐 Overview

The authentication system includes:
- **Login Page**: Beautiful, responsive login form
- **User Authentication**: Username/password authentication with database verification
- **Protected Routes**: Route protection based on authentication status and user roles
- **Session Management**: Token-based session handling with localStorage persistence
- **Role-Based Access Control**: Different access levels (admin, developer, viewer)

## 🏗️ Architecture

### Frontend Components

#### 1. Login Page (`src/pages/Login.jsx`)
- Modern, responsive design using Ant Design components
- Form validation with error handling
- Integration with AuthContext for authentication
- Auto-redirect for already authenticated users
- Default credentials display for development

#### 2. Authentication Context (`src/contexts/AuthContext.jsx`)
- Centralized authentication state management
- Persistent login sessions using localStorage
- Role-based permission checking
- Automatic token management for API calls

#### 3. Protected Route Component (`src/components/ProtectedRoute.jsx`)
- Route-level authentication protection
- Role-based access control
- Loading states and error handling
- Automatic redirects for unauthorized access

#### 4. App Header (`src/components/AppHeader.jsx`)
- User information display
- Logout functionality
- Dropdown menu for user actions
- Professional header design

#### 5. App Layout (`src/components/AppLayout.jsx`)
- Consistent layout wrapper for authenticated pages
- Includes header and content areas

### Backend API

#### 1. Authentication Routes (`server/routes/auth.js`)
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user information

#### 2. Database Integration
- User authentication against MySQL database
- Password verification (currently plain text for development)
- Last login tracking
- User status validation

## 🚀 Usage

### Default Admin Account
After running `npm run db:init`, you'll have:
- **Username**: `admin`
- **Password**: `admin`
- **Role**: `admin`
- **Email**: `admin@preview-builder.local`

### Login Process
1. Navigate to `/login`
2. Enter username and password
3. System validates credentials against database
4. On success, user is redirected to home page
5. Session is persisted in localStorage

### Route Protection
```jsx
// Public route
<Route path="/login" element={<Login />} />

// Protected route (any authenticated user)
<Route 
  path="/" 
  element={
    <ProtectedRoute>
      <Home />
    </ProtectedRoute>
  } 
/>

// Role-protected route (developer or admin only)
<Route 
  path="/config" 
  element={
    <ProtectedRoute requiredRole="developer">
      <FrontendConfig />
    </ProtectedRoute>
  } 
/>
```

### Using Authentication Context
```jsx
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { 
    user, 
    isAuthenticated, 
    isAdmin, 
    isDeveloper, 
    logout 
  } = useAuth();

  if (!isAuthenticated()) {
    return <div>Please login</div>;
  }

  return (
    <div>
      <p>Welcome, {user.username}!</p>
      {isAdmin() && <AdminPanel />}
      {isDeveloper() && <DeveloperTools />}
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## 🔧 Configuration

### Environment Variables
Make sure your server `.env` file includes database configuration:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=preview_builder
```

### API Base URL
The frontend is configured to connect to `http://localhost:4000` for API calls. Update `src/contexts/AuthContext.jsx` if your server runs on a different port.

## 🛡️ Security Features

### Current Implementation
- Database-backed user authentication
- Session token management
- Role-based access control
- Protected routes
- Input validation
- Error handling

### Production Recommendations
1. **Password Hashing**: Implement bcrypt for password hashing
2. **JWT Tokens**: Replace simple tokens with JWT for better security
3. **HTTPS**: Use HTTPS in production
4. **Token Expiration**: Implement token expiration and refresh
5. **Rate Limiting**: Add rate limiting for login attempts
6. **Input Sanitization**: Enhanced input validation and sanitization

## 🎨 UI Features

### Login Page Design
- Modern gradient background
- Card-based form layout
- Loading states and error messages
- Responsive design
- Default credentials display
- Form validation with helpful messages

### User Interface
- Professional header with user info
- Dropdown menu for user actions
- Consistent layout across pages
- Loading spinners for better UX
- Error boundaries for fault tolerance

## 📱 Responsive Design

The authentication system is fully responsive and works on:
- Desktop browsers
- Tablets
- Mobile devices

## 🧪 Testing

### Manual Testing Steps
1. Start the server: `cd server && npm run dev`
2. Start the frontend: `npm run dev`
3. Initialize database: `cd server && npm run db:init`
4. Navigate to `http://localhost:5173`
5. Try logging in with `admin`/`admin`
6. Test protected routes
7. Test logout functionality

### Test Scenarios
- ✅ Login with correct credentials
- ✅ Login with incorrect credentials
- ✅ Access protected routes when authenticated
- ✅ Redirect to login when not authenticated
- ✅ Role-based access control
- ✅ Session persistence across browser refresh
- ✅ Logout functionality

## 🔄 Integration with Existing Pages

The authentication system is integrated with your existing pages:
- **Home Page**: Protected, requires authentication
- **Frontend Config**: Protected, requires developer role or admin
- All pages now include the app header with user info and logout

## 📋 User Roles

1. **Admin**: Full access to all features
2. **Developer**: Access to development tools and configurations
3. **Viewer**: Basic read-only access

## 🚨 Troubleshooting

### Common Issues
1. **Database Connection**: Ensure MySQL is running and credentials are correct
2. **CORS Issues**: Server includes CORS middleware
3. **Token Issues**: Clear localStorage if experiencing token problems
4. **Route Issues**: Check that all routes are properly wrapped with ProtectedRoute

### Debug Commands
```bash
# Check server logs
cd server && npm run dev

# Check database connection
cd server && npm run db:init

# Clear browser storage
localStorage.clear()
```

## 🔮 Future Enhancements

- Password reset functionality
- User registration (if needed)
- Two-factor authentication
- Social login integration
- User profile management
- Audit logging
- Password complexity requirements
- Account lockout after failed attempts

The authentication system is now fully functional and ready for use!