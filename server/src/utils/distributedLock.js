import { DistributedLock } from '../models/DistributedLock.js';
import { logger } from '../config/logger.js';
import crypto from 'crypto';

const INSTANCE_ID = `worker-${process.pid}-${crypto.randomBytes(4).toString('hex')}`;

export class LockManager {
  /**
   * Attempts to acquire an atomic distributed lock in MongoDB
   */
  static async acquire(lockKey, ttlMs = 30000) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMs);

    try {
      // Atomic findOneAndUpdate with conditional acquisition
      const lock = await DistributedLock.findOneAndUpdate(
        {
          _id: lockKey,
          $or: [
            { expiresAt: { $lt: now } }, // Lock expired
            { holderId: INSTANCE_ID }    // Re-entrancy for same instance
          ]
        },
        {
          $set: {
            holderId: INSTANCE_ID,
            expiresAt
          }
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        }
      );

      return lock && lock.holderId === INSTANCE_ID;
    } catch (err) {
      // E11000 duplicate key error means another instance won the race
      if (err.code === 11000) {
        return false;
      }
      logger.debug(`[LOCK] Failed to acquire lock ${lockKey}: ${err.message}`);
      return false;
    }
  }

  /**
   * Releases an acquired distributed lock
   */
  static async release(lockKey) {
    try {
      await DistributedLock.deleteOne({
        _id: lockKey,
        holderId: INSTANCE_ID
      });
      return true;
    } catch (err) {
      logger.debug(`[LOCK] Failed to release lock ${lockKey}: ${err.message}`);
      return false;
    }
  }

  /**
   * Helper to execute an async action under a distributed lock
   */
  static async withLock(lockKey, ttlMs, fn) {
    const acquired = await this.acquire(lockKey, ttlMs);
    if (!acquired) {
      logger.debug(`[LOCK] Lock '${lockKey}' held by another instance. Skipping.`);
      return false;
    }

    try {
      await fn();
      return true;
    } finally {
      await this.release(lockKey);
    }
  }
}
