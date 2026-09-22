# StartupEvents API Documentation

## Overview
The StartupEvents API provides endpoints to search, filter, and manage startup events. All endpoints (except `/health` and `/api/auth/*`) require authentication via Bearer token.

## Base URL
```
http://localhost:3000/api
```

## Rate Limiting
- **Standard endpoints**: 100 requests per 15 minutes per IP
- **Bulk operations**: 5 requests per minute per IP
- Rate limit info is returned in response headers:
  - `X-RateLimit-Limit`: Total requests allowed
  - `X-RateLimit-Remaining`: Requests remaining in window
  - `X-RateLimit-Reset`: When the limit resets (ISO 8601)

## Authentication
Include the Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Public Endpoints

### Health Check
Check if the server is running.

```
GET /health
```

**Response** (200 OK):
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Authentication Endpoints

### Register
Create a new user account.

```
POST /api/auth/register
```

**Body**:
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "uuid-123",
    "email": "john@example.com",
    "username": "john_doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Login
Authenticate and get access token.

```
POST /api/auth/login
```

**Body**:
```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "user": {
    "id": "uuid-123",
    "email": "john@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Verify Token
Verify if the current token is valid.

```
GET /api/auth/verify
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "message": "Token is valid",
  "user": {
    "id": "uuid-123",
    "email": "john@example.com"
  }
}
```

### Refresh Token
Get a new access token using refresh token.

```
POST /api/auth/refresh
```

**Body**:
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## Event Endpoints

### Get Events
Fetch all events with optional filtering, sorting, and pagination.

```
GET /api/events?keyword=AI&location=NYC&sortBy=date-asc&limit=20&offset=0
Authorization: Bearer <token>
```

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `keyword` | string | - | Search by event name or description |
| `location` | string | - | Filter by city or venue name |
| `eventType` | string | - | Filter by type (workshop, networking, conference, pitch) |
| `sortBy` | string | date-asc | Sort order: date-asc, date-desc, name |
| `limit` | number | 20 | Results per page (max 100) |
| `offset` | number | 0 | Pagination offset |

**Response** (200 OK):
```json
{
  "success": true,
  "events": [
    {
      "name": "AI Summit 2024",
      "description": "Annual AI conference...",
      "dates": {
        "start": {
          "dateTime": "2024-02-15T10:00:00.000Z"
        }
      },
      "_embedded": {
        "venues": [{
          "name": "Convention Center",
          "city": {
            "name": "New York"
          }
        }]
      },
      "images": [{
        "url": "https://...",
        "ratio": "16_9"
      }],
      "url": "https://eventlink.com"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  },
  "cache": {
    "savedAt": "2024-01-15T09:00:00.000Z",
    "filePath": "/path/to/cache.json",
    "eventsCount": 150
  }
}
```

**Error Response** (400 Bad Request):
```json
{
  "error": "Invalid query parameters",
  "details": ["Limit must be a number between 1 and 100"]
}
```

### Get Trending Events
Fetch trending events within a timeframe.

```
GET /api/events/trending?days=7&limit=10
Authorization: Bearer <token>
```

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `days` | number | 7 | Timeframe in days (max 90) |
| `limit` | number | 10 | Number of events to return (max 50) |

**Response** (200 OK):
```json
{
  "success": true,
  "events": [...],
  "total": 45,
  "limit": 10,
  "timeframe": "7 days",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Get Event Suggestions
Get autocomplete suggestions for search queries.

```
GET /api/events/suggestions?query=AI&limit=5
Authorization: Bearer <token>
```

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | string | - | Search query (min 2 characters) |
| `limit` | number | 5 | Number of suggestions (max 20) |

**Response** (200 OK):
```json
{
  "success": true,
  "query": "AI",
  "suggestions": [
    {
      "id": "event-123",
      "name": "AI Summit 2024",
      "description": "Annual AI conference bringing together...",
      "location": "San Francisco",
      "date": "2024-02-15T10:00:00.000Z"
    }
  ],
  "count": 5
}
```

### Download Events
Download cached events as JSON file.

```
GET /api/events/download
Authorization: Bearer <token>
```

**Response** (200 OK):
- File download (application/json)

### Fetch Apify Events
Trigger a fresh event fetch from Apify.

```
POST /api/apify/fetch
Authorization: Bearer <token>
```

**Body** (optional):
```json
{
  "searchUrls": ["https://meetup.com/..."],
  "maxItems": 50
}
```

**Response** (200 OK):
```json
{
  "message": "Apify actor run completed and events updated.",
  "actorId": "9dardaZ3akeIhRfs3",
  "runId": "abcd1234",
  "datasetId": "xyz789",
  "eventsCount": 150,
  "cache": {...}
}
```

---

## Bulk Operations

### Bulk Export/Summary
Perform bulk operations on multiple events.

```
POST /api/events/bulk
Authorization: Bearer <token>
```

**Rate Limit**: 5 requests per minute

**Body**:
```json
{
  "action": "export",
  "eventIds": ["event-1", "event-2", "event-3"]
}
```

**Actions**:
- `export`: Return full event data for specified IDs
- `summary`: Get aggregate statistics for events

**Response** (200 OK) - Export:
```json
{
  "success": true,
  "action": "export",
  "events": [...],
  "count": 3,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Response** (200 OK) - Summary:
```json
{
  "success": true,
  "action": "summary",
  "summary": {
    "totalCount": 3,
    "eventsByType": {
      "workshop": 2,
      "networking": 1
    },
    "eventsByLocation": {
      "New York": 2,
      "San Francisco": 1
    },
    "dateRange": {
      "earliest": "2024-02-01T10:00:00.000Z",
      "latest": "2024-03-15T18:00:00.000Z"
    }
  }
}
```

---

## Assistant Endpoint

### Chat with Assistant
Get AI-powered suggestions and answers about events.

```
POST /api/assistant
Authorization: Bearer <token>
```

**Body**:
```json
{
  "message": "What events are happening next week?",
  "events": [...],
  "filters": {
    "keyword": "AI",
    "location": "New York"
  }
}
```

**Response** (200 OK):
```json
{
  "reply": "There are 5 AI events in New York next week. The most popular is the AI Summit on Feb 20th..."
}
```

---

## Webhook Endpoints

### Apify Webhook
Receive notifications when Apify completes event scraping.

```
POST /api/webhooks/apify?secret=<webhook-secret>
```

**Headers**:
```
x-apify-webhook-secret: <webhook-secret>
Content-Type: application/json
```

**Response** (200 OK):
```
Apify Webhook Processed!
```

---

## Error Handling

### Common Error Responses

**400 Bad Request**:
```json
{
  "error": "Invalid query parameters",
  "details": ["Limit must be a number between 1 and 100"]
}
```

**401 Unauthorized**:
```json
{
  "error": "Missing or invalid authentication token"
}
```

**429 Too Many Requests**:
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Try again after 2024-01-15T10:45:00.000Z",
  "retryAfter": 900
}
```

**500 Internal Server Error**:
```json
{
  "error": "Failed to fetch events",
  "message": "Internal server error"
}
```

---

## Example Requests

### Search for AI events in New York
```bash
curl -X GET \
  'http://localhost:3000/api/events?keyword=AI&location=New%20York&limit=10' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

### Get trending events for the next 30 days
```bash
curl -X GET \
  'http://localhost:3000/api/events/trending?days=30&limit=15' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

### Get autocomplete suggestions
```bash
curl -X GET \
  'http://localhost:3000/api/events/suggestions?query=blockchain' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

### Bulk export events
```bash
curl -X POST \
  'http://localhost:3000/api/events/bulk' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "export",
    "eventIds": ["event-1", "event-2"]
  }'
```

---

## Best Practices

1. **Use pagination** for large result sets
2. **Cache responses** on the client side when possible
3. **Implement retry logic** for failed requests (with exponential backoff)
4. **Monitor rate limits** using response headers
5. **Refresh tokens** before they expire
6. **Validate user input** before sending to API
7. **Handle errors gracefully** and provide user feedback
8. **Use specific queries** to reduce response payload sizes

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01-15 | Initial release with enhanced filtering, pagination, rate limiting, and new endpoints |

