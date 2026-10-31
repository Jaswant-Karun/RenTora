"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const booking_controller_js_1 = require("../controllers/booking.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
// All booking operations require an authenticated session
router.use(auth_middleware_js_1.authenticate);
// Transparent Waitlist Route
router.get('/waitlist', booking_controller_js_1.getTransparentWaitlist);
// Pre-check system diagnostics before submission (Step 3)
router.post('/pre-check', booking_controller_js_1.preCheckBooking);
// Submit booking request (Step 4 & 5)
router.post('/', booking_controller_js_1.createBooking);
// List current user's bookings (with dynamic overdue detection)
router.get('/', booking_controller_js_1.getMyBookings);
// Get single booking with full visual timeline & diagnostic details
router.get('/:id', booking_controller_js_1.getBookingById);
// Step 7: Custodian marks request under review
router.post('/:id/review', booking_controller_js_1.putBookingUnderReview);
// Step 7 & 8: Custodian approves request
router.post('/:id/approve', booking_controller_js_1.approveBookingRequest);
// Step 7: Custodian rejects request with mandatory reason
router.post('/:id/reject', booking_controller_js_1.rejectBookingRequest);
// Move request to priority waitlist
router.post('/:id/waitlist', booking_controller_js_1.waitlistBookingRequest);
// Step 9 & 10: Check-In & record initial condition (with photos & user confirmation)
router.post('/:id/check-in', booking_controller_js_1.checkInBooking);
// Step 12: User initiates check-out & records return condition
router.post('/:id/initiate-return', booking_controller_js_1.initiateReturn);
// Step 13 & 14: Custodian confirms return inspection & marks completed (with photos & owner confirmation)
router.post('/:id/confirm-return', booking_controller_js_1.confirmReturnAndComplete);
// Cancel booking with stated reason
router.post('/:id/cancel', booking_controller_js_1.cancelBooking);
// Manager override with mandatory reason
router.post('/:id/override', (0, auth_middleware_js_1.requireRole)(['manager', 'admin']), booking_controller_js_1.managerOverrideBooking);
exports.default = router;
