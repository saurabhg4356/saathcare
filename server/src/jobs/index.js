import { initMissedTaskCron } from './missedTaskDetector.job.js';
import { initNotificationOutboxCron } from './notificationOutbox.job.js';
import { initAccountDeletionCron } from './accountDeletion.job.js';
import { logger } from '../config/logger.js';

let activeJobs = [];

export function startScheduledJobs() {
  try {
    const missedTaskJob = initMissedTaskCron();
    if (missedTaskJob) activeJobs.push(missedTaskJob);

    const outboxJob = initNotificationOutboxCron();
    if (outboxJob) activeJobs.push(outboxJob);

    const deletionJob = initAccountDeletionCron();
    if (deletionJob) activeJobs.push(deletionJob);

    logger.info(`Scheduled background jobs started successfully (${activeJobs.length} active worker crons)`);
  } catch (err) {
    logger.error('Failed to start scheduled background jobs', err);
  }
}

export function stopScheduledJobs() {
  for (const job of activeJobs) {
    if (job && typeof job.stop === 'function') {
      job.stop();
    }
  }
  activeJobs = [];
  logger.info('All scheduled background jobs stopped cleanly');
}
