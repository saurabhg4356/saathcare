export const TASK_STATUS = Object.freeze({
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  MISSED: 'MISSED'
});

export const VALID_STATUS_TRANSITIONS = Object.freeze({
  [TASK_STATUS.PENDING]: [TASK_STATUS.COMPLETED, TASK_STATUS.MISSED],
  [TASK_STATUS.COMPLETED]: [], // Immutable - cannot transition out of COMPLETED
  [TASK_STATUS.MISSED]: []     // Immutable - cannot transition out of MISSED
});
