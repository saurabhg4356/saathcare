import { ExpenseLedger } from '../models/ExpenseLedger.js';
import { FamilyGroup } from '../models/FamilyGroup.js';
import { SPLIT_TYPE } from '../constants/splitType.js';
import { ApiError } from '../utils/apiError.js';
import { SettleUpService } from './settleUp.service.js';

export class ExpenseService {
  /**
   * Distributes total paise equally among participant IDs, distributing remainder paise evenly
   * @param {number} totalAmountPaise 
   * @param {Array<string>} participantIds 
   * @returns {Array<{ userId: string, amountPaise: number }>}
   */
  static calculateEqualSplit(totalAmountPaise, participantIds) {
    const n = participantIds.length;
    if (n === 0) return [];

    const baseAmount = Math.floor(totalAmountPaise / n);
    const remainder = totalAmountPaise % n;

    return participantIds.map((userId, index) => ({
      userId,
      // Distribute 1 extra paise to first `remainder` participants to ensure exact sum match
      amountPaise: baseAmount + (index < remainder ? 1 : 0)
    }));
  }

  /**
   * Appends an immutable expense entry to the ledger
   */
  static async recordExpense(familyGroupId, creatorUserId, {
    amountPaise,
    description,
    category,
    splitType = SPLIT_TYPE.EQUAL,
    participantIds = [],
    customSplits = []
  }) {
    const group = await FamilyGroup.findById(familyGroupId);
    if (!group) {
      throw ApiError.notFound('Family group not found');
    }

    const memberIdStrings = group.members.map(m => m.toString());

    let finalSplit = [];

    if (splitType === SPLIT_TYPE.EQUAL) {
      // Validate all participant IDs belong to the family
      for (const pId of participantIds) {
        if (!memberIdStrings.includes(pId.toString())) {
          throw ApiError.badRequest(`Participant ${pId} is not a member of this family group`);
        }
      }
      finalSplit = this.calculateEqualSplit(amountPaise, participantIds);
    } else {
      // Custom split validation
      for (const split of customSplits) {
        if (!memberIdStrings.includes(split.userId.toString())) {
          throw ApiError.badRequest(`Participant ${split.userId} is not a member of this family group`);
        }
      }
      finalSplit = customSplits;
    }

    const entry = new ExpenseLedger({
      familyGroupId,
      paidById: creatorUserId,
      amountPaise,
      description,
      category,
      splitType,
      splitAmong: finalSplit,
      isReversal: false,
      createdBy: creatorUserId
    });

    await entry.save();

    return ExpenseLedger.findById(entry._id)
      .populate('paidById', 'name email')
      .populate('splitAmong.userId', 'name email')
      .populate('createdBy', 'name email');
  }

  /**
   * Appends a reversing entry to offset a previous erroneous expense
   */
  static async reverseExpense(familyGroupId, expenseId, requestingUserId, reason) {
    const original = await ExpenseLedger.findOne({ _id: expenseId, familyGroupId });
    if (!original) {
      throw ApiError.notFound('Original expense record not found');
    }

    if (original.isReversal) {
      throw ApiError.badRequest('Cannot reverse an entry that is already a reversal');
    }

    // Check if previously reversed
    const existingReversal = await ExpenseLedger.findOne({
      familyGroupId,
      originalEntryId: expenseId,
      isReversal: true
    });

    if (existingReversal) {
      throw ApiError.badRequest('This expense has already been reversed');
    }

    const reversal = new ExpenseLedger({
      familyGroupId,
      paidById: original.paidById,
      amountPaise: original.amountPaise,
      description: `[REVERSED] ${original.description}`,
      category: original.category,
      splitType: original.splitType,
      splitAmong: original.splitAmong,
      isReversal: true,
      originalEntryId: original._id,
      reversalReason: reason,
      createdBy: requestingUserId
    });

    await reversal.save();

    return ExpenseLedger.findById(reversal._id)
      .populate('paidById', 'name email')
      .populate('splitAmong.userId', 'name email')
      .populate('originalEntryId')
      .populate('createdBy', 'name email');
  }

  /**
   * Retrieves the immutable financial history for a family group
   */
  static async getFamilyLedger(familyGroupId, { page = 1, limit = 50 }) {
    const filter = { familyGroupId };
    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      ExpenseLedger.find(filter)
        .populate('paidById', 'name email')
        .populate('splitAmong.userId', 'name email')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ExpenseLedger.countDocuments(filter)
    ]);

    return {
      entries,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  /**
   * Calculates net balances and minimal settlement transfers for the family group
   */
  static async getFamilySettlements(familyGroupId) {
    const [entries, group] = await Promise.all([
      ExpenseLedger.find({ familyGroupId }).sort({ createdAt: 1 }),
      FamilyGroup.findById(familyGroupId).populate('members', 'name email')
    ]);

    if (!group) {
      throw ApiError.notFound('Family group not found');
    }

    // Build directory of member user objects
    const userDirectory = new Map();
    for (const member of group.members) {
      userDirectory.set(member._id.toString(), {
        _id: member._id.toString(),
        name: member.name,
        email: member.email
      });
    }

    return SettleUpService.calculateSettlements(entries, userDirectory);
  }
}
