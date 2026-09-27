# SaathCare — Software Engineering Interview Notes & Architectural Deep-Dive

Use this reference to explain design decisions, architectural trade-offs, and engineering rigor in technical interviews.

---

### Q1: Why did you choose a Clean Layered Architecture rather than putting logic in Express routes or controllers?
**Answer**:
Putting database calls and business rules inside route handlers creates high coupling and makes unit testing impossible without mocking the entire HTTP request/response lifecycle. In SaathCare:
- **Routes** only define HTTP methods, endpoints, and middleware chains.
- **Middleware** isolates cross-cutting concerns (authentication, family boundary authorization, rate limiting, and Zod payload validation).
- **Controllers** are thin orchestration adapters: they extract validated data from `req`, call domain services, and format the response using standard envelopes.
- **Services** encapsulate pure business logic (split calculations, settlement matrices, state machine transitions).
- **Models** enforce schema rules, indexes, and database-level immutability.
This separation allowed us to test the settlement engine and validation logic in milliseconds using pure unit tests with zero database or HTTP overhead.

---

### Q2: Why an Append-Only Ledger with Reversing Entries rather than standard CRUD updates or deletions?
**Answer**:
In shared family caregiving, financial trust is paramount. If sibling A logs an expense for ₹5,000 and later edits or deletes it, other siblings lose visibility into what happened, breeding suspicion. 
In SaathCare:
1. The database layer **strictly blocks** `updateOne`, `deleteMany`, `findOneAndUpdate`, etc., via Mongoose pre-save hooks.
2. If an entry is erroneous, the user invokes the **reversal endpoint**, which creates an explicit offsetting record referencing `originalEntryId` with a documented reason.
3. This creates a permanent, tamper-proof financial audit trail identical to professional double-entry accounting systems (such as SAP or Stripe Ledger).

---

### Q3: How does your SettleUp settlement algorithm work, and is it mathematically optimal?
**Answer**:
The settlement engine uses a **greedy debt-minimization algorithm**:
1. First, it computes the net balance for every member:
   $$\text{netBalance} = \text{totalPaid} - \text{totalOwed}$$
2. Reversals are identified and their corresponding original entries are neutralized.
3. Members are separated into **creditors** (net $> 0$) and **debtors** (net $< 0$).
4. Creditors are sorted descending by credit amount; debtors are sorted descending by debt amount.
5. In each iteration, the largest debtor pays the largest creditor $\min(\text{credit}, \text{debt})$. Balances are updated and settled parties are shifted out.
6. **Complexity**: $O(N \log N)$ due to sorting.
7. **Interview Distinction**: In an interview, I clarify that this is a **greedy heuristic** rather than a mathematically optimal minimum-transaction solution. Finding the absolute theoretical minimum transfers across multi-party subsets is a reduction of the **NP-Hard Subset-Sum / Partition Problem**. However, the greedy heuristic is deterministic, executes in near-instantaneous time, and is the standard industry choice (used by apps like Splitwise) because it avoids strange multi-hop combinatorial settlements that confuse users.

---

### Q4: Why store money in paise (integers) instead of floating-point rupees?
**Answer**:
Computers represent numbers using IEEE 754 binary floating-point. In JavaScript:
`0.1 + 0.2 === 0.30000000000000004`
In financial calculations, splitting ₹1,000 across 3 members with floating-point decimals causes fractional paise to be lost or accumulated, creating balancing errors where sum of splits $\neq$ total amount. By storing all money in **integer paise** (1 INR = 100 paise), all calculations are exact integer math. We distribute the remainder paise evenly across participants, ensuring:
$$\sum \text{splitAmong}[i].\text{amountPaise} \equiv \text{amountPaise}$$

---

### Q5: How do you prevent data leaks between different family groups?
**Answer**:
We never rely on the frontend or client-supplied IDs without validation. Every family-scoped route is protected by `familyMembershipMiddleware`. This middleware queries:
`FamilyGroup.exists({ _id: familyGroupId, members: req.user._id })`
If the authenticated user is not in the `members` array, the request is immediately aborted with `403 Forbidden` before any controller or query executes. Furthermore, all database queries explicitly filter by `familyGroupId`.

---

### Q6: How is Socket.io secured against unauthorized room listening?
**Answer**:
Socket.io uses two tiers of security:
1. **Handshake Authentication**: The connection middleware verifies the user's JWT access token, attaching their verified identity `socket.user`.
2. **Room Authorization**: When the client emits `family:join` with `{ familyGroupId }`, the server executes a database query verifying that `socket.user._id` belongs to that family group before allowing `socket.join(room)`. If unauthorized, it emits an error and blocks the socket from joining the room.

