import { NotificationOutbox, NOTIFICATION_TYPE, OUTBOX_STATUS } from '../models/NotificationOutbox.js';
import { EmailService } from './email/index.js';
import { logger } from '../config/logger.js';

export class NotificationService {
  /**
   * Non-blocking: Creates an outbox entry to be processed by background worker
   */
  static async enqueue({ type, recipient, payload, familyGroupId = null, userId = null }) {
    try {
      const record = await NotificationOutbox.create({
        type,
        recipient,
        payload,
        familyGroupId,
        userId,
        status: OUTBOX_STATUS.PENDING,
        availableAt: new Date()
      });
      logger.debug(`[OUTBOX] Enqueued notification ${record._id} of type ${type} for ${recipient}`);
      return record;
    } catch (error) {
      // Rule: Notification enqueue failure must NOT throw or abort primary business operations
      logger.error(`[OUTBOX] Failed to enqueue notification of type ${type} for ${recipient}`, error);
      return null;
    }
  }

  /**
   * Processes a single outbox record with retry and exponential backoff
   */
  static async processRecord(record) {
    try {
      await EmailService.sendEmail({
        to: record.recipient,
        subject: record.payload.subject,
        text: record.payload.text,
        html: record.payload.html
      });

      record.status = OUTBOX_STATUS.SENT;
      record.processedAt = new Date();
      record.lastError = null;
      await record.save();
      logger.info(`[OUTBOX] Successfully processed notification ${record._id} to ${record.recipient}`);
      return true;
    } catch (err) {
      record.attempts += 1;
      record.lastError = err.message || 'Unknown email dispatch error';

      if (record.attempts >= record.maxAttempts) {
        record.status = OUTBOX_STATUS.FAILED;
        logger.error(`[OUTBOX] Notification ${record._id} permanently failed after ${record.attempts} attempts: ${record.lastError}`);
      } else {
        // Exponential backoff: 10s * 2^(attempts-1) -> 10s, 20s, 40s, 80s
        const backoffMs = Math.min(Math.pow(2, record.attempts - 1) * 10000, 300000);
        record.availableAt = new Date(Date.now() + backoffMs);
        record.status = OUTBOX_STATUS.PENDING;
        logger.warn(`[OUTBOX] Notification ${record._id} failed (attempt ${record.attempts}/${record.maxAttempts}). Retrying in ${backoffMs / 1000}s`);
      }

      await record.save();
      return false;
    }
  }
}
