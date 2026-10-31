import { Router } from 'express';
import {
  preCheckBooking,
  createBooking,
  getMyBookings,
  getBookingById,
  putBookingUnderReview,
  approveBookingRequest,
  rejectBookingRequest,
  waitlistBookingRequest,
  checkInBooking,
  initiateReturn,
  confirmReturnAndComplete,
  cancelBooking,
} from '../controllers/booking.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// All booking operations require an authenticated session
router.use(authenticate);

// Pre-check system diagnostics before submission (Step 3)
router.post('/pre-check', preCheckBooking);

// Submit booking request (Step 4 & 5)
router.post('/', createBooking);

// List current user's bookings (with dynamic overdue detection)
router.get('/', getMyBookings);

// Get single booking with full visual timeline & audit logs
router.get('/:id', getBookingById);

// Step 7: Custodian marks request under review
router.post('/:id/review', putBookingUnderReview);

// Step 7 & 8: Custodian approves request
router.post('/:id/approve', approveBookingRequest);

// Step 7: Custodian rejects request with mandatory reason
router.post('/:id/reject', rejectBookingRequest);

// Move request to priority waitlist
router.post('/:id/waitlist', waitlistBookingRequest);

// Step 9 & 10: Check-In & record initial condition
router.post('/:id/check-in', checkInBooking);

// Step 12: User initiates check-out & records return condition
router.post('/:id/initiate-return', initiateReturn);

// Step 13 & 14: Custodian confirms return inspection & marks completed
router.post('/:id/confirm-return', confirmReturnAndComplete);

// Cancel booking with stated reason
router.post('/:id/cancel', cancelBooking);

export default router;
