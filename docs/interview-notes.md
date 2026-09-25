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
