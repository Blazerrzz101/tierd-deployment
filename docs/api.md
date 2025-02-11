# API Documentation

This document provides detailed information about the Tier'd API endpoints, their usage, and examples.

## Authentication

### Sign Up

```http
POST /api/auth/signup
```

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "username": "johndoe"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "created_at": "2024-03-21T00:00:00Z"
  },
  "session": {
    "access_token": "token",
    "refresh_token": "token",
    "expires_at": 1679356800
  }
}
```

### Sign In

```http
POST /api/auth/signin
```

Sign in to an existing account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "created_at": "2024-03-21T00:00:00Z"
  },
  "session": {
    "access_token": "token",
    "refresh_token": "token",
    "expires_at": 1679356800
  }
}
```

### Sign Out

```http
POST /api/auth/signout
```

Sign out the current user.

**Response:**
```json
{
  "message": "Signed out successfully"
}
```

## Products

### List Products

```http
GET /api/products
```

Get a list of products with optional filtering and pagination.

**Query Parameters:**
- `category` (string, optional): Filter by category
- `sort` (string, optional): Sort by "votes" or "date"
- `page` (number, optional): Page number
- `limit` (number, optional): Items per page

**Response:**
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Product Name",
      "description": "Product description",
      "category": "Category",
      "votes_count": 42,
      "created_at": "2024-03-21T00:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10
}
```

### Get Product

```http
GET /api/products/:id
```

Get detailed information about a specific product.

**Response:**
```json
{
  "id": "uuid",
  "name": "Product Name",
  "description": "Product description",
  "category": "Category",
  "votes_count": 42,
  "created_at": "2024-03-21T00:00:00Z",
  "threads": [
    {
      "id": "uuid",
      "title": "Thread Title",
      "content": "Thread content",
      "created_at": "2024-03-21T00:00:00Z"
    }
  ]
}
```

## Votes

### Vote on Product

```http
POST /api/products/:id/vote
```

Vote on a product.

**Request Body:**
```json
{
  "type": "up" | "down"
}
```

**Response:**
```json
{
  "product_id": "uuid",
  "votes_count": 43,
  "user_vote": "up"
}
```

### Get User Votes

```http
GET /api/votes
```

Get the current user's votes.

**Response:**
```json
{
  "votes": [
    {
      "product_id": "uuid",
      "type": "up",
      "created_at": "2024-03-21T00:00:00Z"
    }
  ]
}
```

## Threads

### Create Thread

```http
POST /api/products/:id/threads
```

Create a new thread for a product.

**Request Body:**
```json
{
  "title": "Thread Title",
  "content": "Thread content with @product mentions"
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Thread Title",
  "content": "Thread content with @product mentions",
  "created_at": "2024-03-21T00:00:00Z",
  "product_mentions": [
    {
      "id": "uuid",
      "name": "Mentioned Product",
      "category": "Category"
    }
  ]
}
```

### List Threads

```http
GET /api/products/:id/threads
```

Get threads for a product.

**Query Parameters:**
- `sort` (string, optional): Sort by "date" or "votes"
- `page` (number, optional): Page number
- `limit` (number, optional): Items per page

**Response:**
```json
{
  "threads": [
    {
      "id": "uuid",
      "title": "Thread Title",
      "content": "Thread content",
      "created_at": "2024-03-21T00:00:00Z",
      "product_mentions": [
        {
          "id": "uuid",
          "name": "Mentioned Product",
          "category": "Category"
        }
      ]
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10
}
```

## Real-time Updates

### Subscribe to Product Updates

```typescript
const channel = supabase
  .channel('product_updates')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'products' },
    (payload) => {
      // Handle product updates
    }
  )
  .subscribe()
```

### Subscribe to Vote Updates

```typescript
const channel = supabase
  .channel('vote_updates')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'votes' },
    (payload) => {
      // Handle vote updates
    }
  )
  .subscribe()
```

## Error Handling

All API endpoints follow a consistent error response format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      // Additional error details if available
    }
  }
}
```

### Common Error Codes

- `AUTH_REQUIRED`: Authentication required
- `INVALID_CREDENTIALS`: Invalid email or password
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `RESOURCE_NOT_FOUND`: Requested resource not found
- `VALIDATION_ERROR`: Invalid request parameters
- `PERMISSION_DENIED`: User lacks required permissions

## Rate Limiting

- Anonymous users: 100 requests per hour
- Authenticated users: 1000 requests per hour
- Vote endpoints: 50 votes per day for authenticated users
- Vote endpoints: 5 votes per day for anonymous users

Rate limit headers are included in all responses:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1679356800
```

## Pagination

All list endpoints support pagination using the following query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

Response includes pagination metadata:
```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "total_pages": 10
  }
}
```

## CORS

The API supports CORS for all origins in development and specified origins in production.

Allowed methods:
- GET
- POST
- PUT
- DELETE
- OPTIONS

## API Versioning

The API is versioned through the URL path. The current version is v1:
```http
https://api.tierd.com/v1/products
```

## Development Tools

### API Client

We provide a TypeScript client for easy API integration:

```typescript
import { TierdClient } from '@tierd/client'

const client = new TierdClient({
  apiKey: 'your-api-key',
  environment: 'production' // or 'development'
})

// Use the client
const products = await client.products.list({
  category: 'keyboards',
  sort: 'votes',
  page: 1,
  limit: 10
})
```

### WebSocket Client

For real-time updates:

```typescript
import { TierdRealtimeClient } from '@tierd/client'

const realtime = new TierdRealtimeClient({
  apiKey: 'your-api-key'
})

realtime.subscribe('products', (update) => {
  console.log('Product updated:', update)
})
```

## Support

For API support and questions:
- Email: api@tierd.com
- Discord: https://discord.gg/tierd
- Documentation: https://docs.tierd.com 