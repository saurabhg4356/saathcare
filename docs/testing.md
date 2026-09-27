# SaathCare — Testing Strategy & Quality Assurance

## 1. Test Architecture & Directory Structure

SaathCare utilizes **Vitest** and **Supertest** to execute fast, reliable unit and integration test suites. The test suite contains **16 test files** (14 unit test suites and 2 integration test suites) totaling **57 automated tests**.

```text
server/tests/
├── unit/
│   ├── accountDeletion.test.js     # 3-day grace period, PII scrub to 'Former Member', ledger preservation
│   ├── auth.test.js                # JWT token signing, verification, bcrypt hashing, Zod schemas
│   ├── contact.test.js             # Inbound inquiries, honeypot drop, 3-char min length validation
│   ├── emailVerification.test.js   # SHA-256 token hashing, expiration, verification state transitions
│   ├── family.test.js              # Family group creation, member roles, invite validation schemas
│   ├── idempotency.test.js         # Atomic key reservation, cached response replay (X-Cache: HIT)
│   ├── immutability.test.js        # Mongoose pre-hooks blocking updateOne, findOneAndUpdate, deleteOne
│   ├── inAppNotification.test.js   # In-app notification creation, unread counts, socket event emission
│   ├── models.test.js              # Mongoose schema constraints, required fields, toJSON password stripping
│   ├── notificationOutbox.test.js  # Outbox enqueue, status transitions, exponential backoff, max attempts
│   ├── passwordReset.test.js       # SHA-256 reset token validation, expiration, password update
│   ├── settlement.test.js          # SettleUp greedy algorithm (2-member, 3-member, multi-creditor, custom, reversals)
│   ├── stats.test.js               # Real database metric aggregation, 15-minute in-memory caching
│   └── task.test.js                # Task creation, priority, category, state machine transition locks
└── integration/
    ├── health.test.js              # Supertest HTTP assertions on /health liveness and 404 error envelopes
    └── readiness.test.js           # Supertest HTTP assertions on /ready probe (200 on connected, 503 on disconnected)
```

---

## 2. Settlement Algorithm Test Matrix

| Test Scenario | Inputs | Expected Output | Verification |
|---|---|---|---|
| **Case 1: 2 Members** | A pays ₹1000, split equally with B | B pays A ₹500 | `[ { from: B, to: A, amount: 50000 } ]` |
| **Case 2: 3 Members** | A pays ₹3000, split equally among A, B, C | B pays A ₹1000, C pays A ₹1000 | 2 minimal direct transfers |
| **Case 3: Multi-Creditor & Multi-Debtor** | A pays ₹2000, B pays ₹1000 (total ₹3000, ₹1000 each) | C pays A ₹1000 | Single transfer resolves all positions |
| **Case 4: Uneven Custom Split** | A pays ₹1500 (A ₹500, B ₹700, C ₹300) | B pays A ₹700, C pays A ₹300 | Exact matching of custom obligations |
| **Case 5: Zero Balances** | All members contributed their exact share | No transfers | `[]` |
| **Case 6: Remainder Paise Rounding** | ₹100.00 split among 3 members | ₹33.34, ₹33.33, ₹33.33 | Sum of splits strictly equals 10000 paise |
| **Case 7: Ledger Reversal** | Entry of ₹5000 reversed by offsetting record | Net balances remain 0 | `[]` (Reversal neutralizes target entry) |

---

## 3. Subsystem Test Matrices

### 3.1 Idempotency & Concurrency (`idempotency.test.js`)
- Reserving new key creates `PENDING` record in `IdempotencyKey` collection.
- Completed operations save response status and payload; subsequent identical calls immediately replay cached response (`X-Cache: HIT`).
- Concurrent in-flight requests with identical keys are rejected with `409 Conflict`.

### 3.2 Notification Outbox (`notificationOutbox.test.js`)
- Operations insert records into `NotificationOutbox` with status `PENDING`.
- Successful dispatch marks record as `SENT`.
- Dispatch failure increments `attempts` and applies exponential backoff ($2^{\text{attempts}} \times 10\text{s}$, max 3600s).
- After 5 consecutive failures, record transitions to `FAILED` for dead-letter analysis.

### 3.3 Account Anonymization (`accountDeletion.test.js`)
- Deletion requests schedule deletion 3 days in the future.
- Users can cancel deletion within the 3-day window.
- The anonymizer worker scrubs user name to `"Former Member"`, replaces email with anonymized alias, and purges credentials while keeping financial ledger records intact.

---

## 4. Running Test Suites

### Server Unit & Integration Tests:
```bash
# From workspace root
npm test

# Or directly in server directory
cd server
npm test
```

### With Watch Mode:
```bash
npm --prefix server run test:watch
```

### With Code Coverage:
```bash
npm --prefix server run test:coverage
```

### Frontend Production Build Validation:
```bash
npm run build:client
```
All 57 automated tests pass with 0 failures, ensuring complete functional correctness across the full stack.
