import { Router } from 'express';
import { getResources, getResourceById, createResource } from '../controllers/resource.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', getResources);
router.get('/:id', getResourceById);
router.post('/', authenticate, createResource);

export default router;
