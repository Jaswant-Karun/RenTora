import { Router } from 'express';
import { EcoShareController } from '../controllers/ecoShare.controller.js';
import { authenticate, optionalAuth, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// GET /api/ecoshare/insights - Retrieve institutional sustainability metrics and estimates
router.get('/insights', optionalAuth, EcoShareController.getInsights);

// GET /api/ecoshare/assumptions - Retrieve current assumption parameters
router.get('/assumptions', optionalAuth, EcoShareController.getAssumptions);

// PUT /api/ecoshare/assumptions - Update assumptions (Manager / Admin only)
router.put(
  '/assumptions',
  authenticate,
  requireRole(['manager', 'admin']),
  EcoShareController.updateAssumptions
);

// GET /api/ecoshare/export - Download full sustainability impact report as CSV
router.get('/export', optionalAuth, EcoShareController.exportReport);

export default router;
