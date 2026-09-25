# SaathCare — System Architecture & Design

## 1. Overview
SaathCare is built with a **Clean Layered Architecture** separating routing, network security, domain services, data persistence, and real-time events.

```
Incoming Request
       ↓
Network Security Layer (Helmet, CORS, CookieParser, RateLimiter)
       ↓
Routes Layer (Express Router)
       ↓
Middleware Layer (authenticateUser, familyMembershipMiddleware, Zod validation)
       ↓
Controllers Layer (Thin request/response handlers)
       ↓
Domain Services Layer (Business logic: AuthService, FamilyService, TaskService, ExpenseService, SettleUpService)
       ↓
Models Layer (Mongoose Schemas with Immutability Hooks)
       ↓
Database Layer (MongoDB Atlas / Local Replica Set)
```

---

## 2. Layer Responsibilities

### Network & Gateway Layer
- **Helmet**: Injects security headers (`X-Frame-Options`, `Content-Security-Policy`, `HSTS`, `X-Content-Type-Options`).
- **CORS Whitelist**: Rejects requests from unauthorized origins; permits credentials for HTTP-only cookies.
- **Rate Limiting**: Mitigates brute-force attacks on `/api/auth/*` (max 20 reqs/15m) and general API endpoints (max 200 reqs/15m).

### Middleware Layer
- **`authenticateUser`**: Validates JWT access token from `Authorization: Bearer <token>` or HTTP-only cookie. Attaches `req.user` to the request pipeline.
- **`familyMembershipMiddleware`**: Validates that `req.user._id` is an active member in `FamilyGroup.members`. Rejects unauthorized cross-family access with `403 Forbidden`.
- **`validate(schema, target)`**: Higher-order Zod validator parsing and stripping unexpected payload fields before controllers execute.

### Domain Service Layer
- Independent domain logic. Controllers only orchestrate HTTP requests and pass inputs to services.
- **`SettleUpService`**: Fully decoupled from Express and MongoDB; can be executed anywhere and tested in isolation.

### Persistence & Models Layer
- **Mongoose ODM**: Enforces schema validation, required fields, and compound indexes.
- **Append-Only Immutability Hooks**: Pre-hooks block any mutation (`updateOne`, `deleteOne`, etc.) on `ExpenseLedger` records.

---

## 3. Real-Time Communication Architecture (Socket.io)
- Real-time events are transmitted over WebSockets with HTTP polling fallback.
- **Room Isolation**: Each family group communicates exclusively within a scoped room: `family:<familyGroupId>`.
- **Handshake Verification**: Socket.io middleware validates the user's JWT access token on connection.
- **Room Authorization**: On `family:join`, the backend verifies database membership before allowing the socket into the room, preventing unauthorized room eavesdropping.

```
Client -> connect(auth: { token }) -> JWT Handshake Auth
Client -> emit('family:join', { familyGroupId }) -> Check DB Membership -> Join room `family:<familyGroupId>`
Task Completed / Expense Logged -> Backend emits to `family:<familyGroupId>` -> All siblings receive live UI updates
```

---

## 4. Background Scheduled Jobs (Missed Task Sweeper)
- Configured with `node-cron` running on `env.CRON.MISSED_TASK_SCHEDULE` (default: every 5 minutes).
- **Sweep Logic**: Queries for tasks where `status = PENDING` and `dueAt < NOW`.
- **Atomic Transition**: Executes `findOneAndUpdate({ _id, status: PENDING }, { status: MISSED })`.
- **Live Broadcast**: Dispatches `task:missed` payload to the family's Socket.io room.
