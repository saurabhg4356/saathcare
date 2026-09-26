import { InAppNotificationService } from '../services/inAppNotification.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';

export async function getNotifications(req, res, next) {
  try {
    const { page, limit, unreadOnly } = req.query;
    const result = await InAppNotificationService.getUserNotifications(req.user._id, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      unreadOnly: unreadOnly === 'true'
    });

    return res.status(200).json(
      new ApiResponse(200, result, 'Notifications retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
}

export async function markNotificationAsRead(req, res, next) {
  try {
    const { id } = req.params;
    const notification = await InAppNotificationService.markAsRead(id, req.user._id);

    if (!notification) {
      throw ApiError.notFound('Notification not found or unauthorized');
    }

    return res.status(200).json(
      new ApiResponse(200, notification, 'Notification marked as read')
    );
  } catch (error) {
    next(error);
  }
}

export async function markAllNotificationsAsRead(req, res, next) {
  try {
    const result = await InAppNotificationService.markAllAsRead(req.user._id);
    return res.status(200).json(
      new ApiResponse(200, result, 'All notifications marked as read')
    );
  } catch (error) {
    next(error);
  }
}
