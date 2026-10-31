import { Router } from 'express';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  triggerNotificationCheck,
} from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getNotifications);
router.post('/mark-all-read', markAllNotificationsRead);
router.post('/trigger-check', triggerNotificationCheck);
router.patch('/:id/read', markNotificationRead);

export default router;
