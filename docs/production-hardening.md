# SaathCare — Production Hardening & Advanced Engineering Architecture

This document details the enterprise-grade production engineering enhancements implemented across **Phases B through O** of the SaathCare platform.

---

## 1. Executive Summary & Hardening Dimensions

The hardening effort elevates SaathCare from a full-stack functional application into a resilient, scalable, secure, and observable distributed system.

| Domain | Hardening Mechanism | Key Benefit |
|---|---|---|
| **Security & Auth** | SHA-256 token hashing, anti-enumeration, cross-site cookie controls, session revocation | Defense against token theft, timing attacks, credential stuffing, and user enumeration |
| **Email Infrastructure** | Provider abstraction pattern, decoupled Notification Outbox | Non-blocking HTTP paths, guaranteed delivery with exponential backoff |
| **Data Integrity** | Idempotency key middleware, integer paise calculations, append-only ledger hooks | Zero duplicate financial transactions on retry; zero rounding errors |
| **Object Storage** | Multer MIME validation, Local/S3 driver abstraction, signed time-limited URLs | Secure, immutable bill receipt attachments without exposing private buckets |
| **Reliability & Scaling** | Distributed MongoDB lease locks, database reconnect retry loops, process shutdown traps | Zero duplicate cron jobs across multi-replica clusters; zero socket leaks |
| **Observability** | Request correlation IDs (`X-Request-Id`), structured request logger, error taxonomy hierarchy | End-to-end request tracing and standardized operational error envelopes |
| **Data Privacy** | 3-day deletion grace period, complete PII anonymization preserving ledger history | Compliance with GDPR/DPDP "right to be forgotten" without compromising auditability |
| **Client Experience** | PWA offline caching, reconnect refetch, $\ge 44\text{px}$ touch targets, React ErrorBoundary | Seamless mobile UX on erratic cellular connections |

---

## 2. Architectural Deep-Dives

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT (PWA / React)                              |
|   - Idempotency UUIDs (crypto.randomUUID)                                         |
|   - Optimistic Button Disabling                                                   |
|   - Service Worker Cache-First for static assets                                  |
|   - Auto Refetch on Network Reconnection                                          |
+----------------------------------------+------------------------------------------+
                                         | HTTP / REST (X-Request-Id, X-Idempotency-Key)
                                         v
+-----------------------------------------------------------------------------------+
|                              EXPRESS GATEWAY & MIDDLEWARE                         |
|   1. RequestIdMiddleware (Assign/Forward X-Request-Id)                             |
|   2. RequestLoggerMiddleware (Structured log with method, URL, duration, status)    |
|   3. RateLimiter (Window / IP-based)                                              |
|   4. SecurityHeaders (Helmet, CORS with credentials)                              |
|   5. IdempotencyMiddleware (Atomic MongoDB reservation & cached response replay)  |
|   6. AuthMiddleware (JWT verification, User lookup, Refresh token rotation)       |
|   7. FamilyMembershipMiddleware (Multi-tenant authorization)                      |
+----------------------------------------+------------------------------------------+
                                         |
             +---------------------------+---------------------------+
             |                                                       |
             v                                                       v
+---------------------------+                               +-----------------------+
|      DOMAIN SERVICES      |                               |      FILE STORAGE     |
| - AuthService             |                               | - LocalStorageProvider|
| - ExpenseService          |                               | - S3StorageProvider   |
| - TaskService             |                               | - Signed GET URLs     |
| - FamilyService           |                               +-----------------------+
+-------------+-------------+
              |
              v (Transactional Enqueue)
+-------------------------------------------+
|          NOTIFICATION OUTBOX              |
| - Status: PENDING -> PROCESSING -> SENT   |
| - NextAttemptAt (Exponential Backoff)     |
| - Decoupled Cron Worker (outboxWorker)    |
+---------------------+---------------------+
                      |
                      v
