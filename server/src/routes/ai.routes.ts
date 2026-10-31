import { Router } from 'express';
import {
  matchResourcesController,
  getUtilizationAnalyticsController,
  detectConflictsController,
  summarizeIncidentController,
  getAiStatusController,
} from '../controllers/ai.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Public / Health / Status
router.get('/status', getAiStatusController);

// FEATURE 1: SMART RESOURCE MATCHING (supports user profile context when available)
router.post('/match-resources', optionalAuth, matchResourcesController);

// FEATURE 2: RESOURCE UTILIZATION ANALYTICS
router.get('/utilization-analytics', optionalAuth, getUtilizationAnalyticsController);

// FEATURE 3: SCHEDULING CONFLICT DETECTION
router.post('/detect-conflicts', optionalAuth, detectConflictsController);

// FEATURE 4: INCIDENT SUMMARY ASSISTANT (requires authenticated session)
router.post('/summarize-incident', authenticate, summarizeIncidentController);

export default router;
