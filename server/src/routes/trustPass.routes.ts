import { Router } from 'express';
import {
  getTrustPassToken,
  verifyTrustPass,
  checkInTrustPass,
  checkOutTrustPass,
  getTrustPassHistory,
} from '../controllers/trustPass.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// All TrustPass routes require authentication
router.use(authenticate);

// 1. Generate or fetch TrustPass token (Borrower, Owner, Manager)
router.get('/token/:bookingId', getTrustPassToken);

// 2. Scan or Verify token on backend (Owners, Managers, Admins)
router.post('/verify', requireRole(['owner', 'manager', 'admin']), verifyTrustPass);

// 3. Confirm Handover Check-In (Owners, Managers, Admins)
router.post('/check-in', requireRole(['owner', 'manager', 'admin']), checkInTrustPass);

// 4. Confirm Return Check-Out (Owners, Managers, Admins)
router.post('/check-out', requireRole(['owner', 'manager', 'admin']), checkOutTrustPass);

// 5. Complete Transaction Lifecycle History
router.get('/history/:bookingId', getTrustPassHistory);

export default router;
