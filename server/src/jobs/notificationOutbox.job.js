import cron from 'node-cron';
import { NotificationOutbox, OUTBOX_STATUS } from '../models/NotificationOutbox.js';
import { NotificationService } from '../services/notification.service.js';
import { LockManager } from '../utils/distributedLock.js';
import { logger } from '../config/logger.js';

export async function processOutboxQueue() {
  await LockManager.withLock('lock:notification_outbox', 25000, async () => {
    try {
      const now = new Date();
      // Fetch batch of ready pending notifications
      const pendingItems = await NotificationOutbox.find({
        status: OUTBOX_STATUS.PENDING,
        availableAt: { $lte: now }
      })
        .sort({ availableAt: 1 })
        .limit(20);

      if (pendingItems.length === 0) return;

      logger.debug(`[OUTBOX] Found ${pendingItems.length} notification(s) ready for dispatch.`);

      for (const item of pendingItems) {
        // Atomic lock for item
        const locked = await NotificationOutbox.findOneAndUpdate(
          { _id: item._id, status: OUTBOX_STATUS.PENDING },
          { $set: { status: OUTBOX_STATUS.PROCESSING } },
          { new: true }
        );

        if (locked) {
          await NotificationService.processRecord(locked);
        }
      }
    } catch (err) {
      logger.error('[OUTBOX] Error during outbox sweep execution', err);
    }
  });
}

/**
 * Initializes outbox worker cron: runs every 10 seconds in production/development
 */
export function initNotificationOutboxCron() {
  // Run every 15 seconds
  const task = cron.schedule('*/15 * * * * *', async () => {
    await processOutboxQueue();
  });

  logger.info('[JOBS] Notification outbox background worker initialized (schedule: every 15s)');
  return task;
}
