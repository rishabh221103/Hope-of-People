# HOP Project - API Specification & Reference

**Version:** 1.0.0  
**Last Updated:** 2026-11-19  
**Base URL:** `/api/v1`  
**Protocol:** HTTPS / JSON REST  

---

## 1. API Standards & Envelope Pattern

All responses adhere to a standardized JSON response envelope:

### Success Response Envelope (`ApiResponse<T>`)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation completed successfully.",
  "data": { ... },
  "timestamp": "2026-11-19T13:30:00Z"
}
```

### Error Response Envelope (`ApiErrorResponse`)
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed.",
  "errors": [
    {
      "field": "email",
      "rejectedValue": "invalid-email",
      "message": "Must be a well-formed email address"
    }
  ],
  "timestamp": "2026-11-19T13:30:00Z"
}
```

---

## 2. Currently Verified & Implemented Endpoints

The following REST endpoints are fully implemented, secured via Spring Security, and verified:

| HTTP Verb | Endpoint | Description | Auth Required | Required Role | Status |
|:---|:---|:---|:---|:---|:---|
| `POST` | `/api/v1/auth/register` | Register new user account with BCrypt password hashing | Public (No) | None | `[ACTIVE]` |
| `POST` | `/api/v1/auth/login` | Authenticate user and issue signed Bearer JWT token | Public (No) | None | `[ACTIVE]` |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile summary | Bearer JWT | Any authenticated user | `[ACTIVE]` |
| `GET` | `/api/v1/users/profile` | Get currently logged-in user profile | Bearer JWT | `ROLE_USER`, `ROLE_ADMIN` | `[ACTIVE]` |
| `PUT` | `/api/v1/users/profile` | Update personal details (name, phone) | Bearer JWT | `ROLE_USER`, `ROLE_ADMIN` | `[ACTIVE]` |
| `PUT` | `/api/v1/users/password` | Change account password with current validation | Bearer JWT | `ROLE_USER`, `ROLE_ADMIN` | `[ACTIVE]` |
| `POST` | `/api/v1/assistance` | Submit an assistance application with financial goal | Bearer JWT | `ROLE_USER` | `[ACTIVE]` |
| `GET` | `/api/v1/assistance/my-requests` | Retrieve current user's submitted applications | Bearer JWT | `ROLE_USER` | `[ACTIVE]` |
| `GET` | `/api/v1/assistance/public` | Browse public approved initiatives (paginated) | Public (No) | None | `[ACTIVE]` |
| `GET` | `/api/v1/assistance/nearby` | Discover initiatives using Haversine proximity radius, city, or zip | Public (No) | None | `[ACTIVE]` |
| `GET` | `/api/v1/assistance/{id}` | Retrieve details for a specific assistance ticket | Bearer JWT | Any authenticated user | `[ACTIVE]` |
| `POST` | `/api/v1/documents/upload/{requestId}` | Upload & attach verification document to request | Bearer JWT | Owner or `ROLE_ADMIN` | `[ACTIVE]` |
| `GET` | `/api/v1/documents/request/{requestId}` | List all supporting documents for request | Bearer JWT | Owner or `ROLE_ADMIN` | `[ACTIVE]` |
| `GET` | `/api/v1/documents/download/{documentId}` | Stream and download supporting document file | Bearer JWT | Owner or `ROLE_ADMIN` | `[ACTIVE]` |
| `GET` | `/api/v1/admin/users` | List all system users (paginated) | Bearer JWT | `ROLE_ADMIN` | `[ACTIVE]` |
| `PUT` | `/api/v1/admin/users/{id}/status` | Update user account status (ACTIVE, SUSPENDED, PENDING) | Bearer JWT | `ROLE_ADMIN` | `[ACTIVE]` |
| `GET` | `/api/v1/admin/assistance` | List assistance requests for review queue | Bearer JWT | `ROLE_ADMIN` | `[ACTIVE]` |
| `PATCH` | `/api/v1/admin/assistance/{id}/review` | Approve or Reject assistance ticket | Bearer JWT | `ROLE_ADMIN` | `[ACTIVE]` |
| `GET` | `/api/v1/admin/metrics` | Retrieve aggregated system-wide performance & metrics | Bearer JWT | `ROLE_ADMIN` | `[ACTIVE]` |

