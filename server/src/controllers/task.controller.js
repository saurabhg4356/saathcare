import { TaskService } from '../services/task.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { SocketEmitter } from '../sockets/socketEmitter.js';

export class TaskController {
  static async createTask(req, res, next) {
    try {
      const task = await TaskService.createTask(
        req.params.familyGroupId,
        req.user._id,
        req.body
      );

      // Real-time broadcast to family room
      SocketEmitter.emitTaskCreated(req.params.familyGroupId, task);

      return res.status(201).json(
        ApiResponse.success(task, 'Task created successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  static async getTasks(req, res, next) {
    try {
      const result = await TaskService.getFamilyTasks(
        req.params.familyGroupId,
        req.query
      );
      return res.status(200).json(
        ApiResponse.success(result.tasks, 'Tasks retrieved successfully', result.pagination)
      );
    } catch (error) {
      next(error);
    }
  }

  static async getTask(req, res, next) {
    try {
      const task = await TaskService.getTaskById(
        req.params.familyGroupId,
        req.params.taskId
      );
      return res.status(200).json(
        ApiResponse.success(task, 'Task retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  static async completeTask(req, res, next) {
    try {
      const task = await TaskService.completeTask(
        req.params.familyGroupId,
        req.params.taskId,
        req.user._id
      );

      // Real-time broadcast to family room
      SocketEmitter.emitTaskCompleted(req.params.familyGroupId, task);

      return res.status(200).json(
        ApiResponse.success(task, 'Task marked as completed')
      );
    } catch (error) {
      next(error);
    }
  }
}
