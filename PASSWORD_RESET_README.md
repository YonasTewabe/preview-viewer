# Password Reset Functionality

This document describes the password reset functionality implemented in the Preview Builder application.

## Overview

The application now includes a complete password reset flow that allows users to:
1. Request a password reset via email
2. Receive a secure reset link
3. Reset their password using a valid token

## Backend Implementation

### New Routes

#### POST /api/auth/forgot-password
- **Purpose**: Request a password reset
- **Request Body**: `{ "email": "user@example.com" }`
- **Response**: Generic success message (prevents email enumeration)
- **Security Features**:
  - Rate limiting: 5 requests per 15 minutes per IP
  - Email validation
  - Generic responses to prevent information leakage

#### POST /api/auth/reset-password
- **Purpose**: Reset password using token
- **Request Body**: 
  ```json
  {
    "email": "user@example.com",
    "token": "reset_token_here",
    "password": "newPassword123",
    "passwordConfirmation": "newPassword123"
  }
  ```
- **Response**: Success message or validation errors
- **Security Features**:
  - Password strength validation
  - Token expiration (1 hour)
  - SHA256 hashed tokens

### Security Features

1. **Rate Limiting**: Prevents brute force attacks on forgot-password endpoint
2. **Token Security**: 
   - 32-byte random tokens
   - SHA256 hashed storage
   - 1-hour expiration
3. **Generic Responses**: Prevents email enumeration attacks
4. **Password Validation**: 
   - Minimum 8 characters
   - Must contain lowercase, uppercase, and number
5. **Token Invalidation**: Tokens are cleared after use

### Database Changes

The User model already includes the necessary fields:
- `reset_password_token`: Stores hashed reset token
- `reset_password_expires`: Token expiration timestamp

## Frontend Implementation

### New Pages

#### /forgot-password
- Clean, responsive form to enter email
- Shows generic success message after submission
- Links back to login page

#### /reset-password?token=...&email=...
- Password reset form with validation
- Accepts token and email from URL parameters
- Password strength requirements displayed
- Automatic redirect to login after success

### Features

1. **Responsive Design**: Works on all device sizes
2. **Form Validation**: Client-side validation with helpful error messages
3. **Loading States**: Visual feedback during API calls
4. **Error Handling**: User-friendly error messages
5. **Navigation**: Easy navigation between pages

## Email Configuration

### Environment Variables Required

```bash
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL="Preview Builder" <noreply@example.com>
FRONTEND_URL=http://localhost:3000

# Database Configuration
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=preview_builder
DB_HOST=localhost
DB_PORT=3306
```

### Email Templates

The system includes professional HTML email templates for:
- Password reset requests
- Welcome emails (existing)

## Usage Flow

1. **User requests password reset**:
   - Navigate to `/forgot-password`
   - Enter email address
   - Submit form

2. **System processes request**:
   - Validates email format
   - Checks if user exists (without revealing)
   - Generates secure reset token
   - Sends email with reset link

3. **User resets password**:
   - Clicks link in email
   - Enters new password
   - Confirms password
   - Submits form

4. **System completes reset**:
   - Validates token and expiration
   - Updates password (hashed with bcrypt)
   - Invalidates reset token
   - Redirects to login

## Testing

### Development Mode
- Uses Ethereal Email for testing
- Preview URLs provided in console
- No actual emails sent

### Production Mode
- Configured SMTP server
- Real emails sent to users

## Security Considerations

1. **Token Storage**: Never store plain text tokens
2. **Rate Limiting**: Implemented on sensitive endpoints
3. **Generic Responses**: Prevent information leakage
4. **Token Expiration**: Short-lived tokens (1 hour)
5. **Password Strength**: Enforce strong password requirements
6. **HTTPS**: Ensure all communications are encrypted in production

## Troubleshooting

### Common Issues

1. **Email not received**:
   - Check spam folder
   - Verify SMTP configuration
   - Check server logs for errors

2. **Token expired**:
   - Request new password reset
   - Tokens expire after 1 hour

3. **Invalid token**:
   - Ensure complete URL is copied
   - Check if token was already used

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` in your environment variables.

## Future Enhancements

1. **Session Invalidation**: Force logout other sessions after password reset
2. **Audit Logging**: Track password reset attempts
3. **Multi-factor Authentication**: Add 2FA for password resets
4. **Password History**: Prevent reuse of recent passwords
5. **Account Lockout**: Temporary lockout after failed attempts
