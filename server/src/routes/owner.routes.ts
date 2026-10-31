import { Router } from 'express';
import {
  getOwnerOverview,
  addOwnerResource,
  getOwnerResources,
  updateOwnerResource,
  deleteOwnerResource,
  getOwnerBookings,
  approveBooking,
  rejectBooking,
  cancelBookingByOwner,
  moveBookingToWaitlist,
  handleCheckInCheckOut,
  getConditionReports,
  createConditionReport,
  getOwnerIncidents,
  createIncident,
} from '../controllers/owner.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// Strict RBAC Permission Enforcement: Only resource owners, managers, and admins
router.use(authenticate);
router.use(requireRole(['owner', 'manager', 'admin']));

// Overview
router.get('/overview', getOwnerOverview);

// Resources
router.get('/resources', getOwnerResources);
router.post('/resources', addOwnerResource);
router.patch('/resources/:id', updateOwnerResource);
router.delete('/resources/:id', deleteOwnerResource);

// Bookings & Approvals
router.get('/bookings', getOwnerBookings);
router.post('/bookings/:id/approve', approveBooking);
router.post('/bookings/:id/reject', rejectBooking);
router.post('/bookings/:id/cancel', cancelBookingByOwner);
router.post('/bookings/:id/waitlist', moveBookingToWaitlist);

// Check-in / Check-out
router.post('/checkin-checkout', handleCheckInCheckOut);

// Condition Reports
router.get('/condition-reports', getConditionReports);
router.post('/condition-reports', createConditionReport);

// Incidents
router.get('/incidents', getOwnerIncidents);
router.post('/incidents', createIncident);

export default router;
