"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const owner_controller_js_1 = require("../controllers/owner.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
// Strict RBAC Permission Enforcement: Only resource owners, managers, and admins
router.use(auth_middleware_js_1.authenticate);
router.use((0, auth_middleware_js_1.requireRole)(['owner', 'manager', 'admin']));
// Overview
router.get('/overview', owner_controller_js_1.getOwnerOverview);
// Resources
router.get('/resources', owner_controller_js_1.getOwnerResources);
router.post('/resources', owner_controller_js_1.addOwnerResource);
router.patch('/resources/:id', owner_controller_js_1.updateOwnerResource);
router.delete('/resources/:id', owner_controller_js_1.deleteOwnerResource);
// Bookings & Approvals
router.get('/bookings', owner_controller_js_1.getOwnerBookings);
router.post('/bookings/:id/approve', owner_controller_js_1.approveBooking);
router.post('/bookings/:id/reject', owner_controller_js_1.rejectBooking);
router.post('/bookings/:id/cancel', owner_controller_js_1.cancelBookingByOwner);
router.post('/bookings/:id/waitlist', owner_controller_js_1.moveBookingToWaitlist);
// Check-in / Check-out
router.post('/checkin-checkout', owner_controller_js_1.handleCheckInCheckOut);
// Condition Reports
router.get('/condition-reports', owner_controller_js_1.getConditionReports);
router.post('/condition-reports', owner_controller_js_1.createConditionReport);
// Incidents
router.get('/incidents', owner_controller_js_1.getOwnerIncidents);
router.post('/incidents', owner_controller_js_1.createIncident);
exports.default = router;
