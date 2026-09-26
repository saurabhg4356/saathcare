import { Router } from 'express';
import { FamilyController } from '../controllers/family.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { familyMembershipMiddleware } from '../middleware/family.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { createFamilyGroupSchema, createInviteSchema } from '../validators/family.validators.js';
import { idempotency } from '../middleware/idempotency.middleware.js';

const router = Router();

// Create and list family groups
router.post('/', authenticateUser, validate(createFamilyGroupSchema), FamilyController.createGroup);
router.get('/', authenticateUser, FamilyController.getMyGroups);

// Invitation preview (Public) & Accept (Authenticated)
router.get('/invites/:token', FamilyController.getInvitePreview);
router.post('/invites/:token/accept', authenticateUser, FamilyController.acceptInvite);

// Scoped to specific family group - Protected by familyMembershipMiddleware
router.get('/:familyGroupId', authenticateUser, familyMembershipMiddleware, FamilyController.getGroupDetails);
router.post(
  '/:familyGroupId/invites',
  authenticateUser,
  familyMembershipMiddleware,
  idempotency({ required: false }),
  validate(createInviteSchema),
  FamilyController.createInvite
);
router.get('/:familyGroupId/invites', authenticateUser, familyMembershipMiddleware, FamilyController.getPendingInvites);

// Care Recipient Sensitive Details (Protected by family boundary)
router.patch('/:familyGroupId/care-info', authenticateUser, familyMembershipMiddleware, FamilyController.updateCareInfo);

export default router;
