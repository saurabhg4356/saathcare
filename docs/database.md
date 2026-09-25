# SaathCare — Database Architecture & Data Dictionary

## 1. Persistence Engine
- **Primary Database**: MongoDB 7.0 / MongoDB Atlas.
- **ODM**: Mongoose 8.3+.
- **Data Integrity Model**: Strongly typed schemas with pre-save validators, compound indexes, and database-level mutation blockers for financial immutability.

---

## 2. Collections & Schemas

### `users`
Represents registered family caregivers.
```json
{
  "_id": "ObjectId",
  "name": "String (Required, Trimmed, Max 100)",
  "email": "String (Required, Unique, Lowercase, Indexed)",
  "password": "String (bcrypt work factor 12 hash)",
  "refreshTokenHash": "String (SHA-256 hash of active refresh token, null on logout)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```
*Indexes*: `{ email: 1 } (Unique)`

---

### `familygroups`
Represents an elder-care coordination team. The care recipient is not a login user.
```json
{
  "_id": "ObjectId",
  "careRecipientName": "String (Required, Trimmed, Max 100)",
  "groupName": "String (Trimmed, Max 120)",
  "createdBy": "ObjectId (Ref: User)",
  "members": ["ObjectId (Ref: User)"],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```
*Indexes*: `{ members: 1 }`, `{ createdBy: 1 }`

---

### `invites`
Cryptographically secured 7-day invitations to join a family group.
```json
{
  "_id": "ObjectId",
  "familyGroupId": "ObjectId (Ref: FamilyGroup, Indexed)",
  "email": "String (Required, Lowercase, Trimmed)",
  "token": "String (64-char hex, Unique, Indexed)",
  "status": "String (Enum: ['PENDING', 'ACCEPTED', 'EXPIRED'])",
  "invitedBy": "ObjectId (Ref: User)",
  "expiresAt": "Date (Default: now + 7 days)",
  "acceptedAt": "Date (null until accepted)",
  "createdAt": "Date"
}
```
*Indexes*: `{ token: 1 } (Unique)`, `{ familyGroupId: 1, email: 1, status: 1 }`

---

### `tasks`
Daily care duties, vitals checks, doctor appointments, and medication schedules.
```json
{
  "_id": "ObjectId",
  "familyGroupId": "ObjectId (Ref: FamilyGroup, Indexed)",
  "title": "String (Required, Max 150)",
  "description": "String (Max 1000)",
  "assigneeId": "ObjectId (Ref: User, Indexed)",
  "dueAt": "Date (Required, Indexed)",
  "status": "String (Enum: ['PENDING', 'COMPLETED', 'MISSED'])",
  "completedBy": "ObjectId (Ref: User, null until done)",
  "completedAt": "Date (null until done)",
  "createdBy": "ObjectId (Ref: User)",
  "rotationRuleId": "ObjectId (Ref: RotationRule, Optional)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```
*State Machine Transitions*:
- `PENDING` $\rightarrow$ `COMPLETED` (Permitted)
- `PENDING` $\rightarrow$ `MISSED` (Permitted)
- `COMPLETED` $\rightarrow$ `PENDING` (**Blocked by Mongoose pre-save hook**)
- `MISSED` $\rightarrow$ `PENDING` (**Blocked by Mongoose pre-save hook**)

*Indexes*: `{ familyGroupId: 1, status: 1, dueAt: 1 }`, `{ status: 1, dueAt: 1 }`

---

### `expenseledgers`
The append-only financial ledger of shared elder-care costs.
```json
{
  "_id": "ObjectId",
  "familyGroupId": "ObjectId (Ref: FamilyGroup, Indexed)",
  "paidById": "ObjectId (Ref: User, Indexed)",
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
  "originalEntryId": "ObjectId (Ref: ExpenseLedger, null for regular expenses)",
  "reversalReason": "String (Max 250, null for regular expenses)",
  "createdBy": "ObjectId (Ref: User)",
  "createdAt": "Date (Append-only: No updatedAt)"
}
```

---

## 3. Financial Invariant & Minor Unit Policy
1. **Paise Precision**: All currency amounts are stored in integer minor units (paise). ₹1,500.50 is stored as `150050`. This prevents IEEE 754 floating-point cumulative drift (e.g. `0.1 + 0.2 = 0.30000000000000004`).
2. **Exact Split Sum Invariant**:
   $$\sum_{i=1}^{k} \text{splitAmong}[i].\text{amountPaise} = \text{amountPaise}$$
   This condition is enforced both at the Zod validation layer and at the Mongoose schema validator.

---

## 4. Immutability & Reversals
To prevent ledger tampering and maintain auditability:
- Mongoose middleware blocks:
  - `updateOne`, `updateMany`, `findOneAndUpdate`, `findByIdAndUpdate`
  - `deleteOne`, `deleteMany`, `findOneAndDelete`, `findByIdAndDelete`
- To correct an error, the platform creates an offsetting entry with `isReversal: true` and `originalEntryId: [targetId]`.
- The settlement engine automatically neutralizes any original entry that has a corresponding reversal.
