import { Router } from 'express';
import authRoutes from './auth.routes.js';
import resourceRoutes from './resource.routes.js';
import bookingRoutes from './booking.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import notificationRoutes from './notification.routes.js';
import { getDBStatus } from '../config/db.js';

const router = Router();

// Health Check
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    platform: 'RENTORA - Smart Institutional Resource Sharing Platform',
    version: '1.0.0',
    system: 'Operational',
    timestamp: new Date().toISOString(),
    status: 'ONLINE',
    database: getDBStatus(),
  });
});

// Database diagnostics
router.get('/db-status', (_req, res) => {
  res.status(200).json({
    success: true,
    database: getDBStatus(),
  });
});

// API Endpoints
router.use('/auth', authRoutes);
router.use('/resources', resourceRoutes);
router.use('/bookings', bookingRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);

export default router;
