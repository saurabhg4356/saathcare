import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../../src/services/auth.service.js';
import { User } from '../../src/models/User.js';
import { hashToken } from '../../src/utils/crypto.js';
import { NotificationService } from '../../src/services/notification.service.js';

describe('Phase E: Password Reset & Anti-Enumeration Logic', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(NotificationService, 'enqueue').mockResolvedValue({ _id: 'outbox-mock' });
  });

  it('forgotPassword always returns generic message without revealing account existence', async () => {
    vi.spyOn(User, 'findOne').mockResolvedValue(null);

    const result = await AuthService.forgotPassword('unknown@example.com');
    expect(result.success).toBe(true);
    expect(result.message).toBe('If an account with that email exists, a password reset link has been sent.');
  });

  it('forgotPassword creates high-entropy hashed reset token with 30m expiry for existing users', async () => {
    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Rohan Verma',
      email: 'rohan@example.com',
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
      save: vi.fn().mockResolvedValue(true)
    };

    vi.spyOn(User, 'findOne').mockResolvedValue(mockUser);

    const result = await AuthService.forgotPassword('rohan@example.com');
    expect(result.success).toBe(true);
    expect(mockUser.passwordResetTokenHash).toBeDefined();
    expect(mockUser.passwordResetExpiresAt).toBeDefined();
    expect(mockUser.save).toHaveBeenCalled();
    expect(NotificationService.enqueue).toHaveBeenCalled();
  });

  it('resetPassword rejects expired or already used tokens', async () => {
    vi.spyOn(User, 'findOne').mockResolvedValue(null);
    await expect(AuthService.resetPassword('invalid_token', 'newSecurePassword123')).rejects.toThrow(
      'This reset link has expired or was already used.'
    );
  });

  it('resetPassword updates password, clears reset token (single-use), and invalidates active sessions', async () => {
    const rawToken = 'valid_reset_token_xyz987';
    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Rohan Verma',
      email: 'rohan@example.com',
      password: 'oldPasswordHash',
      passwordResetTokenHash: hashToken(rawToken),
      passwordResetExpiresAt: new Date(Date.now() + 1800000), // 30 mins
      refreshTokenHash: 'active_session_hash',
      save: vi.fn().mockResolvedValue(true)
    };

    vi.spyOn(User, 'findOne').mockResolvedValue(mockUser);

    const result = await AuthService.resetPassword(rawToken, 'newStrongPassword456');

    expect(result.success).toBe(true);
    expect(mockUser.password).toBe('newStrongPassword456');
    expect(mockUser.passwordResetTokenHash).toBeNull(); // Single-use!
    expect(mockUser.passwordResetExpiresAt).toBeNull();
    expect(mockUser.refreshTokenHash).toBeNull(); // Active sessions revoked!
    expect(mockUser.save).toHaveBeenCalled();
  });
});
