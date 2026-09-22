# Supabase Authentication - Troubleshooting Guide

## Problem: "It shows an error; it's not showing anything"

### What Was Fixed
1. **Fixed endpoint mismatch**: Frontend auth.js was calling `/api/auth/signup` but backend only has `/api/auth/register` - Changed to use correct endpoint
2. **Fixed auth initialization timing**: Added retry logic so `initAuth()` waits for `AuthClient` to be loaded before running
3. **Added better error handling**: Wrapped auth initialization in try-catch blocks
4. **Improved script loading**: Changed from immediate execution to delayed initialization with timeout

### Solution - Step by Step

#### 1. Clear Your Browser Cache
```bash
# In browser DevTools (F12)
# Go to Application > Storage > Clear Site Data
# Or use Ctrl+Shift+Delete to open Clear Browsing Data
```

#### 2. Check Console for Errors
```javascript
// Open Browser DevTools (F12)
// Go to Console tab
// Look for any errors in red

// Should see:
// ✓ Auth.js loaded
// ✓ AuthClient is defined
```

#### 3. Verify Backend is Running
```bash
# In terminal
curl http://localhost:3000/health
# Should return: { "status": "ok" }
```

#### 4. Check Network Requests
```javascript
// In Browser DevTools > Network tab
// Try to login
// Should see requests like:
// POST /api/auth/login - Status 200 or 401
// GET /api/events - Status 200
```

### Common Issues & Fixes

#### Issue: "AuthClient is not defined"
**Cause**: auth.js loaded after app.js tried to use it

**Fix**: 
- Restart dev server: `npm run dev`
- Clear browser cache: Ctrl+Shift+Delete
- Check console for script loading errors

#### Issue: "Cannot read property 'login' of undefined"
**Same as above** - AuthClient not loaded

**Fix**:
```javascript
// Verify in browser console:
typeof AuthClient // Should be 'object'
AuthClient.login  // Should be a function
```

#### Issue: Login returns 404
**Cause**: Backend endpoint changed from `/signup` to `/register`

**Fix**: This has been fixed in the code. If you still see 404:
1. Check server.js has `app.post('/api/auth/register'...)`
2. Restart backend: Kill process and run `npm run dev`

#### Issue: "Email already exists"
**Cause**: User already registered with that email

**Fix**: Use a different email or check Supabase dashboard

#### Issue: Login succeeds but page doesn't redirect
**Cause**: Network error or localStorage issue

**Fix**:
```javascript
// In browser console:
AuthClient.getToken()    // Should return a token string
AuthClient.getUser()     // Should return user object
localStorage.getItem('startup-events-auth-token') // Should have token
```

### Debugging Steps

#### Check if AuthClient loads correctly:
```javascript
// F12 > Console tab > Type:
AuthClient  // Should show the object with all methods
```

#### Check token storage:
```javascript
// F12 > Console:
localStorage.getItem('startup-events-auth-token')
localStorage.getItem('startup-events-user')
```

#### Make a test request:
```javascript
// F12 > Console:
AuthClient.login('test@example.com', 'password123')
  .then(result => console.log('Login result:', result))
  .catch(error => console.error('Login error:', error))
```

### File Changes Made to Fix Issues

#### `/public/scripts/auth.js`
- Changed `/api/auth/signup` → `/api/auth/register`
- Added try-catch in auto-verify logic
- Improved error messages

#### `/public/scripts/app.js`
- Added retry logic for `initAuth()`
- Changed from `initAuth()` → `setTimeout(initAuth, 50)`
- Better null checking on elements

#### `/public/login.html`
- Already correct - properly loads auth.js then login.js

### Testing Checklist

- [ ] Visit `http://localhost:3000/login.html`
- [ ] Click "Sign up"
- [ ] Enter test email, password, username
- [ ] Click "Create Account"
- [ ] Should redirect to `http://localhost:3000/index.html`
- [ ] Should see "Welcome, [username]!" in navbar
- [ ] Click "Logout"
- [ ] Should redirect to login page
- [ ] Try login with credentials
- [ ] Should work and redirect to main page

### Still Having Issues?

1. **Stop dev server**: Ctrl+C
2. **Kill port 3000**: `lsof -ti:3000 | xargs kill -9`
3. **Clear all storage**:
   ```javascript
   // In console:
   localStorage.clear()
   sessionStorage.clear()
   ```
4. **Restart server**: `npm run dev`
5. **Hard refresh browser**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
6. **Check console** for any new errors

### Network Requests Should Look Like:

**Signup:**
```
POST /api/auth/register
Headers: Content-Type: application/json
Body: {email, password, username}
Response: {user: {...}, success: true}
```

**Login:**
```
POST /api/auth/login  
Headers: Content-Type: application/json
Body: {email, password}
Response: {user: {...}, access_token: "...", refresh_token: "..."}
```

**Protected API:**
```
GET /api/events
Headers: Authorization: Bearer <token>
Response: {success: true, events: [...]}
```

### Environment Variables Check

Verify these are set in Vercel Settings or .env:
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
```

If not set, Supabase auth won't work.
