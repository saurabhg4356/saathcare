# SaathCare — Security Architecture & Threat Mitigation

## 1. Threat Mitigation Matrix

| Security Threat | Attack Vector | Architecture Mitigation |
|---|---|---|
| **Cross-Tenant Data Leak** | Malicious user guesses/substitutes another `familyGroupId` in URL | `familyMembershipMiddleware` queries database to ensure caller belongs to `members` before executing any controller or service |
| **XSS Token Theft** | Malicious script in browser attempts to read authentication tokens | Refresh tokens stored in `HttpOnly`, `Secure` (in prod), `SameSite=Lax/Strict` cookies; unreadable by JavaScript |
| **Token Theft & Replay** | Attacker intercepts refresh token | Refresh Token Rotation: every refresh cycle invalidates the existing SHA-256 hash; token reuse revokes all active sessions |
| **Financial Ledger Tampering** | Attacker calls `DELETE /expenses/:id` or malicious update | Append-only ledger: Mongoose pre-hooks throw fatal exceptions on all update/delete commands; corrections require signed reversal records |
| **Floating-Point Rounding Exploitation** | Accumulating fractions of cents/paise across splits | Monetary amounts stored as integer paise with sum equality validation: $\sum \text{splits} = \text{total}$ |
| **Brute-Force Credential Stuffing** | Automated credential guessing on `/api/auth/login` | `authLimiter`: 20 requests per 15 minutes per IP; bcrypt with salt work factor 12 (computationally expensive) |
| **Socket Room Snooping** | Unauthenticated socket attempts to join `family:<id>` room | Handshake JWT verification + database membership check before allowing `socket.join(room)` |
| **Sensitive Data Exposure in Logs** | Password, tokens, or JWTs logged to stdout/disk | Structured logger sanitizes all sensitive keys (`password`, `token`, `secret`, `authorization`) with `***REDACTED***` |

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
Set Refresh Token in HttpOnly Cookie
Return Access Token in JSON response
```

### Refresh Token Rotation Algorithm
1. Client makes request to `/api/auth/refresh` sending the HTTP-only refresh cookie.
2. Server verifies cryptographic signature with `JWT_REFRESH_SECRET`.
3. Server queries `User.findById(payload.userId)`.
4. Server hashes received token: `hashToken(receivedToken)` and compares with `user.refreshTokenHash`.
5. **Reuse Detection**: If the hashes do NOT match, a previously rotated token was reused! The server sets `user.refreshTokenHash = null` (revoking all sessions) and rejects with `403 Forbidden`.
6. If hashes match: Server issues a **NEW Access Token** and a **NEW Refresh Token**, updates `user.refreshTokenHash`, and sets the new cookie.

---

## 3. Data Isolation Guarantee (`familyMembershipMiddleware`)
Every family-scoped route enforces:
```javascript
const isMember = await FamilyGroup.exists({
  _id: familyGroupId,
  members: req.user._id
});
if (!isMember) {
  throw ApiError.forbidden('Access denied: You do not belong to this family group');
}
```
No user can query, create, or modify tasks, expenses, invites, or settlements for a family group they do not belong to.
