import { Router } from 'express';
import {
  recordBeforeCheckIn,
  recordAfterCheckOut,
  getComparison,
  getConditionReports,
} from '../controllers/conditionGuard.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

// 1. Before Check-in: Record pre-use condition & baseline
router.post('/before-checkin', recordBeforeCheckIn);

// 2. After Check-out: Record post-use condition & compute differences
router.post('/after-checkout', recordAfterCheckOut);

// 3. Side-by-side Before/After Comparison
router.get('/comparison/:bookingId', getComparison);

// 4. List Condition Reports
router.get('/reports', getConditionReports);

export default router;
