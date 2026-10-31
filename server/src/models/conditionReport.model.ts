import { Schema, model, Document, Types } from 'mongoose';

export interface IConditionReport extends Document {
  resourceId: Types.ObjectId;
  resourceName: string;
  bookingId?: Types.ObjectId;
  inspectorName: string;
  inspectorRole: string;
  type: 'check_in' | 'check_out' | 'routine';
  operationalStatus: 'optimal' | 'minor_wear' | 'damaged' | 'offline';
  cleanliness: 'passed' | 'needs_cleaning';
  meterReading?: string;
  observations: string;
  signoffConfirmed: boolean;
  createdAt: Date;
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
    },
    inspectorName: {
      type: String,
      required: true,
    },
    inspectorRole: {
      type: String,
      default: 'Lab Custodian',
    },
    type: {
      type: String,
      enum: ['check_in', 'check_out', 'routine'],
      default: 'check_out',
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
    meterReading: String,
    observations: {
      type: String,
      required: true,
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
