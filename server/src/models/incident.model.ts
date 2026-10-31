import { Schema, model, Document, Types } from 'mongoose';

export interface IIncident extends Document {
  resourceId?: Types.ObjectId;
  resourceName: string;
  bookingId?: Types.ObjectId;
  reportedBy: string;
  userEmail: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  status: 'reported' | 'investigating' | 'resolved' | 'dismissed';
  resolutionNotes?: string;
  actionTaken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const incidentSchema = new Schema<IIncident>(
  {
    resourceId: {
      type: Schema.Types.ObjectId,
      ref: 'Resource',
    },
    resourceName: {
      type: String,
      required: true,
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
    },
    reportedBy: {
      type: String,
      required: true,
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
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['reported', 'investigating', 'resolved', 'dismissed'],
      default: 'reported',
      index: true,
    },
    resolutionNotes: String,
    actionTaken: String,
  },
  {
    timestamps: true,
  }
);

export const Incident = model<IIncident>('Incident', incidentSchema);
