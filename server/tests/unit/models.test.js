import { describe, it, expect } from 'vitest';
import { User, FamilyGroup, Invite, Task, ExpenseLedger } from '../../src/models/index.js';
import mongoose from 'mongoose';

describe('Database Models Unit Tests', () => {
  it('should validate User model required fields', async () => {
    const user = new User({});
    const err = user.validateSync();
    expect(err.errors.name).toBeDefined();
    expect(err.errors.email).toBeDefined();
    expect(err.errors.password).toBeDefined();
  });

  it('should strip password and refreshTokenHash in User toJSON', () => {
    const user = new User({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashedpassword123',
      refreshTokenHash: 'secret_token_hash'
    });
    const json = user.toJSON();
    expect(json.password).toBeUndefined();
    expect(json.refreshTokenHash).toBeUndefined();
    expect(json.name).toBe('John Doe');
  });

  it('should enforce Task valid status values', () => {
    const task = new Task({
      familyGroupId: new mongoose.Types.ObjectId(),
      title: 'Morning Medicine',
      assigneeId: new mongoose.Types.ObjectId(),
      dueAt: new Date(),
      status: 'INVALID_STATUS',
      createdBy: new mongoose.Types.ObjectId()
    });
    const err = task.validateSync();
    expect(err.errors.status).toBeDefined();
  });

  it('should reject ExpenseLedger where split sum does not match total amount', () => {
    const userA = new mongoose.Types.ObjectId();
    const userB = new mongoose.Types.ObjectId();
    const expense = new ExpenseLedger({
      familyGroupId: new mongoose.Types.ObjectId(),
      paidById: userA,
      amountPaise: 300000, // ₹3000
      description: 'Monthly Doctor Visit',
      splitAmong: [
        { userId: userA, amountPaise: 100000 },
        { userId: userB, amountPaise: 150000 } // Total 250000 != 300000
      ],
      createdBy: userA
    });
    const err = expense.validateSync();
    expect(err.errors.splitAmong).toBeDefined();
  });

  it('should accept ExpenseLedger when split sum exactly matches total amount in paise', () => {
    const userA = new mongoose.Types.ObjectId();
    const userB = new mongoose.Types.ObjectId();
    const expense = new ExpenseLedger({
      familyGroupId: new mongoose.Types.ObjectId(),
      paidById: userA,
      amountPaise: 300000, // ₹3000
      description: 'Monthly Doctor Visit',
      splitAmong: [
        { userId: userA, amountPaise: 150000 },
        { userId: userB, amountPaise: 150000 } // Exactly 300000
      ],
      createdBy: userA
    });
    const err = expense.validateSync();
    expect(err).toBeUndefined();
  });
});
