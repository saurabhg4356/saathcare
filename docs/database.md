# SaathCare — Database Architecture & Data Dictionary

## 1. Persistence Engine
- **Primary Database**: MongoDB 7.0 / MongoDB Atlas.
- **ODM**: Mongoose 8.3+.
- **Integrity Principles**: Strongly typed schemas, pre-save state validation, compound indexes for family isolation, integer minor units (paise), and database-level mutation blockers for financial immutability.

---

## 2. Collections & Data Dictionary

### 2.1 `users`
Represents registered family caregivers and administrative accounts.
```json
{
  "_id": "ObjectId",
  "name": "String (Required, Trimmed, Max 100)",
  "email": "String (Required, Unique, Lowercase, Indexed)",
  "password": "String (bcrypt work factor 12 hash)",
  "refreshTokenHash": "String (SHA-256 hash of active refresh token, null on logout)",
  "isEmailVerified": "Boolean (Default: false)",
  "verificationToken": "String (SHA-256 hash, null when verified)",
  "verificationTokenExpiresAt": "Date (null when verified)",
  "resetPasswordToken": "String (SHA-256 hash, null when unused)",
  "resetPasswordExpiresAt": "Date (null when unused)",
  "hasSeenOnboarding": "Boolean (Default: false)",
  "deletionRequestedAt": "Date (null unless deletion requested)",
  "deletionScheduledAt": "Date (3-day grace period, null unless active)",
  "isDeleted": "Boolean (Default: false)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```
*Indexes*: `{ email: 1 } (Unique)`, `{ verificationToken: 1 }`, `{ resetPasswordToken: 1 }`, `{ deletionScheduledAt: 1 }`

---

### 2.2 `familygroups`
Represents a family care team coordinating elder care. The care recipient is not a login user.
```json
{
  "_id": "ObjectId",
  "name": "String (Required, Trimmed, Max 120)",
  "careRecipientName": "String (Required, Trimmed, Max 100)",
  "careRecipientAge": "Number (Optional, Integer, 1-130)",
  "careRecipientNotes": "String (Optional, Max 2000)",
  "createdBy": "ObjectId (Ref: User, Required)",
  "members": [
    {
      "userId": "ObjectId (Ref: User, Required)",
      "role": "String (Enum: ['ADMIN', 'MEMBER'], Default: 'MEMBER')",
      "joinedAt": "Date (Default: Date.now)"
    }
  ],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```
*Indexes*: `{ 'members.userId': 1 }`, `{ createdBy: 1 }`

---

### 2.3 `invites`
Cryptographically secured 7-day invitations to join a family group.
```json
{
  "_id": "ObjectId",
  "familyGroupId": "ObjectId (Ref: FamilyGroup, Indexed)",
  "email": "String (Required, Lowercase, Trimmed)",
  "token": "String (64-char hex, Unique, Indexed)",
  "role": "String (Enum: ['ADMIN', 'MEMBER'], Default: 'MEMBER')",
  "status": "String (Enum: ['PENDING', 'ACCEPTED', 'EXPIRED'])",
  "invitedBy": "ObjectId (Ref: User)",
  "expiresAt": "Date (Default: Date.now + 7 days)",
  "acceptedAt": "Date (null until accepted)",
  "createdAt": "Date"
}
```
*Indexes*: `{ token: 1 } (Unique)`, `{ familyGroupId: 1, email: 1, status: 1 }`

---

### 2.4 `tasks`
Daily care duties, vital signs checks, medication reminders, and doctor visits.
```json
{
  "_id": "ObjectId",
  "familyGroupId": "ObjectId (Ref: FamilyGroup, Indexed)",
  "title": "String (Required, Max 150)",
  "description": "String (Max 1000)",
  "assignedToUserId": "ObjectId (Ref: User, Indexed)",
  "dueDate": "Date (Required, Indexed)",
  "category": "String (Enum: ['MEDICATION', 'MEAL', 'EXERCISE', 'DOCTOR', 'HYGIENE', 'OTHER'])",
  "priority": "String (Enum: ['LOW', 'MEDIUM', 'HIGH'], Default: 'MEDIUM')",
  "status": "String (Enum: ['PENDING', 'COMPLETED', 'MISSED'], Default: 'PENDING')",
  "completedByUserId": "ObjectId (Ref: User, null until done)",
  "completedAt": "Date (null until done)",
  "createdBy": "ObjectId (Ref: User)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```
*State Machine Rules (Mongoose Pre-Save)*:
- `PENDING` $\rightarrow$ `COMPLETED` (Allowed)
- `PENDING` $\rightarrow$ `MISSED` (Allowed)
- `COMPLETED` $\rightarrow$ `PENDING` (**Rejected with error**)
- `MISSED` $\rightarrow$ `PENDING` (**Rejected with error**)

*Indexes*: `{ familyGroupId: 1, status: 1, dueDate: 1 }`, `{ status: 1, dueDate: 1 }`

---

