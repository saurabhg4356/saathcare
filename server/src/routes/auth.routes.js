import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validation.middleware.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resendVerificationSchema
} from '../validators/auth.validators.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

// Core authentication
router.post('/register', authLimiter, validate(registerSchema), AuthController.register);
router.post('/login', authLimiter, validate(loginSchema), AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', authenticateUser, AuthController.logout);
router.get('/me', authenticateUser, AuthController.getMe);

// Email verification
router.get('/verify-email/:token', AuthController.verifyEmail);
router.post('/resend-verification', authLimiter, validate(resendVerificationSchema), AuthController.resendVerification);

// Password recovery
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password/:token', authLimiter, validate(resetPasswordSchema), AuthController.resetPassword);

// Account deletion with 3-day grace period
router.post('/request-deletion', authenticateUser, AuthController.requestDeletion);
router.post('/cancel-deletion', authenticateUser, AuthController.cancelDeletion);

// Interactive onboarding tour completed status
router.patch('/onboarding', authenticateUser, AuthController.completeOnboarding);

export default router;
