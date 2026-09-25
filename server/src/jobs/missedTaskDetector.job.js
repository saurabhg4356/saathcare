import cron from 'node-cron';
import { Task } from '../models/Task.js';
import { TASK_STATUS } from '../constants/taskStatus.js';
import { SocketEmitter } from '../sockets/socketEmitter.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

let isJobRunning = false;

/**
 * Sweeps for overdue PENDING tasks and transitions them to MISSED
 * Emits real-time notification to the respective family room
 */
export async function detectMissedTasks() {
  // Simple re-entrancy / instance lock (pluggable with Redis Redlock for multi-instance clusters)
  if (isJobRunning) {
    logger.debug('Missed task detection job already in progress; skipping tick');
    return;
  }

  isJobRunning = true;
  try {
    const now = new Date();

    // Find overdue pending tasks
    const overdueTasks = await Task.find({
      status: TASK_STATUS.PENDING,
      dueAt: { $lt: now }
    })
      .populate('assigneeId', 'name email')
      .populate('createdBy', 'name email')
      .limit(100); // Process in bounded batches

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

        // Dispatch real-time alert to family members
        SocketEmitter.emitTaskMissed(updated.familyGroupId, updated);
      }
    }
  } catch (error) {
    logger.error('Error during missed task detection sweep', error);
  } finally {
    isJobRunning = false;
  }
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