### Endpoint Details: `POST /api/v1/auth/register`
- **Request Headers:** `Content-Type: application/json`
- **Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecretPassword123!",
  "firstName": "Jane",
  "lastName": "Doe",
  "phone": "+1234567890",
  "role": "ROLE_USER"
}
```
- **Response (201 Created):** Returns standard `ApiResponse<AuthResponse>` containing issued JWT token, user ID, email, name, and assigned roles.

### Endpoint Details: `POST /api/v1/auth/login`
- **Request Headers:** `Content-Type: application/json`
- **Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecretPassword123!"
}
```
- **Response (200 OK):** Returns standard `ApiResponse<AuthResponse>` containing issued JWT token and profile details.

### Endpoint Details: `GET /api/v1/auth/me`
- **Request Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):** Returns `ApiResponse<UserSummaryResponse>` containing the current user profile and role authorities.

---

## 3. Verified & Active API Endpoints

### 3.1 Authentication Endpoints (`/api/v1/auth`) — *Phase 06*

| Method | Endpoint | Purpose | Auth Required | Required Role | Status |
|---|---|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Register new user account | No (Public) | None | `[ACTIVE]` |
| `POST` | `/api/v1/auth/login` | Authenticate and issue JWT token | No (Public) | None | `[ACTIVE]` |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile summary | Yes (Bearer) | Any | `[ACTIVE]` |

