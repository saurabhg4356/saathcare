import { z } from 'zod';
import { SPLIT_TYPE, EXPENSE_CATEGORIES } from '../constants/splitType.js';

export const createExpenseSchema = z
  .object({
    amountPaise: z
      .number({ required_error: 'Amount in paise is required' })
      .int('Amount in paise must be an integer')
      .positive('Amount must be greater than zero'),
    description: z
      .string({ required_error: 'Description is required' })
      .trim()
      .min(2, 'Description must be at least 2 characters')
      .max(250, 'Description cannot exceed 250 characters'),
    category: z
      .enum(Object.values(EXPENSE_CATEGORIES))
      .default(EXPENSE_CATEGORIES.OTHER),
    splitType: z
      .enum(Object.values(SPLIT_TYPE))
      .default(SPLIT_TYPE.EQUAL),
    // Required for equal split: list of user IDs to split among
    participantIds: z
      .array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid participant ID'))
      .min(1, 'At least one participant is required')
      .optional(),
    // Required for custom split
    customSplits: z
      .array(
        z.object({
          userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID in split'),
          amountPaise: z.number().int().positive('Split amount must be greater than zero')
        })
      )
      .optional()
  })
  .refine(
    (data) => {
      if (data.splitType === SPLIT_TYPE.CUSTOM) {
        if (!data.customSplits || data.customSplits.length === 0) return false;
        const totalSplit = data.customSplits.reduce((acc, curr) => acc + curr.amountPaise, 0);
        return totalSplit === data.amountPaise;
      }
      return true;
    },
    {
      message: 'For custom splits, the sum of split amounts must exactly match the total expense amount in paise',
      path: ['customSplits']
    }
  )
  .refine(
    (data) => {
      if (data.splitType === SPLIT_TYPE.EQUAL) {
        return !!data.participantIds && data.participantIds.length > 0;
      }
      return true;
    },
    {
      message: 'Participant IDs are required for equal splits',
      path: ['participantIds']
    }
  );

export const reverseExpenseSchema = z.object({
  reason: z
    .string({ required_error: 'Reversal reason is required' })
    .trim()
    .min(3, 'Reason must be at least 3 characters')
    .max(250, 'Reason cannot exceed 250 characters')
});
