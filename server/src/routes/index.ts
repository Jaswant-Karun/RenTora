import { Router } from 'express';
import authRoutes from './auth.routes.js';
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

// Auth Routes
router.use('/auth', authRoutes);

export default router;
