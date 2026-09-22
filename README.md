# StartupEvents

A Node.js event discovery app for startup and AI events. It fetches event data from Apify, stores a local JSON cache, serves a static frontend, protects app APIs with Supabase authentication, and broadcasts fresh event data in real time with Socket.IO.

## Features

- Express 5 server for the web app and API routes
- Static frontend in `public/`
- Supabase-backed signup, login, token verification, refresh, and logout flow
- Protected event, Apify, assistant, and download APIs
- Apify actor integration for fetching event data
- Apify webhook endpoint for automatic event cache updates
- Local JSON event cache with configurable storage path
- Filtering, sorting, pagination, trending events, suggestions, and bulk event operations
- Socket.IO updates for connected clients
- Gemini-powered assistant endpoint for event discovery help
- In-memory API rate limiting
- Vercel-compatible API entrypoints

## Requirements

- Node.js 18 or newer
- npm
- Supabase project URL and service role key
- Apify API token
- Gemini API key, if you want to use the assistant endpoint
- Cloudflare Turnstile site key, optional, for CAPTCHA configuration

## Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Update `.env` with your own values:

```env
PORT=3000

SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

APIFY_API_TOKEN=your_apify_api_token_here
APIFY_WEBHOOK_SECRET=choose_a_long_random_secret
APIFY_ACTOR_ID=9dardaZ3akeIhRfs3

EVENTS_CACHE_DIR=./data
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash

TURNSTILE_SITE_KEY=your_cloudflare_turnstile_site_key_here
```

Create the Supabase profile table from `SUPABASE_SETUP.sql` before using registration. The backend writes user profile rows to `user_profiles` after creating Supabase Auth users.

## Run Locally

Start the development server:

```bash
npm run dev
```

Open the app:

```text
http://localhost:3000
```

Login and signup are available at:

```text
http://localhost:3000/login
```

For production-style local startup:

```bash
npm start
```

## Authentication

Most API routes require a Supabase access token:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

Public routes:

- `GET /`
- `GET /login`
- `GET /health`
- `GET /api/auth/config`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/webhooks/apify`

Protected routes include event reads, downloads, Apify fetches, assistant calls, token verification, logout, and bulk operations.

## API Routes

### Health Check

```http
GET /health
```

Returns server health and a timestamp.

### Auth Config

```http
GET /api/auth/config
```

Returns CAPTCHA configuration for the frontend.

### Register

```http
POST /api/auth/register
```

Creates a Supabase Auth user and a `user_profiles` row.

Expected JSON body:

```json
{
  "username": "founder",
  "email": "founder@example.com",
  "password": "secret123",
  "captchaToken": "optional-turnstile-token"
}
```

### Login

```http
POST /api/auth/login
```

Authenticates with Supabase and returns the user plus access and refresh tokens.

### Verify Token

```http
GET /api/auth/verify
```

Requires auth. Verifies the current access token.

### Refresh Token

```http
POST /api/auth/refresh
```

Returns a fresh Supabase session from a refresh token.

### Logout

```http
POST /api/auth/logout
```

Requires auth. Confirms logout; client-side token removal completes the flow.

### Fetch Events From Apify

```http
POST /api/apify/fetch
```

Requires auth. Runs the configured Apify actor, maps dataset items into app event objects, saves them to the local cache, and broadcasts the update over Socket.IO.

### Apify Webhook

```http
POST /api/webhooks/apify?secret=YOUR_WEBHOOK_SECRET
```

Receives an Apify webhook payload, reads the completed run dataset, updates the local cache, and broadcasts the latest events. If `APIFY_WEBHOOK_SECRET` is set, the request must include the matching `secret` query parameter or `x-apify-webhook-secret` header.

### Get Cached Events

```http
GET /api/events
```

Requires auth. Returns cached events with filtering, sorting, and pagination.

Supported query parameters:

- `keyword`
- `location`
- `eventType`
- `sortBy`, defaults to `date-asc`
- `limit`, defaults to `20`, maximum `100`
- `offset`, defaults to `0`

### Download Event Cache

```http
GET /api/events/download
```

Requires auth. Downloads the local `events-cache.json` file when a cache exists.

### Trending Events

```http
GET /api/events/trending
```

Requires auth. Returns upcoming or recent trending events from the local cache.

Supported query parameters:

- `days`, defaults to `7`, maximum `90`
- `limit`, defaults to `10`, maximum `50`

### Event Suggestions

```http
GET /api/events/suggestions?query=ai
```

Requires auth. Returns search-as-you-type event suggestions. The query must be at least 2 characters.

### Bulk Event Operations

```http
POST /api/events/bulk
```

Requires auth. Supports `export` and `summary` actions for up to 50 event IDs.

Expected JSON body:

```json
{
  "action": "summary",
  "eventIds": ["Event name or id"]
}
```

### Assistant

```http
POST /api/assistant
```

Requires auth. Uses Gemini to answer short, practical questions based on the provided event data and filter context.

Expected JSON body:

```json
{
  "message": "Which AI events should I look at this week?",
  "filters": {},
  "events": []
}
```

## Rate Limiting

All `/api/` routes use an in-memory limiter of 100 requests per 15 minutes per IP or authenticated user. Bulk event operations also use a stricter limit of 5 requests per minute.

Rate limit headers:

- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

## Data Persistence

Fetched events are saved as JSON using `EVENTS_CACHE_DIR` or `EVENTS_CACHE_FILE`.

For local development, this can be:

```env
EVENTS_CACHE_DIR=./data
```

On hosts with ephemeral filesystems, the cache may not persist between restarts or function invocations. See `VERCEL_DEPLOYMENT.md` for hosting notes.

## Project Structure

```text
api/                    Vercel API entrypoints
lib/api-utils.js        Event filtering, sorting, pagination, and response helpers
lib/auth.js             Supabase auth helpers and auth middleware
lib/event-store.js      Local event cache helpers
lib/logger.js           Request and error logging helpers
lib/rate-limiter.js     In-memory API rate limiter
public/                 Static frontend assets
server.js               Express and Socket.IO server
SUPABASE_SETUP.sql      Supabase table setup
vercel.json             Vercel routing config
```

## Scripts

```bash
npm run dev     # Start server with node --watch
npm start       # Start server
npm run build   # Placeholder build command
npm test        # Placeholder test command
```

## Additional Docs

- `AUTH_QUICK_START.md`
- `AUTHENTICATION.md`
- `API_DOCUMENTATION.md`
- `SUPABASE_AUTH_GUIDE.md`
- `VERCEL_DEPLOYMENT.md`
- `TROUBLESHOOTING.md`
- `DEVELOPER_GUIDE.md`

## Deployment

The app can run on Vercel, Render, Railway, or another Node.js host. Set the same environment variables in your hosting provider. If you need durable JSON cache storage, prefer a host with persistent disks or volumes.

See `VERCEL_DEPLOYMENT.md` for deployment details.
