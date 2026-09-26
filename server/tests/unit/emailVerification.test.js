import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../../src/services/auth.service.js';
import { User } from '../../src/models/User.js';
import { hashToken } from '../../src/utils/crypto.js';

describe('Phase D: Email Verification Logic', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects verification if token is missing', async () => {
    await expect(AuthService.verifyEmail(null)).rejects.toThrow('Verification token is required');
  });

  it('rejects verification if token does not match any valid pending record', async () => {
    vi.spyOn(User, 'findOne').mockResolvedValue(null);
    await expect(AuthService.verifyEmail('nonexistent-token')).rejects.toThrow('Verification link is invalid or has expired');
  });

  it('successfully verifies email, marks isVerified true, and clears token fields', async () => {
    const rawToken = 'my_secure_random_token_12345';
    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Priya Sharma',
      email: 'priya@example.com',
      isVerified: false,
      verificationTokenHash: hashToken(rawToken),
      verificationTokenExpiresAt: new Date(Date.now() + 3600000),
      save: vi.fn().mockResolvedValue(true),
      toJSON: vi.fn().mockReturnValue({
        _id: '507f1f77bcf86cd799439011',
        name: 'Priya Sharma',
        email: 'priya@example.com',
        isVerified: true
      })
    };

    vi.spyOn(User, 'findOne').mockResolvedValue(mockUser);

    const result = await AuthService.verifyEmail(rawToken);

    expect(result.verified).toBe(true);
    expect(mockUser.isVerified).toBe(true);
    expect(mockUser.verificationTokenHash).toBeNull();
    expect(mockUser.verificationTokenExpiresAt).toBeNull();
    expect(mockUser.save).toHaveBeenCalled();
  });

  it('resendVerification maintains anti-enumeration by returning generic message for non-existent users', async () => {
    vi.spyOn(User, 'findOne').mockResolvedValue(null);

    const result = await AuthService.resendVerification('unknown@example.com');
    expect(result.success).toBe(true);
    expect(result.message).toContain('If an unverified account exists');
  });
});
