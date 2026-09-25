import { initMissedTaskCron } from './missedTaskDetector.job.js';
import { logger } from '../config/logger.js';

let missedTaskJob = null;

export function startScheduledJobs() {
  try {
    missedTaskJob = initMissedTaskCron();
    logger.info('Scheduled background jobs started successfully');
  } catch (err) {
    logger.error('Failed to start scheduled background jobs', err);
  }
}

export function stopScheduledJobs() {
  if (missedTaskJob) {
    missedTaskJob.stop();
    logger.info('Scheduled background jobs stopped');
  }
}
