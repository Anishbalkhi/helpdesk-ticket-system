# HelpDesk — Support Ticket Management System

A mini helpdesk where **users raise support tickets** and **admins manage and resolve them**.
Built with **Node.js, Express, MongoDB (Mongoose) and React**, with JWT authentication,
role-based access control and an event-driven activity log and notification system.

**Live demo:** _<add your deployment URL here>_

| Role | Email | Password |
|---|---|---|
| Admin | `admin@helpdesk.dev` | `Admin@12345` |
| User | `user@helpdesk.dev` | `User@12345` |

(You can also register a new user account from the login page.)

---

## Features

**Authentication & roles**
- Register / log in with JWT (bcrypt-hashed passwords, 1-day tokens).
- Two roles: **User** and **Admin**. Public sign-up always creates a *user*; admins are created by a seed script, so nobody can register themselves as an admin.
- Every protected route checks the token **and** reloads the user from the database, so a deleted account or changed role takes effect immediately.

**Users can**
- Create tickets (title, description, category, priority) — each gets a readable number like **#1001**.
- See only their own tickets, with filters, search, sorting and pagination.
- Edit or delete a ticket **while it is still open** (once support starts work, it is locked).
- Track status (`open → in progress → resolved → closed`) and comment on their tickets.

**Admins can**
- See **all** tickets and filter by status, priority and category (plus search and sort).
- Change status and priority, reply to any ticket, delete any ticket.
- Use a **dashboard** with ticket counts by status, priority and category and a live feed of recent activity.

**Event handling & actions**
- Every important action publishes an event: `ticket.created`, `ticket.updated`, `ticket.status_changed`, `ticket.resolved`, `ticket.deleted`, `comment.added`.
- Independent handlers react to those events:
  - an **activity logger** writes an audit trail shown as a timeline on each ticket and on the dashboard;
  - a **notifier** creates in-app notifications (bell icon with unread count): admins hear about new tickets and user replies, owners hear about status changes and admin replies.

**Bonus features implemented:** search, pagination, sorting & filtering, dashboard with statistics, React frontend, automated API tests (37), Docker support, GitHub Actions CI, Postman collection.

---

## Tech stack

| Layer | Choice |
|---|---|
| Backend | Node.js 22, Express 4 |
| Database | MongoDB with Mongoose 8 |
| Auth | JSON Web Tokens (`jsonwebtoken`), `bcryptjs` |
| Validation | `zod` schemas (body and query) |
| Security | `helmet`, CORS allow-list, rate limiting on login/register, 100 kB body limit |
| Frontend | React 18, React Router 6, Axios, Tailwind CSS 4, Vite |
| Testing | Jest, Supertest, mongodb-memory-server |
| DevOps | Docker / Docker Compose, Render blueprint, GitHub Actions |

---

## Architecture

```
support-ticket-system/
├── backend/
│   ├── src/
│   │   ├── config/        env + database connection
│   │   ├── models/        User, Ticket, Comment, Activity, Notification, Counter
│   │   ├── validators/    zod schemas for every request body / query
│   │   ├── middleware/    authenticate, authorize(role), validate, error handler
│   │   ├── routes/        URL → middleware chain → controller
│   │   ├── controllers/   auth, tickets, comments, activity, notifications, admin
│   │   ├── services/      ticketAccess (who may see which ticket)
│   │   ├── events/        eventBus + handlers/ (activityLogger, notifier)
│   │   ├── seed/          idempotent admin/demo data
│   │   ├── utils/         AppError, asyncHandler, serializers
│   │   ├── app.js         builds the Express app (also used by tests)
│   │   └── server.js      connects to MongoDB and starts listening
│   ├── scripts/seed.js
│   └── tests/             37 API tests (auth, tickets, comments, events, stats)
├── frontend/
│   └── src/
│       ├── api/           axios client + one module per resource
│       ├── context/       AuthContext (token, current user)
│       ├── pages/         Login, Register, Tickets, NewTicket, TicketDetail, AdminDashboard
│       ├── components/    Navbar, NotificationBell, TicketFilters, CommentThread, ActivityTimeline, ...
│       └── utils/         enum labels, date formatting, activity sentences, validation
├── docs/                  API.md, DATABASE.md, postman_collection.json
├── Dockerfile, docker-compose.yml, render.yaml
```

### How a request flows

```
PATCH /api/tickets/:id
  → authenticate          (verify JWT, load user)
  → validateObjectId      (400 on a malformed id)
  → validate(zod schema)  (400 with field errors; unknown fields stripped)
  → ticketController.updateTicket
        → findAccessibleTicket   (404 if not yours — unless admin)
        → role rules             (403 user changing status, 409 editing a non-open ticket)
        → ticket.save()          (pre-save hook keeps priorityRank / resolvedAt in sync)
        → eventBus.publish('ticket.status_changed', { ticket, actor, details })
              ├─ activityLogger → Activity row
              └─ notifier       → Notification for the ticket owner
  → JSON response   |   any thrown AppError → central errorHandler → { success:false, message, errors? }
```

### The event system

