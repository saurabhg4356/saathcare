import { describe, it, expect } from 'vitest';
import { ExpenseLedger } from '../../src/models/ExpenseLedger.js';
import mongoose from 'mongoose';

describe('ExpenseLedger Immutability Unit Tests', () => {
  it('blocks updateOne and throws MUTATION_FORBIDDEN error', async () => {
    try {
      await ExpenseLedger.updateOne(
        { _id: new mongoose.Types.ObjectId() },
        { amountPaise: 500000 }
      );
      expect.fail('Should have thrown mutation error');
    } catch (err) {
      expect(err.message).toContain('MUTATION_FORBIDDEN');
    }
  });

  it('blocks findOneAndUpdate and throws MUTATION_FORBIDDEN error', async () => {
    try {
      await ExpenseLedger.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId() },
        { description: 'Altered record' }
      );
      expect.fail('Should have thrown mutation error');
    } catch (err) {
      expect(err.message).toContain('MUTATION_FORBIDDEN');
    }
  });

  it('blocks deleteOne and throws MUTATION_FORBIDDEN error', async () => {
    try {
      await ExpenseLedger.deleteOne({ _id: new mongoose.Types.ObjectId() });
      expect.fail('Should have thrown mutation error');
    } catch (err) {
      expect(err.message).toContain('MUTATION_FORBIDDEN');
    }
  });

  it('blocks deleteMany and throws MUTATION_FORBIDDEN error', async () => {
    try {
      await ExpenseLedger.deleteMany({});
      expect.fail('Should have thrown mutation error');
    } catch (err) {
      expect(err.message).toContain('MUTATION_FORBIDDEN');
    }
  });
});
