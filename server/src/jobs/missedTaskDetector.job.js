import cron from 'node-cron';
import { Task } from '../models/Task.js';
import { TASK_STATUS } from '../constants/taskStatus.js';
import { SocketEmitter } from '../sockets/socketEmitter.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

import { LockManager } from '../utils/distributedLock.js';
import { NotificationService } from '../services/notification.service.js';
import { NOTIFICATION_TYPE } from '../models/NotificationOutbox.js';
import { EmailService } from '../services/email/index.js';
import { FamilyGroup } from '../models/FamilyGroup.js';

let isJobRunning = false;

/**
 * Sweeps for overdue PENDING tasks and transitions them to MISSED
 * Emits real-time notification to the respective family room and queues outbox alerts
 */
export async function detectMissedTasks() {
  await LockManager.withLock('lock:missed_task_detector', 45000, async () => {
    try {
      const now = new Date();

      // Find overdue pending tasks
      const overdueTasks = await Task.find({
        status: TASK_STATUS.PENDING,
        dueAt: { $lt: now }
      })
        .populate('assigneeId', 'name email')
        .populate('createdBy', 'name email')
        .limit(100);

      if (overdueTasks.length === 0) {
        return;
      }

      logger.info(`Detected ${overdueTasks.length} overdue task(s). Transitioning to MISSED...`);

      for (const task of overdueTasks) {
        // Atomic condition check: ensure task is still PENDING at update time
        const updated = await Task.findOneAndUpdate(
          {
            _id: task._id,
            status: TASK_STATUS.PENDING
          },
          {
            $set: { status: TASK_STATUS.MISSED }
          },
          { new: true }
        )
          .populate('assigneeId', 'name email')
          .populate('createdBy', 'name email');

        if (updated) {
          logger.info(`Task [${updated.title}] (_id: ${updated._id}) marked as MISSED`);

          // 1. Dispatch real-time alert to family members via WebSockets
          SocketEmitter.emitTaskMissed(updated.familyGroupId, updated);

          // 2. Queue asynchronous notification via Outbox (non-blocking)
          try {
            const family = await FamilyGroup.findById(updated.familyGroupId).populate('members.userId', 'name email');
            if (family && family.members) {
              const dueFormatted = new Date(updated.dueAt).toLocaleString();
              const template = EmailService.getTaskMissedTemplate({
                taskTitle: updated.title,
                dueAtFormatted: dueFormatted,
                assigneeName: updated.assigneeId?.name || 'Unassigned',
                careRecipientName: family.careRecipient?.name || 'Care Recipient',
                groupName: family.name
              });

              for (const member of family.members) {
                if (member.userId?.email) {
                  await NotificationService.enqueue({
                    type: NOTIFICATION_TYPE.TASK_MISSED,
                    recipient: member.userId.email,
                    familyGroupId: family._id,
                    userId: member.userId._id,
                    payload: template
                  });
                }
              }
            }
          } catch (notifErr) {
            logger.warn(`Failed to enqueue outbox alert for missed task ${updated._id}`, notifErr);
          }
        }
      }
    } catch (error) {
      logger.error('Error during missed task detection sweep', error);
    }
  });
}

/**
 * Initializes the node-cron scheduled job
 */
export function initMissedTaskCron() {
  if (!env.CRON.MISSED_TASK_ENABLED) {
    logger.info('Missed task background job is disabled by configuration');
    return null;
  }

  const schedule = env.CRON.MISSED_TASK_SCHEDULE;
  logger.info(`Initializing missed task background job with schedule: ${schedule}`);

  const task = cron.schedule(schedule, async () => {
    logger.debug('Running scheduled missed task detector sweep...');
    await detectMissedTasks();
  });

  return task;
}
