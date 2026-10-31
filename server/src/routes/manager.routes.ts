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
  getManagerBookings,
  getManagerWaitlists,
  promoteWaitlistBooking,
  getManagerAuditLogs,
} from '../controllers/manager.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// Strict RBAC Permission Enforcement: Only institution managers and admins
router.use(authenticate);
router.use(requireRole(['manager', 'admin']));

// Stats & Analytics
router.get('/stats', getManagerStats);

// Resource Approvals
router.get('/resource-approvals', getResourceApprovals);
router.patch('/resource-approvals/:id', updateResourceApproval);

// User & Owner Verification
router.get('/users', getUsersForVerification);
router.patch('/users/:id/verify', toggleUserVerification);

// Booking Oversight
router.get('/bookings', getManagerBookings);

// Waiting-List Management
router.get('/waitlists', getManagerWaitlists);
router.post('/waitlists/:id/promote', promoteWaitlistBooking);

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

// Institutional Audit Logs
router.get('/audit-logs', getManagerAuditLogs);

export default router;
