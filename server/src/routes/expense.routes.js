import { Router } from 'express';
import { ExpenseController } from '../controllers/expense.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { familyMembershipMiddleware } from '../middleware/family.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { createExpenseSchema, reverseExpenseSchema } from '../validators/expense.validators.js';
import { idempotency } from '../middleware/idempotency.middleware.js';
import { receiptUpload } from '../middleware/upload.middleware.js';

const router = Router();

// Secure file streaming route (protected by authentication)
router.get('/receipts/:key', authenticateUser, ExpenseController.streamReceipt);

// All other expense routes scoped to familyGroupId and protected by authentication & membership
router.use('/:familyGroupId', authenticateUser, familyMembershipMiddleware);

// Idempotent expense creation
router.post(
  '/:familyGroupId',
  idempotency({ required: false }),
  validate(createExpenseSchema),
  ExpenseController.addExpense
);

// Receipt file upload
router.post('/:familyGroupId/upload-receipt', receiptUpload, ExpenseController.uploadReceipt);

// Signed URL retrieval
router.get('/:familyGroupId/:expenseId/receipt-url', ExpenseController.getReceiptUrl);

// Ledger & settlements
router.get('/:familyGroupId', ExpenseController.getLedger);
router.post('/:familyGroupId/:expenseId/reverse', validate(reverseExpenseSchema), ExpenseController.reverseExpense);
router.get('/:familyGroupId/settlements', ExpenseController.getSettlements);

export default router;
