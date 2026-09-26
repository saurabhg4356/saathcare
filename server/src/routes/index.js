import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import familyRoutes from './family.routes.js';
import taskRoutes from './task.routes.js';
import expenseRoutes from './expense.routes.js';
import contactRoutes from './contact.routes.js';
import statsRoutes from './stats.routes.js';
import notificationRoutes from './notification.routes.js';

const router = Router();

// Liveness & health check
router.use('/health', healthRoutes);

// Authentication & Identity
router.use('/auth', authRoutes);

// Family Groups & Invitations
router.use('/family-groups', familyRoutes);

// Tasks & Duty Management
router.use('/tasks', taskRoutes);

// Expense Ledger & Settlements
router.use('/expenses', expenseRoutes);

// Public Inquiries & Contact
router.use('/contact', contactRoutes);

// Real-Time System Statistics (Public & Cached)
router.use('/stats', statsRoutes);

// In-App Notification Center
router.use('/notifications', notificationRoutes);

export default router;
