import { Router } from 'express';
import {
  reportIncident,
  getIncidents,
  getIncidentById,
  addInvestigationNote,
  recordDecision,
  resolveIncident,
  getIncidentConditionComparison,
} from '../controllers/incident.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

// Lifecycle 1 & 2: Report Incident & List
router.post('/', reportIncident);
router.get('/', getIncidents);

// Lifecycle 3 & 4: Get Incident Details & Condition Comparison
router.get('/:id', getIncidentById);
router.get('/:id/comparison', getIncidentConditionComparison);

// Lifecycle 5: Add Investigation Notes
router.post('/:id/investigate', addInvestigationNote);

// Lifecycle 6: Record Decision (Authorized Human Review Enforced)
router.post('/:id/decision', requireRole(['manager', 'admin', 'owner']), recordDecision);

// Lifecycle 7 & 8: Record Resolution & Full History
router.post('/:id/resolve', requireRole(['manager', 'admin', 'owner']), resolveIncident);

// Backward Compatibility
router.patch('/:id/review', requireRole(['manager', 'admin', 'owner']), resolveIncident);

export default router;
