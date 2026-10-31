import { Router } from 'express';
import {
  getAdminOverview,
  getAdminUsers,
  updateAdminUserRole,
  deleteAdminUser,
  getAdminResources,
  updateAdminResource,
  deleteAdminResource,
  getAdminInstitutions,
  createAdminInstitution,
  getAdminSettings,
  updateAdminSettings,
} from '../controllers/admin.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// Strict RBAC Permission Guard: Exclusively accessible to system Administrators
router.use(authenticate);
router.use(requireRole(['admin']));

// Overview Metrics
router.get('/overview', getAdminOverview);

// User Management
router.get('/users', getAdminUsers);
router.patch('/users/:id/role', updateAdminUserRole);
router.delete('/users/:id', deleteAdminUser);

// Resource Management
router.get('/resources', getAdminResources);
router.patch('/resources/:id', updateAdminResource);
router.delete('/resources/:id', deleteAdminResource);

// Institution Management
router.get('/institutions', getAdminInstitutions);
router.post('/institutions', createAdminInstitution);

// System Settings
router.get('/settings', getAdminSettings);
router.put('/settings', updateAdminSettings);

export default router;
