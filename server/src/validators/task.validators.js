import { z } from 'zod';
import { TASK_STATUS } from '../constants/taskStatus.js';

export const createTaskSchema = z.object({
  title: z
    .string({ required_error: 'Task title is required' })
    .trim()
    .min(2, 'Title must be at least 2 characters')
    .max(150, 'Title cannot exceed 150 characters'),
  description: z
    .string()
    .trim()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional()
    .default(''),
  assigneeId: z
    .string({ required_error: 'Assignee is required' })
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid assignee ID format'),
  dueAt: z
    .string({ required_error: 'Due date is required' })
    .datetime({ message: 'Due date must be a valid ISO datetime' })
});

export const taskQuerySchema = z.object({
  status: z
    .enum(Object.values(TASK_STATUS))
    .optional(),
  assigneeId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid assignee ID')
    .optional(),
  page: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .optional()
    .default('1'),
  limit: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .optional()
    .default('50')
});
