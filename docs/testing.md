# SaathCare — Testing Strategy & Quality Assurance

## 1. Test Architecture
SaathCare utilizes **Vitest** and **Supertest** to execute ultra-fast unit and integration test suites.

```
server/tests/
├── unit/
│   ├── models.test.js          # Mongoose schema constraints, required fields, toJSON sanitization
│   ├── auth.test.js            # JWT signing, refresh token hashing, Zod auth schema validation
│   ├── family.test.js          # Family group creation & invite validation schemas
│   ├── task.test.js            # Task creation, query parameters, state machine transition rules
│   ├── settlement.test.js      # Greedy algorithm: 2-member, 3-member, multi-creditor/debtor, custom split, reversals
│   └── immutability.test.js    # Database-level mutation blockers on ExpenseLedger (updateOne, deleteOne, etc.)
└── integration/
    └── health.test.js          # Supertest HTTP assertions for /health and 404 error envelopes
```

---

## 2. Settlement Algorithm Test Matrix

| Test Scenario | Inputs | Expected Output | Verification |
|---|---|---|---|
| **Case 1: 2 Members** | A pays ₹1000, split equally with B | B pays A ₹500 | `[ { from: B, to: A, amount: 50000 } ]` |
| **Case 2: 3 Members** | A pays ₹3000, split equally among A, B, C | B pays A ₹1000, C pays A ₹1000 | 2 minimal transfers instead of circular splits |
| **Case 3: Multi-Creditor & Multi-Debtor** | A pays ₹2000, B pays ₹1000 (total ₹3000, ₹1000 each) | C pays A ₹1000 | Single direct transfer |
| **Case 4: Uneven Split** | A pays ₹1500 (A ₹500, B ₹700, C ₹300) | B pays A ₹700, C pays A ₹300 | 2 transfers resolving all balances |
| **Case 5: Zero Balance** | All members contributed their exact share | No transfers | `[]` |
| **Case 6: Ledger Reversal** | Entry of ₹5000 reversed by offsetting record | Net balances remain 0 | `[]` (Reversal neutralizes target entry) |

---

## 3. Running Test Suites

### Server Unit & Integration Tests:
```bash
cd server
npm test
```

### With Watch Mode:
```bash
npm run test:watch
```

### With Code Coverage:
```bash
npm run test:coverage
```
