import { Router } from 'express';
import { ExpenseController } from '../controllers/expense.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { familyMembershipMiddleware } from '../middleware/family.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { createExpenseSchema, reverseExpenseSchema } from '../validators/expense.validators.js';

const router = Router();

// All expense routes scoped to familyGroupId and protected by authentication & membership
router.use('/:familyGroupId', authenticateUser, familyMembershipMiddleware);

router.post('/:familyGroupId', validate(createExpenseSchema), ExpenseController.addExpense);
router.get('/:familyGroupId', ExpenseController.getLedger);
router.post('/:familyGroupId/:expenseId/reverse', validate(reverseExpenseSchema), ExpenseController.reverseExpense);
router.get('/:familyGroupId/settlements', ExpenseController.getSettlements);

export default router;
