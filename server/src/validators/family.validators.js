import { z } from 'zod';

export const createFamilyGroupSchema = z.object({
  careRecipientName: z
    .string({ required_error: 'Care recipient name is required' })
    .trim()
    .min(2, 'Care recipient name must be at least 2 characters')
    .max(100, 'Care recipient name cannot exceed 100 characters'),
  groupName: z
    .string()
    .trim()
    .max(120, 'Group name cannot exceed 120 characters')
    .optional()
});

export const createInviteSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Invalid email address format')
});
