import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InAppNotificationService } from '../../src/services/inAppNotification.service.js';
import { Notification } from '../../src/models/Notification.js';
import { SocketEmitter } from '../../src/sockets/socketEmitter.js';

describe('In-App Notification Service Unit Tests (Phase 7)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates notification and emits socket event to user room', async () => {
    const mockNotif = {
      _id: '607f1f77bcf86cd799439088',
      userId: '507f1f77bcf86cd799439011',
      title: 'Duty Assigned',
      message: 'You have been assigned: Morning Blood Pressure Check',
      type: 'TASK_ASSIGNED',
      link: '/tasks',
      read: false
    };

    vi.spyOn(Notification, 'create').mockResolvedValue(mockNotif);
    vi.spyOn(SocketEmitter, 'emitToUser').mockImplementation(() => {});

    const created = await InAppNotificationService.createNotification({
      userId: '507f1f77bcf86cd799439011',
      familyGroupId: '507f1f77bcf86cd799439022',
      title: 'Duty Assigned',
      message: 'You have been assigned: Morning Blood Pressure Check',
      type: 'TASK_ASSIGNED',
      link: '/tasks'
    });

    expect(created).toBeDefined();
    expect(Notification.create).toHaveBeenCalledTimes(1);
    expect(SocketEmitter.emitToUser).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
      'notification:new',
      mockNotif
    );
  });
});
