# 📘 API Documentation

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Rate Limiting](#rate-limiting)
4. [Error Handling](#error-handling)
5. [API Endpoints](#api-endpoints)
6. [Tools API](#tools-api)
7. [User API](#user-api)
8. [Stripe API](#stripe-api)
9. [Email API](#email-api)
10. [Health Check API](#health-check-api)
11. [Security](#security)
12. [Testing](#testing)

## 🔍 Overview

The Design Kit API provides programmatic access to all tools and services available in the web application. The API is organized around REST principles and returns JSON responses.

### Base URL

```
https://api.desinerkit.com/v1
```

For local development:
```
http://localhost:3000/api
```

### Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "data": { /* response data */ },
  "meta": { /* metadata */ }
}
```

Or for errors:

```json
{
  "success": false,
  "error": {
    "type": "VALIDATION",
    "message": "Invalid request data",
    "status": 400,
    "context": { /* additional context */ }
  }
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request succeeded |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid request data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Access denied |
| 404 | Not Found - Resource not found |
| 405 | Method Not Allowed - Invalid HTTP method |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |
| 503 | Service Unavailable - Service not configured |

## 🔐 Authentication

All API endpoints require authentication via JWT tokens obtained through Supabase authentication.

### Headers

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Token Refresh

Tokens expire after 1 hour. Use the refresh endpoint to get a new token:

```bash
POST /api/auth/refresh
```

### User Context

Authenticated requests automatically include user context:

```typescript
interface UserContext {
  id: string
  email: string
  full_name: string
  plan: 'free' | 'premium' | 'pro'
  stripe_customer_id?: string
}
```

## 🚦 Rate Limiting

API endpoints implement rate limiting using Upstash Redis with different limits based on endpoint type and user authentication:

### Rate Limit Tiers

| Tier | Requests/Minute | Applied To | Description |
|------|----------------|------------|-------------|
| IP-based | 10 | Public endpoints | Unauthenticated requests (health check) |
| User-based | 30 | Authenticated endpoints | Standard user operations |
| User-based (Updates) | 10 | Profile updates | Write operations with stricter limits |
| API Tools | 5 | Tool processing | Strict limits for resource-intensive operations |

### Endpoint-Specific Limits

| Endpoint Category | Rate Limit | Identifier |
|------------------|------------|------------|
| `/api/health` | 10/min | IP address |
| `/api/user/profile` (GET) | 30/min | User ID |
| `/api/user/profile` (PUT) | 10/min | User ID |
| `/api/user/email-preferences` (GET) | 30/min | User ID |
| `/api/user/email-preferences` (PUT) | 10/min | User ID |
| `/api/stripe/create-checkout` | 30/min | User ID |
| `/api/stripe/create-portal` | 30/min | User ID |
| `/api/tools/background-remover` | 5/min | User ID |
| `/api/tools/image-upscaler` | 5/min | User ID |
| `/api/tools/check-quota` | 30/min | User ID |
| `/api/tools/increment-usage` | 30/min | User ID |
| `/api/email/send` | 30/min | User ID |

### Rate Limit Headers

All responses include rate limit headers:

```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 29
X-RateLimit-Reset: 2023-12-01T12:01:00Z
```

### Daily Quota System

In addition to rate limiting, API-powered tools are subject to daily quotas based on user plans:

| Plan | Daily API Quota | File Size Limit | Batch Processing |
|------|----------------|-----------------|------------------|
| Free | 10 operations | 10MB | Not available |
| Premium | 500 operations | 50MB | 10 files |
| Pro | 2000 operations | 100MB | 50 files |

#### Quota Reset

Daily quotas reset at midnight UTC (00:00:00Z) each day.

#### Quota Checking

Before making API tool requests, check quota availability:

```bash
curl -X GET http://localhost:3000/api/tools/check-quota \
  -H "Authorization: Bearer <jwt_token>"
```

#### Quota Exceeded Response

When daily quota is exceeded:

```json
{
  "error": "Daily quota exceeded",
  "currentUsage": 10,
  "maxUsage": 10,
  "plan": "free"
}
```

### Rate Limit Response

When rate limit is exceeded:

```json
{
  "success": false,
  "error": {
    "type": "RATE_LIMIT",
    "message": "Rate limit exceeded. Please try again later.",
    "status": 429,
    "context": {
      "limit": 60,
      "remaining": 0,
      "reset": "2023-12-01T00:00:00Z"
    }
  }
}
```

## ⚠️ Error Handling

The API uses standardized error responses with context information:

### Error Types

| Type | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION | 400 | Invalid request data |
| AUTHENTICATION | 401 | Authentication required |
| AUTHORIZATION | 403 | Access denied |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource conflict |
| QUOTA_EXCEEDED | 403 | Daily quota exceeded |
| RATE_LIMIT | 429 | Rate limit exceeded |
| BAD_REQUEST | 400 | Malformed request |
| INTERNAL | 500 | Internal server error |
| METHOD_NOT_ALLOWED | 405 | Invalid HTTP method |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "type": "VALIDATION",
    "message": "Email is required",
    "status": 400,
    "context": {
      "field": "email",
      "value": null
    }
  }
}
```

## 📍 API Endpoints

### Authentication Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/refresh` | POST | Refresh JWT token |
| `/api/auth/logout` | POST | Sign out user |

### Tools Endpoints

| Endpoint | Method | Description | Rate Limit | Auth Required |
|----------|--------|-------------|------------|---------------|
| `/api/tools/background-remover` | POST | Remove image backgrounds | 5/min | Yes |
| `/api/tools/image-upscaler` | POST | Upscale images with AI | 5/min | Yes |
| `/api/tools/check-quota` | GET | Check user's daily quota | 30/min | Yes |
| `/api/tools/increment-usage` | POST | Increment usage count | 30/min | Yes |

### User Endpoints

| Endpoint | Method | Description | Rate Limit | Auth Required |
|----------|--------|-------------|------------|---------------|
| `/api/user/profile` | GET | Get user profile | 30/min | Yes |
| `/api/user/profile` | PUT | Update user profile | 10/min | Yes |
| `/api/user/email-preferences` | GET | Get email preferences | 30/min | Yes |
| `/api/user/email-preferences` | PUT | Update email preferences | 10/min | Yes |

### Stripe Endpoints

| Endpoint | Method | Description | Rate Limit | Auth Required |
|----------|--------|-------------|------------|---------------|
| `/api/stripe/create-checkout` | POST | Create checkout session | 30/min | Yes |
| `/api/stripe/create-portal` | POST | Create customer portal session | 30/min | Yes |
| `/api/stripe/webhook` | POST | Handle Stripe webhooks | None | No (Signature) |

### Email Endpoints

| Endpoint | Method | Description | Rate Limit | Auth Required |
|----------|--------|-------------|------------|---------------|
| `/api/email/send` | POST | Send transactional emails | 30/min | Internal |
| `/api/email/send` | GET | Check email service status | 30/min | No |

### Health Check Endpoints

| Endpoint | Method | Description | Rate Limit | Auth Required |
|----------|--------|-------------|------------|---------------|
| `/api/health` | GET | System health check | 10/min | No |

## 🛠️ Tools API

### Background Remover

Remove image backgrounds with AI-powered precision using Remove.bg API.

#### Endpoint

```
POST /api/tools/background-remover
```

#### Rate Limiting

- **Limit**: 5 requests per minute per user
- **Quota**: Counts against daily API quota based on user plan

#### Request

```bash
curl -X POST http://localhost:3000/api/tools/background-remover \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "my-image.png"
  }'
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| filename | String | Yes | Original filename for processing |

#### Response

```json
{
  "success": true,
  "filename": "my-image.png",
  "processedAt": "2023-12-01T12:00:00Z",
  "message": "Background removed successfully"
}
```

#### Errors

| Error Type | Status | Description |
|------------|--------|-------------|
| VALIDATION | 400 | Invalid filename parameter |
| AUTHENTICATION | 401 | User not authenticated |
| QUOTA_EXCEEDED | 429 | Daily quota exceeded |
| RATE_LIMIT | 429 | Rate limit exceeded (5/min) |
| INTERNAL | 500 | Processing failed |

### Image Upscaler

Enhance image resolution with AI-powered upscaling using Replicate API.

#### Endpoint

```
POST /api/tools/image-upscaler
```

#### Rate Limiting

- **Limit**: 5 requests per minute per user
- **Quota**: Counts against daily API quota based on user plan

#### Request

```bash
curl -X POST http://localhost:3000/api/tools/image-upscaler \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: multipart/form-data" \
  -F "image=@path/to/image.png" \
  -F "scale=2"
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| image | File | Yes | Image file (PNG, JPG, WEBP, max 10MB) |
| scale | Integer | Yes | Scale factor (2, 4, or 8) |

#### Response

```json
{
  "imageUrl": "https://replicate.delivery/pbxt/abc123.png",
  "predictionId": "pred_xyz789",
  "processingTime": 2345,
  "scaleFactor": 2
}
```

#### Errors

| Error Type | Status | Description |
|------------|--------|-------------|
| VALIDATION | 400 | Invalid file type, size, or scale factor |
| AUTHENTICATION | 401 | User not authenticated |
| QUOTA_EXCEEDED | 403 | Daily quota exceeded |
| RATE_LIMIT | 429 | Rate limit exceeded (5/min) |
| INTERNAL | 500 | Processing failed or Replicate API error |

### Check Quota

Check user's remaining API quota for today.

#### Endpoint

```
GET /api/tools/check-quota
```

#### Rate Limiting

- **Limit**: 30 requests per minute per user
- **Quota**: Does not count against daily API quota

#### Request

```bash
curl -X GET http://localhost:3000/api/tools/check-quota \
  -H "Authorization: Bearer <jwt_token>"
```

#### Response

```json
{
  "canUse": true,
  "currentUsage": 45,
  "dailyLimit": 500,
  "remaining": 455,
  "plan": "premium",
  "resetAt": "2023-12-02T00:00:00Z"
}
```

#### Errors

| Error Type | Status | Description |
|------------|--------|-------------|
| AUTHENTICATION | 401 | User not authenticated |
| NOT_FOUND | 404 | User profile not found |
| RATE_LIMIT | 429 | Rate limit exceeded (30/min) |
| INTERNAL | 500 | Database query failed |

### Increment Usage

Increment user's API tool usage count after successful operations.

#### Endpoint

```
POST /api/tools/increment-usage
```

#### Rate Limiting

- **Limit**: 30 requests per minute per user
- **Quota**: This endpoint manages the quota system

#### Request

```bash
curl -X POST http://localhost:3000/api/tools/increment-usage \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "toolName": "background-remover",
    "fileSizeMb": 2.5,
    "processingTimeMs": 1234,
    "success": true
  }'
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| toolName | String | Yes | Name of the tool used |
| fileSizeMb | Number | No | File size in megabytes |
| processingTimeMs | Number | No | Processing time in milliseconds |
| success | Boolean | No | Whether operation was successful (default: true) |
| errorMessage | String | No | Error message if success is false |

#### Response

```json
{
  "success": true,
  "currentUsage": 46,
  "dailyLimit": 500,
  "remaining": 454
}
```

#### Errors

| Error Type | Status | Description |
|------------|--------|-------------|
| VALIDATION | 400 | Invalid request body or missing toolName |
| AUTHENTICATION | 401 | User not authenticated |
| QUOTA_EXCEEDED | 403 | Daily quota already exceeded |
| NOT_FOUND | 404 | User profile not found |
| RATE_LIMIT | 429 | Rate limit exceeded (30/min) |
| INTERNAL | 500 | Database operation failed |

### Image Upscaler

Enhance image resolution with AI-powered upscaling.

#### Endpoint

```
POST /api/tools/image-upscaler
```

#### Request

```bash
curl -X POST https://api.desinerkit.com/v1/api/tools/image-upscaler \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: multipart/form-data" \
  -F "image=@path/to/image.png" \
  -F "scale=2"
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| image | File | Yes | Image file (PNG, JPG, WEBP) |
| scale | Integer | Yes | Scale factor (2, 4, or 8) |

#### Response

```json
{
  "success": true,
  "data": {
    "imageUrl": "https://cdn.desinerkit.com/results/def456.png",
    "predictionId": "pred_uvw123",
    "processingTime": 2345,
    "scaleFactor": 2
  },
  "meta": {
    "tool": "image-upscaler",
    "version": "1.0"
  }
}
```

#### Errors

| Error Type | Status | Description |
|------------|--------|-------------|
| VALIDATION | 400 | Invalid scale factor or file |
| AUTHENTICATION | 401 | User not authenticated |
| QUOTA_EXCEEDED | 403 | Daily quota exceeded |
| RATE_LIMIT | 429 | Rate limit exceeded |
| INTERNAL | 500 | Processing failed |

### Mockup Generator

Create realistic product mockups.

#### Endpoint

```
POST /api/tools/mockup-generator
```

#### Request

```bash
curl -X POST https://api.desinerkit.com/v1/api/tools/mockup-generator \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: multipart/form-data" \
  -F "design=@path/to/design.png" \
  -F "template=device-iphone-14-pro" \
  -F "position[x]=100" \
  -F "position[y]=200" \
  -F "scale=1.5" \
  -F "rotation=15"
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| design | File | Yes | Design file (PNG with transparency) |
| template | String | Yes | Mockup template ID |
| position[x] | Integer | No | Horizontal position |
| position[y] | Integer | No | Vertical position |
| scale | Float | No | Scale factor |
| rotation | Integer | No | Rotation degrees |

#### Response

```json
{
  "success": true,
  "data": {
    "imageUrl": "https://cdn.desinerkit.com/results/ghi789.png",
    "templateId": "device-iphone-14-pro",
    "processingTime": 3456
  },
  "meta": {
    "tool": "mockup-generator",
    "version": "1.0"
  }
}
```

#### Errors

| Error Type | Status | Description |
|------------|--------|-------------|
| VALIDATION | 400 | Invalid template or parameters |
| AUTHENTICATION | 401 | User not authenticated |
| QUOTA_EXCEEDED | 403 | Daily quota exceeded |
| RATE_LIMIT | 429 | Rate limit exceeded |
| INTERNAL | 500 | Processing failed |

### Color Picker

Extract colors from images.

#### Endpoint

```
POST /api/tools/color-picker
```

#### Request

```bash
curl -X POST https://api.desinerkit.com/v1/api/tools/color-picker \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: multipart/form-data" \
  -F "image=@path/to/image.png"
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| image | File | Yes | Image file (PNG, JPG, WEBP) |

#### Response

```json
{
  "success": true,
  "data": {
    "colors": [
      {
        "hex": "#FF5733",
        "rgb": { "r": 255, "g": 87, "b": 51 },
        "hsl": { "h": 15, "s": 100, "l": 60 },
        "count": 12345
      },
      {
        "hex": "#33FF57",
        "rgb": { "r": 51, "g": 255, "b": 87 },
        "hsl": { "h": 135, "s": 100, "l": 60 },
        "count": 9876
      }
    ],
    "processingTime": 456
  },
  "meta": {
    "tool": "color-picker",
    "version": "1.0"
  }
}
```

#### Errors

| Error Type | Status | Description |
|------------|--------|-------------|
| VALIDATION | 400 | Invalid file type or size |
| AUTHENTICATION | 401 | User not authenticated |
| QUOTA_EXCEEDED | 403 | Daily quota exceeded |
| RATE_LIMIT | 429 | Rate limit exceeded |
| INTERNAL | 500 | Processing failed |

### QR Code Generator

Create custom QR codes.

#### Endpoint

```
POST /api/tools/qr-code-generator
```

#### Request

```bash
curl -X POST https://api.desinerkit.com/v1/api/tools/qr-code-generator \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "https://desinerkit.com",
    "size": 300,
    "foregroundColor": "#000000",
    "backgroundColor": "#FFFFFF"
  }'
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| text | String | Yes | Text or URL to encode |
| size | Integer | No | QR code size (pixels) |
| foregroundColor | String | No | Foreground color (hex) |
| backgroundColor | String | No | Background color (hex) |

#### Response

```json
{
  "success": true,
  "data": {
    "imageUrl": "https://cdn.desinerkit.com/results/jkl012.png",
    "qrCodeData": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
    "processingTime": 123
  },
  "meta": {
    "tool": "qr-code-generator",
    "version": "1.0"
  }
}
```

#### Errors

| Error Type | Status | Description |
|------------|--------|-------------|
| VALIDATION | 400 | Invalid text or parameters |
| AUTHENTICATION | 401 | User not authenticated |
| QUOTA_EXCEEDED | 403 | Daily quota exceeded |
| RATE_LIMIT | 429 | Rate limit exceeded |
| INTERNAL | 500 | Processing failed |

## 👤 User API

### Get User Profile

Retrieve user profile information including plan details and account data.

#### Endpoint

```
GET /api/user/profile
```

#### Rate Limiting

- **Limit**: 30 requests per minute per user

#### Request

```bash
curl -X GET http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer <jwt_token>"
```

#### Response

```json
{
  "id": "user_123",
  "email": "user@example.com",
  "profile": {
    "id": "user_123",
    "full_name": "John Doe",
    "avatar_url": "https://avatars.example.com/user_123.png",
    "plan": "premium",
    "stripe_customer_id": "cus_abc123",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-12-01T12:00:00Z"
  }
}
```

#### Errors

| Error Type | Status | Description |
|------------|--------|-------------|
| AUTHENTICATION | 401 | User not authenticated |
| NOT_FOUND | 404 | User profile not found |
| RATE_LIMIT | 429 | Rate limit exceeded (30/min) |
| INTERNAL | 500 | Database query failed |

### Update User Profile

Update user profile information such as name and avatar.

#### Endpoint

```
PUT /api/user/profile
```

#### Rate Limiting

- **Limit**: 10 requests per minute per user

#### Request

```bash
curl -X PUT http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Jane Doe",
    "avatar_url": "https://avatars.example.com/new_avatar.png"
  }'
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| full_name | String | No | User's full name (max 255 chars) |
| avatar_url | String | No | Avatar image URL (max 255 chars) |

#### Response

```json
{
  "message": "Profile updated successfully",
  "profile": {
    "id": "user_123",
    "full_name": "Jane Doe",
    "avatar_url": "https://avatars.example.com/new_avatar.png",
    "plan": "premium",
    "stripe_customer_id": "cus_abc123",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-12-01T12:00:00Z"
  }
}
```

#### Errors

| Error Type | Status | Description |
|------------|--------|-------------|
| VALIDATION | 400 | No valid fields to update or invalid data |
| AUTHENTICATION | 401 | User not authenticated |
| RATE_LIMIT | 429 | Rate limit exceeded (10/min) |
| INTERNAL | 500 | Database update failed |

### Get Email Preferences

Retrieve user's email notification preferences.

#### Endpoint

```
GET /api/user/email-preferences
```

#### Rate Limiting

- **Limit**: 30 requests per minute per user

#### Request

```bash
curl -X GET http://localhost:3000/api/user/email-preferences \
  -H "Authorization: Bearer <jwt_token>"
```

#### Response

```json
{
  "user_id": "user_123",
  "marketing_emails": true,
  "quota_warnings": true,
  "subscription_updates": true,
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-12-01T12:00:00Z"
}
```

#### Errors

| Error Type | Status | Description |
|------------|--------|-------------|
| AUTHENTICATION | 401 | User not authenticated |
| RATE_LIMIT | 429 | Rate limit exceeded (30/min) |
| INTERNAL | 500 | Database query failed |

### Update Email Preferences

Update user's email notification preferences.

#### Endpoint

```
PUT /api/user/email-preferences
```

#### Rate Limiting

- **Limit**: 10 requests per minute per user

#### Request

```bash
curl -X PUT http://localhost:3000/api/user/email-preferences \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "marketing_emails": false,
    "quota_warnings": true,
    "subscription_updates": true
  }'
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| marketing_emails | Boolean | No | Receive marketing emails |
| quota_warnings | Boolean | No | Receive quota warning emails |
| subscription_updates | Boolean | No | Receive subscription update emails |

#### Response

```json
{
  "user_id": "user_123",
  "marketing_emails": false,
  "quota_warnings": true,
  "subscription_updates": true,
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-12-01T12:00:00Z"
}
```

#### Errors

| Error Type | Status | Description |
|------------|--------|-------------|
| VALIDATION | 400 | Invalid request data |
| AUTHENTICATION | 401 | User not authenticated |
| RATE_LIMIT | 429 | Rate limit exceeded (10/min) |
| INTERNAL | 500 | Database update failed |

### Get User Quota

Retrieve user quota information.

#### Endpoint

```
GET /api/user/quota
```

#### Request

```bash
curl -X GET https://api.desinerkit.com/v1/api/user/quota \
  -H "Authorization: Bearer <jwt_token>"
```

#### Response

```json
{
  "success": true,
  "data": {
    "plan": "premium",
    "dailyLimit": 500,
    "currentUsage": 45,
    "remaining": 455,
    "resetDate": "2023-12-02T00:00:00Z",
    "resetTime": 86400
  },
  "meta": {
    "timestamp": "2023-12-01T12:00:00Z"
  }
}
```

### Get User Preferences

Retrieve user preferences.

#### Endpoint

```
GET /api/user/preferences
```

#### Request

```bash
curl -X GET https://api.desinerkit.com/v1/api/user/preferences \
  -H "Authorization: Bearer <jwt_token>"
```

#### Response

```json
{
  "success": true,
  "data": {
    "theme": "dark",
    "language": "en",
    "notifications": true,
    "auto_save": true
  },
  "meta": {
    "timestamp": "2023-12-01T12:00:00Z"
  }
}
```

### Update User Preferences

Update user preferences.

#### Endpoint

```
PUT /api/user/preferences
```

#### Request

```bash
curl -X PUT https://api.desinerkit.com/v1/api/user/preferences \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "theme": "light",
    "language": "tr",
    "notifications": false,
    "auto_save": false
  }'
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| theme | String | No | UI theme ('light', 'dark', 'system') |
| language | String | No | Language preference |
| notifications | Boolean | No | Notification preferences |
| auto_save | Boolean | No | Auto-save preferences |

#### Response

```json
{
  "success": true,
  "data": {
    "theme": "light",
    "language": "tr",
    "notifications": false,
    "auto_save": false
  },
  "meta": {
    "timestamp": "2023-12-01T12:00:00Z"
  }
}
```

### Get Email Preferences

Retrieve email preferences.

#### Endpoint

```
GET /api/user/email-preferences
```

#### Request

```bash
curl -X GET https://api.desinerkit.com/v1/api/user/email-preferences \
  -H "Authorization: Bearer <jwt_token>"
```

#### Response

```json
{
  "success": true,
  "data": {
    "marketing_emails": true,
    "quota_warnings": true,
    "newsletter": true,
    "product_updates": true
  },
  "meta": {
    "timestamp": "2023-12-01T12:00:00Z"
  }
}
```

### Update Email Preferences

Update email preferences.

#### Endpoint

```
PUT /api/user/email-preferences
```

#### Request

```bash
curl -X PUT https://api.desinerkit.com/v1/api/user/email-preferences \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "marketing_emails": false,
    "quota_warnings": false,
    "newsletter": false,
    "product_updates": false
  }'
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| marketing_emails | Boolean | No | Marketing email preferences |
| quota_warnings | Boolean | No | Quota warning email preferences |
| newsletter | Boolean | No | Newsletter email preferences |
| product_updates | Boolean | No | Product update email preferences |

#### Response

```json
{
  "success": true,
  "data": {
    "marketing_emails": false,
    "quota_warnings": false,
    "newsletter": false,
    "product_updates": false
  },
  "meta": {
    "timestamp": "2023-12-01T12:00:00Z"
  }
}
```

### Get Subscription Status

Retrieve user subscription status.

#### Endpoint

```
GET /api/user/subscription
```

#### Request

```bash
curl -X GET https://api.desinerkit.com/v1/api/user/subscription \
  -H "Authorization: Bearer <jwt_token>"
```

#### Response

```json
{
  "success": true,
  "data": {
    "status": "active",
    "plan": "premium",
    "stripe_subscription_id": "sub_123",
    "current_period_start": "2023-11-01T00:00:00Z",
    "current_period_end": "2023-12-01T00:00:00Z",
    "cancel_at_period_end": false
  },
  "meta": {
    "timestamp": "2023-12-01T12:00:00Z"
  }
}
```

## 💳 Stripe API

### Create Checkout Session

Create a Stripe checkout session for plan upgrades. This endpoint creates a Stripe Customer if one doesn't exist and generates a checkout session URL.

#### Endpoint

```
POST /api/stripe/create-checkout
```

#### Rate Limiting

- **Limit**: 30 requests per minute per user

#### Request

```bash
curl -X POST http://localhost:3000/api/stripe/create-checkout \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "premium"
  }'
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| plan | String | Yes | Target plan ('premium' or 'pro') |

#### Response

```json
{
  "sessionId": "cs_mock_1701432000000",
  "url": "https://checkout.stripe.com/pay/cs_mock_1701432000000",
  "plan": "premium"
}
```

#### Errors

| Error Type | Status | Description |
|------------|--------|-------------|
| VALIDATION | 400 | Invalid plan parameter |
| AUTHENTICATION | 401 | User not authenticated |
| RATE_LIMIT | 429 | Rate limit exceeded (30/min) |
| INTERNAL | 500 | Stripe API error or database failure |

### Create Customer Portal Session

Create a Stripe customer portal session for subscription management. Allows users to update payment methods, view invoices, and cancel subscriptions.

#### Endpoint

```
POST /api/stripe/create-portal
```

#### Rate Limiting

- **Limit**: 30 requests per minute per user

#### Request

```bash
curl -X POST http://localhost:3000/api/stripe/create-portal \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json"
```

#### Response

```json
{
  "success": true,
  "url": "https://billing.stripe.com/p/session_abc123"
}
```

#### Errors

| Error Type | Status | Description |
|------------|--------|-------------|
| AUTHENTICATION | 401 | User not authenticated |
| AUTHORIZATION | 403 | Free plan users cannot access portal |
| NOT_FOUND | 404 | No Stripe customer found |
| RATE_LIMIT | 429 | Rate limit exceeded (30/min) |
| INTERNAL | 500 | Stripe API error or database failure |

### Webhook Handler

Handle Stripe webhook events for subscription lifecycle management. This endpoint processes webhook events from Stripe to keep subscription data in sync.

#### Endpoint

```
POST /api/stripe/webhook
```

#### Rate Limiting

- **Limit**: None (trusted Stripe webhooks)
- **Security**: Webhook signature verification required

#### Events Handled

| Event | Description | Actions |
|-------|-------------|---------|
| `checkout.session.completed` | New subscription created | Create subscription record, update user plan, send confirmation email |
| `customer.subscription.updated` | Subscription updated | Update subscription status and billing period |
| `customer.subscription.deleted` | Subscription canceled | Mark subscription as canceled, downgrade user to free plan, send cancellation email |

#### Request Headers

```
stripe-signature: t=1701432000,v1=abc123...
```

#### Response

```json
{
  "received": true
}
```

#### Errors

| Error Type | Status | Description |
|------------|--------|-------------|
| VALIDATION | 400 | Missing or invalid webhook signature |
| INTERNAL | 500 | Webhook processing failed (Stripe will retry) |

## 📧 Email API

### Send Email

Send transactional emails to users. This is an internal API endpoint used by the system to send various types of emails.

#### Endpoint

```
POST /api/email/send
```

#### Rate Limiting

- **Limit**: 30 requests per minute per user
- **Auth**: Internal endpoint (no user authentication required)

#### Request

```bash
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "welcome",
    "user_id": "user_123",
    "email": "user@example.com",
    "full_name": "John Doe"
  }'
```

#### Email Types

| Type | Description | Required Parameters |
|------|-------------|-------------------|
| `welcome` | Welcome email for new users | `user_id`, `email`, `full_name` |
| `subscription_confirmation` | Subscription purchase confirmation | `user_id`, `email`, `full_name`, `plan`, `amount` |
| `quota_warning` | Daily quota warning (90% usage) | `user_id`, `email`, `full_name`, `current_usage`, `daily_limit`, `plan` |
| `subscription_cancellation` | Subscription cancellation notice | `user_id`, `email`, `full_name`, `plan`, `end_date` |
| `custom` | Custom email content | `email`, `subject`, `html_content`, `text_content` |

#### Parameters (Welcome Email)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| type | String | Yes | Must be "welcome" |
| user_id | String | Yes | User UUID |
| email | String | Yes | Recipient email address |
| full_name | String | No | Recipient's full name |

#### Parameters (Subscription Confirmation)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| type | String | Yes | Must be "subscription_confirmation" |
| user_id | String | Yes | User UUID |
| email | String | Yes | Recipient email address |
| full_name | String | No | Recipient's full name |
| plan | String | Yes | Plan name ('premium' or 'pro') |
| amount | Number | Yes | Amount paid in cents |

#### Parameters (Quota Warning)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| type | String | Yes | Must be "quota_warning" |
| user_id | String | Yes | User UUID |
| email | String | Yes | Recipient email address |
| full_name | String | No | Recipient's full name |
| current_usage | Number | Yes | Current API usage count |
| daily_limit | Number | Yes | Daily limit for user's plan |
| plan | String | Yes | User's plan ('free', 'premium', 'pro') |

#### Response

```json
{
  "success": true,
  "message": "welcome email sent successfully",
  "type": "welcome"
}
```

#### Errors

| Error Type | Status | Description |
|------------|--------|-------------|
| VALIDATION | 400 | Invalid request data or missing required fields |
| NOT_FOUND | 404 | User not found |
| SERVICE_UNAVAILABLE | 503 | Email service not configured |
| RATE_LIMIT | 429 | Rate limit exceeded (30/min) |
| INTERNAL | 500 | Email sending failed |

### Check Email Service Status

Check the status of the email service and supported email types.

#### Endpoint

```
GET /api/email/send
```

#### Request

```bash
curl -X GET http://localhost:3000/api/email/send
```

#### Response

```json
{
  "status": "ready",
  "errors": [],
  "supported_types": [
    "welcome",
    "subscription_confirmation",
    "quota_warning",
    "subscription_cancellation",
    "custom"
  ],
  "configuration": {
    "resend_configured": true,
    "from_email_configured": true
  }
}
```

#### Status Values

| Status | Description |
|--------|-------------|
| `ready` | Email service is configured and ready |
| `not_configured` | Email service is not properly configured |
| `error` | Error checking email configuration |

### Get Email Preferences

Retrieve user email preferences.

#### Endpoint

```
GET /api/email/preferences?user_id=user_123
```

#### Request

```bash
curl -X GET https://api.desinerkit.com/v1/api/email/preferences?user_id=user_123 \
  -H "Authorization: Bearer <jwt_token>"
```

#### Response

```json
{
  "success": true,
  "data": {
    "marketing_emails": true,
    "quota_warnings": true,
    "newsletter": true,
    "product_updates": true
  },
  "meta": {
    "timestamp": "2023-12-01T12:00:00Z"
  }
}
```

### Update Email Preferences

Update user email preferences.

#### Endpoint

```
PUT /api/email/preferences
```

#### Request

```bash
curl -X PUT https://api.desinerkit.com/v1/api/email/preferences \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_123",
    "marketing_emails": false,
    "quota_warnings": false
  }'
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| user_id | String | Yes | User ID |
| marketing_emails | Boolean | No | Marketing email preferences |
| quota_warnings | Boolean | No | Quota warning email preferences |

#### Response

```json
{
  "success": true,
  "data": {
    "marketing_emails": false,
    "quota_warnings": false
  },
  "meta": {
    "timestamp": "2023-12-01T12:00:00Z"
  }
}
```

## 📊 Analytics API

### Get Tool Usage

Retrieve tool usage statistics.

#### Endpoint

```
GET /api/analytics/usage?days=7&limit=10
```

#### Request

```bash
curl -X GET https://api.desinerkit.com/v1/api/analytics/usage?days=7&limit=10 \
  -H "Authorization: Bearer <jwt_token>"
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| days | Integer | No | Number of days to analyze (default: 7) |
| limit | Integer | No | Maximum number of results (default: 10) |

#### Response

```json
{
  "success": true,
  "data": [
    {
      "tool_name": "background-remover",
      "count": 150,
      "percentage": 45.5
    },
    {
      "tool_name": "image-upscaler",
      "count": 120,
      "percentage": 36.4
    },
    {
      "tool_name": "mockup-generator",
      "count": 60,
      "percentage": 18.1
    }
  ],
  "meta": {
    "days": 7,
    "limit": 10,
    "timestamp": "2023-12-01T12:00:00Z"
  }
}
```

### Get Most Used Tools

Retrieve most used tools statistics.

#### Endpoint

```
GET /api/analytics/tools?days=30&limit=5
```

#### Request

```bash
curl -X GET https://api.desinerkit.com/v1/api/analytics/tools?days=30&limit=5 \
  -H "Authorization: Bearer <jwt_token>"
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| days | Integer | No | Number of days to analyze (default: 30) |
| limit | Integer | No | Maximum number of results (default: 5) |

#### Response

```json
{
  "success": true,
  "data": [
    {
      "tool_name": "background-remover",
      "usage_count": 450,
      "success_rate": 98.2,
      "avg_processing_time": 1234
    },
    {
      "tool_name": "image-upscaler",
      "usage_count": 320,
      "success_rate": 95.6,
      "avg_processing_time": 2345
    }
  ],
  "meta": {
    "days": 30,
    "limit": 5,
    "timestamp": "2023-12-01T12:00:00Z"
  }
}
```

### Get Recent Activity

Retrieve recent user activity.

#### Endpoint

```
GET /api/analytics/activity?limit=20
```

#### Request

```bash
curl -X GET https://api.desinerkit.com/v1/api/analytics/activity?limit=20 \
  -H "Authorization: Bearer <jwt_token>"
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | Integer | No | Maximum number of results (default: 20) |

#### Response

```json
{
  "success": true,
  "data": [
    {
      "tool_name": "background-remover",
      "created_at": "2023-12-01T11:30:00Z",
      "success": true,
      "processing_time_ms": 1234
    },
    {
      "tool_name": "image-upscaler",
      "created_at": "2023-12-01T11:15:00Z",
      "success": true,
      "processing_time_ms": 2345
    }
  ],
  "meta": {
    "limit": 20,
    "timestamp": "2023-12-01T12:00:00Z"
  }
}
```

## 🏥 Health Check API

### System Health Check

Check the overall health and status of the API system. This endpoint is useful for monitoring, load balancers, and uptime checks.

#### Endpoint

```
GET /api/health
```

#### Rate Limiting

- **Limit**: 10 requests per minute per IP
- **Auth**: No authentication required

#### Request

```bash
curl -X GET http://localhost:3000/api/health
```

#### Response

```json
{
  "status": "healthy",
  "timestamp": "2023-12-01T12:00:00Z",
  "uptime": 86400,
  "environment": "production",
  "version": "1.0.0"
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| status | String | System status ('healthy' or 'unhealthy') |
| timestamp | String | Current server timestamp (ISO 8601) |
| uptime | Number | Server uptime in seconds |
| environment | String | Current environment ('development', 'production') |
| version | String | Application version |

#### Status Codes

| Status | Description |
|--------|-------------|
| 200 | System is healthy and operational |
| 429 | Rate limit exceeded |
| 500 | System is unhealthy or experiencing issues |

#### Errors

| Error Type | Status | Description |
|------------|--------|-------------|
| RATE_LIMIT | 429 | Rate limit exceeded (10/min per IP) |
| INTERNAL | 500 | Health check failed |

#### Unhealthy Response

```json
{
  "status": "unhealthy",
  "error": "Health check failed",
  "timestamp": "2023-12-01T12:00:00Z"
}
```

#### Usage

This endpoint is designed for:
- **Load Balancers**: Health checks for traffic routing
- **Monitoring Systems**: Uptime and availability monitoring
- **CI/CD Pipelines**: Deployment verification
- **Development**: Quick system status verification

#### Cache Headers

The health check endpoint includes cache control headers to prevent caching:

```
Cache-Control: no-cache, no-store, must-revalidate
Pragma: no-cache
Expires: 0
```

## 🔒 Security

### Authentication Security

All API endpoints require JWT token authentication:

```typescript
// Header format
Authorization: Bearer <jwt_token>
```

Tokens are refreshed automatically and expire after 1 hour.

### Input Validation

All inputs are validated using Zod schemas:

```typescript
// Example validation schema
const checkoutSchema = z.object({
  plan: z.enum(['premium', 'pro']),
})

// Validation in route handler
const body = await validateRequestBody(request, checkoutSchema)
```

### Rate Limiting

Rate limiting is implemented per user with different tiers:

```typescript
// Rate limit configuration
const rateLimitConfig = {
  maxRequests: 60, // Requests per window
  windowSeconds: 60, // Window period in seconds
  errorMessage: 'Rate limit exceeded. Please try again later.',
}
```

### Error Sanitization

Sensitive information is removed from error responses:

```typescript
// Error sanitization
const sanitizedError = sanitizeErrorForLogging(error, {
  userId: user.id,
  plan: user.plan,
})
```

### Content Security Policy

Comprehensive CSP headers are enforced:

```
Content-Security-Policy: default-src 'self'; script-src 'self'; ...
```

### Cross-Origin Resource Sharing

CORS policies restrict origins:

```
Access-Control-Allow-Origin: https://desinerkit.com
```

## 🧪 Testing

### Unit Tests

Each API endpoint has comprehensive unit tests:

```bash
# Run all API tests
npm run test:api

# Run specific endpoint tests
npm run test:api:stripe
npm run test:api:tools
npm run test:api:user
```

### Integration Tests

Integration tests verify complete workflows:

```bash
# Run integration tests
npm run test:integration

# Run specific integration tests
npm run test:integration:tools
npm run test:integration:auth
```

### End-to-End Tests

E2E tests verify user journeys:

```bash
# Run E2E tests
npm run test:e2e

# Run specific E2E tests
npm run test:e2e:stripe
npm run test:e2e:auth
npm run test:e2e:tools
```

### Performance Tests

Performance tests verify response times:

```bash
# Run performance tests
npm run test:performance

# Run specific performance tests
npm run test:performance:tools
npm run test:performance:api
```

### Security Tests

Security tests verify protection mechanisms:

```bash
# Run security tests
npm run test:security

# Run specific security tests
npm run test:security:auth
npm run test:security:xss
npm run test:security:csrf
```

### Test Coverage

Minimum test coverage requirements:

| Metric | Target | Current |
|--------|--------|---------|
| Lines | 85% | 92% |
| Functions | 85% | 88% |
| Branches | 80% | 85% |
| Statements | 85% | 91% |

Run coverage report:

```bash
# Generate coverage report
npm run test:coverage
```

## 📋 API Reference Summary

### Complete Endpoint List

| Endpoint | Method | Auth | Rate Limit | Quota | Description |
|----------|--------|------|------------|-------|-------------|
| `/api/health` | GET | No | 10/min (IP) | No | System health check |
| `/api/user/profile` | GET | Yes | 30/min | No | Get user profile |
| `/api/user/profile` | PUT | Yes | 10/min | No | Update user profile |
| `/api/user/email-preferences` | GET | Yes | 30/min | No | Get email preferences |
| `/api/user/email-preferences` | PUT | Yes | 10/min | No | Update email preferences |
| `/api/stripe/create-checkout` | POST | Yes | 30/min | No | Create Stripe checkout session |
| `/api/stripe/create-portal` | POST | Yes | 30/min | No | Create Stripe customer portal |
| `/api/stripe/webhook` | POST | Signature | None | No | Handle Stripe webhooks |
| `/api/tools/background-remover` | POST | Yes | 5/min | Yes | Remove image backgrounds |
| `/api/tools/image-upscaler` | POST | Yes | 5/min | Yes | Upscale images with AI |
| `/api/tools/check-quota` | GET | Yes | 30/min | No | Check daily quota status |
| `/api/tools/increment-usage` | POST | Yes | 30/min | No | Increment usage counter |
| `/api/email/send` | POST | Internal | 30/min | No | Send transactional emails |
| `/api/email/send` | GET | No | 30/min | No | Check email service status |

### Error Code Reference

| HTTP Status | Error Type | Description | Common Causes |
|-------------|------------|-------------|---------------|
| 400 | VALIDATION | Invalid request data | Missing required fields, invalid format |
| 401 | AUTHENTICATION | Authentication required | Missing or invalid JWT token |
| 403 | AUTHORIZATION | Access denied | Insufficient permissions |
| 403 | QUOTA_EXCEEDED | Daily quota exceeded | User has reached daily API limit |
| 404 | NOT_FOUND | Resource not found | User profile, subscription not found |
| 405 | METHOD_NOT_ALLOWED | Invalid HTTP method | Using GET instead of POST |
| 429 | RATE_LIMIT | Rate limit exceeded | Too many requests in time window |
| 500 | INTERNAL | Internal server error | Database error, API failure |
| 503 | SERVICE_UNAVAILABLE | Service not configured | Email service not set up |

### Authentication Methods

| Method | Usage | Header Format |
|--------|-------|---------------|
| JWT Token | All authenticated endpoints | `Authorization: Bearer <jwt_token>` |
| Webhook Signature | Stripe webhooks only | `stripe-signature: t=timestamp,v1=signature` |
| Internal | System-to-system calls | No authentication required |

### Content Types

| Endpoint Type | Content-Type | Description |
|---------------|--------------|-------------|
| JSON APIs | `application/json` | Standard REST endpoints |
| File Uploads | `multipart/form-data` | Image processing endpoints |
| Webhooks | `application/json` | Stripe webhook events |

### Response Formats

#### Success Response
```json
{
  "success": true,
  "data": { /* response data */ }
}
```

#### Error Response
```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

#### Rate Limited Response
```json
{
  "error": "Rate limit exceeded. Please try again later."
}
```

### Plan Limits Summary

| Feature | Free | Premium | Pro |
|---------|------|---------|-----|
| Daily API Quota | 10 | 500 | 2000 |
| Max File Size | 10MB | 50MB | 100MB |
| Batch Processing | ❌ | 10 files | 50 files |
| Customer Portal | ❌ | ✅ | ✅ |
| Priority Support | ❌ | ❌ | ✅ |

## 🛠️ Best Practices

### 1. Always Use Authentication

```typescript
// ✅ Good - Require authentication
export async function POST(request: NextRequest) {
  return withApiSecurity(
    request,
    async (req, user) => {
      // Handler logic
    },
    {
      requireAuth: true,
    }
  )
}

// ❌ Bad - No authentication
export async function POST(request: NextRequest) {
  // Handler logic without auth
}
```

### 2. Implement Proper Rate Limiting

```typescript
// ✅ Good - Apply rate limiting
export async function POST(request: NextRequest) {
  return withApiSecurity(
    request,
    async (req, user) => {
      // Handler logic
    },
    {
      requireAuth: true,
      rateLimit: 'strict', // For API tools
    }
  )
}

// ❌ Bad - No rate limiting
export async function POST(request: NextRequest) {
  return withApiSecurity(
    request,
    async (req, user) => {
      // Handler logic
    },
    {
      requireAuth: true,
      rateLimit: false, // Disabled rate limiting
    }
  )
}
```

### 3. Validate All Inputs

```typescript
// ✅ Good - Validate inputs
export async function POST(request: NextRequest) {
  return withApiSecurity(
    request,
    async (req, user) => {
      const body = await validateRequestBody(req, (data) => {
        if (!data.image) return 'Image is required'
        if (!data.scale) return 'Scale factor is required'
        if (![2, 4, 8].includes(data.scale)) return 'Invalid scale factor'
        return true
      })
      
      // Process validated data
    },
    {
      requireAuth: true,
      rateLimit: 'strict',
    }
  )
}

// ❌ Bad - No input validation
export async function POST(request: NextRequest) {
  return withApiSecurity(
    request,
    async (req, user) => {
      const body = await req.json()
      // Use body directly without validation
    },
    {
      requireAuth: true,
      rateLimit: 'strict',
    }
  )
}
```

### 4. Handle Errors Gracefully

```typescript
// ✅ Good - Proper error handling
export async function POST(request: NextRequest) {
  return withApiSecurity(
    request,
    async (req, user) => {
      try {
        const result = await processImage(body.image)
        return { success: true, result }
      } catch (error) {
        return handleApiError(error, {
          context: { toolName: 'image-upscaler' },
        })
      }
    },
    {
      requireAuth: true,
      rateLimit: 'strict',
    }
  )
}

// ❌ Bad - Poor error handling
export async function POST(request: NextRequest) {
  return withApiSecurity(
    request,
    async (req, user) => {
      const result = await processImage(body.image)
      return { success: true, result }
    },
    {
      requireAuth: true,
      rateLimit: 'strict',
    }
  )
}
```

### 5. Check User Quota

```typescript
// ✅ Good - Check user quota before processing
export async function POST(request: NextRequest) {
  return withApiSecurity(
    request,
    async (req, user) => {
      // Check quota before expensive operation
      await checkUserQuota(user!.id)
      
      const result = await expensiveOperation()
      
      // Increment usage after successful processing
      await incrementUserUsage(user!.id, 'tool-name')
      
      return { success: true, result }
    },
    {
      requireAuth: true,
      rateLimit: 'strict',
    }
  )
}

// ❌ Bad - Process first, check quota later
export async function POST(request: NextRequest) {
  return withApiSecurity(
    request,
    async (req, user) => {
      const result = await expensiveOperation()
      
      // Check quota after processing (too late)
      await checkUserQuota(user!.id)
      
      await incrementUserUsage(user!.id, 'tool-name')
      
      return { success: true, result }
    },
    {
      requireAuth: true,
      rateLimit: 'strict',
    }
  )
}
```

### 6. Log Operations for Analytics

```typescript
// ✅ Good - Log operations for analytics
export async function POST(request: NextRequest) {
  return withApiSecurity(
    request,
    async (req, user) => {
      const startTime = Date.now()
      
      const result = await processImage(body.image)
      
      const processingTime = Date.now() - startTime
      
      // Log operation for analytics
      await logToolUsage(
        supabase,
        user!.id,
        true,
        body.image.size / (1024 * 1024),
        processingTime
      )
      
      await incrementUserUsage(user!.id, 'tool-name')
      
      return { success: true, result, processingTime }
    },
    {
      requireAuth: true,
      rateLimit: 'strict',
    }
  )
}

// ❌ Bad - No analytics logging
export async function POST(request: NextRequest) {
  return withApiSecurity(
    request,
    async (req, user) => {
      const result = await processImage(body.image)
      await incrementUserUsage(user!.id, 'tool-name')
      return { success: true, result }
    },
    {
      requireAuth: true,
      rateLimit: 'strict',
    }
  )
}
```

### 7. Return Proper HTTP Status Codes

```typescript
// ✅ Good - Return proper status codes
export async function POST(request: NextRequest) {
  return withApiSecurity(
    request,
    async (req, user) => {
      const body = await validateRequestBody(req, validator)
      
      if (!body.image) {
        throw new ApiError(
          ApiErrorType.VALIDATION,
          'Image is required',
          400
        )
      }
      
      if (!user) {
        throw new ApiError(
          ApiErrorType.AUTHENTICATION,
          'Authentication required',
          401
        )
      }
      
      const quotaCheck = await checkUserQuota(user.id)
      if (!quotaCheck.success) {
        throw new ApiError(
          ApiErrorType.QUOTA_EXCEEDED,
          'Daily quota exceeded',
          403,
          { limit: quotaCheck.limit, usage: quotaCheck.usage }
        )
      }
      
      const result = await processImage(body.image)
      
      return { success: true, result }
    },
    {
      requireAuth: true,
      rateLimit: 'strict',
    }
  )
}

// ❌ Bad - Always return 200
export async function POST(request: NextRequest) {
  return withApiSecurity(
    request,
    async (req, user) => {
      try {
        const result = await processImage(body.image)
        return { success: true, result }
      } catch (error) {
        return { success: false, error: error.message }
      }
    },
    {
      requireAuth: true,
      rateLimit: 'strict',
    }
  )
}
```

### 8. Sanitize Sensitive Data

```typescript
// ✅ Good - Sanitize sensitive data in logs
export async function POST(request: NextRequest) {
  return withApiSecurity(
    request,
    async (req, user) => {
      try {
        const result = await processImage(body.image)
        return { success: true, result }
      } catch (error) {
        // Sanitize error for logging
        const sanitizedError = sanitizeErrorForLogging(error, {
          userId: user?.id,
          fileSize: body.image?.size,
        })
        
        console.error('Image processing failed:', sanitizedError)
        
        throw new ApiError(
          ApiErrorType.INTERNAL,
          'Failed to process image',
          500
        )
      }
    },
    {
      requireAuth: true,
      rateLimit: 'strict',
    }
  )
}

// ❌ Bad - Log sensitive data
export async function POST(request: NextRequest) {
  return withApiSecurity(
    request,
    async (req, user) => {
      try {
        const result = await processImage(body.image)
        return { success: true, result }
      } catch (error) {
        // Log raw error with sensitive data
        console.error('Image processing failed:', error)
        
        throw new ApiError(
          ApiErrorType.INTERNAL,
          'Failed to process image',
          500
        )
      }
    },
    {
      requireAuth: true,
      rateLimit: 'strict',
    }
  )
}
```

## 📈 Monitoring

### Error Tracking

All API errors are tracked with Sentry:

```typescript
// Error tracking in apiSecurity.ts
reportError(
  new Error(`API Error: ${message} (Type: ${type}, Status: ${status})`),
  type,
  { status, type, originalError: error }
)
```

### Performance Monitoring

Performance metrics are tracked:

```typescript
// Performance tracking in tools
const startTime = Date.now()
// ... processing ...
const processingTime = Date.now() - startTime

// Log performance metrics
console.log(`[Performance] ${toolName} took ${processingTime}ms`)
```

### Usage Analytics

Tool usage is tracked in Supabase:

```sql
-- Analytics table structure
CREATE TABLE tool_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  tool_name TEXT,
  is_api_tool BOOLEAN,
  file_size_mb NUMERIC,
  processing_time_ms INTEGER,
  success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔧 Troubleshooting

### Common Issues

1. **Rate Limit Exceeded**
   - Solution: Wait for rate limit window to reset
   - Check headers for reset time

2. **Authentication Required**
   - Solution: Ensure valid JWT token in Authorization header
   - Refresh token if expired

3. **Quota Exceeded**
   - Solution: Upgrade plan or wait for daily reset
   - Check quota information endpoint

4. **Invalid Request Data**
   - Solution: Validate request format and parameters
   - Check required fields

5. **Internal Server Error**
   - Solution: Check error logs and contact support
   - Verify service availability

### Debugging Tips

1. **Check Rate Limit Headers**
   ```
   X-RateLimit-Limit: 60
   X-RateLimit-Remaining: 59
   X-RateLimit-Reset: 2023-12-01T00:00:00Z
   ```

2. **Verify Authentication Token**
   ```bash
   curl -H "Authorization: Bearer <token>" https://api.desinerkit.com/v1/api/user/profile
   ```

3. **Validate Request Format**
   ```bash
   # Check content type
   curl -H "Content-Type: application/json" ...
   
   # Check request body
   curl -d '{"plan": "premium"}' ...
   ```

4. **Check API Version**
   ```bash
   # Use correct API version
   curl https://api.desinerkit.com/v1/...
   ```

## 🔄 Updates and Changes

### Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2023-12-01 | Initial API documentation |
| 1.1.0 | 2023-12-15 | Added rate limiting documentation |
| 1.2.0 | 2023-12-30 | Added security best practices |

### Breaking Changes

None yet. All changes are backward compatible.

### Deprecation Notices

None yet. All endpoints are actively maintained.

## 📞 Support

For API support, contact:

- **Email**: api-support@desinerkit.com
- **Documentation**: https://desinerkit.com/docs/api
- **Status Page**: https://status.desinerkit.com

Include:
- API endpoint URL
- Request headers and body
- Response status and body
- Error messages
- Timestamp of request

---

**Last Updated:** 2023-12-01  
**API Version:** v1  
**Status:** ✅ Ready for Production Use