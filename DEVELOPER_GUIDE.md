# Developer Guide - StartupEvents Platform

## Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- Git

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/Zhangu1235/Node-pro.git
cd Node-pro
```

2. **Install dependencies**
```bash
npm install
```

3. **Create `.env` file**
```env
# Server
PORT=3000

# Apify
APIFY_API_TOKEN=your_apify_token
APIFY_WEBHOOK_SECRET=your_webhook_secret
APIFY_ACTOR_ID=9dardaZ3akeIhRfs3

# AI Assistant
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-1.5-flash

# Database (if configured)
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

4. **Start the development server**
```bash
npm run dev
# or
node server.js
```

Server runs at `http://localhost:3000`

---

## Project Structure

```
/project-root
├── /public                 # Static files & frontend
│   ├── index.html         # Main page
│   ├── login.html         # Login page
│   ├── /styles
│   │   ├── main.css       # Main styles
│   │   └── design-system.css  # Design tokens
│   └── /scripts
│       └── app.js         # Frontend logic
├── /lib                    # Backend utilities
│   ├── api-utils.js       # API utilities (NEW)
│   ├── rate-limiter.js    # Rate limiting (NEW)
│   ├── logger.js          # Logging (NEW)
│   ├── auth.js            # Authentication
│   └── event-store.js     # Event storage
├── /api                    # Vercel API functions
│   ├── index.js           # API handler
│   └── handler.js         # Request handler
├── server.js              # Express server (ENHANCED)
├── package.json           # Dependencies
└── README.md              # Project info
```

---

## Frontend Development

### Key Files
- `/public/index.html` - Main HTML structure
- `/public/styles/main.css` - All styles (1500+ lines)
- `/public/scripts/app.js` - Frontend logic (750+ lines)

### Frontend Features
- Responsive design (mobile-first)
- Advanced filtering system
- Search with debouncing
- Event pagination
- Smart caching
- Accessibility features

### CSS Architecture
```css
/* CSS is organized by section */
:root { /* Color variables */ }
.navbar { /* Navigation */ }
.hero { /* Hero section */ }
.search-bar { /* Search */ }
.advanced-filters { /* Filters (NEW) */ }
.events-grid { /* Event grid */ }
.event-card { /* Event cards */ }
.pagination { /* Pagination (NEW) */ }

/* Mobile responsiveness */
@media (max-width: 768px) { }
@media (max-width: 640px) { }
```

### JavaScript Architecture
```javascript
// Global state
let allEvents = [];
let activeFilters = {};
let paginationState = {};

// Core functions
function getFilteredEvents() { }
function sortEvents() { }
function renderEvents() { }
function applyFiltersAndRender() { }

// Event handlers
searchBtn.addEventListener('click', () => {});
filterCheckbox.addEventListener('change', () => {});
```

---

## Backend Development

### API Structure

#### Enhanced Utilities (`/lib/api-utils.js`)
```javascript
const {
    validateEventQuery,           // Validate query params
    filterEventsByQuery,          // Apply filters
    sortEvents,                   // Sort events
    paginateEvents,               // Paginate results
    getTrendingEvents,            // Get trending
    getEventSuggestions,          // Get suggestions
    createSuccessResponse,        // Standard success
    createErrorResponse           // Standard error
} = require('./lib/api-utils');
```

#### Rate Limiting (`/lib/rate-limiter.js`)
```javascript
const RateLimiter = require('./lib/rate-limiter');

// Create limiters
const apiLimiter = new RateLimiter(15 * 60 * 1000, 100);
const strictLimiter = new RateLimiter(60 * 1000, 5);

// Use in routes
app.use('/api/', apiLimiter.middleware());
app.post('/expensive', strictLimiter.middleware(), handler);
```

#### Logging (`/lib/logger.js`)
```javascript
const { log, logError, logSuccess, requestLoggingMiddleware } = require('./lib/logger');

// Use middleware
app.use(requestLoggingMiddleware);

// Log messages
log('Info message');
logError(error, 'Context');
logSuccess('Operation completed', data);
```

### Endpoint Examples

