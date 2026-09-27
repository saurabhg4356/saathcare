# SaathCare — REST API Specification

All API endpoints return a standardized JSON envelope structure:

**Success Response Envelope (`2xx`):**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "meta": { ... } // optional pagination metadata
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

## 1. System Health & Probes

### `GET /health`
- **Auth**: Public
- **Description**: Liveness probe returning process health, system uptime, and memory usage.
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "System is healthy",
    "data": {
      "status": "ok",
      "uptime": 124.5,
      "timestamp": "2026-09-27T10:00:00.000Z",
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

### `GET /ready`
- **Auth**: Public
- **Description**: Readiness probe verifying active database connection (`mongoose.connection.readyState === 1`).
- **Response `200 OK`** (Ready):
  ```json
  {
    "success": true,
    "message": "Service is ready to handle traffic",
    "data": {
      "status": "ready",
      "timestamp": "2026-09-27T10:00:00.000Z",
      "database": "connected"
    }
  }
  ```
- **Response `503 Service Unavailable`** (Not Ready):
  ```json
  {
    "success": false,
    "error": {
      "code": "SERVICE_UNAVAILABLE",
      "message": "Database not connected. Service unavailable"
    }
  }
  ```

---

## 2. Authentication & Identity (`/api/auth`)

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
- **Response `201 Created`**: Returns user profile and access token; sets HTTP-only `refreshToken` cookie.

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
- **Response `200 OK`**: Sets HTTP-only `refreshToken` cookie and returns new `accessToken`.

### `POST /api/auth/refresh`
- **Auth**: Public (Requires HTTP-only `refreshToken` cookie or body)
- **Description**: Rotates refresh token, invalidates old SHA-256 hash, issues new access token.
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOi..."
    }
  }
  ```

### `POST /api/auth/logout`
- **Auth**: Bearer Token
- **Description**: Clears refresh token hash in DB and clears the HTTP-only cookie.
- **Response `200 OK`**: `{ "message": "Logged out successfully" }`

### `GET /api/auth/me`
- **Auth**: Bearer Token
- **Response `200 OK`**: Returns current authenticated user record with email verification and onboarding flags.

### `GET /api/auth/verify-email/:token`
- **Auth**: Public
- **Description**: Verifies user's email address by matching SHA-256 hash of token.
- **Response `200 OK`**: `{ "message": "Email verified successfully" }`

### `POST /api/auth/resend-verification`
- **Auth**: Public
- **Rate Limit**: 20 requests / 15 minutes
- **Body**: `{ "email": "priya.sharma@example.com" }`
- **Response `200 OK`**: `{ "message": "If this account exists, a verification link has been sent" }`

### `POST /api/auth/forgot-password`
- **Auth**: Public
- **Rate Limit**: 20 requests / 15 minutes
- **Body**: `{ "email": "priya.sharma@example.com" }`
- **Response `200 OK`**: Dispatches password reset link via Notification Outbox.

### `POST /api/auth/reset-password/:token`
- **Auth**: Public
- **Rate Limit**: 20 requests / 15 minutes
- **Body**: `{ "password": "NewStrongPassword123" }`
- **Response `200 OK`**: `{ "message": "Password reset successfully. Please log in with your new password" }`

### `POST /api/auth/request-deletion`
- **Auth**: Bearer Token
- **Description**: Initiates 3-day deletion grace period.
- **Response `200 OK`**: Returns scheduled deletion timestamp.

### `POST /api/auth/cancel-deletion`
- **Auth**: Bearer Token
- **Description**: Cancels pending deletion during the 3-day grace period.
- **Response `200 OK`**: `{ "message": "Account deletion cancelled successfully" }`

### `PATCH /api/auth/onboarding`
- **Auth**: Bearer Token
- **Description**: Marks interactive onboarding tour as completed (`hasSeenOnboarding: true`).
- **Response `200 OK`**: Returns updated user profile.

---

## 3. Family Groups & Invitations (`/api/family-groups`)

### `POST /api/family-groups`
- **Auth**: Bearer Token
- **Body**:
  ```json
  {
    "name": "Sharma Family Care Team",
    "careRecipientName": "Dad (Shri Ramesh Sharma)",
    "careRecipientAge": 76,
    "careRecipientNotes": "Hypertension, diabetic diet, daily BP checks"
  }
  ```
- **Response `201 Created`**: Returns newly created group.

### `GET /api/family-groups`
- **Auth**: Bearer Token
- **Response `200 OK`**: Returns array of family groups the user belongs to.

### `GET /api/family-groups/:familyGroupId`
- **Auth**: Bearer Token + `familyMembershipMiddleware`
- **Response `200 OK`**: Returns group metadata and populated member roster.

### `PATCH /api/family-groups/:familyGroupId/care-info`
- **Auth**: Bearer Token + `familyMembershipMiddleware`
- **Body**:
  ```json
  {
    "careRecipientName": "Shri Ramesh Sharma",
    "careRecipientAge": 77,
    "careRecipientNotes": "Updated insulin dosage: 12 units"
  }
  ```
- **Response `200 OK`**: Returns updated family group document.

### `POST /api/family-groups/:familyGroupId/invites`
- **Auth**: Bearer Token + `familyMembershipMiddleware`
- **Headers**: Optional `Idempotency-Key`
- **Body**: `{ "email": "brother.rohit@example.com", "role": "MEMBER" }`
- **Response `201 Created`**: Returns invitation metadata; queues invite email.

### `GET /api/family-groups/:familyGroupId/invites`
- **Auth**: Bearer Token + `familyMembershipMiddleware`
- **Response `200 OK`**: Returns pending unexpired invitations.

### `GET /api/family-groups/invites/:token`
- **Auth**: Public
- **Description**: Returns preview of family group name and care recipient without requiring authentication.

### `POST /api/family-groups/invites/:token/accept`
- **Auth**: Bearer Token
- **Description**: Joins the family group. Emits `member:joined` over Socket.io.

---

## 4. Care Duties & Tasks (`/api/tasks`)

### `POST /api/tasks/:familyGroupId`
- **Auth**: Bearer Token + `familyMembershipMiddleware`
- **Headers**: Optional `Idempotency-Key`
- **Body**:
  ```json
  {
    "title": "Morning Insulin & Blood Sugar Check",
    "description": "Administer 12 units Lantus before breakfast",
    "assignedToUserId": "6602e1...",
    "dueDate": "2026-09-28T08:30:00.000Z",
    "category": "MEDICATION",
    "priority": "HIGH"
  }
  ```
- **Response `201 Created`**: Returns created task document. Emits `task:created`.

### `GET /api/tasks/:familyGroupId`
- **Auth**: Bearer Token + `familyMembershipMiddleware`
- **Query Params**: `status` (`PENDING`, `COMPLETED`, `MISSED`), `assigneeId`, `page`, `limit`.
- **Response `200 OK`**: Returns task array for the family.

### `GET /api/tasks/:familyGroupId/:taskId`
- **Auth**: Bearer Token + `familyMembershipMiddleware`
- **Response `200 OK`**: Returns single task details.

### `PATCH /api/tasks/:familyGroupId/:taskId/complete`
- **Auth**: Bearer Token + `familyMembershipMiddleware`
- **Headers**: Optional `Idempotency-Key`
- **Description**: Transitions task status to `COMPLETED`. Emits `task:completed`.
- **Response `200 OK`**: Returns updated task.

---

## 5. Expense Ledger & Settlements (`/api/expenses`)

### `POST /api/expenses/:familyGroupId`
- **Auth**: Bearer Token + `familyMembershipMiddleware`
- **Headers**: Optional `Idempotency-Key`
- **Equal Split Body**:
  ```json
  {
    "amountPaise": 300000,
    "description": "Monthly Attendant Salary",
    "category": "CAREGIVER",
    "splitType": "EQUAL",
    "splitAmong": [
      { "userId": "6602e1...", "amountPaise": 100000 },
      { "userId": "6602e2...", "amountPaise": 100000 },
      { "userId": "6602e3...", "amountPaise": 100000 }
    ],
    "receiptUrl": "/api/expenses/receipts/rec-1234.pdf",
    "receiptStorageKey": "rec-1234.pdf"
  }
  ```
- **Response `201 Created`**: Appends immutable ledger record. Emits `expense:added`.

### `POST /api/expenses/:familyGroupId/upload-receipt`
- **Auth**: Bearer Token + `familyMembershipMiddleware`
- **Form Data**: `receipt` (File: JPEG, PNG, WebP, PDF $\le 5\text{MB}$)
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "data": {
      "storageKey": "rec-1727438400000.png",
      "receiptUrl": "/api/expenses/receipts/rec-1727438400000.png",
      "fileSize": 245120,
      "mimeType": "image/png"
    }
  }
  ```

