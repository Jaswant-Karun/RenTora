import { Response, NextFunction } from 'express';
import { Notification } from '../models/notification.model.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export const getNotifications = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    const query: any = {};
    if (user) {
      query.$or = [{ userId: user._id }, { targetRole: 'all' }, { targetRole: user.role }];
    }
    const notifications = await Notification.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};
