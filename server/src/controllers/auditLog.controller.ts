import { Response, NextFunction } from 'express';
import { AuditLog } from '../models/auditLog.model.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

/**
 * Read-only retrieval of institutional audit logs.
 * Strictly no write/update/delete endpoints exist in this controller.
 */
export const getAuditLogs = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { action, entityType, entityId, limit = 100, page = 1 } = req.query;

    const query: any = {};
    if (action) query.action = action;
    if (entityType) query.entityType = entityType;
    if (entityId) query.entityId = entityId;

    // Students can only see audit records where they were the actor or related entity
    if (req.user?.role === 'student') {
      query.$or = [{ actorId: req.user._id }, { 'details.userId': req.user._id }];
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(200, Math.max(1, Number(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort({ timestamp: -1 }).skip(skip).limit(limitNum),
      AuditLog.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
      ledgerNotice: 'RENTORA Centralized Trust & Safety Ledger (Immutable WORM Record)',
    });
  } catch (error) {
    next(error);
  }
};
