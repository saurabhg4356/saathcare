import { describe, it, expect } from 'vitest';
import { SettleUpService } from '../../src/services/settleUp.service.js';
import { ExpenseService } from '../../src/services/expense.service.js';

describe('SettleUp Service & Split Math Unit Tests', () => {
  const userA = 'user_A_111111111111111111111111';
  const userB = 'user_B_222222222222222222222222';
  const userC = 'user_C_333333333333333333333333';
  const userD = 'user_D_444444444444444444444444';

  it('correctly handles equal split with remainder paise distribution', () => {
    // ₹100 (10000 paise) split across 3 members
    const splits = ExpenseService.calculateEqualSplit(10000, [userA, userB, userC]);
    expect(splits).toHaveLength(3);
    const totalPaise = splits.reduce((acc, curr) => acc + curr.amountPaise, 0);
    expect(totalPaise).toBe(10000);
    // 10000 / 3 = 3333 with remainder 1 -> first user gets 3334, others get 3333
    expect(splits[0].amountPaise).toBe(3334);
    expect(splits[1].amountPaise).toBe(3333);
    expect(splits[2].amountPaise).toBe(3333);
  });

  it('Case 1: 2 members — A pays ₹1000 split equally with B', () => {
    const entries = [
      {
        _id: 'entry1',
        paidById: userA,
        amountPaise: 100000, // ₹1000
        splitAmong: [
          { userId: userA, amountPaise: 50000 },
          { userId: userB, amountPaise: 50000 }
        ],
        isReversal: false
      }
    ];

    const result = SettleUpService.calculateSettlements(entries);
    expect(result.settlements).toHaveLength(1);
    expect(result.settlements[0]).toEqual({
      from: userB,
      to: userA,
      amountPaise: 50000,
      fromUser: { _id: userB },
      toUser: { _id: userA }
    });
  });

  it('Case 2: 3 members — A pays ₹3000 split equally among A, B, C', () => {
    const entries = [
      {
        _id: 'entry1',
        paidById: userA,
        amountPaise: 300000, // ₹3000
        splitAmong: [
          { userId: userA, amountPaise: 100000 },
          { userId: userB, amountPaise: 100000 },
          { userId: userC, amountPaise: 100000 }
        ],
        isReversal: false
      }
    ];

    const result = SettleUpService.calculateSettlements(entries);
    expect(result.settlements).toHaveLength(2);
    // Both B and C owe A ₹1000
    const bToA = result.settlements.find(s => s.from === userB && s.to === userA);
    const cToA = result.settlements.find(s => s.from === userC && s.to === userA);
    expect(bToA.amountPaise).toBe(100000);
    expect(cToA.amountPaise).toBe(100000);
  });

  it('Case 3: Multiple creditors & debtors — A pays ₹2000, B pays ₹1000, split ₹1000 each among A, B, C', () => {
    // Total ₹3000. Share is ₹1000 each.
    // A paid ₹2000, owed ₹1000 -> net +₹1000
    // B paid ₹1000, owed ₹1000 -> net 0
    // C paid ₹0, owed ₹1000 -> net -₹1000
    const entries = [
      {
        _id: 'entry1',
        paidById: userA,
        amountPaise: 200000,
        splitAmong: [
          { userId: userA, amountPaise: 66667 },
          { userId: userB, amountPaise: 66667 },
          { userId: userC, amountPaise: 66666 }
        ],
        isReversal: false
      },
      {
        _id: 'entry2',
        paidById: userB,
        amountPaise: 100000,
        splitAmong: [
          { userId: userA, amountPaise: 33333 },
          { userId: userB, amountPaise: 33333 },
          { userId: userC, amountPaise: 33334 }
        ],
        isReversal: false
      }
    ];

    const result = SettleUpService.calculateSettlements(entries);
    expect(result.settlements).toHaveLength(1);
    expect(result.settlements[0].from).toBe(userC);
    expect(result.settlements[0].to).toBe(userA);
    expect(result.settlements[0].amountPaise).toBe(100000);
  });

  it('Case 4: Custom uneven split — A pays ₹1500 (A ₹500, B ₹700, C ₹300)', () => {
    // A net: +₹1000 (+100000 paise)
    // B net: -₹700 (-70000 paise)
    // C net: -₹300 (-30000 paise)
    const entries = [
      {
        _id: 'entry1',
        paidById: userA,
        amountPaise: 150000,
        splitAmong: [
          { userId: userA, amountPaise: 50000 },
          { userId: userB, amountPaise: 70000 },
          { userId: userC, amountPaise: 30000 }
        ],
        isReversal: false
      }
    ];

    const result = SettleUpService.calculateSettlements(entries);
    expect(result.settlements).toHaveLength(2);
    const bToA = result.settlements.find(s => s.from === userB && s.to === userA);
    const cToA = result.settlements.find(s => s.from === userC && s.to === userA);
    expect(bToA.amountPaise).toBe(70000);
    expect(cToA.amountPaise).toBe(30000);
  });

  it('Case 5: Zero balance when all members paid their exact share', () => {
    const entries = [
      {
        _id: 'entry1',
        paidById: userA,
        amountPaise: 50000,
        splitAmong: [{ userId: userA, amountPaise: 50000 }],
        isReversal: false
      },
      {
        _id: 'entry2',
        paidById: userB,
        amountPaise: 50000,
        splitAmong: [{ userId: userB, amountPaise: 50000 }],
        isReversal: false
      }
    ];

    const result = SettleUpService.calculateSettlements(entries);
    expect(result.settlements).toHaveLength(0);
  });

  it('Case 6: Reversal entry neutralizes original expense from settlement calculation', () => {
    const entries = [
      {
        _id: 'erroneous_entry',
        paidById: userA,
        amountPaise: 500000, // ₹5000
        splitAmong: [
          { userId: userA, amountPaise: 250000 },
          { userId: userB, amountPaise: 250000 }
        ],
        isReversal: false
      },
      {
        _id: 'reversal_entry',
        paidById: userA,
        amountPaise: 500000,
        splitAmong: [
          { userId: userA, amountPaise: 250000 },
          { userId: userB, amountPaise: 250000 }
        ],
        isReversal: true,
        originalEntryId: 'erroneous_entry'
      }
    ];

    const result = SettleUpService.calculateSettlements(entries);
    // Because the entry was reversed, net balance is 0 and no settlements exist!
    expect(result.settlements).toHaveLength(0);
  });
});