### 2.5 `expenseledgers`
The append-only immutable financial ledger of shared elder-care costs.
```json
{
  "_id": "ObjectId",
  "familyGroupId": "ObjectId (Ref: FamilyGroup, Indexed)",
  "paidByUserId": "ObjectId (Ref: User, Indexed)",
  "amountPaise": "Number (Integer, strictly > 0)",
  "description": "String (Required, Max 250)",
  "category": "String (Enum: ['MEDICINE', 'DOCTOR', 'GROCERY', 'CAREGIVER', 'EQUIPMENT', 'OTHER'])",
  "splitType": "String (Enum: ['EQUAL', 'CUSTOM'])",
  "splitAmong": [
    {
      "userId": "ObjectId (Ref: User)",
      "amountPaise": "Number (Integer, strictly > 0)"
    }
  ],
  "isReversal": "Boolean (Default: false)",
  "originalEntryId": "ObjectId (Ref: ExpenseLedger, null for normal expenses)",
  "reversalReason": "String (Max 250, null for normal expenses)",
  "receiptUrl": "String (Optional signed URL / stream path)",
  "receiptStorageKey": "String (Optional storage key)",
  "createdBy": "ObjectId (Ref: User)",
  "createdAt": "Date (Append-only: No updatedAt)"
}
```
*Immutability Hook*: Pre-hooks abort all `updateOne`, `findOneAndUpdate`, `deleteOne`, etc.
*Indexes*: `{ familyGroupId: 1, createdAt: -1 }`, `{ originalEntryId: 1 }`

---

### 2.6 `notifications`
In-app notifications displayed in the notification drawer.
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (Ref: User, Indexed)",
  "familyGroupId": "ObjectId (Ref: FamilyGroup, Indexed)",
  "title": "String (Required, Max 150)",
  "message": "String (Required, Max 500)",
  "type": "String (Enum: ['TASK_ASSIGNED', 'TASK_COMPLETED', 'TASK_MISSED', 'EXPENSE_ADDED', 'EXPENSE_REVERSED', 'MEMBER_JOINED'])",
  "isRead": "Boolean (Default: false)",
  "createdAt": "Date (Default: Date.now)"
}
```
*Indexes*: `{ userId: 1, isRead: 1, createdAt: -1 }`

---

### 2.7 `notificationoutboxes`
Transactional email queue preventing the dual-write problem.
```json
{
  "_id": "ObjectId",
  "recipientEmail": "String (Required, Lowercase)",
  "subject": "String (Required, Max 200)",
  "template": "String (Required)",
  "contextData": "Object",
  "status": "String (Enum: ['PENDING', 'PROCESSING', 'SENT', 'FAILED'], Default: 'PENDING')",
  "attempts": "Number (Default: 0)",
  "nextAttemptAt": "Date (Default: Date.now)",
  "lastError": "String (Optional)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```
*Indexes*: `{ status: 1, nextAttemptAt: 1 }`

---

### 2.8 `idempotencykeys`
Deduplication store preventing duplicate financial charges during network retries.
```json
{
  "_id": "ObjectId",
  "key": "String (Required, Unique UUID)",
  "familyGroupId": "ObjectId (Ref: FamilyGroup, Optional)",
  "userId": "ObjectId (Ref: User, Required)",
  "requestPath": "String (Required)",
  "responseStatus": "Number",
  "responseBody": "Object",
  "createdAt": "Date (Default: Date.now, TTL: 86400s / 24 hours)"
}
```
*Indexes*: `{ key: 1 } (Unique)`, `{ createdAt: 1 } (ExpireAfterSeconds: 86400)`

---

### 2.9 `contactmessages`
Inbound inquiries from the public Contact Us form.
```json
{
  "_id": "ObjectId",
  "name": "String (Required, Max 100)",
  "email": "String (Required, Lowercase)",
  "subject": "String (Required, Max 200)",
  "message": "String (Required, Max 5000)",
  "website_url": "String (Honeypot, dropped if filled)",
  "emailSent": "Boolean (Default: false)",
  "createdAt": "Date (Default: Date.now)"
}
```
*Indexes*: `{ createdAt: -1 }`

---

### 2.10 `distributedlocks`
Lease records coordinating multi-instance cron job execution.
```json
{
  "_id": "ObjectId",
  "lockName": "String (Required, Unique)",
  "ownerId": "String (Required)",
  "acquiredAt": "Date (Default: Date.now)",
  "expiresAt": "Date (Required, Indexed TTL)"
}
```
*Indexes*: `{ lockName: 1 } (Unique)`, `{ expiresAt: 1 } (ExpireAfterSeconds: 0)`

---

### 2.11 `rotationrules`
Recurring duty rotation schedules.
```json
{
  "_id": "ObjectId",
  "familyGroupId": "ObjectId (Ref: FamilyGroup, Required)",
  "ruleName": "String (Required)",
  "dutyType": "String (Required)",
  "memberRotationOrder": ["ObjectId (Ref: User)"],
  "currentMemberIndex": "Number (Default: 0)",
  "frequencyDays": "Number (Default: 1)",
  "nextRunDate": "Date"
}
```

---

## 3. Financial Invariant & Minor Unit Policy

1. **Paise Precision**: All currency amounts are stored in integer minor units (paise). ₹1,500.50 is stored as `150050`. This prevents binary floating-point drift (`0.1 + 0.2 === 0.30000000000000004`).
2. **Exact Split Sum Invariant**:
   $$\sum_{i=1}^{k} \text{splitAmong}[i].\text{amountPaise} = \text{amountPaise}$$
   This condition is strictly enforced at both the Zod validation layer and Mongoose schema pre-validation.

---

## 4. Immutability & Reversals Policy

To prevent ledger tampering and maintain absolute financial transparency:
- Mongoose middleware blocks:
  - `updateOne`, `updateMany`, `findOneAndUpdate`, `findByIdAndUpdate`
  - `deleteOne`, `deleteMany`, `findOneAndDelete`, `findByIdAndDelete`
- Erroneous entries are corrected via offsetting reversal records (`isReversal: true`, `originalEntryId: targetId`).
- The settlement engine automatically neutralizes any original entry that has a corresponding reversal.
