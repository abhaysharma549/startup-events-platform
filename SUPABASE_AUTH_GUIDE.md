# Supabase Authentication Setup Guide

Your Node-pro app now uses **Supabase** for authentication and user management instead of local JWT tokens.

## What Changed

✅ **Local Authentication** → **Supabase Auth**
- User registration/login managed by Supabase
- Secure password storage in Supabase
- Session tokens provided by Supabase
- User data stored in `user_profiles` table

## Setup Steps

### 1. Create User Profiles Table
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **"New Query"**
4. Copy the contents of `SUPABASE_SETUP.sql` (in your project root)
5. Paste it into the SQL Editor
6. Click **"Run"** to execute

This creates:
- `user_profiles` table to store additional user info
- Row-level security (RLS) policies
- Proper indexes for performance

### 2. Environment Variables
Your `.env` file already contains:
```
SUPABASE_URL=https://jakwgeemiepmjehawaih.supabase.co
SUPABASE_SECRET_KEY=sb_secret_TiUiOde8Bj4X4vfUvsvjWQ_JuNmR4ce
```

These are your server-side credentials (keep them secret!).

## Features

### Authentication Endpoints

**Register:**
```bash
POST /api/auth/register
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Login:**
```bash
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

Returns:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "username": "john_doe"
  },
  "session": {
    "access_token": "eyJhbGc...",
    "refresh_token": "sbr_1234...",
    "expires_in": 3600
  }
}
```

**Refresh Token:**
```bash
POST /api/auth/refresh
{
  "refresh_token": "sbr_1234..."
}
```

**Verify Token:**
```bash
GET /api/auth/verify
Authorization: Bearer <access_token>
```

**Logout:**
```bash
POST /api/auth/logout
Authorization: Bearer <access_token>
```

## How It Works

1. **Frontend** (login.html):
   - User registers or logs in
   - Receives `access_token` and `refresh_token`
   - Stores tokens in `localStorage`
   - Automatically adds token to API requests

2. **Backend** (server.js):
   - Validates all protected routes with auth middleware
   - Protected routes: `/api/apify/*`, `/api/events`, `/api/assistant`
   - Verifies token with Supabase

3. **Supabase Auth**:
   - Manages user accounts securely
   - Issues JWT tokens
   - Stores user metadata (username, email)
   - Handles password hashing

## Protected Routes

All these routes now require a valid `Authorization: Bearer <token>` header:
- `POST /api/apify/fetch` - Fetch events
- `GET /api/events` - Get cached events
- `GET /api/events/download` - Download JSON
- `POST /api/assistant` - Ask the AI assistant

## Security Notes

✅ **Best Practices Implemented:**
- Service role key stored in `.env` (server-only)
- Tokens never exposed in frontend code
- Row-level security (RLS) on `user_profiles`
- Password hashing handled by Supabase
- Session expiration (1 hour default)

## Troubleshooting

**"Missing SUPABASE_URL or SUPABASE_SECRET_KEY"**
- Ensure `.env` has both variables set correctly
- Restart your server after updating `.env`

**"Invalid token" when calling API**
- Token may have expired - use refresh endpoint
- Token format should be: `Authorization: Bearer <token>`

**Signup fails with "User already exists"**
- Email is already registered in Supabase
- Use login endpoint instead

## Next Steps

1. Run the SQL setup query in Supabase
2. Start your server: `npm run dev`
3. Visit http://localhost:3000/login
4. Register a new account
5. Login and access the app

For more info, see:
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
