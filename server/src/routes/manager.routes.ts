import { Router } from 'express';
import {
  getManagerStats,
  getResourceApprovals,
  updateResourceApproval,
  getUsersForVerification,
  toggleUserVerification,
  getSchedulingConflicts,
  resolveConflict,
  getManagerIncidents,
  updateIncidentStatus,
  getManagerDisputes,
  resolveDispute,
  getFairAllocationSettings,
  updateFairAllocationSettings,
} from '../controllers/manager.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// Strict RBAC Permission Enforcement: Only institution managers and admins
router.use(authenticate);
router.use(requireRole(['manager', 'admin']));

// Stats
router.get('/stats', getManagerStats);

// Resource Approvals
router.get('/resource-approvals', getResourceApprovals);
router.patch('/resource-approvals/:id', updateResourceApproval);

// User Verification
router.get('/users', getUsersForVerification);
router.patch('/users/:id/verify', toggleUserVerification);

// Scheduling Conflicts
router.get('/conflicts', getSchedulingConflicts);
router.post('/conflicts/resolve', resolveConflict);

// Incidents
router.get('/incidents', getManagerIncidents);
router.patch('/incidents/:id', updateIncidentStatus);

// Disputes
router.get('/disputes', getManagerDisputes);
router.post('/disputes/:id/resolve', resolveDispute);

// Fair Allocation Policies
router.get('/fair-allocation', getFairAllocationSettings);
router.put('/fair-allocation', updateFairAllocationSettings);

export default router;
