import { Task } from '../models/Task.js';
import { FamilyGroup } from '../models/FamilyGroup.js';
import { TASK_STATUS } from '../constants/taskStatus.js';
import { ApiError } from '../utils/apiError.js';
import { NotificationService } from './notification.service.js';
import { NOTIFICATION_TYPE } from '../models/NotificationOutbox.js';
import { EmailService } from './email/index.js';
import { InAppNotificationService } from './inAppNotification.service.js';

export class TaskService {
  /**
   * Creates a new elder-care task within a family group
   */
  static async createTask(familyGroupId, creatorUserId, { title, description, assigneeId, dueAt }) {
    // Verify assignee belongs to the family group
    const isMember = await FamilyGroup.exists({
      _id: familyGroupId,
      members: assigneeId
    });

    if (!isMember) {
      throw ApiError.badRequest('Task assignee must be a member of this family group');
    }

    const task = new Task({
      familyGroupId,
      title,
      description: description || '',
      assigneeId,
      dueAt: new Date(dueAt),
      status: TASK_STATUS.PENDING,
      createdBy: creatorUserId
    });

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assigneeId', 'name email')
      .populate('createdBy', 'name email');

    // Queue in-app notification for assignee
    try {
      if (populatedTask.assigneeId?._id) {
        await InAppNotificationService.createNotification({
          userId: populatedTask.assigneeId._id,
          familyGroupId,
          title: 'New Care Duty Assigned',
          message: `You were assigned duty: "${populatedTask.title}"`,
          type: 'TASK_ASSIGNED',
          link: '/tasks'
        });
      }
    } catch (notifErr) {
      // Non-blocking
    }

    // Asynchronously queue notification to assignee via Outbox
    try {
      if (populatedTask.assigneeId?.email) {
        const family = await FamilyGroup.findById(familyGroupId);
        const dueFormatted = new Date(populatedTask.dueAt).toLocaleString();
        const template = EmailService.getTaskAssignedTemplate({
          taskTitle: populatedTask.title,
          dueAtFormatted: dueFormatted,
          careRecipientName: family?.careRecipient?.name || 'Care Recipient',
          groupName: family?.name || 'Care Group'
        });

        await NotificationService.enqueue({
          type: NOTIFICATION_TYPE.TASK_ASSIGNED,
          recipient: populatedTask.assigneeId.email,
          familyGroupId,
          userId: populatedTask.assigneeId._id,
          payload: template
        });
      }
    } catch (notifErr) {
      // Non-blocking
    }

    return populatedTask;
  }

  /**
   * Lists tasks with filters and pagination
   */
  static async getFamilyTasks(familyGroupId, { status, assigneeId, page = 1, limit = 50 }) {
    const filter = { familyGroupId };

    if (status) {
      filter.status = status;
    }
    if (assigneeId) {
      filter.assigneeId = assigneeId;
    }

    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('assigneeId', 'name email')
        .populate('completedBy', 'name email')
        .populate('createdBy', 'name email')
        .sort({ dueAt: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Task.countDocuments(filter)
    ]);

    return {
      tasks,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  /**
   * Retrieves single task by ID
   */
  static async getTaskById(familyGroupId, taskId) {
    const task = await Task.findOne({ _id: taskId, familyGroupId })
      .populate('assigneeId', 'name email')
      .populate('completedBy', 'name email')
      .populate('createdBy', 'name email');

    if (!task) {
      throw ApiError.notFound('Task not found');
    }
    return task;
  }

  /**
   * Marks a task as COMPLETED with state transition protection
   */
  static async completeTask(familyGroupId, taskId, completedByUserId) {
    const task = await Task.findOne({ _id: taskId, familyGroupId });
    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    if (task.status === TASK_STATUS.COMPLETED) {
      // Idempotent return
      return Task.findById(task._id)
        .populate('assigneeId', 'name email')
        .populate('completedBy', 'name email')
        .populate('createdBy', 'name email');
    }

    if (task.status === TASK_STATUS.MISSED) {
      throw ApiError.badRequest('Cannot complete a missed task. Missed tasks are permanent historical records.');
    }

    task.status = TASK_STATUS.COMPLETED;
    task.completedBy = completedByUserId;
    task.completedAt = new Date();

    await task.save();

    // Notify task creator if someone else completed it
    try {
      if (task.createdBy && task.createdBy.toString() !== completedByUserId.toString()) {
        await InAppNotificationService.createNotification({
          userId: task.createdBy,
          familyGroupId,
          title: 'Care Duty Completed',
          message: `Duty "${task.title}" has been marked completed.`,
          type: 'TASK_COMPLETED',
          link: '/tasks'
        });
      }
    } catch (notifErr) {
      // Non-blocking
    }

    return Task.findById(task._id)
      .populate('assigneeId', 'name email')
      .populate('completedBy', 'name email')
      .populate('createdBy', 'name email');
  }
}
