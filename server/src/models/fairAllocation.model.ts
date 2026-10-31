import { Schema, model, Document } from 'mongoose';

export interface IFairAllocation extends Document {
  institution: string;
  maxWeeklyHoursPerStudent: number;
  maxActiveBookingsPerStudent: number;
  peakHourThrottling: boolean;
  emergencyBypassEnabled: boolean;
  priorityTiers: string[];
  advanceBookingDays: number;
  cancellationGraceHours: number;
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
  },
  {
    timestamps: true,
  }
);

export const FairAllocation = model<IFairAllocation>('FairAllocation', fairAllocationSchema);
