import { Schema, model, Document, Types } from 'mongoose';

export interface IDispute extends Document {
  bookingId?: Types.ObjectId;
  resourceName: string;
  userName: string;
  userEmail: string;
  ownerName: string;
  reason: string;
  status: 'open' | 'under_review' | 'resolved';
  resolution?: string;
  createdAt: Date;
  updatedAt: Date;
}

const disputeSchema = new Schema<IDispute>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
    },
    resourceName: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    ownerName: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'under_review', 'resolved'],
      default: 'open',
      index: true,
    },
    resolution: String,
  },
  {
    timestamps: true,
  }
);

export const Dispute = model<IDispute>('Dispute', disputeSchema);
