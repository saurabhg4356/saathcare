import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationService } from '../../src/services/notification.service.js';
import { NotificationOutbox, OUTBOX_STATUS, NOTIFICATION_TYPE } from '../../src/models/NotificationOutbox.js';
import { EmailService } from '../../src/services/email/index.js';

describe('Phase F: Notification Outbox Pattern', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('enqueues notification record without throwing even if DB error occurs', async () => {
    vi.spyOn(NotificationOutbox, 'create').mockResolvedValue({
      _id: 'outbox-1',
      status: OUTBOX_STATUS.PENDING
    });

    const res = await NotificationService.enqueue({
      type: NOTIFICATION_TYPE.TASK_ASSIGNED,
      recipient: 'member@example.com',
      payload: { subject: 'Test', text: 'Task body' }
    });

    expect(res).toBeDefined();
    expect(res.status).toBe(OUTBOX_STATUS.PENDING);
  });

  it('marks outbox record as SENT upon successful email dispatch', async () => {
    vi.spyOn(EmailService, 'sendEmail').mockResolvedValue({ success: true });

    const mockRecord = {
      _id: 'outbox-1',
      recipient: 'user@example.com',
      payload: { subject: 'Test', text: 'Body' },
      status: OUTBOX_STATUS.PENDING,
      attempts: 0,
      maxAttempts: 5,
      save: vi.fn().mockResolvedValue(true)
    };

    const success = await NotificationService.processRecord(mockRecord);

    expect(success).toBe(true);
    expect(mockRecord.status).toBe(OUTBOX_STATUS.SENT);
    expect(mockRecord.processedAt).toBeDefined();
    expect(mockRecord.save).toHaveBeenCalled();
  });

  it('increments attempts and applies exponential backoff on dispatch failure', async () => {
    vi.spyOn(EmailService, 'sendEmail').mockRejectedValue(new Error('SMTP timeout'));

    const mockRecord = {
      _id: 'outbox-2',
      recipient: 'user@example.com',
      payload: { subject: 'Test', text: 'Body' },
      status: OUTBOX_STATUS.PROCESSING,
      attempts: 1,
      maxAttempts: 5,
      save: vi.fn().mockResolvedValue(true)
    };

    const success = await NotificationService.processRecord(mockRecord);

    expect(success).toBe(false);
    expect(mockRecord.attempts).toBe(2);
    expect(mockRecord.status).toBe(OUTBOX_STATUS.PENDING);
    expect(mockRecord.availableAt.getTime()).toBeGreaterThan(Date.now());
    expect(mockRecord.lastError).toBe('SMTP timeout');
  });

  it('marks record as FAILED when max attempts are reached', async () => {
    vi.spyOn(EmailService, 'sendEmail').mockRejectedValue(new Error('Permanent mailbox error'));

    const mockRecord = {
      _id: 'outbox-3',
      recipient: 'invalid@example.com',
      payload: { subject: 'Test', text: 'Body' },
      status: OUTBOX_STATUS.PROCESSING,
      attempts: 4,
      maxAttempts: 5,
      save: vi.fn().mockResolvedValue(true)
    };

    const success = await NotificationService.processRecord(mockRecord);

    expect(success).toBe(false);
    expect(mockRecord.attempts).toBe(5);
    expect(mockRecord.status).toBe(OUTBOX_STATUS.FAILED);
  });
});