---

### Q7: How does missed-task detection work and how can it scale to multiple server instances?
**Answer**:
A scheduled `node-cron` background job runs every 5 minutes. It queries tasks with `status: PENDING` and `dueAt < NOW`. It performs an atomic `findOneAndUpdate({ _id: task._id, status: PENDING }, { status: MISSED })`. If updated, it broadcasts a `task:missed` WebSocket event to the family room.
**Distributed Scaling Strategy**: In a single instance, an in-memory execution lock prevents overlapping cron runs. In a multi-instance container cluster (e.g. AWS ECS or Kubernetes), we would attach a distributed lock (e.g., Redis Redlock or a MongoDB TTL lease document) so that only one node performs the sweep per cycle, preventing duplicate socket broadcasts.

---

### Q8: How does your refresh token rotation protect against token theft?
**Answer**:
When an access token expires (after 15 minutes), the client requests `/api/auth/refresh` with an HTTP-only cookie.
1. The server hashes the incoming refresh token with SHA-256 and compares it to `user.refreshTokenHash`.
2. If they match, a brand new access and refresh token pair is issued, and the new hash is stored.
3. **Theft Detection**: If an attacker steals a refresh token and uses it, both the legitimate user and attacker will eventually present the same token. As soon as a used token is presented again, the hashes mismatch. The server detects token reuse, immediately sets `refreshTokenHash = null` (revoking all active sessions), and forces re-authentication.

---

### Q9: Why did you choose MongoDB over a relational SQL database?
**Answer**:
Elder-care duty coordination and expense tracking involve semi-structured subdocuments:
- Custom splits vary dynamically per expense entry (array of `{ userId, amountPaise }`).
- Multi-member family teams and rotation rules map naturally to embedded documents and referenced arrays.
- MongoDB document atomicity ensures that adding an expense and its complete split breakdown occurs in a single atomic write operation without complex multi-table joins.
- At the same time, we enforced strict relational-grade integrity using Mongoose validation and compound indexes.

---

### Q10: How does the Notification Outbox pattern solve the dual-write problem when sending transactional emails?
**Answer**:
In distributed architectures, attempting to write to the database and call an external third-party API (like SendGrid or AWS SES) in the same HTTP request is known as the **dual-write problem**. If the database commit succeeds but the email API times out or fails, the user never gets notified; if the email sends first but the database rollback triggers, an email was sent for a phantom transaction.
In SaathCare:
1. When an event occurs (e.g., user registration, task assignment, password reset request), we write a record to the `NotificationOutbox` collection with `status: PENDING` in the same local database transaction or operation.
2. The HTTP request responds immediately ($\sim 20\text{ms}$) without waiting for external SMTP handshakes.
3. A background cron worker (`notificationOutbox.job.js`) polls for pending outbox items, updates their status atomically to `PROCESSING`, and dispatches them via the active `EmailProvider`.
4. If the provider fails, the worker increments `attempts` and calculates an **exponential backoff delay**:
   $$\text{delay} = \min(2^{\text{attempts}} \times 10\text{s}, 3600\text{s})$$
5. This guarantees **at-least-once delivery** and insulates our API latency from third-party outages.

---

### Q11: How does your Idempotency Middleware prevent duplicate financial charges during network retries?
**Answer**:
When a client sends `POST /api/expenses` or `POST /api/expenses/settle-up`, poor mobile connectivity may cause the client to drop connection before receiving the HTTP response, prompting the client or user to retry.
1. The client generates a unique UUID `v4` in the `X-Idempotency-Key` header and disables the submit button optimistically.
2. The `idempotencyMiddleware` attempts to reserve the key in MongoDB with `status: PENDING`:
   - If the key exists with `status: COMPLETED`, the server skips controller execution entirely and replays the cached status code and response payload with an `X-Cache: HIT` header.
   - If the key exists with `status: PENDING`, a concurrent identical request is currently executing; the server responds with `409 Conflict`.
   - If the key is new, the request proceeds through domain services.
3. Upon completion, an Express response interceptor stores the HTTP status and JSON body into `IdempotencyKey` and flips the status to `COMPLETED`.
4. Keys are automatically pruned after 24 hours using a MongoDB native TTL index (`expireAfterSeconds: 86400`).

---

