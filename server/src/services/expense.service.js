import { ExpenseLedger } from '../models/ExpenseLedger.js';
import { FamilyGroup } from '../models/FamilyGroup.js';
import { SPLIT_TYPE } from '../constants/splitType.js';
import { ApiError } from '../utils/apiError.js';
import { SettleUpService } from './settleUp.service.js';
import { StorageService } from './storage/index.js';
import { NotificationService } from './notification.service.js';
import { NOTIFICATION_TYPE } from '../models/NotificationOutbox.js';
import { EmailService } from './email/index.js';

export class ExpenseService {
  /**
   * Distributes total paise equally among participant IDs, distributing remainder paise evenly
   */
  static calculateEqualSplit(totalAmountPaise, participantIds) {
    const n = participantIds.length;
    if (n === 0) return [];

    const baseAmount = Math.floor(totalAmountPaise / n);
    const remainder = totalAmountPaise % n;

    return participantIds.map((userId, index) => ({
      userId,
      amountPaise: baseAmount + (index < remainder ? 1 : 0)
    }));
  }

  /**
   * Appends an immutable expense entry to the ledger with optional attachment metadata
   */
  static async recordExpense(familyGroupId, creatorUserId, {
    amountPaise,
    description,
    category,
    splitType = SPLIT_TYPE.EQUAL,
    participantIds = [],
    customSplits = [],
    attachment = null
  }) {
    const group = await FamilyGroup.findById(familyGroupId).populate('members', 'name email');
    if (!group) {
      throw ApiError.notFound('Family group not found');
    }

    const memberIdStrings = group.members.map(m => m._id.toString());

    let finalSplit = [];

    if (splitType === SPLIT_TYPE.EQUAL) {
      for (const pId of participantIds) {
        if (!memberIdStrings.includes(pId.toString())) {
          throw ApiError.badRequest(`Participant ${pId} is not a member of this family group`);
        }
      }
      finalSplit = this.calculateEqualSplit(amountPaise, participantIds);
    } else {
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
      attachment: attachment ? {
        url: attachment.url,
        key: attachment.key,
        contentType: attachment.contentType,
        originalName: attachment.originalName,
        sizeBytes: attachment.sizeBytes
      } : null,
      isReversal: false,
      createdBy: creatorUserId
    });

    await entry.save();

    const savedEntry = await ExpenseLedger.findById(entry._id)
      .populate('paidById', 'name email')
      .populate('splitAmong.userId', 'name email')
      .populate('createdBy', 'name email');

    // Asynchronously queue notification to family members (except creator) via Outbox
    try {
      const payerName = savedEntry.paidById?.name || 'A family member';
      const amountRupees = `₹${(amountPaise / 100).toFixed(2)}`;
      const template = EmailService.getExpenseAddedTemplate({
        payerName,
        amountFormatted: amountRupees,
        description,
        groupName: group.name
      });

      for (const member of group.members) {
        if (member._id.toString() !== creatorUserId.toString() && member.email) {
          await NotificationService.enqueue({
            type: NOTIFICATION_TYPE.EXPENSE_ADDED,
            recipient: member.email,
            familyGroupId: group._id,
            userId: member._id,
            payload: template
          });
        }
      }
    } catch (notifErr) {
      // Non-blocking rule: Notification error does not fail the primary ledger record
    }

    return savedEntry;
  }

  /**
   * Uploads receipt file to configured storage provider
   */
  static async uploadReceipt(file) {
    if (!file) {
      throw ApiError.badRequest('No receipt file provided');
    }
    return StorageService.upload(file);
  }

  /**
   * Generates a secure, temporary access URL for an expense receipt
   */
  static async getReceiptUrl(familyGroupId, expenseId, requestingUserId) {
    const expense = await ExpenseLedger.findOne({ _id: expenseId, familyGroupId });
    if (!expense) {
      throw ApiError.notFound('Expense record not found');
    }

    if (!expense.attachment || !expense.attachment.key) {
      throw ApiError.notFound('No receipt attached to this expense');
    }

    const signedUrl = await StorageService.getSignedUrl(expense.attachment.key);
    return {
      signedUrl,
      attachment: expense.attachment
    };
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
