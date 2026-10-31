import { Router } from 'express';
import { getMyBookings, createBooking, updateBookingStatus } from '../controllers/booking.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getMyBookings);
router.post('/', createBooking);
router.patch('/:id/status', updateBookingStatus);

export default router;
