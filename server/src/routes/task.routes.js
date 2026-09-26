import { Router } from 'express';
import { TaskController } from '../controllers/task.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { familyMembershipMiddleware } from '../middleware/family.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { createTaskSchema, taskQuerySchema } from '../validators/task.validators.js';

import { idempotency } from '../middleware/idempotency.middleware.js';

const router = Router();

// All task routes are scoped by familyGroupId and protected by authentication & membership
router.use('/:familyGroupId', authenticateUser, familyMembershipMiddleware);

router.post('/:familyGroupId', idempotency({ required: false }), validate(createTaskSchema), TaskController.createTask);
router.get('/:familyGroupId', validate(taskQuerySchema, 'query'), TaskController.getTasks);
router.get('/:familyGroupId/:taskId', TaskController.getTask);
router.patch('/:familyGroupId/:taskId/complete', idempotency({ required: false }), TaskController.completeTask);

export default router;
