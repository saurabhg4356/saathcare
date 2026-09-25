import { describe, it, expect } from 'vitest';
import { createTaskSchema, taskQuerySchema } from '../../src/validators/task.validators.js';
import { TASK_STATUS, VALID_STATUS_TRANSITIONS } from '../../src/constants/taskStatus.js';

describe('Task Validators & State Machine Unit Tests', () => {
  it('validates correct task creation payload', () => {
    const valid = {
      title: 'Blood Pressure & Vitals Morning Check',
      description: 'Record systolic and diastolic reading in the diary',
      assigneeId: '507f1f77bcf86cd799439011',
      dueAt: new Date(Date.now() + 3600000).toISOString()
    };
    const result = createTaskSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects task with invalid ObjectId for assignee', () => {
    const invalid = {
      title: 'Doctor Appointment',
      assigneeId: 'not-a-valid-id',
      dueAt: new Date().toISOString()
    };
    const result = createTaskSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects task with invalid due date', () => {
    const invalid = {
      title: 'Physiotherapy',
      assigneeId: '507f1f77bcf86cd799439011',
      dueAt: 'invalid-date-string'
    };
    const result = createTaskSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('verifies state machine forbids transitions out of COMPLETED or MISSED', () => {
    expect(VALID_STATUS_TRANSITIONS[TASK_STATUS.COMPLETED]).toEqual([]);
    expect(VALID_STATUS_TRANSITIONS[TASK_STATUS.MISSED]).toEqual([]);
    expect(VALID_STATUS_TRANSITIONS[TASK_STATUS.PENDING]).toContain(TASK_STATUS.COMPLETED);
    expect(VALID_STATUS_TRANSITIONS[TASK_STATUS.PENDING]).toContain(TASK_STATUS.MISSED);
  });
});
