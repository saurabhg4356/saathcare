/**
 * SettleUp Service — Deterministic Greedy Debt Minimization Engine
 * 
 * NOTE ON ALGORITHM:
 * This uses a greedy algorithm to settle balances by matching the largest creditor
 * with the largest debtor at each step. While NP-hard subset-sum minimization yields
 * the absolute theoretical minimum transfers in certain multi-party combinatorial splits,
 * this greedy heuristic executes in O(N log N) time, is strictly deterministic, and is
 * universally preferred for real-world peer expense platforms (e.g. Splitwise) for
 * intuitive, predictable settlement suggestions.
 */

export class SettleUpService {
  /**
   * Calculates net balances for all members from ledger entries, accounting for reversals
   * @param {Array<object>} ledgerEntries 
   * @returns {Map<string, { paidPaise: number, owedPaise: number, netPaise: number }>}
   */
  static computeNetBalances(ledgerEntries) {
    const balances = new Map();

    const ensureUser = (userId) => {
      const idStr = userId.toString();
      if (!balances.has(idStr)) {
        balances.set(idStr, { paidPaise: 0, owedPaise: 0, netPaise: 0 });
      }
      return balances.get(idStr);
    };

    // First, find all reversed entry IDs
    const reversedEntryIds = new Set();
    for (const entry of ledgerEntries) {
      if (entry.isReversal && entry.originalEntryId) {
        reversedEntryIds.add(entry.originalEntryId.toString());
      }
    }

    // Process all entries that are not reversals and have not been reversed
    for (const entry of ledgerEntries) {
      // If this entry was subsequently reversed, skip it
      if (reversedEntryIds.has(entry._id.toString())) {
        continue;
      }
      // If this entry itself is a reversal marker, skip it (the original is already skipped)
      if (entry.isReversal) {
        continue;
      }

      const payerId = entry.paidById.toString();
      const payerRecord = ensureUser(payerId);
      payerRecord.paidPaise += entry.amountPaise;

      for (const split of entry.splitAmong) {
        const participantId = split.userId.toString();
        const participantRecord = ensureUser(participantId);
        participantRecord.owedPaise += split.amountPaise;
      }
    }

    // Compute net = paid - owed
    for (const [userId, record] of balances.entries()) {
      record.netPaise = record.paidPaise - record.owedPaise;
    }

    return balances;
  }

  /**
   * Generates minimal recommended debt transfers using the greedy algorithm
   * @param {Array<object>} ledgerEntries 
   * @param {Map<string, object>} [userDirectory=new Map()] Optional map of userId -> userObj for populating names
   * @returns {{ balances: Array<object>, settlements: Array<{ from: string, to: string, amountPaise: number, fromUser?: object, toUser?: object }> }}
   */
  static calculateSettlements(ledgerEntries, userDirectory = new Map()) {
    const balanceMap = this.computeNetBalances(ledgerEntries);

    const debtors = [];  // People who owe money (netPaise < 0)
    const creditors = []; // People who should receive money (netPaise > 0)
    const balancesSummary = [];

    for (const [userId, record] of balanceMap.entries()) {
      const userMeta = userDirectory.get(userId) || { _id: userId, name: `User ${userId.slice(-4)}` };
      balancesSummary.push({
        userId,
        user: userMeta,
        paidPaise: record.paidPaise,
        owedPaise: record.owedPaise,
        netPaise: record.netPaise
      });

      if (record.netPaise < 0) {
        debtors.push({ userId, amount: Math.abs(record.netPaise) });
      } else if (record.netPaise > 0) {
        creditors.push({ userId, amount: record.netPaise });
      }
    }

    // Sort creditors descending by amount, debtors descending by amount owed
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    const settlements = [];
    let i = 0; // creditor index
    let j = 0; // debtor index

    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];

      // Settle the minimum of what debtor owes and creditor is owed
      const settledAmount = Math.min(creditor.amount, debtor.amount);

      if (settledAmount > 0) {
        settlements.push({
          from: debtor.userId,
          to: creditor.userId,
          amountPaise: settledAmount,
          fromUser: userDirectory.get(debtor.userId) || { _id: debtor.userId },
          toUser: userDirectory.get(creditor.userId) || { _id: creditor.userId }
        });

        creditor.amount -= settledAmount;
        debtor.amount -= settledAmount;
      }

      if (creditor.amount === 0) i++;
      if (debtor.amount === 0) j++;
    }

    return {
      balances: balancesSummary,
      settlements
    };
  }
}
