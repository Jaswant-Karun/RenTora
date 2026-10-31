import { Router } from 'express';
import authRoutes from './auth.routes.js';
import resourceRoutes from './resource.routes.js';
import bookingRoutes from './booking.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import notificationRoutes from './notification.routes.js';
import ownerRoutes from './owner.routes.js';
import managerRoutes from './manager.routes.js';
import incidentRoutes from './incident.routes.js';
import auditLogRoutes from './auditLog.routes.js';
import aiRoutes from './ai.routes.js';
import adminRoutes from './admin.routes.js';
import fairShareRoutes from './fairShare.routes.js';
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
router.use('/owner', ownerRoutes);
router.use('/manager', managerRoutes);
router.use('/incidents', incidentRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/ai', aiRoutes);
router.use('/admin', adminRoutes);
router.use('/fairshare', fairShareRoutes);

export default router;