### Q12: How does Node.js handle concurrency given its single-threaded event loop, and where do race conditions still occur?
**Answer**:
Node.js runs user JavaScript code on a single thread via the V8 event loop, delegating asynchronous I/O (file system, network, database queries) to the OS kernel or Libuv thread pool.
- Because JavaScript execution is non-preemptive between synchronous instructions, synchronous code blocks never experience thread context switching or shared-memory data races.
- However, **application-level race conditions** readily occur across asynchronous boundaries (`await` points). For example, between `const user = await User.findById(id)` and `await user.save()`, another request might have modified the user document.
- In SaathCare, we prevent asynchronous race conditions using:
  1. **Atomic database operators** (`$set`, `$inc`, `$push`) rather than read-modify-save patterns wherever possible.
  2. **Unique database indexes** (e.g. idempotency keys, compound indexes).
  3. **Atomic find-and-modify operations** (`findOneAndUpdate` with filter conditions).

---

### Q13: If traffic scales to millions of users, how would you migrate from in-process/MongoDB locks to Redis?
**Answer**:
While MongoDB-based locks and TTL indexes are completely sufficient for single-region, moderately loaded clusters:
1. **Distributed Locks**: We would replace our MongoDB `DistributedLock` with **Redis Redlock** (via `ioredis` / `redlock`). Redis executes in-memory with sub-millisecond latency using single-threaded atomic Lua scripts, reducing database I/O overhead.
2. **WebSocket Pub/Sub**: For real-time updates across multiple Node.js server pods behind a load balancer, we would attach the `@socket.io/redis-adapter`. When pod A emits a `family:task_updated` event, Redis Pub/Sub distributes the message to pods B and C so connected family members receive the broadcast regardless of which server instance they are connected to.
3. **Idempotency Caching**: Idempotency keys would be stored in Redis using atomic `SET NX EX` commands, removing TTL deletion load from MongoDB.

---

### Q14: How does distributed cron locking work across multi-replica container instances?
**Answer**:
When deploying 5 replicas of the SaathCare backend behind an AWS ALB or Kubernetes Ingress, standard `node-cron` timers would fire 5 times simultaneously on every pod, sending 5 duplicate emails and running 5 parallel sweeps.
In SaathCare:
1. Each server instance initializes with a unique `instanceId` (hostname + PID + random UUID).
2. Before any scheduled job executes, the worker invokes `DistributedLock.acquire(lockKey, ttlMs)`.
3. The method uses an atomic MongoDB query:
   ```javascript
   await DistributedLock.findOneAndUpdate(
     { key, $or: [{ expiresAt: { $lt: now } }, { lockedBy: instanceId }] },
     { $set: { lockedBy: instanceId, lockedAt: now, expiresAt: now + ttlMs } },
     { upsert: true, new: true }
   );
   ```
4. If another pod holds an unexpired lease, the query returns null, and the current pod skips execution cleanly without conflict.
5. In addition, an in-memory lock flag prevents task execution overlap within the same process.

---

### Q15: Why hash verification and password reset tokens in the database instead of storing raw tokens?
**Answer**:
If an attacker gains unauthorized read access to the database (via SQL/NoSQL injection, backup exposure, or internal credential leakage), plaintext tokens would allow them to reset passwords and verify accounts immediately.
In SaathCare:
1. When generating a token (e.g., for password reset or email verification), we generate high-entropy random bytes using `crypto.randomBytes(32).toString('hex')`.
2. The **raw unhashed token** is sent solely to the user via their private email address.
3. The **SHA-256 hash** of that token (`crypto.createHash('sha256').update(rawToken).digest('hex')`) is stored in the database with an expiration timestamp.
4. When the user submits the reset form, the incoming token is hashed on the fly and compared to the database record.
5. Because SHA-256 is a one-way cryptographic hash, a compromised database reveals zero usable reset tokens.

---

### Q16: How do you reconcile GDPR/DPDP "Right to Erasure" with an immutable financial ledger?
**Answer**:
Under GDPR Article 17 and India's DPDP Act, users have the right to delete their personal data. However, in shared financial applications, physically deleting ledger entries or user IDs breaks the accounting invariant:
$$\sum \text{debits} \equiv \sum \text{credits}$$
Surviving family members would find their debts altered, and audits would show unbalanceable books.
**SaathCare's Resolution**:
1. **3-Day Deletion Window**: Account deletion flags `pendingDeletion: true` with a 3-day grace period, allowing accidental or coerced deletions to be cancelled.
2. **Permanent Anonymization**: When the deletion job runs:
   - All Personally Identifiable Information (PII) is permanently scrambled: `name = "Former Member"`, `email = "former_member_{userId}@deleted.saathcare.internal"`.
   - Passwords, refresh tokens, push tokens, and phone numbers are completely purged.
   - The user is removed from all active family memberships.
3. **Ledger Preservation**: Financial ledger records created by or involving the user remain intact with the original `ObjectId`. Ledger balances, settlement calculations, and transaction histories remain mathematically valid and immutable while ensuring the user's real identity is completely erased.