`src/events/eventBus.js` is a small publish/subscribe bus. Controllers only *announce* what happened;
they don't know who is listening. Handlers run concurrently and `publish` waits for them with
`Promise.allSettled`, so:

- the activity log is already written when the API responds (the UI can refresh the timeline straight away);
- a failing handler (say, the notifier) is logged but **never breaks the user's request** — the ticket change is already saved. A test covers this.

Adding a new action — e-mail, Slack, a webhook — is one new handler file plus one `subscribe` call; no controller changes.
In a larger system the same interface could be backed by a message queue (BullMQ, RabbitMQ) to retry failed actions.

More detail: **[docs/API.md](docs/API.md)** (every endpoint, request and response) and **[docs/DATABASE.md](docs/DATABASE.md)** (schema diagram, indexes, design decisions).

---

## Running locally

**Prerequisites:** Node.js 20.19+ (22 recommended) and MongoDB (local, Docker, or a free MongoDB Atlas cluster).

```bash
git clone <this repo>
cd support-ticket-system
npm run install:all                      # installs backend + frontend

cp backend/.env.example backend/.env     # then edit MONGODB_URI / JWT_SECRET if needed
npm run seed:demo                        # admin + demo user + 3 sample tickets

npm run dev:api                          # API on http://localhost:5000
npm run dev:web                          # (second terminal) React app on http://localhost:5173
```

The Vite dev server proxies `/api` to the backend, so no CORS setup is needed in development.

### Production-style run (one server)

```bash
npm run build                            # installs deps and builds the React app into frontend/dist
NODE_ENV=production JWT_SECRET=<long-random-string> npm start
```

Express serves the API under `/api` and the built React app for every other route, on one port.

### With Docker

```bash
docker compose up --build                # app + MongoDB → http://localhost:5000 (demo data seeded)
```

### Environment variables (`backend/.env`)

| Variable | Default | Purpose |
|---|---|---|
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/helpdesk` | database connection string |
| `JWT_SECRET` | dev-only value | **required in production** |
| `JWT_EXPIRES_IN` | `1d` | token lifetime |
| `PORT` | `5000` | HTTP port |
| `CLIENT_URL` | `http://localhost:5173` | allowed browser origins (comma-separated) |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | demo values | admin created by the seed |
| `SEED_ON_START` | `false` | create the admin when the server starts (for hosts without a shell) |
| `SEED_DEMO` | `false` | with `SEED_ON_START`, also create the demo user and sample tickets |

---

## Tests

```bash
npm test
```

37 Jest + Supertest tests run against a throwaway in-memory MongoDB (no real database is touched). They cover:
registration/login/token expiry, role restrictions, ownership (404 for other users' tickets),
the "only while open" edit/delete rule, validation errors, filters/search/sort/pagination,
priority sorting, comments, the activity log contents, who gets which notification,
handler-failure isolation, admin stats and error responses.

CI (`.github/workflows/ci.yml`) runs the tests and the frontend build on every push.

The **Postman collection** in `docs/postman_collection.json` walks through the whole flow (register → create → comment → admin resolves → stats → notifications → delete) and stores tokens and ids automatically.

---

## Deployment (Render + MongoDB Atlas)

1. Create a free **MongoDB Atlas** M0 cluster, a database user, and allow access from anywhere (`0.0.0.0/0`). Copy the connection string.
2. On **Render** → *New* → *Blueprint* → pick this repo. `render.yaml` creates one web service that builds the frontend and serves everything from Express.
3. Set `MONGODB_URI` when prompted. `JWT_SECRET` is generated automatically. The blueprint turns on `SEED_ON_START` and `SEED_DEMO` so reviewers can log in with the demo accounts.
4. Health check: `GET /api/health`.

For a real (non-demo) deployment, set `SEED_DEMO=false` and your own `ADMIN_EMAIL` / `ADMIN_PASSWORD` — the seed refuses to create a production admin with the default password.

---

## Implementation decisions

- **Ownership checks return 404, not 403**, so a user can't tell whether ticket #1042 exists.
- **Users edit only while `open`.** Once an admin is working on a ticket, its content is stable; users can still comment.
- **Only admins change status.** This keeps the workflow predictable; users communicate through comments.
- **Comments in their own collection** with a denormalised `commentCount` — see DATABASE.md.
- **Readable ticket numbers** from an atomic counter, alongside MongoDB ids.
- **Central error handling:** controllers throw `AppError`s; one middleware turns every error (validation, duplicate key, bad JSON, unknown route, bugs) into the same JSON shape and never leaks stack traces in production.
- **Serializers** define exactly what leaves the API, so internal fields (password hash, `priorityRank`, `__v`) can't leak.
- **One deployment:** Express serves the React build, so there's no CORS to configure in production and one URL to share.

## Possible next steps

- Ticket assignment to specific admins and SLA timers.
- E-mail notifications as another event handler (e.g. Nodemailer / SendGrid).
- Real-time updates with WebSockets (Socket.IO) instead of polling notifications.
- File attachments (S3/Cloudinary) and refresh tokens in HTTP-only cookies.
