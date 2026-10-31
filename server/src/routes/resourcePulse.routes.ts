import { Router } from 'express';
import {
  getResourcePulseMetrics,
  exportResourcePulseCSV,
} from '../controllers/resourcePulse.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// Strict RBAC: Accessible only by institutional owners, managers, and system administrators
router.use(authenticate);
router.use(requireRole(['owner', 'manager', 'admin']));

// Get ResourcePulse Intelligence Metrics with Date Range Filters
router.get('/metrics', getResourcePulseMetrics);

// Export ResourcePulse CSV Report
router.get('/export', exportResourcePulseCSV);

export default router;