---

### Q17: How are receipt attachments securely stored and served using S3 signed URLs without exposing private buckets?
**Answer**:
Storing user medical receipts and pharmacy bills in a public S3 bucket or unauthenticated directory is a major HIPAA/GDPR privacy violation.
In SaathCare:
1. **Strict Upload Quarantine**: Multer enforces memory/temporary staging with a strict 5MB limit and MIME whitelist (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`).
2. **Private Storage**: In production, files are uploaded to an AWS S3 bucket with **Public Access Blocked** and server-side encryption (`AES256`).
3. **Time-Limited Signed URLs**: When a family member requests an expense receipt, the backend verifies their family group membership and generates an S3 pre-signed GET URL via AWS SDK (`getSignedUrlPromise`) valid for only 15 minutes.
4. **Local Fallback**: In local development, the `LocalStorageProvider` serves files through an authenticated Express endpoint verifying family credentials, ensuring identical security semantics in all environments.

---

### Q18: What is the architectural difference between Kubernetes Liveness (`/health`) and Readiness (`/ready`) probes?
**Answer**:
In container orchestrators like Kubernetes or Docker Swarm:
- **Liveness Probe (`/health`)**: Answers *"Is the Node.js process alive and responsive?"* It checks only the HTTP server and event loop responsiveness. If this endpoint fails or hangs, the orchestrator terminates the container and restarts it. You should **never** check database connectivity in a liveness probe; if the database experiences a momentary failover, all server pods would simultaneously fail their liveness check and restart in a catastrophic cascading crash-loop.
- **Readiness Probe (`/ready`)**: Answers *"Is this container ready to accept external user traffic?"* It evaluates database connectivity (`mongoose.connection.readyState === 1`). If the database is disconnecting or reconnecting, `/ready` returns `503 Service Unavailable`. The load balancer stops routing traffic to that pod while keeping the container running until the database reconnects.

---

### Q19: Why are refresh tokens stored in `httpOnly`, `SameSite=lax` cookies instead of localStorage?
**Answer**:
Storing authentication tokens in `localStorage` leaves them completely vulnerable to **Cross-Site Scripting (XSS)**. Any malicious third-party script, compromised CDN dependency, or injection flaw can execute `localStorage.getItem('token')` and exfiltrate the credentials.
In SaathCare:
1. Refresh tokens are stored in an **`httpOnly` cookie**, which makes it strictly inaccessible to JavaScript via the DOM (`document.cookie` cannot read it).
2. The cookie is configured with `SameSite=lax` (or `strict` in production) and `Secure=true`, which protects against **Cross-Site Request Forgery (CSRF)** by ensuring the cookie is not attached to cross-origin subresource requests.
3. Access tokens remain short-lived (15 minutes), minimizing the blast radius if an in-memory access token were ever intercepted.

---

### Q20: How does the Service Worker and PWA architecture ensure offline resilience on erratic mobile networks?
**Answer**:
Elder caregivers often coordinate tasks and check medicines in hospitals, transit, or basements where connectivity is intermittent.
In SaathCare:
1. **Web App Manifest**: Provides native app installation prompts, app icons, and standalone display mode on Android and iOS.
2. **Service Worker Caching**: The service worker implements a **Cache-First** strategy for core static assets (HTML, CSS, JS bundles, fonts) and a **Network-First with fallback** strategy for API responses.
3. **Offline Indicators**: The client listens to `window.addEventListener('online')` and `'offline'`, rendering a clear amber banner informing the user when connection is lost.
4. **Reconnect Synchronization**: Upon receiving the `online` event, the application automatically refetches stale active views (tasks, expenses, member balances) to ensure local state reflects any changes made by other family members while offline.

---

### Q21: What is your error taxonomy and how do Correlation IDs (`X-Request-Id`) enable distributed tracing?
**Answer**:
1. **Correlation IDs**: The `requestIdMiddleware` inspects every incoming HTTP request for an `X-Request-Id` header. If absent, it generates a fresh UUID. This ID is passed to the response headers, attached to all structured log statements, and included in error payloads. When a user reports an issue, support engineers can search log aggregators (e.g. Datadog, CloudWatch) for that single ID and inspect the complete chronological request lifecycle.
2. **Error Taxonomy**: We built an object-oriented error hierarchy inheriting from `ApiError`:
   - `NotFoundError` ($404$)
   - `ValidationError` ($400$, with field-level constraint metadata)
   - `UnauthorizedError` ($401$, authentication failures)
   - `ForbiddenError` ($403$, authorization & boundary violations)
   - `ConflictError` ($409$, concurrency and idempotency collisions)
3. The centralized `errorHandlerMiddleware` catches all exceptions, suppresses internal stack traces in production, and emits a consistent envelope: `{ success: false, error: { message, code, requestId } }`.

---

### Q22: How does the frontend handle mobile reliability and offline-to-online reconnection synchronization?
**Answer**:
Mobile ergonomics and reliability are critical for elderly family care:
1. **Touch Ergonomics**: All interactive elements (buttons, inputs, bottom navigation tabs, modal actions) enforce a minimum touch target size of $44 \times 44\text{px}$ adhering to WCAG 2.1 AAA touch guidelines.
2. **Double-Submit Prevention**: All modal confirmation actions (e.g. adding an expense, completing a task, inviting a member) use optimistic button disabling and loading indicators, preventing duplicate requests while network latency is high.
3. **Client-Side Error Boundaries**: React `ErrorBoundary` wraps major routes, catching component render faults gracefully with a recovery button instead of crashing into a blank white screen.
4. **Event-Driven Resync**: The client registers window `online` listeners that trigger immediate silent REST refetches of current tasks and expenses, merging updated server truth as soon as network returns.

---

### Q23: Why decouple email delivery using the Notification Outbox pattern instead of sending emails inline in HTTP handlers?
**Answer**:
Sending emails directly within Express route handlers (e.g. calling `nodemailer.sendMail` inside `POST /invites` or `POST /register`) creates two major production vulnerabilities:
1. **HTTP Latency & Tail Times**: Connecting to external SMTP relays or third-party email APIs takes between 500ms to 5000ms. Making users wait for an email handshake slows down the perceived responsiveness of the app.
2. **The Dual-Write Problem**: If the database write succeeds but the third-party SMTP server returns an error or times out, what do you do? If you fail the HTTP request, you leave an orphaned database record. If you succeed the HTTP request, the user never receives their critical invitation or verification link.

**The Outbox Solution**:
In SaathCare, mutating actions save their primary entity and simultaneously insert a `PENDING` record into the `NotificationOutbox` collection. A background worker (`notificationOutbox.job.js`) polls records every 10 seconds, dispatches them via the active `EmailProvider`, and applies exponential backoff ($2^{\text{attempts}} \times 10\text{s}$, max 3600s) on transient network failures.

---

### Q24: How does the Financial Idempotency middleware prevent duplicate billing during network timeouts?
**Answer**:
When a sibling logs a ₹15,000 hospital deposit on an unstable cellular connection, the request might reach the backend, successfully write to the database, but time out before the HTTP response reaches the mobile browser. If the user clicks "Submit" again:
1. Without idempotency, a second duplicate ₹15,000 expense is created, corrupting ledger balances.
2. In SaathCare, the client generates a unique UUID `X-Idempotency-Key` for mutating requests.
3. `idempotencyMiddleware` attempts to atomically reserve the key in the `IdempotencyKey` collection:
   ```javascript
   await IdempotencyKey.create({ key, userId, status: 'PENDING', expiresAt });
   ```
4. If a concurrent duplicate request arrives, the unique index violation responds with `409 Conflict`.
5. Once the request succeeds, the response body and status code are cached. When the retried request arrives, the middleware recognizes the key and replays the cached response immediately with an `X-Cache: HIT` header. Keys expire automatically after 24 hours via MongoDB TTL indexes.

---

### Q25: How do you balance GDPR / DPDP "Right to be Forgotten" with immutable financial ledger auditing?
**Answer**:
This is a classic compliance vs financial integrity trade-off:
- **GDPR / DPDP Regulation**: Users have the right to request the permanent deletion of their personal identifiable information (PII).
- **Financial Audit Invariant**: If you hard-delete a user who paid for medical bills, you create orphaned records in `ExpenseLedger`, break the mathematical debt-minimization matrices, and destroy the historical audit trail for surviving siblings.

**The Solution**:
1. **3-Day Grace Period**: When a user requests account deletion, a 3-day countdown is initiated (`deletionScheduledAt = NOW + 3 days`). The user can log in and cancel the request at any time during this window.
2. **Anonymization Sweeper (`accountDeletion.job.js`)**: Once the grace period expires, the worker scrubs all PII:
   - Name is permanently updated to `"Former Member"`.
   - Email is rewritten to `former_member_{userId}@deleted.saathcare.internal`.
   - Passwords, refresh tokens, active sessions, and unread notifications are wiped.
   - The user is removed from family group member rosters.
   - **Expense ledger documents are preserved unmodified**, maintaining accurate historical totals, paise balance calculations, and transparency for the remaining family members.

