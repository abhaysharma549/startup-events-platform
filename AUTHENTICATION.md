# Supabase Authentication Documentation

## Overview

This application uses **Supabase Authentication** for secure user management. The system includes:
- User registration (signup)
- User login with JWT tokens
- Token refresh mechanism
- Logout functionality
- Session management
- User profile storage

## Architecture

### Backend Structure

#### `/lib/auth.js`
Core authentication module with Supabase integration:

**Key Functions:**
- `registerUser(email, password, username)` - Create new user account
- `loginUser(email, password)` - Authenticate and return session
- `verifyToken(token)` - Validate JWT token
- `authMiddleware(req, res, next)` - Express middleware for protected routes
- `refreshToken(refreshToken)` - Get new access token
- `logoutUser(token)` - Invalidate session

**Example:**
```javascript
const { registerUser, authMiddleware } = require('./lib/auth');

// Register user
const result = await registerUser('user@example.com', 'password123', 'username');
if (result.success) {
    console.log('User created:', result.user);
}

// Protect endpoint
app.get('/api/protected', authMiddleware, (req, res) => {
    // req.user contains authenticated user info
    res.json({ user: req.user });
});
```

### Frontend Structure

#### `/public/scripts/auth.js`
Client-side authentication client for browser:

**Key Methods:**
- `AuthClient.signup(email, password, username)` - Register new user
- `AuthClient.login(email, password)` - Login user
- `AuthClient.logout()` - Logout user
- `AuthClient.isAuthenticated()` - Check auth status
- `AuthClient.getUser()` - Get current user
- `AuthClient.getToken()` - Get access token
- `AuthClient.getAuthHeaders()` - Get headers for API calls
- `AuthClient.verifyToken()` - Validate token
- `AuthClient.refreshToken()` - Refresh expired token

**Example Usage:**
```javascript
// Signup
const result = await AuthClient.signup('user@example.com', 'pass123', 'john');
if (result.success) {
    window.location.href = '/index.html';
}

// Check if logged in
if (AuthClient.isAuthenticated()) {
    const user = AuthClient.getUser();
    console.log(`Welcome, ${user.username}`);
}

// Make authenticated API call
const headers = AuthClient.getAuthHeaders();
const response = await fetch('/api/events', { headers });

// Logout
await AuthClient.logout();
```

#### `/public/scripts/login.js`
Form handler for login and signup pages

### API Endpoints

#### Authentication Endpoints

**POST `/api/auth/signup`**
Register a new user
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "username": "john_doe"
  }'
```

Response:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "john_doe"
  }
}
```

**POST `/api/auth/login`**
Authenticate and get session
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "john_doe"
  },
  "session": {
    "access_token": "eyJhbGc...",
    "refresh_token": "refresh_token_value",
    "expires_in": 3600
  }
}
```

**GET `/api/auth/verify`**
Verify current token validity
```bash
curl -X GET http://localhost:3000/api/auth/verify \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

**POST `/api/auth/refresh`**
Refresh expired access token
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "REFRESH_TOKEN"}'
```

**POST `/api/auth/logout`**
Logout and invalidate session
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## Token Management

### Access Tokens
- **Type:** JWT (JSON Web Tokens)
- **Duration:** 1 hour (3600 seconds)
- **Storage:** localStorage as `startup-events-auth-token`
- **Usage:** Sent in `Authorization: Bearer TOKEN` header

### Refresh Tokens
- **Type:** Opaque token
- **Duration:** 7 days (can be configured in Supabase)
- **Storage:** localStorage as `startup-events-refresh-token`
- **Usage:** Use to get new access token when expired

### Token Refresh Flow
1. Client makes API request with expired token
2. Backend returns 401 Unauthorized
3. Client detects 401 and calls refresh endpoint
4. New access token received
5. Original request retried with new token

## User Profile

Users have two levels of data:

### Auth Users (Supabase Auth)
- `id` - UUID
- `email` - User email
- `created_at` - Account creation date
- `metadata` - Custom fields (username stored here)

### User Profiles (Public Table)
Optional table for additional user data:
```sql
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
```

## Security Considerations

### Best Practices Implemented
- ✅ Passwords never stored on client
- ✅ JWT tokens used for stateless auth
- ✅ Refresh tokens for long-lived sessions
- ✅ Automatic token expiration
- ✅ AuthMiddleware for protected routes
- ✅ HTTPS recommended for production
- ✅ CORS enabled for web clients

### Recommended Improvements
- Use HttpOnly cookies instead of localStorage
- Implement token rotation on refresh
- Add rate limiting to auth endpoints
- Implement 2FA for sensitive accounts
- Add email verification before login
- Log authentication attempts

## Integration with Other APIs

All authenticated API calls should include the token:

```javascript
const token = AuthClient.getToken();
const response = await fetch('/api/events', {
    headers: {
        'Authorization': `Bearer ${token}`
    }
});
```

Or use the helper method:

```javascript
const response = await fetch('/api/events', {
    headers: AuthClient.getAuthHeaders()
});
```

## Error Handling

### Common Auth Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Missing/invalid token | Login again |
| 403 Forbidden | Token expired | Token auto-refreshes |
| 400 Bad Request | Invalid input | Check email/password |
| 409 Conflict | Email already exists | Use different email |

## Environment Variables

Required for authentication:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Testing Authentication

### Manual Testing
1. Visit `/login.html`
2. Click "Sign up" to create account
3. Enter email, username, password
4. Submit form
5. Should redirect to `/index.html`
6. User info shown in navbar
7. Click logout to return to login

### API Testing with cURL

```bash
# Signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","username":"testuser"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# Get token from login response and test protected endpoint
TOKEN="eyJ..."
curl -X GET http://localhost:3000/api/auth/verify \
  -H "Authorization: Bearer $TOKEN"
```

## Migration from Old Auth

If migrating from a different auth system:

1. Update all API routes to use new `authMiddleware`
2. Replace client auth calls with `AuthClient` methods
3. Update token storage if using different location
4. Test all protected endpoints
5. Verify token refresh works

## Support

For issues with:
- **Supabase Auth:** Check [Supabase Docs](https://supabase.com/docs/guides/auth)
- **JWT/Tokens:** Review token generation in `lib/auth.js`
- **Frontend Auth:** Check `public/scripts/auth.js`
- **Login Page:** See `/public/login.html` form handlers
