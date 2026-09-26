import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../../src/services/auth.service.js';
import { User } from '../../src/models/User.js';
import { FamilyGroup } from '../../src/models/FamilyGroup.js';
import { processAccountDeletions } from '../../src/jobs/accountDeletion.job.js';
import { LockManager } from '../../src/utils/distributedLock.js';

describe('Phase J: Account Deletion Grace Period & Ledger Anonymization', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('requestAccountDeletion sets 3-day grace period and revokes active refresh tokens', async () => {
    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      pendingDeletion: false,
      deletionScheduledAt: null,
      refreshTokenHash: 'active_hash',
      save: vi.fn().mockResolvedValue(true)
    };

    vi.spyOn(User, 'findById').mockResolvedValue(mockUser);

    const result = await AuthService.requestAccountDeletion(mockUser._id);

    expect(result.success).toBe(true);
    expect(mockUser.pendingDeletion).toBe(true);
    expect(mockUser.deletionScheduledAt).toBeDefined();
    // Verify 3 days (~259200000 ms) in future
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    const diff = mockUser.deletionScheduledAt.getTime() - Date.now();
    expect(diff).toBeGreaterThan(threeDaysMs - 5000);
    expect(mockUser.refreshTokenHash).toBeNull();
  });

  it('cancelAccountDeletion restores account status within grace period', async () => {
    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      pendingDeletion: true,
      deletionScheduledAt: new Date(Date.now() + 86400000),
      save: vi.fn().mockResolvedValue(true)
    };

    vi.spyOn(User, 'findById').mockResolvedValue(mockUser);

    const result = await AuthService.cancelAccountDeletion(mockUser._id);

    expect(result.success).toBe(true);
    expect(mockUser.pendingDeletion).toBe(false);
    expect(mockUser.deletionScheduledAt).toBeNull();
  });

  it('processAccountDeletions anonymizes user to "Former Member" without deleting financial ledger records', async () => {
    vi.spyOn(LockManager, 'withLock').mockImplementation(async (key, ttl, fn) => fn());
    vi.spyOn(FamilyGroup, 'updateMany').mockResolvedValue({ modifiedCount: 1 });

    const mockUserToDelete = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Ananya Roy',
      email: 'ananya@example.com',
      pendingDeletion: true,
      deletionScheduledAt: new Date(Date.now() - 1000),
      save: vi.fn().mockResolvedValue(true)
    };

    const mockFindQuery = {
      limit: vi.fn().mockResolvedValue([mockUserToDelete])
    };
    vi.spyOn(User, 'find').mockReturnValue(mockFindQuery);

    await processAccountDeletions();

    expect(mockUserToDelete.name).toBe('Former Member');
    expect(mockUserToDelete.email).toContain('anonymized_');
    expect(mockUserToDelete.pendingDeletion).toBe(false);
    expect(mockUserToDelete.deletionScheduledAt).toBeNull();
    expect(mockUserToDelete.save).toHaveBeenCalled();
    expect(FamilyGroup.updateMany).toHaveBeenCalled();
  });
});
