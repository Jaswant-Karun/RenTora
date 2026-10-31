"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const manager_controller_js_1 = require("../controllers/manager.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
// Strict RBAC Permission Enforcement: Only institution managers and admins
router.use(auth_middleware_js_1.authenticate);
router.use((0, auth_middleware_js_1.requireRole)(['manager', 'admin']));
// Stats & Analytics
router.get('/stats', manager_controller_js_1.getManagerStats);
// Resource Approvals
router.get('/resource-approvals', manager_controller_js_1.getResourceApprovals);
router.patch('/resource-approvals/:id', manager_controller_js_1.updateResourceApproval);
// User & Owner Verification
router.get('/users', manager_controller_js_1.getUsersForVerification);
router.patch('/users/:id/verify', manager_controller_js_1.toggleUserVerification);
// Booking Oversight
router.get('/bookings', manager_controller_js_1.getManagerBookings);
// Waiting-List Management
router.get('/waitlists', manager_controller_js_1.getManagerWaitlists);
router.post('/waitlists/:id/promote', manager_controller_js_1.promoteWaitlistBooking);
// Scheduling Conflicts
router.get('/conflicts', manager_controller_js_1.getSchedulingConflicts);
router.post('/conflicts/resolve', manager_controller_js_1.resolveConflict);
// Incidents
router.get('/incidents', manager_controller_js_1.getManagerIncidents);
router.patch('/incidents/:id', manager_controller_js_1.updateIncidentStatus);
// Disputes
router.get('/disputes', manager_controller_js_1.getManagerDisputes);
router.post('/disputes/:id/resolve', manager_controller_js_1.resolveDispute);
// Fair Allocation Policies
router.get('/fair-allocation', manager_controller_js_1.getFairAllocationSettings);
router.put('/fair-allocation', manager_controller_js_1.updateFairAllocationSettings);
// Institutional Audit Logs
router.get('/audit-logs', manager_controller_js_1.getManagerAuditLogs);
exports.default = router;
