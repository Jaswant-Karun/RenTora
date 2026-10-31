import { Schema, model, Document, Types } from 'mongoose';

export type AuditAction =
  | 'RESOURCE_CREATION'
  | 'RESOURCE_UPDATE'
  | 'RESOURCE_ARCHIVED'
  | 'RESOURCE_DISABLED'
  | 'BOOKING_REQUEST'
  | 'BOOKING_APPROVAL'
  | 'BOOKING_REJECTION'
  | 'BOOKING_CANCELLATION'
  | 'BOOKING_ALTERNATIVE_SUGGESTED'
  | 'CHECK_IN'
  | 'CHECK_OUT'
  | 'CONDITION_REPORT'
  | 'CONDITION_REPORT_CHECK_IN'
  | 'CONDITION_REPORT_CHECK_OUT'
  | 'INCIDENT_REPORT'
  | 'INCIDENT_INVESTIGATION_UPDATE'
  | 'INCIDENT_HUMAN_DECISION'
  | 'INCIDENT_RESOLUTION'
  | 'MANAGER_DECISION'
  | 'MANAGER_OVERRIDE'
  | 'WAITLIST_ENQUEUE'
  | 'WAITLIST_PROMOTION'
  | 'FAIRSHARE_DECISION'
  | 'SLOT_RELEASE_NOTIFICATION';

export interface IAuditLog extends Document {
  action: AuditAction;
  entityType: 'Resource' | 'Booking' | 'ConditionReport' | 'Incident' | 'User' | 'Policy' | 'System';
  entityId?: string;
  entityTitle?: string;
  actorId?: Types.ObjectId;
  actorName: string;
  actorEmail?: string;
  actorRole: string;
  ipAddress?: string;
  details?: Record<string, any>;
  reason?: string;
  timestamp: Date;
  isImmutable: boolean;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    action: {
      type: String,
      required: true,
      index: true,
      enum: [
        'RESOURCE_CREATION',
        'RESOURCE_UPDATE',
        'RESOURCE_ARCHIVED',
        'RESOURCE_DISABLED',
        'BOOKING_REQUEST',
        'BOOKING_APPROVAL',
        'BOOKING_REJECTION',
        'BOOKING_CANCELLATION',
        'BOOKING_ALTERNATIVE_SUGGESTED',
        'CHECK_IN',
        'CHECK_OUT',
        'CONDITION_REPORT',
        'CONDITION_REPORT_CHECK_IN',
        'CONDITION_REPORT_CHECK_OUT',
        'INCIDENT_REPORT',
        'INCIDENT_INVESTIGATION_UPDATE',
        'INCIDENT_HUMAN_DECISION',
        'INCIDENT_RESOLUTION',
        'MANAGER_DECISION',
        'MANAGER_OVERRIDE',
        'WAITLIST_ENQUEUE',
        'WAITLIST_PROMOTION',
        'FAIRSHARE_DECISION',
        'SLOT_RELEASE_NOTIFICATION',
      ],
    },
    entityType: {
      type: String,
      required: true,
      index: true,
      enum: ['Resource', 'Booking', 'ConditionReport', 'Incident', 'User', 'Policy', 'System'],
    },
    entityId: {
      type: String,
      index: true,
    },
    entityTitle: {
      type: String,
      default: '',
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    actorName: {
      type: String,
      required: true,
    },
    actorEmail: {
      type: String,
    },
    actorRole: {
      type: String,
      required: true,
      default: 'system',
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    reason: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    isImmutable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // No updatedAt since audit entries cannot change
  }
);

// Enforce strict database-level immutability: Disallow updates and deletions
auditLogSchema.pre('updateOne', function (next) {
  next(new Error('IMMUTABILITY_VIOLATION: Audit log records are permanent and cannot be modified.'));
});

auditLogSchema.pre('updateMany', function (next) {
  next(new Error('IMMUTABILITY_VIOLATION: Audit log records are permanent and cannot be modified.'));
});

auditLogSchema.pre('findOneAndUpdate', function (next) {
  next(new Error('IMMUTABILITY_VIOLATION: Audit log records are permanent and cannot be modified.'));
});

auditLogSchema.pre('findOneAndDelete', function (next) {
  next(new Error('IMMUTABILITY_VIOLATION: Audit log records are permanent and cannot be deleted.'));
});

auditLogSchema.pre('deleteOne', function (next) {
  next(new Error('IMMUTABILITY_VIOLATION: Audit log records are permanent and cannot be deleted.'));
});

auditLogSchema.pre('deleteMany', function (next) {
  next(new Error('IMMUTABILITY_VIOLATION: Audit log records are permanent and cannot be deleted.'));
});

// Non-repudiation chronological and entity investigation indexes
auditLogSchema.index({ timestamp: -1, action: 1 });
auditLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);
