import { Router } from 'express';
import {
  evaluateFairShare,
  getFairShareHistory,
  getFairSharePolicy,
  updateFairSharePolicy,
  managerOverrideAllocation,
  getResourceWaitlist,
} from '../controllers/fairShare.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// All FairShare operations require an authenticated user
router.use(authenticate);

// 1. Transparent Pre-Evaluation Endpoint (Available to all authenticated borrowers)
router.post('/evaluate', evaluateFairShare);

// 2. FairShare Decision History (Borrowers view their own; Managers view institution)
router.get('/history', getFairShareHistory);

// 3. Current Policy Configuration
router.get('/policy', getFairSharePolicy);

// 4. Update Policy (Managers and Admins only)
router.put('/policy', requireRole(['manager', 'admin']), updateFairSharePolicy);

// 5. Manager Override with Mandatory Reason (Managers and Admins only)
router.post('/override/:id', requireRole(['manager', 'admin']), managerOverrideAllocation);

// 6. Ordered Resource Waiting List
router.get('/waitlist/:resourceId', getResourceWaitlist);

export default router;