+-------------------------------------------+
|         EMAIL PROVIDER ADAPTER            |
| - MockEmailProvider (Dev/Test logger)     |
| - SmtpEmailProvider (Nodemailer TLS)      |
+-------------------------------------------+
```

---

## 3. Core Subsystems

### 3.1 Idempotency Guarantee (Phase G)
- **Problem**: Network timeouts or multi-clicks during financial operations (`POST /api/expenses`, `/settle-up`, `/tasks/:id/complete`) cause duplicate entries or duplicate payouts.
- **Solution**:
  - The client generates a unique UUID `X-Idempotency-Key` for mutating requests.
  - The `idempotencyMiddleware` atomically reserves the key in the `IdempotencyKey` collection:
    ```javascript
    await IdempotencyKey.create({ key, userId, status: 'PENDING', expiresAt });
    ```
  - If a concurrent duplicate arrives, the unique index triggers a duplicate key error, responding with `409 Conflict` (request in progress).
  - If a completed key exists, the cached `responseStatus` and `responseBody` are immediately replayed with an `X-Cache: HIT` header.
  - Documents expire automatically after 24 hours via MongoDB's native TTL index on `expiresAt`.

### 3.2 Notification Outbox Pattern (Phase F)
- **Problem**: Calling external SMTP services inline during HTTP requests creates network latency, introduces timeout failure risks, and causes distributed state inconsistencies (dual-write problem).
- **Solution**:
  - Domain operations insert the notification record into `NotificationOutbox` with status `PENDING` within the local database operation.
  - A detached background worker runs every 10 seconds, selects batches of `PENDING` or `FAILED` records where `nextAttemptAt <= NOW`, transitions them atomically to `PROCESSING`, and dispatches them via the active `EmailProvider`.
  - Failures increment `attempts` and calculate exponential backoff:
    $$\text{backoffDelay} = \min(2^{\text{attempts}} \times 10\text{s}, 3600\text{s})$$
  - After 5 consecutive failures, the item transitions to `FAILED` for dead-letter analysis.

### 3.3 Receipt Attachment & Ledger Immutability (Phase H)
- **Design Constraint**: `ExpenseLedger` contains strict pre-save hooks preventing all document modification or deletion (`Cannot modify immutable expense ledger`).
- **Solution**:
  - Receipts are uploaded **first** to `/api/expenses/upload-receipt`.
  - The upload route enforces a 5MB size limit and strictly validates MIME types (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`).
  - The storage provider (Local disk in dev, AWS S3 in production) generates the object key and metadata.
  - When the expense is created, the `attachment` object is persisted atomically inside the original ledger creation payload.
  - Storage providers vend time-limited signed URLs (`getSignedUrlPromise` or authenticated static routes), ensuring private objects cannot be accessed without authorization.

### 3.4 Distributed Multi-Node Cron Locking (Phase M)
- **Problem**: In clustered deployments (e.g. AWS ECS, Kubernetes), running `node-cron` independently across multiple replicas causes duplicate emails, duplicate task miss broadcasts, and duplicate deletion sweeps.
- **Solution**:
  - The `DistributedLock` model maintains a collection of named leases with a TTL index on `expiresAt`.
  - Before executing a cron job, the node executes an atomic upsert:
    ```javascript
    const acquired = await DistributedLock.findOneAndUpdate(
      { key, $or: [{ expiresAt: { $lt: now } }, { lockedBy: instanceId }] },
      { $set: { lockedBy: instanceId, lockedAt: now, expiresAt: leaseExpires } },
      { upsert: true, new: true }
    );
    ```
  - Only the winning instance executes the job logic. In-memory locks provide secondary defense against thread overlap.

### 3.5 Account Anonymization vs Ledger Immutability (Phase J)
- **Problem**: GDPR / DPDP compliance requires honoring account deletion requests. However, deleting user records or associated expense ledger entries would corrupt historical debt matrices, modify balance math, and violate financial audit regulations.
- **Solution**:
  1. **3-Day Grace Period**: Requesting deletion sets `pendingDeletion: true` and `deletionScheduledAt = NOW + 3 days`. Users can log in and cancel deletion during this window.
  2. **Anonymization Execution**: After the grace period, a scheduled job anonymizes the user:
     - Name replaced with `"Former Member"`.
     - Email replaced with `former_member_{userId}@deleted.saathcare.internal`.
     - Passwords, refresh tokens, and notification outbox items purged.
     - Family group memberships removed.
     - **Expense ledger documents are preserved unmodified**, maintaining mathematical ledger balance and historical financial clarity for surviving family members.

---

## 4. Verification & Readiness Endpoints (Phase I)

The API exposes two distinct probe endpoints matching cloud container standards:

1. **`GET /health` (Liveness Probe)**:
   - Evaluates process health. Always returns `200 OK` as long as Express is accepting requests and event loop is responsive.
2. **`GET /ready` (Readiness Probe)**:
   - Evaluates system dependencies (MongoDB connectivity). Returns `200 OK` when `mongoose.connection.readyState === 1`, otherwise returns `503 Service Unavailable`. Ingress routers and Kubernetes Service controllers use this to cut traffic from unhealthy pods without restarting them.

---

## 5. Security & Verification Checklist

- [x] All password reset and email verification tokens hashed with SHA-256 before database persistence.
- [x] Anti-enumeration enforced on `/forgot-password`, `/resend-verification`, and registration endpoints.
- [x] `X-Request-Id` generated or propagated on every inbound HTTP request.
- [x] All financial calculations executed in integer paise; float math completely prohibited.
- [x] Storage paths sandboxed; file uploads restricted to whitelist of MIME types and 5MB limit.
- [x] Clean architecture strictly preserved: routes $\to$ middleware $\to$ controllers $\to$ services $\to$ models.