#### GET /api/events (Search & Filter)
```bash
# Get events with filters
curl -X GET \
  'http://localhost:3000/api/events?keyword=AI&location=NYC&limit=10' \
  -H 'Authorization: Bearer TOKEN'
```

#### GET /api/events/trending (New)
```bash
# Get trending events
curl -X GET \
  'http://localhost:3000/api/events/trending?days=7&limit=10' \
  -H 'Authorization: Bearer TOKEN'
```

#### GET /api/events/suggestions (New)
```bash
# Get autocomplete suggestions
curl -X GET \
  'http://localhost:3000/api/events/suggestions?query=AI&limit=5' \
  -H 'Authorization: Bearer TOKEN'
```

#### POST /api/events/bulk (New)
```bash
# Bulk export events
curl -X POST \
  'http://localhost:3000/api/events/bulk' \
  -H 'Authorization: Bearer TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "export",
    "eventIds": ["id1", "id2"]
  }'
```

---

## Development Workflow

### Adding a New Feature

1. **Create branch**
```bash
git checkout -b feature/my-feature
git checkout -b enhance-ui
```

2. **Make changes**
   - Frontend: Update `/public/` files
   - Backend: Update `/lib/` and `server.js`

3. **Test locally**
```bash
npm run dev
# Test in browser and API
```

4. **Commit changes**
```bash
git add -A
git commit -m "feat: Add my feature"
```

5. **Push and create PR**
```bash
git push origin feature/my-feature
```

---

## Common Tasks

### Add a New API Endpoint

1. **Define the endpoint in `server.js`**
```javascript
app.get('/api/my-endpoint', authMiddleware, async (req, res) => {
    try {
        // Validate input
        const validation = validateEventQuery(req.query);
        if (!validation.isValid) {
            return res.status(400).json({
                error: 'Invalid parameters',
                details: validation.errors
            });
        }

        // Process request
        const result = processData(req.query);

        // Return response
        return res.json({
            success: true,
            data: result
        });
    } catch (error) {
        logError(error, '/api/my-endpoint');
        return res.status(500).json({ error: 'Internal error' });
    }
});
```

2. **Add utility function to `/lib/api-utils.js` if needed**
3. **Update API documentation**
4. **Test the endpoint**

### Add a New Filter

1. **Add filter HTML in `/public/index.html`**
```html
<label class="filter-checkbox">
    <input type="checkbox" data-filter="my-filter" value="value">
    My Filter
</label>
```

2. **Add filter styling in `/public/styles/main.css`**
3. **Add filter handler in `/public/scripts/app.js`**
```javascript
document.querySelectorAll('[data-filter="my-filter"]').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            activeFilters.myFilters.add(e.target.value);
        } else {
            activeFilters.myFilters.delete(e.target.value);
        }
        applyFiltersAndRender();
    });
});
```

4. **Update filter logic in `getFilteredEvents()`**

### Improve Mobile Responsiveness

1. **Add mobile styles**
```css
@media (max-width: 768px) {
    .my-component {
        /* Mobile styles */
    }
}

@media (max-width: 640px) {
    .my-component {
        /* Small screen styles */
    }
}
```

2. **Test on real devices**
```bash
# Use device emulation in Chrome DevTools
# Or connect real device
```

3. **Check accessibility**
```bash
# Use axe DevTools or WAVE
# Check color contrast
# Test keyboard navigation
```

---

## Testing

### Manual Testing

1. **Frontend**
   - Open `http://localhost:3000`
   - Test search and filters
   - Test pagination
   - Test mobile responsiveness
   - Test keyboard navigation

2. **Backend**
   - Test API endpoints with curl or Postman
   - Verify rate limiting
   - Check error handling
   - Monitor console logs

### Testing Checklist

- [ ] Search works with keywords
- [ ] Filters apply correctly
- [ ] Pagination works
- [ ] Trending endpoint returns data
- [ ] Suggestions endpoint responds
- [ ] Bulk operations complete
- [ ] Rate limiting enforces limits
- [ ] Errors return proper status codes
- [ ] Mobile layout is responsive
- [ ] Keyboard navigation works
- [ ] Screen reader works

