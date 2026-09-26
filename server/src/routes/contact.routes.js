import { Router } from 'express';
import { handleContactSubmission } from '../controllers/contact.controller.js';
import { validate } from '../middleware/validation.middleware.js';
import { contactSchema } from '../validators/contact.validators.js';
import { contactLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

router.post('/', contactLimiter, validate(contactSchema), handleContactSubmission);

export default router;
