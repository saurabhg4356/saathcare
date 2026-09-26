import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPublicStats } from '../../src/controllers/stats.controller.js';
import { FamilyGroup } from '../../src/models/FamilyGroup.js';
import { User } from '../../src/models/User.js';
import { Task } from '../../src/models/Task.js';
import { ExpenseLedger } from '../../src/models/ExpenseLedger.js';

describe('Public Statistics Controller Unit Tests (Phase 6)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('aggregates real database counts and returns sanitized public stats', async () => {
    vi.spyOn(FamilyGroup, 'countDocuments').mockResolvedValue(12);
    vi.spyOn(User, 'countDocuments').mockResolvedValue(35);
    vi.spyOn(Task, 'countDocuments').mockResolvedValue(148);
    vi.spyOn(ExpenseLedger, 'aggregate').mockResolvedValue([
      { _id: null, totalPaise: 45000000 } // ₹450,000.00
    ]);

    const req = {};
    const res = {
      statusCode: 0,
      jsonPayload: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.jsonPayload = payload;
        return this;
      }
    };
    const next = vi.fn();

    await getPublicStats(req, res, next);

    expect(res.statusCode).toBe(200);
    expect(res.jsonPayload?.success).toBe(true);
    const data = res.jsonPayload?.data;
    expect(data).toBeDefined();
    expect(data.activeFamilies).toBeGreaterThanOrEqual(0);
    expect(data.totalCaregivers).toBeGreaterThanOrEqual(0);
    expect(data.completedDuties).toBeGreaterThanOrEqual(0);
    expect(data.totalExpensesPaise).toBeGreaterThanOrEqual(0);
    expect(data.lastUpdated).toBeDefined();
  });
});
