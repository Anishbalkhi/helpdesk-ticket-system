# API Documentation

Base URL: `/api` (local: `http://localhost:5000/api`)

All responses are JSON. Authenticated routes (🔒) need the header:

```
Authorization: Bearer <jwt>
```

Errors always have this shape:

```json
{ "success": false, "message": "Human readable message", "errors": [{ "field": "title", "message": "Title must be at least 5 characters" }] }
```

`errors` is only present for validation failures (HTTP 400).

| Status | Meaning |
|---|---|
| 400 | Validation failed / bad input / malformed id |
| 401 | Missing, invalid or expired token |
| 403 | Logged in but not allowed (wrong role, or a user trying an admin-only change) |
| 404 | Resource not found — also returned when a user asks for someone else's ticket, so ticket IDs can't be probed |
| 409 | Conflict (email already registered, ticket can no longer be edited/commented) |
| 429 | Too many login/register attempts |

A Postman collection with every request is in [`postman_collection.json`](postman_collection.json).

---

## Enums

| Field | Values |
|---|---|
| `role` | `user`, `admin` |
| `category` | `technical`, `billing`, `account`, `feature_request`, `other` |
| `priority` | `low`, `medium`, `high`, `urgent` |
| `status` | `open`, `in_progress`, `resolved`, `closed` |

## Objects

**User**
```json
{ "id": "665f...", "name": "Asha Verma", "email": "asha@example.com", "role": "user", "createdAt": "2026-11-26T10:00:00.000Z" }
```

**Ticket**
```json
{
  "id": "6660...",
  "ticketNumber": 1024,
  "title": "Cannot reset password",
  "description": "The reset link in the email returns a 404.",
  "category": "account",
  "priority": "high",
  "status": "open",
  "createdBy": { "id": "665f...", "name": "Asha Verma", "email": "asha@example.com" },
  "commentCount": 2,
  "resolvedAt": null,
  "createdAt": "2026-11-26T10:05:00.000Z",
  "updatedAt": "2026-11-26T10:05:00.000Z"
}
```

**Comment**
```json
{ "id": "6661...", "ticket": "6660...", "body": "We are looking into it.", "author": { "id": "665a...", "name": "Support Admin", "role": "admin" }, "createdAt": "..." }
```

**Activity** (event log entry)
```json
{ "id": "6662...", "ticket": "6660...", "ticketNumber": 1024, "event": "ticket.status_changed", "actor": { "id": "665a...", "name": "Support Admin", "role": "admin" }, "details": { "from": "open", "to": "in_progress" }, "createdAt": "..." }
```
`event` is one of `ticket.created`, `ticket.updated`, `ticket.status_changed`, `ticket.resolved`, `ticket.deleted`, `comment.added`.

**Notification**
```json
{ "id": "6663...", "type": "ticket.status_changed", "message": "Ticket #1024 moved from open to in_progress", "ticket": "6660...", "read": false, "createdAt": "..." }
```

---

## Auth

### POST /api/auth/register
Creates a **user** account. Admin accounts are created with `npm run seed`, never through this route, so nobody can sign themselves up as an admin.

Body: `{ "name": "Asha Verma", "email": "asha@example.com", "password": "Secret123" }`
Rules: name 2–60 chars; valid email; password 8–72 chars with at least one letter and one number.

`201` → `{ "success": true, "data": { "token": "<jwt>", "user": User } }`
`409` if the email is already registered.

### POST /api/auth/login
Body: `{ "email": "asha@example.com", "password": "Secret123" }`
`200` → `{ "success": true, "data": { "token": "<jwt>", "user": User } }`
`401` → `"Invalid email or password"` (same message for an unknown email and a wrong password).

### GET /api/auth/me 🔒
`200` → `{ "success": true, "data": { "user": User } }`

---

## Tickets 🔒

### GET /api/tickets
Users get **their own** tickets; admins get **all** tickets.

