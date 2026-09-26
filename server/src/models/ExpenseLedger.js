import mongoose from 'mongoose';
import { SPLIT_TYPE, EXPENSE_CATEGORIES } from '../constants/splitType.js';

const splitItemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID in split is required']
    },
    amountPaise: {
      type: Number,
      required: [true, 'Split amount in paise is required'],
      min: [1, 'Split amount must be at least 1 paise']
    }
  },
  { _id: false }
);

const expenseLedgerSchema = new mongoose.Schema(
  {
    familyGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FamilyGroup',
      required: [true, 'Family group ID is required'],
      index: true
    },
    paidById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'PaidBy user ID is required'],
      index: true
    },
    amountPaise: {
      type: Number,
      required: [true, 'Amount in paise is required'],
      min: [1, 'Amount must be greater than zero']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [250, 'Description cannot exceed 250 characters']
    },
    category: {
      type: String,
      enum: Object.values(EXPENSE_CATEGORIES),
      default: EXPENSE_CATEGORIES.OTHER
    },
    splitType: {
      type: String,
      enum: Object.values(SPLIT_TYPE),
      default: SPLIT_TYPE.EQUAL
    },
    splitAmong: {
      type: [splitItemSchema],
      required: [true, 'Split breakdown is required'],
      validate: {
        validator: function (splits) {
          if (!splits || splits.length === 0) return false;
          const totalSplit = splits.reduce((acc, curr) => acc + curr.amountPaise, 0);
          return totalSplit === this.amountPaise;
        },
        message: 'Sum of split amounts must exactly equal the total expense amount'
      }
    },
    isReversal: {
      type: Boolean,
      default: false
    },
    originalEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExpenseLedger',
      default: null
    },
    reversalReason: {
      type: String,
      default: null,
      maxlength: [250, 'Reversal reason cannot exceed 250 characters']
    },
    attachment: {
      url: { type: String, default: null },
      key: { type: String, default: null },
      contentType: { type: String, default: null },
      originalName: { type: String, default: null },
      sizeBytes: { type: Number, default: null }
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'CreatedBy user ID is required']
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Append-only: No updatedAt
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// High performance index for retrieving chronological family expense history
expenseLedgerSchema.index({ familyGroupId: 1, createdAt: -1 });

// ============================================================================
// IMMUTABILITY GUARDS (DATABASE LAYER)
// Block any update or delete operations on ExpenseLedger documents
// ============================================================================

const blockMutation = function (next) {
  const err = new Error('MUTATION_FORBIDDEN: ExpenseLedger is an append-only ledger. Records cannot be updated or deleted. Use reversals instead.');
  next(err);
};

expenseLedgerSchema.pre('updateOne', blockMutation);
expenseLedgerSchema.pre('updateMany', blockMutation);
expenseLedgerSchema.pre('findOneAndUpdate', blockMutation);
expenseLedgerSchema.pre('findByIdAndUpdate', blockMutation);
expenseLedgerSchema.pre('deleteOne', blockMutation);
expenseLedgerSchema.pre('deleteMany', blockMutation);
expenseLedgerSchema.pre('findOneAndDelete', blockMutation);
expenseLedgerSchema.pre('findByIdAndDelete', blockMutation);

export const ExpenseLedger = mongoose.model('ExpenseLedger', expenseLedgerSchema);
