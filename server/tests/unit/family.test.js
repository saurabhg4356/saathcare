import { describe, it, expect } from 'vitest';
import { createFamilyGroupSchema, createInviteSchema } from '../../src/validators/family.validators.js';

describe('Family Validators Unit Tests', () => {
  it('validates correct family group creation payload', () => {
    const valid = {
      careRecipientName: 'Dad (Shri Ramesh Sharma)',
      groupName: 'Sharma Elders Care'
    };
    const result = createFamilyGroupSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects family group creation with short or missing care recipient name', () => {
    const invalid = {
      careRecipientName: 'D'
    };
    const result = createFamilyGroupSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('validates invite creation with valid email', () => {
    const valid = {
      email: 'brother.rohit@example.com'
    };
    const result = createInviteSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects invite with invalid email format', () => {
    const invalid = {
      email: 'not-an-email'
    };
    const result = createInviteSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