| Query param | Example | Notes |
|---|---|---|
| `status` | `open` | one enum value |
| `priority` | `high` | one enum value |
| `category` | `billing` | one enum value |
| `search` | `password` | case-insensitive match on title and description |
| `sort` | `-createdAt` | `createdAt`, `-createdAt`, `updatedAt`, `-updatedAt`, `priority`, `-priority` (priority sorts low → urgent) |
| `page` | `1` | default 1 |
| `limit` | `10` | default 10, max 50 |

`200` →
```json
{ "success": true, "data": { "tickets": [Ticket], "pagination": { "page": 1, "limit": 10, "total": 23, "totalPages": 3 } } }
```

### POST /api/tickets
Body: `{ "title": "...", "description": "...", "category": "account", "priority": "high" }`
Rules: title 5–120 chars; description 10–5000 chars; category required; priority optional (default `medium`). New tickets always start as `open` — a `status` in the body is ignored.
`201` → `{ "success": true, "data": { "ticket": Ticket } }` · fires `ticket.created`.

### GET /api/tickets/:id
Owner or admin. `200` → `{ "success": true, "data": { "ticket": Ticket } }`

### PATCH /api/tickets/:id
- **Owner (user):** may change `title`, `description`, `category`, `priority` — only while the status is `open`, otherwise `409`. Sending `status` → `403`.
- **Admin:** may change `status` and `priority` (and the other fields) on any ticket.

Body: any subset of `{ title, description, category, priority, status }` (at least one field).
`200` → `{ "success": true, "data": { "ticket": Ticket } }`
Fires `ticket.updated` for field edits, `ticket.status_changed` when the status changes, and also `ticket.resolved` when the new status is `resolved`.

### DELETE /api/tickets/:id
- **Owner:** only while the status is `open` (else `409`).
- **Admin:** any ticket.

Also deletes the ticket's comments. Activity log entries are kept as an audit trail.
`200` → `{ "success": true, "message": "Ticket deleted" }` · fires `ticket.deleted`.

---

## Comments 🔒

### GET /api/tickets/:id/comments
Owner or admin. Oldest first.
`200` → `{ "success": true, "data": { "comments": [Comment] } }`

### POST /api/tickets/:id/comments
Owner or admin. Body: `{ "body": "..." }` (1–2000 chars). Not allowed on `closed` tickets (`409`).
`201` → `{ "success": true, "data": { "comment": Comment } }` · fires `comment.added`.

---

## Activity log 🔒

### GET /api/tickets/:id/activity
Owner or admin. Newest first.
`200` → `{ "success": true, "data": { "activity": [Activity] } }`

---

## Notifications 🔒

### GET /api/notifications
The current user's notifications, newest first (max 50).
`200` → `{ "success": true, "data": { "notifications": [Notification], "unreadCount": 3 } }`

### PATCH /api/notifications/:id/read
`200` → `{ "success": true, "data": { "notification": Notification } }`

### PATCH /api/notifications/read-all
`200` → `{ "success": true, "data": { "updated": 3 } }`

Who gets notified:

| Event | Recipients |
|---|---|
| `ticket.created` | all admins |
| `ticket.status_changed` / `ticket.resolved` | the ticket owner (unless they made the change) |
| `comment.added` by an admin | the ticket owner |
| `comment.added` by the owner | all admins |

---

## Admin 🔒 (role: admin)

### GET /api/admin/stats
```json
{
  "success": true,
  "data": {
    "total": 42,
    "byStatus":   { "open": 10, "in_progress": 8, "resolved": 20, "closed": 4 },
    "byPriority": { "low": 5, "medium": 20, "high": 12, "urgent": 5 },
    "byCategory": { "technical": 15, "billing": 9, "account": 10, "feature_request": 5, "other": 3 },
    "recentActivity": [Activity]
  }
}
```

---

## Health

### GET /api/health
`200` → `{ "success": true, "status": "ok", "db": "connected" }`
