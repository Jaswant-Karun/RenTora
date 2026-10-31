import { Schema, model, Document, Types } from 'mongoose';

export type IncidentCategory =
  | 'equipment_damage'
  | 'late_return'
  | 'missing_components'
  | 'misuse'
  | 'scheduling_conflicts'
  | 'other';

export type IncidentStatus = 'reported' | 'investigating' | 'resolved' | 'dismissed';

export interface IIncident extends Document {
  category: IncidentCategory;
  title: string;
  description: string;
  evidence: string[];
  bookingId?: Types.ObjectId;
  bookingReference?: string;
  resourceId?: Types.ObjectId;
  resourceName: string;
  reportedBy: string;
  reportedByUserId?: Types.ObjectId;
  reportedByRole: string;
  userEmail: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: IncidentStatus;
  managerResponse?: string;
  resolutionNotes?: string;
  sanctionsApplied?: string;
  actionTaken?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const incidentSchema = new Schema<IIncident>(
  {
    category: {
      type: String,
      enum: [
        'equipment_damage',
        'late_return',
        'missing_components',
        'misuse',
        'scheduling_conflicts',
        'other',
      ],
      default: 'other',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Incident description is required'],
      trim: true,
    },
    evidence: {
      type: [String],
      default: [],
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      index: true,
    },
    bookingReference: {
      type: String,
      default: '',
      trim: true,
    },
    resourceId: {
      type: Schema.Types.ObjectId,
      ref: 'Resource',
      index: true,
    },
    resourceName: {
      type: String,
      required: true,
      default: 'General Resource',
    },
    reportedBy: {
      type: String,
      required: true,
    },
    reportedByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    reportedByRole: {
      type: String,
      default: 'student',
    },
    userEmail: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true,
    },
    status: {
      type: String,
      enum: ['reported', 'investigating', 'resolved', 'dismissed'],
      default: 'reported',
      index: true,
    },
    managerResponse: {
      type: String,
      default: '',
    },
    resolutionNotes: {
      type: String,
      default: '',
    },
    sanctionsApplied: {
      type: String,
      default: 'none',
    },
    actionTaken: {
      type: String,
      default: '',
    },
    resolvedAt: Date,
    resolvedBy: String,
  },
  {
    timestamps: true,
  }
);

export const Incident = model<IIncident>('Incident', incidentSchema);
