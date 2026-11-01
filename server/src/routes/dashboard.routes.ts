import { Router } from 'express';
import { getDashboardData, globalSearch } from '../controllers/dashboard.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticate, getDashboardData);
router.get('/global-search', optionalAuth, globalSearch);

export default router;