### `GET /api/expenses/:familyGroupId/:expenseId/receipt-url`
- **Auth**: Bearer Token + `familyMembershipMiddleware`
- **Description**: Returns time-limited signed URL or streaming URL for bill verification.
- **Response `200 OK`**: `{ "signedUrl": "..." }`

### `GET /api/expenses/receipts/:key`
- **Auth**: Bearer Token
- **Description**: Authenticated receipt file stream from local storage provider.

### `GET /api/expenses/:familyGroupId`
- **Auth**: Bearer Token + `familyMembershipMiddleware`
- **Response `200 OK`**: Returns chronological immutable ledger entries.

### `POST /api/expenses/:familyGroupId/:expenseId/reverse`
- **Auth**: Bearer Token + `familyMembershipMiddleware`
- **Body**: `{ "reason": "Pharmacist refunded duplicate bill" }`
- **Response `201 Created`**: Appends offsetting reversal record. Emits `expense:reversed`.

### `GET /api/expenses/:familyGroupId/settlements`
- **Auth**: Bearer Token + `familyMembershipMiddleware`
- **Response `200 OK`**:
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

---

## 6. Public Inquiries (`/api/contact`)

### `POST /api/contact`
- **Auth**: Public
- **Rate Limit**: 5 submissions / 15 minutes
- **Body**:
  ```json
  {
    "name": "Saurabh Gupta",
    "email": "user@example.com",
    "subject": "Question about multi-sibling ledger setup",
    "message": "Hello, we need help configuring custom splits.",
    "website_url": ""
  }
  ```
- **Response `201 Created`**: Saves message in MongoDB and queues acknowledgment email.

---

## 7. Real-Time System Statistics (`/api/stats`)

### `GET /api/stats`
- **Auth**: Public
- **Description**: Returns platform aggregated usage statistics. Results are cached in memory for 15 minutes.
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "activeFamilies": 142,
      "totalCaregivers": 380,
      "completedDuties": 12840,
      "totalExpensesPaise": 485000000
    }
  }
  ```

---

## 8. In-App Notifications (`/api/notifications`)

### `GET /api/notifications`
- **Auth**: Bearer Token
- **Response `200 OK`**: Returns user's in-app notification array and unread count.

### `PATCH /api/notifications/:id/read`
- **Auth**: Bearer Token
- **Description**: Marks a single notification as read.
- **Response `200 OK`**: Returns updated notification document.

### `PATCH /api/notifications/read-all`
- **Auth**: Bearer Token
- **Description**: Marks all unread notifications for the user as read.
- **Response `200 OK`**: `{ "message": "All notifications marked as read" }`
