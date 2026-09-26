import cron from 'node-cron';
import { User } from '../models/User.js';
import { FamilyGroup } from '../models/FamilyGroup.js';
import { LockManager } from '../utils/distributedLock.js';
import { logger } from '../config/logger.js';
import crypto from 'crypto';

/**
 * Sweeps for accounts scheduled for deletion whose 3-day grace period has passed.
 * IMPORTANT ARCHITECTURAL DECISION:
 * Shared elder-care history and financial cost-ledgers must remain mathematically trustworthy.
 * We DO NOT cascade delete financial or task records.
 * Instead, the user's identity is anonymized to 'Former Member'.
 */
export async function processAccountDeletions() {
  await LockManager.withLock('lock:account_deletion_processor', 30000, async () => {
    try {
      const now = new Date();
      const accountsToDelete = await User.find({
        pendingDeletion: true,
        deletionScheduledAt: { $lte: now }
      }).limit(50);

      if (accountsToDelete.length === 0) return;

      logger.info(`[DELETION] Found ${accountsToDelete.length} account(s) ready for anonymized deletion.`);

      for (const user of accountsToDelete) {
        logger.info(`[DELETION] Processing account anonymization for user ID: ${user._id}`);

        // 1. Remove user from all active family group memberships
        await FamilyGroup.updateMany(
          { 'members.userId': user._id },
          { $pull: { members: { userId: user._id } } }
        );

        // 2. Anonymize user personal identity while preserving reference ID for immutable ledger consistency
        user.name = 'Former Member';
        user.email = `anonymized_${user._id}_${Date.now()}@deleted.saathcare.local`;
        user.password = crypto.randomBytes(32).toString('hex'); // Scramble credentials
        user.refreshTokenHash = null;
        user.verificationTokenHash = null;
        user.verificationTokenExpiresAt = null;
        user.passwordResetTokenHash = null;
        user.passwordResetExpiresAt = null;
        user.pendingDeletion = false;
        user.deletionScheduledAt = null;

        await user.save();
        logger.info(`[DELETION] Anonymized user ID ${user._id}. Financial ledger and task history intact.`);
      }
    } catch (err) {
      logger.error('[DELETION] Error during account deletion sweep', err);
    }
  });
}

/**
 * Initializes account deletion cron (runs once an hour)
 */
export function initAccountDeletionCron() {
  const task = cron.schedule('0 * * * *', async () => {
    await processAccountDeletions();
  });

  logger.info('[JOBS] Account deletion background worker initialized (schedule: hourly)');
  return task;
}
