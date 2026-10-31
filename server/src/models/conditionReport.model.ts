import { Schema, model, Document, Types } from 'mongoose';

export interface IReportDifference {
  category: string;
  before: string;
  after: string;
  requiresReview: boolean;
}

export interface IConditionReport extends Document {
  resourceId: Types.ObjectId;
  resourceName: string;
  bookingId?: Types.ObjectId;
  inspectorName: string;
  inspectorRole: string;
  responsibleUserId?: Types.ObjectId;
  responsibleUserName?: string;
  responsibleUserEmail?: string;
  type: 'check_in' | 'check_out' | 'routine';
  operationalStatus: 'optimal' | 'minor_wear' | 'damaged' | 'offline';
  cleanliness: 'passed' | 'needs_cleaning';
  meterReading?: string;
  existingDamage: string[];
  conditionNotes: string;
  observations: string;
  photos: string[];
  differences?: {
    hasDifferences: boolean;
    summary: string;
    items: IReportDifference[];
  };
  requiresHumanReview: boolean;
  timestamp: Date;
  userConfirmation: boolean;
  userConfirmedAt?: Date;
  ownerConfirmation: boolean;
  ownerConfirmedAt?: Date;
  signoffConfirmed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const conditionReportSchema = new Schema<IConditionReport>(
  {
    resourceId: {
      type: Schema.Types.ObjectId,
      ref: 'Resource',
      required: true,
      index: true,
    },
    resourceName: {
      type: String,
      required: true,
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      index: true,
    },
    inspectorName: {
      type: String,
      required: true,
    },
    inspectorRole: {
      type: String,
      default: 'Lab Custodian',
    },
    responsibleUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    responsibleUserName: {
      type: String,
      default: '',
    },
    responsibleUserEmail: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['check_in', 'check_out', 'routine'],
      default: 'check_out',
      index: true,
    },
    operationalStatus: {
      type: String,
      enum: ['optimal', 'minor_wear', 'damaged', 'offline'],
      default: 'optimal',
    },
    cleanliness: {
      type: String,
      enum: ['passed', 'needs_cleaning'],
      default: 'passed',
    },
    meterReading: {
      type: String,
      default: '0',
    },
    existingDamage: {
      type: [String],
      default: [],
    },
    conditionNotes: {
      type: String,
      default: '',
    },
    observations: {
      type: String,
      required: true,
    },
    photos: {
      type: [String],
      default: [],
    },
    differences: {
      hasDifferences: { type: Boolean, default: false },
      summary: { type: String, default: '' },
      items: [
        {
          category: { type: String },
          before: { type: String },
          after: { type: String },
          requiresReview: { type: Boolean, default: true },
        },
      ],
    },
    requiresHumanReview: {
      type: Boolean,
      default: false,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    userConfirmation: {
      type: Boolean,
      default: false,
    },
    userConfirmedAt: {
      type: Date,
    },
    ownerConfirmation: {
      type: Boolean,
      default: false,
    },
    ownerConfirmedAt: {
      type: Date,
    },
    signoffConfirmed: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ConditionReport = model<IConditionReport>('ConditionReport', conditionReportSchema);
