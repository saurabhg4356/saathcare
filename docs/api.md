# SaathCare — REST API Specification

All API endpoints return a standardized envelope structure:

**Success Response Envelope (`2xx`):**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "meta": { ... } // optional pagination
}
```

**Error Response Envelope (`4xx / 5xx`):**
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Descriptive error message",
    "details": [ ... ] // optional field-level validation errors
  }
}
```

---

## 1. System Health

### `GET /health`
- **Auth**: Public
- **Description**: Verifies liveness, database connection state, uptime, and memory usage.
- **Response `200`**:
  ```json
  {
    "success": true,
    "message": "System is healthy",
    "data": {
      "status": "ok",
      "uptime": 124.5,
      "timestamp": "2026-09-25T14:00:00.000Z",
      "database": {
        "status": "connected",
        "host": "cluster0.mongodb.net"
      },
      "system": {
        "nodeVersion": "v20.x",
        "memoryUsageMB": { "heapUsed": 45, "heapTotal": 72 }
      }
    }
  }
  ```

---

## 2. Authentication (`/api/auth`)

### `POST /api/auth/register`
- **Auth**: Public
- **Rate Limit**: 20 requests / 15 minutes
- **Body**:
  ```json
  {
    "name": "Priya Sharma",
    "email": "priya.sharma@example.com",
    "password": "StrongPassword123"
  }
  ```
- **Response `201`**:
  Sets HTTP-only `refreshToken` cookie.
  ```json
  {
    "success": true,
    "message": "Account registered successfully",
    "data": {
      "user": {
        "_id": "6602e1...",
        "name": "Priya Sharma",
        "email": "priya.sharma@example.com",
        "createdAt": "..."
      },
      "accessToken": "eyJhbGciOi..."
    }
  }
  ```

### `POST /api/auth/login`
- **Auth**: Public
- **Rate Limit**: 20 requests / 15 minutes
- **Body**:
  ```json
  {
    "email": "priya.sharma@example.com",
    "password": "StrongPassword123"
  }
  ```
- **Response `200`**: Returns new `accessToken` and sets HTTP-only `refreshToken` cookie.

### `POST /api/auth/refresh`
- **Auth**: Public (Requires `refreshToken` cookie or body)
- **Description**: Rotates refresh token, detects token reuse, issues new access token.
- **Response `200`**: `{ "accessToken": "..." }`

### `POST /api/auth/logout`
- **Auth**: Bearer Token
- **Description**: Invalidates stored refresh token hash, clears cookie.
- **Response `200`**: `{ "message": "Logged out successfully" }`

### `GET /api/auth/me`
- **Auth**: Bearer Token
- **Response `200`**: Returns current authenticated user profile.

---

## 3. Family Groups & Invitations (`/api/family-groups`)

### `POST /api/family-groups`
- **Auth**: Bearer Token
- **Body**:
  ```json
  {
    "careRecipientName": "Dad (Shri Ramesh Sharma)",
    "groupName": "Sharma Family Care Team"
  }
  ```
- **Response `201`**: Returns newly created family group with creator in `members`.

### `GET /api/family-groups`
- **Auth**: Bearer Token
- **Response `200`**: Returns array of family groups the authenticated user belongs to.

### `GET /api/family-groups/:familyGroupId`
- **Auth**: Bearer Token + `familyMembershipMiddleware`
- **Response `200`**: Returns single family group details and member roster.

### `POST /api/family-groups/:familyGroupId/invites`
- **Auth**: Bearer Token + `familyMembershipMiddleware`
- **Body**: `{ "email": "brother.rohit@example.com" }`
- **Response `201`**: Generates 64-character token valid for 7 days, dispatches email.

### `GET /api/family-groups/:familyGroupId/invites`
- **Auth**: Bearer Token + `familyMembershipMiddleware`
- **Response `200`**: Lists pending unexpired invitations for the care team.

