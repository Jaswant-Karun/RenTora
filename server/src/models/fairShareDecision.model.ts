import { Schema, model, Document, Types } from 'mongoose';

export interface IFairShareExplanation {
  eligibilityResult: {
    passed: boolean;
    membershipVerified: boolean;
    trainingSatisfied: boolean;
    qualificationSatisfied: boolean;
    details: string;
  };
  availabilityResult: {
    passed: boolean;
    resourceStatus: string;
    details: string;
  };
  conflictResult: {
    hasConflict: boolean;
    conflictingBookingId?: string;
    conflictingUser?: string;
    conflictingSlot?: string;
    details: string;
  };
  priorityRule: {
    appliedRule: string;
    priorityTier: string;
    score: number;
    factors: string[];
    details: string;
  };
  activeLimitResult: {
    passed: boolean;
    currentActiveCount: number;
    maxAllowed: number;
    details: string;
  };
  previousUsageResult: {
    passed: boolean;
    recentBookingsCount: number;
    recentHoursLogged: number;
    cooldownPeriodDays: number;
    details: string;
  };
  finalDecision: 'APPROVED' | 'PENDING_REVIEW' | 'WAITLISTED' | 'REJECTED';
  reason: string;
  timestamp: Date;
}

export interface IFairShareDecision extends Document {
  bookingId?: Types.ObjectId;
  userId: Types.ObjectId;
  userName: string;
  userEmail: string;
  userRole: string;
  userDepartment?: string;
  userQualification?: string;
  resourceId: Types.ObjectId;
  resourceName: string;
  institution: string;
  date: string;
  timeSlot: string;
  startTime?: Date;
  endTime?: Date;
  explanation: IFairShareExplanation;
  finalDecision: 'APPROVED' | 'PENDING_REVIEW' | 'WAITLISTED' | 'REJECTED';
  reason: string;
  isOverridden?: boolean;
  overriddenBy?: string;
  overrideReason?: string;
  overriddenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const fairShareDecisionSchema = new Schema<IFairShareDecision>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    userRole: { type: String, default: 'student' },
    userDepartment: String,
    userQualification: String,
    resourceId: {
      type: Schema.Types.ObjectId,
      ref: 'Resource',
      required: true,
      index: true,
    },
    resourceName: { type: String, required: true },
    institution: { type: String, required: true, index: true },
    date: { type: String, required: true },
    timeSlot: { type: String, required: true },
    startTime: Date,
    endTime: Date,
    explanation: {
      type: Schema.Types.Mixed,
      required: true,
    },
    finalDecision: {
      type: String,
      required: true,
      enum: ['APPROVED', 'PENDING_REVIEW', 'WAITLISTED', 'REJECTED'],
      index: true,
    },
    reason: { type: String, required: true },
    isOverridden: { type: Boolean, default: false },
    overriddenBy: String,
    overrideReason: String,
    overriddenAt: Date,
  },
  {
    timestamps: true,
  }
);

fairShareDecisionSchema.index({ institution: 1, createdAt: -1 });
fairShareDecisionSchema.index({ resourceId: 1, date: 1 });

export const FairShareDecision = model<IFairShareDecision>('FairShareDecision', fairShareDecisionSchema);
