import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { AuthService } from '../../src/services/auth.service.js';
import { registerSchema, loginSchema } from '../../src/validators/auth.validators.js';
import { env } from '../../src/config/env.js';
import { hashToken } from '../../src/utils/crypto.js';

describe('Auth Service & Validation Unit Tests', () => {
  it('generates valid access and refresh tokens for a user', () => {
    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      email: 'test@saathcare.org',
      name: 'Caregiver A'
    };

    const tokens = AuthService.generateTokens(mockUser);
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();

    const decodedAccess = jwt.verify(tokens.accessToken, env.JWT.ACCESS_SECRET);
    expect(decodedAccess.userId).toBe(mockUser._id);
    expect(decodedAccess.email).toBe(mockUser.email);
    expect(decodedAccess.name).toBe(mockUser.name);

    const decodedRefresh = jwt.verify(tokens.refreshToken, env.JWT.REFRESH_SECRET);
    expect(decodedRefresh.userId).toBe(mockUser._id);
  });

  it('correctly creates and checks SHA-256 token hashes', () => {
    const token = 'sample_refresh_token_12345';
    const hash1 = hashToken(token);
    const hash2 = hashToken(token);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it('rejects registration with invalid email or short password via Zod schema', () => {
    const invalid = {
      name: 'A', // too short (< 2)
      email: 'not-an-email',
      password: '123' // too short (< 6)
    };

    const result = registerSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.errors.map(e => e.path[0]);
      expect(fieldErrors).toContain('name');
      expect(fieldErrors).toContain('email');
      expect(fieldErrors).toContain('password');
    }
  });

  it('accepts valid registration payload', () => {
    const valid = {
      name: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      password: 'StrongPassword123'
    };

    const result = registerSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});
