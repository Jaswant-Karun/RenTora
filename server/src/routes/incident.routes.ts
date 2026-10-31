import { Router } from 'express';
import {
  reportIncident,
  getIncidents,
  getIncidentById,
  reviewIncident,
} from '../controllers/incident.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

// Public authenticated reporting & listing
router.post('/', reportIncident);
router.get('/', getIncidents);
router.get('/:id', getIncidentById);

// Manager / Custodian / Admin Review
router.patch('/:id/review', requireRole(['manager', 'admin', 'owner']), reviewIncident);

export default router;
