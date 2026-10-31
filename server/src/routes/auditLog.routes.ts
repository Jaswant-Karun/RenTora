import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditLog.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

// Read-only endpoint
router.get('/', getAuditLogs);

// Explicitly reject any modification attempts with policy violation responses
const rejectMutation = (_req: any, res: any) => {
  res.status(405).json({
    success: false,
    error: 'AUDIT_POLICY_VIOLATION',
    message: 'Institutional audit records are write-once, read-only immutable ledgers and cannot be altered or deleted via public APIs.',
  });
};

router.post('/', rejectMutation);
router.put('/*', rejectMutation);
router.patch('/*', rejectMutation);
router.delete('/*', rejectMutation);

export default router;
