import { Schema, model, Document } from 'mongoose';

export interface IPriorityScoringConfig {
  phdScholarPoints: number;
  finalYearPoints: number;
  undergradPoints: number;
  deptPriorityPoints: number;
  lowUsageBonusPoints: number;
  penaltyDeductionPoints: number;
}

export interface IFairAllocation extends Document {
  institution: string;
  maxWeeklyHoursPerStudent: number;
  maxActiveBookingsPerStudent: number;
  peakHourThrottling: boolean;
  emergencyBypassEnabled: boolean;
  priorityTiers: string[];
  advanceBookingDays: number;
  cancellationGraceHours: number;
  // Monopolisation prevention
  maxReservationsPerAssetPer14Days: number;
  cooldownPeriodDays: number;
  priorityScoring: IPriorityScoringConfig;
  updatedAt: Date;
}

const fairAllocationSchema = new Schema<IFairAllocation>(
  {
    institution: {
      type: String,
      required: true,
      unique: true,
    },
    maxWeeklyHoursPerStudent: {
      type: Number,
      default: 16,
    },
    maxActiveBookingsPerStudent: {
      type: Number,
      default: 3,
    },
    peakHourThrottling: {
      type: Boolean,
      default: true,
    },
    emergencyBypassEnabled: {
      type: Boolean,
      default: true,
    },
    priorityTiers: {
      type: [String],
      default: ['Research Scholar', 'Final Year Student', 'Graduate Student', 'Undergraduate'],
    },
    advanceBookingDays: {
      type: Number,
      default: 14,
    },
    cancellationGraceHours: {
      type: Number,
      default: 2,
    },
    maxReservationsPerAssetPer14Days: {
      type: Number,
      default: 3,
    },
    cooldownPeriodDays: {
      type: Number,
      default: 14,
    },
    priorityScoring: {
      phdScholarPoints: { type: Number, default: 30 },
      finalYearPoints: { type: Number, default: 20 },
      undergradPoints: { type: Number, default: 10 },
      deptPriorityPoints: { type: Number, default: 15 },
      lowUsageBonusPoints: { type: Number, default: 25 },
      penaltyDeductionPoints: { type: Number, default: 15 },
    },
  },
  {
    timestamps: true,
  }
);

export const FairAllocation = model<IFairAllocation>('FairAllocation', fairAllocationSchema);
