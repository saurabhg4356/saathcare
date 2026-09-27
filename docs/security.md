# SaathCare — Security Architecture & Threat Mitigation

## 1. Threat Mitigation Matrix

| Security Threat | Attack Vector | Architectural Mitigation |
|---|---|---|
| **Cross-Tenant Data Leak** | Malicious user guesses or substitutes another `familyGroupId` in URL | `familyMembershipMiddleware` queries database to ensure caller belongs to `FamilyGroup.members` before executing any controller or service |
| **XSS Token Theft** | Malicious script in browser attempts to read authentication tokens | Refresh tokens stored in `HttpOnly`, `Secure` (in prod), `SameSite=none` cookies; completely unreadable by JavaScript |
| **Token Theft & Replay** | Attacker intercepts refresh token | **Refresh Token Rotation**: Every refresh cycle invalidates the existing SHA-256 hash in DB; token reuse immediately revokes all active sessions |
| **Financial Ledger Tampering** | Attacker calls `DELETE /expenses/:id` or malicious update | **Append-Only Ledger**: Mongoose pre-hooks throw fatal exceptions on all update/delete commands; corrections require signed reversal records |
| **Floating-Point Rounding Exploitation** | Accumulating fractions of cents/paise across splits | Monetary amounts stored as integer paise with sum equality validation: $\sum \text{splits} = \text{total}$ |
| **Brute-Force Credential Stuffing** | Automated credential guessing on `/api/auth/login` | `authLimiter`: 20 requests per 15 minutes per IP; bcrypt with salt work factor 12 |
| **Socket Room Snooping** | Unauthenticated socket attempts to join `family:<id>` room | Handshake JWT verification + database membership check before allowing `socket.join(room)` |
| **Sensitive Data Exposure in Logs** | Passwords, tokens, or JWTs logged to stdout/disk | Structured logger sanitizes all sensitive keys (`password`, `token`, `secret`, `authorization`) with `***REDACTED***` |
| **Duplicate Financial Billing** | Network timeouts or double-clicks during expense creation | `idempotencyMiddleware`: Atomically reserves `X-Idempotency-Key` in MongoDB; replays cached responses on retry (`X-Cache: HIT`) |
| **Malicious File Uploads** | Malicious executable uploaded as medical bill | Multer strictly whitelists MIME types (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`) and enforces 5MB limit |
| **Private Bill Exposure** | Unauthenticated users accessing medical scan receipts | Storage provider vends time-limited signed URLs or streams receipts only through authenticated endpoints |
| **Spam / Bot Inquiries** | Automated scripts spamming Contact Us endpoint | Honeypot field `website_url` silently drops bot traffic without DB write; protected by `contactLimiter` (5 reqs/15m) |
| **User Enumeration** | Attacker checks which emails are registered | All password reset, email verification, and auth endpoints return identical generic responses |
| **GDPR Audit Inconsistency** | User deletion corrupts shared financial ledger | 3-day grace period; anonymization scrubs PII to `"Former Member"` while preserving historical immutable ledger balance |

---

## 2. Authentication Flow & Token Lifecycle

```
[Register / Login]
       ↓
Verify Credentials (bcrypt.compare)
       ↓
Generate short-lived Access Token (15 min)
Generate long-lived Refresh Token (7 days)
       ↓
Hash Refresh Token with SHA-256 → Store hash in User.refreshTokenHash
       ↓
Set Refresh Token in HttpOnly, Secure, SameSite=none Cookie
Return Access Token in JSON response
```

### Refresh Token Rotation Algorithm
1. Client makes request to `/api/auth/refresh` sending the HTTP-only refresh cookie.
2. Server verifies cryptographic signature with `JWT_REFRESH_SECRET`.
3. Server queries `User.findById(payload.userId)`.
4. Server hashes received token (`sha256(receivedToken)`) and compares with `user.refreshTokenHash`.
5. **Reuse Detection**: If the hashes do NOT match, a previously rotated token was reused. The server immediately sets `user.refreshTokenHash = null` (revoking all sessions) and rejects with `403 Forbidden`.
6. If hashes match: Server issues a **NEW Access Token** and a **NEW Refresh Token**, updates `user.refreshTokenHash`, and sets the new cookie.

---

## 3. Cryptographic Token Hashing (Email Verification & Password Reset)

Tokens sent via email (email verification and password reset) are **never** stored in plain text in the database:

1. A cryptographically random 32-byte hex token is generated:
   ```javascript
   const rawToken = crypto.randomBytes(32).toString('hex');
   ```
2. The raw token is sent to the user's email address in the link.
3. The SHA-256 hash of the token is saved in the database:
   ```javascript
   const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
   user.verificationToken = tokenHash;
   user.verificationTokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000;
   ```
4. When the user clicks the link, the incoming token is hashed with SHA-256 and matched against the database hash. Even with a full database dump, an attacker cannot forge verification or reset links.

---

## 4. Cross-Domain Production Cookie Security

In production, the React frontend is served from Vercel Edge (`https://saathcare.vercel.app`) while the Express API runs on Render (`https://saathcare-server.onrender.com`).

Because the frontend and backend reside on different domains:
- `SameSite` must be set to `none`.
- `Secure` must be set to `true` (HTTPS only).
- `cors` must explicitly permit credentials with `credentials: true`.
- Wildcard `Access-Control-Allow-Origin: *` is strictly forbidden and disabled.

---

## 5. Multi-Tenant Family Isolation Guarantee

Every family-scoped route enforces `familyMembershipMiddleware`:
```javascript
const isMember = await FamilyGroup.exists({
  _id: familyGroupId,
  members: req.user._id
});
if (!isMember) {
  throw ApiError.forbidden('Access denied: You do not belong to this family group');
}
```
No user can query, create, or modify tasks, expenses, invites, or settlements for any family group they do not belong to.