#### Sample Contract: `POST /api/v1/auth/register`
- **Request Body:**
```json
{
  "email": "user@example.com",
  "password": "StrongPassword123!",
  "fullName": "John Doe",
  "phoneNumber": "+1234567890",
  "address": "123 Main St",
  "roles": ["ROLE_USER"]
}
```
- **Success Response (201 Created):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "type": "Bearer",
    "userId": 1,
    "email": "user@example.com",
    "fullName": "John Doe",
    "roles": ["ROLE_USER"]
  },
  "timestamp": "2026-11-19T13:30:00Z"
}
```

---

### 3.2 User Management Endpoints (`/api/v1/users`) — *Phase 07*

| Method | Endpoint | Purpose | Auth Required | Required Role | Status |
|---|---|---|---|---|---|
| `GET` | `/api/v1/users/profile` | Get current user's profile | Yes (Bearer) | Any Authenticated | `[ACTIVE]` |
| `PUT` | `/api/v1/users/profile` | Update profile information | Yes (Bearer) | Any Authenticated | `[ACTIVE]` |
| `PUT` | `/api/v1/users/password` | Change account password | Yes (Bearer) | Any Authenticated | `[ACTIVE]` |

---

### 3.3 Assistance Request Endpoints (`/api/v1/assistance`) — *Phase 08 & Phase 18*

| Method | Endpoint | Purpose | Auth Required | Required Role | Status |
|---|---|---|---|---|---|
| `POST` | `/api/v1/assistance` | Submit assistance application (Supports `isAnonymous` & `consentGiven`) | Yes (Bearer) | Any Authenticated | `[ACTIVE]` |
| `GET` | `/api/v1/assistance/my-requests`| View user's submitted requests | Yes (Bearer) | Any Authenticated | `[ACTIVE]` |
| `GET` | `/api/v1/assistance/{id}` | Get assistance request details (Masked if anonymous unless admin/direct donor) | Optional (Bearer) | None / Authenticated | `[ACTIVE]` |
| `GET` | `/api/v1/assistance/public` | Browse approved assistance initiatives (Dynamic Dignity masking) | Optional (Bearer) | None / Authenticated | `[ACTIVE]` |

---

### 3.4 Document Management Endpoints (`/api/v1/documents`) — *Phase 09*

| Method | Endpoint | Purpose | Auth Required | Required Role | Status |
|---|---|---|---|---|---|
| `POST` | `/api/v1/documents/upload/{requestId}` | Upload verification document | Yes (Bearer) | Any Authenticated | `[ACTIVE]` |
| `GET` | `/api/v1/documents/request/{requestId}` | List documents for request | Yes (Bearer) | Any Authenticated | `[ACTIVE]` |
| `GET` | `/api/v1/documents/download/{documentId}` | Download attachment file | Yes (Bearer) | Any Authenticated | `[ACTIVE]` |

---

### 3.5 Administrative Endpoints (`/api/v1/admin`) — *Phase 10*

| Method | Endpoint | Purpose | Auth Required | Required Role | Status |
|---|---|---|---|---|---|
| `GET` | `/api/v1/admin/users` | List all system users (paginated) | Yes (Bearer) | `ROLE_ADMIN` | `[ACTIVE]` |
| `PUT` | `/api/v1/admin/users/{id}/status`| Update user account status | Yes (Bearer) | `ROLE_ADMIN` | `[ACTIVE]` |
| `GET` | `/api/v1/admin/assistance` | List assistance tickets for review | Yes (Bearer) | `ROLE_ADMIN` | `[ACTIVE]` |
| `PATCH` | `/api/v1/admin/assistance/{id}/review` | Approve/Reject assistance request | Yes (Bearer) | `ROLE_ADMIN` | `[ACTIVE]` |
| `GET` | `/api/v1/admin/metrics` | System-wide performance and metrics | Yes (Bearer) | `ROLE_ADMIN` | `[ACTIVE]` |

---

### 3.6 Donor & Donation Endpoints (`/api/v1/donations`) — *Phase 11*

| Method | Endpoint | Purpose | Auth Required | Required Role | Status |
|---|---|---|---|---|---|
| `POST` | `/api/v1/donations` | Submit donation towards assistance request | Yes (Bearer) | Any Authenticated | `[ACTIVE]` |
| `GET` | `/api/v1/donations/my-donations` | List authenticated user's donation history | Yes (Bearer) | Any Authenticated | `[ACTIVE]` |
| `GET` | `/api/v1/donations/request/{requestId}` | Public transparency list of donations for ticket | No (Public) | None | `[ACTIVE]` |

---

### 3.7 User Connection Endpoints (`/api/v1/connections`) — *Phase 19*

| Method | Endpoint | Purpose | Auth Required | Required Role | Status |
|---|---|---|---|---|---|
| `POST` | `/api/v1/connections/request/{targetUserId}` | Send connection request (auto-accepts if mutual) | Yes (Bearer) | Any Authenticated | `[ACTIVE]` |
| `PUT / PATCH` | `/api/v1/connections/{id}/accept` | Accept an incoming connection request | Yes (Bearer) | Any Authenticated | `[ACTIVE]` |
| `PUT / PATCH` | `/api/v1/connections/{id}/reject` | Decline an incoming connection request | Yes (Bearer) | Any Authenticated | `[ACTIVE]` |
| `DELETE` | `/api/v1/connections/{id}` | Disconnect / remove active connection | Yes (Bearer) | Any Authenticated | `[ACTIVE]` |
| `GET` | `/api/v1/connections/status/{targetUserId}` | Retrieve relationship status with a user | Yes (Bearer) | Any Authenticated | `[ACTIVE]` |
| `GET` | `/api/v1/connections/my` | List all accepted active connections | Yes (Bearer) | Any Authenticated | `[ACTIVE]` |
| `GET` | `/api/v1/connections/pending` | List pending incoming connection requests | Yes (Bearer) | Any Authenticated | `[ACTIVE]` |
| `GET` | `/api/v1/connections/sent` | List pending outgoing connection requests | Yes (Bearer) | Any Authenticated | `[ACTIVE]` |
| `GET` | `/api/v1/connections/count` | Get total count of pending incoming requests | Yes (Bearer) | Any Authenticated | `[ACTIVE]` |
| `GET` | `/api/v1/connections/discover` | Discover fellow donors and community members | Yes (Bearer) | Any Authenticated | `[ACTIVE]` |

---

### 3.8 Direct Messaging Endpoints (`/api/v1/messages`) — *Phase 20*

| Method | Endpoint | Purpose | Auth Required | Required Role | Status |
|---|---|---|---|---|---|
| `POST` | `/api/v1/messages` | Send message to connected recipient | Yes (Bearer) | Connected / Admin | `[ACTIVE]` |
| `GET` | `/api/v1/messages/conversation/{otherUserId}` | Retrieve chat thread (auto-marks read) | Yes (Bearer) | Connected / Admin | `[ACTIVE]` |
| `GET` | `/api/v1/messages/conversations` | List active conversations and connected partners | Yes (Bearer) | Any Authenticated | `[ACTIVE]` |
| `GET` | `/api/v1/messages/unread-count` | Get global unread message count | Yes (Bearer) | Any Authenticated | `[ACTIVE]` |
| `PUT` | `/api/v1/messages/read/{otherUserId}` | Mark incoming messages from user as read | Yes (Bearer) | Any Authenticated | `[ACTIVE]` |

---

### 3.9 Business Hub & Micro-Grants Endpoints (`/api/v1/business-hub`) — *Phase 21*

| Method | Endpoint | Purpose | Auth Required | Required Role | Status |
|---|---|---|---|---|---|
| `POST` | `/api/v1/business-hub/campaigns` | Submit new micro-grant venture proposal | Yes (Bearer) | Any Authenticated | `[ACTIVE]` |
| `GET` | `/api/v1/business-hub/campaigns` | Browse ventures with optional `?industry=` filter | No | Public | `[ACTIVE]` |
| `GET` | `/api/v1/business-hub/campaigns/{id}` | Retrieve venture details, roadmap & backers | No | Public | `[ACTIVE]` |
| `GET` | `/api/v1/business-hub/campaigns/my` | Retrieve ventures created by current user | Yes (Bearer) | Any Authenticated | `[ACTIVE]` |
| `PATCH` | `/api/v1/business-hub/campaigns/{id}/approve` | Admin moderation approval of venture | Yes (Bearer) | `ROLE_ADMIN` | `[ACTIVE]` |
| `POST` | `/api/v1/business-hub/campaigns/{id}/milestones` | Add execution roadmap milestone | Yes (Bearer) | Founder / Admin | `[ACTIVE]` |
| `PUT` | `/api/v1/business-hub/milestones/{id}/complete` | Mark execution milestone as completed | Yes (Bearer) | Founder / Admin | `[ACTIVE]` |
| `POST` | `/api/v1/business-hub/campaigns/{id}/fund` | Back venture with micro-grant and/or mentorship | Yes (Bearer) | Any Authenticated | `[ACTIVE]` |

---

### 3.10 In-App Notifications Endpoints (`/api/v1/notifications`) — *Phase 22*

| Method | Endpoint | Purpose | Auth Required | Required Role | Status |
|---|---|---|---|---|---|
| `GET` | `/api/v1/notifications` | Retrieve recent 20 in-app notifications | Yes (Bearer) | Any Authenticated | `[ACTIVE]` |
| `GET` | `/api/v1/notifications/unread-count` | Retrieve unread notification count | Yes (Bearer) | Any Authenticated | `[ACTIVE]` |
| `PUT / PATCH` | `/api/v1/notifications/{id}/read` | Mark specific notification as read | Yes (Bearer) | Recipient | `[ACTIVE]` |
| `POST` | `/api/v1/notifications/mark-all-read` | Mark all notifications as read for current user | Yes (Bearer) | Any Authenticated | `[ACTIVE]` |
| `DELETE` | `/api/v1/notifications/{id}` | Delete / dismiss an individual notification | Yes (Bearer) | Recipient | `[ACTIVE]` |

---

### 3.11 Multimedia Short-Video Reels Endpoints (`/api/v1/reels`) — *Phase 24*

| Method | Endpoint | Purpose | Auth Required | Required Role | Status |
|---|---|---|---|---|---|
| `GET` | `/api/v1/reels` | Retrieve chronologically ordered reels feed | No | Public | `[ACTIVE]` |
| `GET` | `/api/v1/reels/{id}` | Retrieve individual reel details & metadata | No | Public | `[ACTIVE]` |
| `GET` | `/api/v1/reels/user/{userId}` | Retrieve all reels published by specific creator | No | Public | `[ACTIVE]` |
| `POST` | `/api/v1/reels` | Publish new reel via JSON payload & video link | Yes (Bearer) | Any Authenticated | `[ACTIVE]` |
| `POST` | `/api/v1/reels/upload` | Upload video file directly (`multipart/form-data`) | Yes (Bearer) | Any Authenticated | `[ACTIVE]` |
| `GET` | `/api/v1/reels/video/{filename}` | Stream inline video file (`video/mp4`, `webm`) | No | Public | `[ACTIVE]` |
| `POST` | `/api/v1/reels/{id}/like` | Toggle like/unlike on a reel (triggers notification) | Yes (Bearer) | Any Authenticated | `[ACTIVE]` |
| `POST` | `/api/v1/reels/{id}/view` | Record video playback view count | No | Public | `[ACTIVE]` |
| `DELETE` | `/api/v1/reels/{id}` | Delete an owned reel (or as admin) | Yes (Bearer) | Creator / Admin | `[ACTIVE]` |

---

### 3.12 Community Forum Endpoints (`/api/v1/forum`) — *Phase 25*

| Method | Endpoint | Purpose | Auth Required | Required Role | Status |
|---|---|---|---|---|---|
| `GET` | `/api/v1/forum/categories` | Retrieve list of discussion channels & categories | No | Public | `[ACTIVE]` |
| `GET` | `/api/v1/forum/posts` | Query forum feed with category, search & sort | No | Public | `[ACTIVE]` |
| `GET` | `/api/v1/forum/posts/{id}` | Retrieve discussion post detail & view increment | No | Public | `[ACTIVE]` |
| `POST` | `/api/v1/forum/posts` | Create new discussion topic with optional cause link | Yes (Bearer) | Any Authenticated | `[ACTIVE]` |
| `DELETE` | `/api/v1/forum/posts/{id}` | Delete a discussion post and its replies/upvotes | Yes (Bearer) | Author / Admin | `[ACTIVE]` |
| `GET` | `/api/v1/forum/posts/{id}/replies` | Retrieve threaded replies (solution first) | No | Public | `[ACTIVE]` |
| `POST` | `/api/v1/forum/posts/{id}/replies` | Post an answer/reply (triggers notification) | Yes (Bearer) | Any Authenticated | `[ACTIVE]` |
| `POST` | `/api/v1/forum/posts/{id}/upvote` | Toggle upvote on a discussion post | Yes (Bearer) | Any Authenticated | `[ACTIVE]` |
| `PATCH` | `/api/v1/forum/replies/{id}/solution` | Mark/unmark reply as accepted solution | Yes (Bearer) | Author / Admin | `[ACTIVE]` |
| `DELETE` | `/api/v1/forum/replies/{id}` | Delete reply | Yes (Bearer) | Reply Author / Admin | `[ACTIVE]` |

---

### 3.13 Podcasts & Audio Streaming Endpoints (`/api/v1/podcasts`) — *Phase 26*

| Method | Endpoint | Purpose | Auth Required | Required Role | Status |
|---|---|---|---|---|---|
| `GET` | `/api/v1/podcasts` | Query podcasts with optional category, search & cause filters | No | Public | `[ACTIVE]` |
| `GET` | `/api/v1/podcasts/{id}` | Retrieve podcast episode metadata and details | No | Public | `[ACTIVE]` |
| `POST` | `/api/v1/podcasts` | Publish new podcast episode with audio link or uploaded file | Yes (Bearer) | Any Authenticated | `[ACTIVE]` |
| `POST` | `/api/v1/podcasts/upload` | Upload audio file directly (`.mp3`, `.wav`, `.ogg`, `.m4a`, `.aac`) | Yes (Bearer) | Any Authenticated | `[ACTIVE]` |
| `GET` | `/api/v1/podcasts/audio/{filename}` | Direct audio file streaming (`audio/mpeg`, etc.) | No | Public | `[ACTIVE]` |
| `POST` | `/api/v1/podcasts/{id}/play` | Record an episode play increment | No | Public | `[ACTIVE]` |
| `POST` | `/api/v1/podcasts/{id}/like` | Toggle like/unlike on an episode (triggers host notification) | Yes (Bearer) | Any Authenticated | `[ACTIVE]` |
| `DELETE` | `/api/v1/podcasts/{id}` | Delete an episode and cascade-delete likes | Yes (Bearer) | Host / Admin | `[ACTIVE]` |

---

## 4. Standard HTTP Status Codes

- `200 OK` — Successful operation.
- `201 Created` — Resource created successfully.
- `400 Bad Request` — Validation failure or malformed payload.
- `401 Unauthorized` — Missing, invalid, or expired JWT token.
- `403 Forbidden` — Authenticated user lacks required role/permission.
- `404 Not Found` — Requested resource does not exist.
- `409 Conflict` — State conflict (e.g., email already registered).
- `500 Internal Server Error` — Unhandled server-side exception.
