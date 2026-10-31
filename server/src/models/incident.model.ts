import { Schema, model, Document, Types } from 'mongoose';

export type IncidentCategory =
  | 'equipment_damage'
  | 'delayed_return'
  | 'late_return'
  | 'missing_components'
  | 'equipment_malfunction'
  | 'safety_concerns'
  | 'disputes'
  | 'misuse'
  | 'scheduling_conflicts'
  | 'other';

export type IncidentStatus =
  | 'reported'
  | 'investigating'
  | 'decision_pending'
  | 'resolved'
  | 'dismissed';

export interface IInvestigationNote {
  authorId?: Types.ObjectId;
  authorName: string;
  authorRole: string;
  note: string;
  createdAt: Date;
}

export interface IIncidentDecision {
  outcome: 'no_fault' | 'user_responsible' | 'fair_wear_and_tear' | 'equipment_defect' | 'under_review';
  decidedBy: string;
  decidedAt: Date;
  rationale: string;
  sanctions?: string;
}

export interface IIncidentResolution {
  summary: string;
  resolvedBy: string;
  resolvedAt: Date;
  actionTaken: string;
}

export interface IIncident extends Document {
  incidentNumber: string;
  category: IncidentCategory;
  title: string;
  description: string;
  evidence: string[];
  bookingId?: Types.ObjectId;
  bookingReference?: string;
  resourceId?: Types.ObjectId;
  resourceName: string;
  conditionReportBeforeId?: Types.ObjectId;
  conditionReportAfterId?: Types.ObjectId;
  reportedBy: string;
  reportedByUserId?: Types.ObjectId;
  reportedByRole: string;
  userEmail: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: IncidentStatus;
  requiresHumanReview: boolean;
  investigationNotes: IInvestigationNote[];
  decision?: IIncidentDecision;
  resolution?: IIncidentResolution;
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
    incidentNumber: {
      type: String,
      unique: true,
      index: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'equipment_damage',
        'delayed_return',
        'late_return',
        'missing_components',
        'equipment_malfunction',
        'safety_concerns',
        'disputes',
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
    conditionReportBeforeId: {
      type: Schema.Types.ObjectId,
      ref: 'ConditionReport',
    },
    conditionReportAfterId: {
      type: Schema.Types.ObjectId,
      ref: 'ConditionReport',
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
      enum: ['reported', 'investigating', 'decision_pending', 'resolved', 'dismissed'],
      default: 'reported',
      index: true,
    },
    requiresHumanReview: {
      type: Boolean,
      default: true,
    },
    investigationNotes: [
      {
        authorId: { type: Schema.Types.ObjectId, ref: 'User' },
        authorName: { type: String, required: true },
        authorRole: { type: String, default: 'Investigator' },
        note: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    decision: {
      outcome: {
        type: String,
        enum: ['no_fault', 'user_responsible', 'fair_wear_and_tear', 'equipment_defect', 'under_review'],
      },
      decidedBy: { type: String },
      decidedAt: { type: Date },
      rationale: { type: String },
      sanctions: { type: String },
    },
    resolution: {
      summary: { type: String },
      resolvedBy: { type: String },
      resolvedAt: { type: Date },
      actionTaken: { type: String },
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

incidentSchema.pre('validate', function (next) {
  if (!this.incidentNumber) {
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    const timeSlice = Date.now().toString().slice(-4);
    this.incidentNumber = `INC-${year}-${timeSlice}${rand}`;
  }
  next();
});

incidentSchema.index({ status: 1, severity: 1, createdAt: -1 });
incidentSchema.index({ resourceId: 1, status: 1 });

export const Incident = model<IIncident>('Incident', incidentSchema);