---

## Debugging

### Frontend Debugging

1. **Open DevTools** (F12)
2. **Check Console** for errors
3. **Use debugger** statements
```javascript
debugger; // Browser will pause here
```

4. **Check Network tab** for API calls
5. **Use React DevTools** if applicable

### Backend Debugging

1. **Check console output** for logs
2. **Add debug statements**
```javascript
console.log("[v0] Variable value:", value);
```

3. **Use curl to test endpoints**
```bash
curl -X GET 'http://localhost:3000/api/events' \
  -H 'Authorization: Bearer TOKEN'
```

4. **Check error logs** in console
5. **Monitor rate limiter** stats

---

## Performance Tips

### Frontend
- Use pagination to limit DOM elements
- Implement lazy loading for images
- Debounce search inputs
- Cache API responses
- Minimize CSS/JS
- Use CSS Grid/Flexbox efficiently

### Backend
- Use pagination on all endpoints
- Validate input early
- Cache frequently accessed data
- Use indexes on searchable fields
- Monitor query performance
- Set reasonable rate limits

---

## Security Checklist

- [ ] Validate all user input
- [ ] Use HTTPS in production
- [ ] Implement rate limiting
- [ ] Sanitize error messages
- [ ] Use environment variables for secrets
- [ ] Implement CORS properly
- [ ] Add CSRF protection
- [ ] Use parameterized queries
- [ ] Log security events
- [ ] Regular security audits

---

## Environment Variables

### Development
```env
PORT=3000
NODE_ENV=development
DEBUG=true
```

### Production
```env
PORT=80
NODE_ENV=production
DEBUG=false
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

---

## Useful Commands

```bash
# Start development server
npm run dev

# Start production server
npm start

# Check syntax
node -c server.js

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format

# Build for production
npm run build
```

---

## Resources

### Documentation
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Complete API reference
- [BACKEND_IMPROVEMENTS.md](./BACKEND_IMPROVEMENTS.md) - Backend details
- [IMPROVEMENTS_SUMMARY.md](./IMPROVEMENTS_SUMMARY.md) - Overview

### External Resources
- [Express.js Docs](https://expressjs.com/)
- [MDN Web Docs](https://developer.mozilla.org/)
- [Web Accessibility Guidelines](https://www.w3.org/WAI/)
- [REST API Best Practices](https://restfulapi.net/)

---

## Support

### Getting Help
1. Check existing documentation
2. Search GitHub issues
3. Review commit history
4. Ask in team chat
5. Create detailed issue report

### Reporting Bugs
- Describe expected behavior
- Describe actual behavior
- Provide steps to reproduce
- Include screenshots/logs
- Mention environment (browser, OS, Node version)

---

## Code Style Guide

### JavaScript
```javascript
// Use const by default
const variable = value;

// Use meaningful names
const eventCount = events.length;

// Use arrow functions
const filter = (arr, fn) => arr.filter(fn);

// Add comments for complex logic
// Calculate date difference in days
const daysDiff = Math.ceil((dateB - dateA) / (1000 * 60 * 60 * 24));

// Use async/await
async function fetchData() {
    try {
        const data = await fetch(url);
        return data;
    } catch (error) {
        console.error('Error:', error);
    }
}
```

### CSS
```css
/* Use consistent naming */
.component-name { }
.component-name__element { }
.component-name--modifier { }

/* Group related rules */
.event-card {
    /* Layout */
    display: flex;
    flex-direction: column;

    /* Spacing */
    padding: 1rem;
    margin-bottom: 1rem;

    /* Visual */
    background: white;
    border-radius: 8px;

    /* Behavior */
    transition: all 0.3s ease;
}

/* Mobile first approach */
.component {
    /* Mobile styles */
}

@media (min-width: 768px) {
    .component {
        /* Tablet+ styles */
    }
}
```

---

## Contributors

- Code improvements by v0[bot]
- UI/UX enhancements across all phases
- Backend optimization and API improvements
- Comprehensive documentation

---

## License

MIT License - See LICENSE file for details

---

**Last Updated**: January 15, 2024  
**Version**: 1.0.0