### `GET /api/family-groups/invites/:token`
- **Auth**: Public
- **Description**: Public preview of invite metadata before onboarding.

### `POST /api/family-groups/invites/:token/accept`
- **Auth**: Bearer Token
- **Description**: Joins family group. Emits `member:joined` to family socket room.

---

## 4. Care Duties & Tasks (`/api/tasks`)

### `POST /api/tasks/:familyGroupId`
- **Auth**: Bearer Token + `familyMembershipMiddleware`
- **Body**:
  ```json
  {
    "title": "Morning Insulin & Blood Sugar Reading",
    "description": "Administer 10 units Lantus before breakfast",
    "assigneeId": "6602e1...",
    "dueAt": "2026-09-26T08:30:00.000Z"
  }
  ```
- **Response `201`**: Returns created task. Emits `task:created` via Socket.io.

### `GET /api/tasks/:familyGroupId`
- **Auth**: Bearer Token + `familyMembershipMiddleware`
- **Query Params**: `status` (`PENDING`, `COMPLETED`, `MISSED`), `assigneeId`, `page`, `limit`.
- **Response `200`**: Returns paginated tasks.

### `PATCH /api/tasks/:familyGroupId/:taskId/complete`
- **Auth**: Bearer Token + `familyMembershipMiddleware`
- **Description**: Marks task as COMPLETED. Enforces state transitions. Emits `task:completed` to family room.

---

## 5. Expense Ledger & Settlements (`/api/expenses`)

### `POST /api/expenses/:familyGroupId`
- **Auth**: Bearer Token + `familyMembershipMiddleware`
- **Equal Split Body**:
  ```json
  {
    "amountPaise": 300000,
    "description": "Monthly Attendant Caregiver Salary",
    "category": "CAREGIVER",
    "splitType": "EQUAL",
    "participantIds": ["6602e1...", "6602e2...", "6602e3..."]
  }
  ```
- **Custom Split Body**:
  ```json
  {
    "amountPaise": 300000,
    "description": "MRI & Neurologist Consultation",
    "category": "DOCTOR",
    "splitType": "CUSTOM",
    "customSplits": [
      { "userId": "6602e1...", "amountPaise": 150000 },
      { "userId": "6602e2...", "amountPaise": 100000 },
      { "userId": "6602e3...", "amountPaise": 50000 }
    ]
  }
  ```
- **Response `201`**: Returns ledger entry. Emits `expense:added` via Socket.io.

### `POST /api/expenses/:familyGroupId/:expenseId/reverse`
- **Auth**: Bearer Token + `familyMembershipMiddleware`
- **Body**: `{ "reason": "Pharmacist refunded duplicate bill" }`
- **Response `201`**: Appends offsetting reversal entry. Emits `expense:reversed`.

### `GET /api/expenses/:familyGroupId`
- **Auth**: Bearer Token + `familyMembershipMiddleware`
- **Response `200`**: Paginated chronological immutable financial records.

### `GET /api/expenses/:familyGroupId/settlements`
- **Auth**: Bearer Token + `familyMembershipMiddleware`
- **Response `200`**:
  ```json
  {
    "success": true,
    "data": {
      "balances": [
        { "userId": "6602e1...", "paidPaise": 300000, "owedPaise": 100000, "netPaise": 200000 },
        { "userId": "6602e2...", "paidPaise": 0, "owedPaise": 100000, "netPaise": -100000 },
        { "userId": "6602e3...", "paidPaise": 0, "owedPaise": 100000, "netPaise": -100000 }
      ],
      "settlements": [
        {
          "from": "6602e2...",
          "to": "6602e1...",
          "amountPaise": 100000,
          "fromUser": { "name": "Rohit" },
          "toUser": { "name": "Priya" }
        },
        {
          "from": "6602e3...",
          "to": "6602e1...",
          "amountPaise": 100000,
          "fromUser": { "name": "Amit" },
          "toUser": { "name": "Priya" }
        }
      ]
    }
  }
  ```
