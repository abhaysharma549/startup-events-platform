# Authentication Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Start the Server
```bash
npm run dev
```

### 2. Visit Login Page
Open browser: `http://localhost:3000/login.html`

### 3. Create Account
- Click "Sign up"
- Enter email, username, password
- Click "Create Account"
- **Auto-redirects to main page**

### 4. See It Work
- Username appears in top-right navbar
- Click "Logout" to return to login
- Try again with different credentials

---

## 📋 What You Get

| Feature | Status | Details |
|---------|--------|---------|
| User Signup | ✅ Live | Supabase auth with email validation |
| User Login | ✅ Live | JWT tokens + refresh tokens |
| Protected APIs | ✅ Live | All endpoints require auth |
| Session Management | ✅ Live | Auto token refresh (1hr expiry) |
| Logout | ✅ Live | Clear tokens and redirect |
| User Profile | ✅ Live | Username + email stored |

---

## 🎯 Frontend Integration

### Check if User is Logged In
```javascript
if (AuthClient.isAuthenticated()) {
    const user = AuthClient.getUser();
    console.log(user.username); // "john_doe"
}
```

### Make Authenticated API Call
```javascript
const response = await fetch('/api/events', {
    headers: AuthClient.getAuthHeaders() // ✅ Adds auth token
});
```

### Logout User
```javascript
await AuthClient.logout();
window.location.href = '/login.html';
```

---

## 🔐 Backend Protection

### Protect Any Route
```javascript
// Before
app.get('/api/mydata', (req, res) => { ... });

// After - add authMiddleware
app.get('/api/mydata', authMiddleware, (req, res) => {
    console.log(req.user.id); // User is authenticated!
    res.json({ ... });
});
```

---

## 🧪 Test in Browser Console

```javascript
// Check auth status
AuthClient.isAuthenticated() // true/false

// Get current user
AuthClient.getUser() // { id, email, username }

// Get token
AuthClient.getToken() // "eyJ..."

// Logout
await AuthClient.logout()

// Check auth headers
AuthClient.getAuthHeaders() // { Authorization: "Bearer ..." }
```

---

## 📝 API Examples

### Signup
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123",
    "username": "testuser"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123"
  }'

# Response includes tokens and user
{
  "success": true,
  "user": { "id": "...", "email": "...", "username": "..." },
  "session": {
    "access_token": "eyJ...",
    "refresh_token": "...",
    "expires_in": 3600
  }
}
```

### Use Token for Protected API
```bash
TOKEN="eyJ..." # From login response
curl -X GET http://localhost:3000/api/events \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🛠️ File Reference

| File | What It Does |
|------|-------------|
| `/lib/auth.js` | Backend auth logic + Supabase integration |
| `/public/scripts/auth.js` | Frontend auth client (use this!) |
| `/public/scripts/login.js` | Login/signup form handler |
| `/public/login.html` | Beautiful login page |

---

## ⚡ Common Tasks

### Add Auth to New Endpoint
```javascript
const { authMiddleware } = require('./lib/auth');

app.get('/api/my-endpoint', authMiddleware, (req, res) => {
    const userId = req.user.id;
    // User is authenticated!
});
```

### Get User Info in API
```javascript
app.get('/api/profile', authMiddleware, (req, res) => {
    res.json({
        id: req.user.id,
        email: req.user.email
        // username is in req.user.user_metadata.username
    });
});
```

### Show Different UI for Logged-In Users
```javascript
if (AuthClient.isAuthenticated()) {
    // Show premium features
} else {
    // Show login link
}
```

### Redirect to Login if Not Authenticated
```javascript
if (!AuthClient.isAuthenticated()) {
    window.location.href = '/login.html';
}
```

---

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Email already exists" | Use different email or login instead |
| "Invalid password" | Check password is at least 6 chars |
| "Token expired" | Page refreshes automatically, or logout and login |
| "401 Unauthorized" | API call missing auth header - check `AuthClient.getAuthHeaders()` |
| Login not working | Check browser console for errors, check server is running |

---

## 📚 Learn More

- **Full Docs**: See `AUTHENTICATION.md`
- **Implementation Details**: See `AUTH_IMPLEMENTATION.md`
- **Backend Code**: See `/lib/auth.js`
- **Frontend Code**: See `/public/scripts/auth.js`

---

## 🎉 That's It!

Your app now has:
- ✅ User registration & login
- ✅ Secure JWT authentication
- ✅ Protected API endpoints
- ✅ Automatic token refresh
- ✅ Beautiful login UI

**Everything is production-ready!**
