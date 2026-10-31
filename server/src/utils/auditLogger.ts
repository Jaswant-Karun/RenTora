import { AuditLog, AuditAction } from '../models/auditLog.model.js';
import { Types } from 'mongoose';

export interface AuditLogParams {
  action: AuditAction;
  entityType: 'Resource' | 'Booking' | 'ConditionReport' | 'Incident' | 'User' | 'Policy' | 'System';
  entityId?: string | Types.ObjectId;
  entityTitle?: string;
  actorId?: string | Types.ObjectId;
  actorName: string;
  actorEmail?: string;
  actorRole: string;
  ipAddress?: string;
  details?: Record<string, any>;
  reason?: string;
}

/**
 * Creates an immutable audit log entry in the centralized institutional ledger.
 * Cannot be modified or deleted once recorded.
 */
export const recordAuditLog = async (params: AuditLogParams): Promise<void> => {
  try {
    await AuditLog.create({
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ? params.entityId.toString() : undefined,
      entityTitle: params.entityTitle || '',
      actorId: params.actorId ? new Types.ObjectId(params.actorId.toString()) : undefined,
      actorName: params.actorName || 'System',
      actorEmail: params.actorEmail,
      actorRole: params.actorRole || 'system',
      ipAddress: params.ipAddress || '127.0.0.1',
      details: params.details || {},
      reason: params.reason,
      timestamp: new Date(),
      isImmutable: true,
    });
  } catch (error) {
    // Audit failure should be logged to console but not crash caller flow unless critical
    console.error('Failed to write immutable audit log entry:', error);
  }
};
