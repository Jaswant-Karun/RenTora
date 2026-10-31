import { Schema, model, Document, Types } from 'mongoose';

export type BookingStatus = 'active' | 'pending' | 'completed' | 'cancelled' | 'rejected' | 'waitlisted';

export interface IBooking extends Document {
  userId: Types.ObjectId;
  userName: string;
  userEmail: string;
  userDepartment?: string;
  userInstitution?: string;
  userEligibility?: string;
  resourceId: Types.ObjectId;
  resourceName: string;
  resourceCategory: string;
  resourceLocation: string;
  resourceImage: string;
  date: string;
  timeSlot: string;
  purpose: string;
  supervisorName?: string;
  status: BookingStatus;
  notes?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  checkedIn?: boolean;
  checkedInAt?: Date;
  checkedOut?: boolean;
  checkedOutAt?: Date;
  conditionOnCheckout?: string;
  conflictDetected?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    userDepartment: String,
    userInstitution: String,
    userEligibility: {
      type: String,
      default: 'Verified Institutional Student',
    },
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
    resourceCategory: {
      type: String,
      required: true,
    },
    resourceLocation: {
      type: String,
      required: true,
    },
    resourceImage: {
      type: String,
      default: '',
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    timeSlot: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      required: [true, 'Purpose of reservation is required'],
    },
    supervisorName: {
      type: String,
      default: 'Faculty Advisor',
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'completed', 'cancelled', 'rejected', 'waitlisted'],
      default: 'pending',
      index: true,
    },
    notes: String,
    rejectionReason: String,
    cancellationReason: String,
    checkedIn: {
      type: Boolean,
      default: false,
    },
    checkedInAt: Date,
    checkedOut: {
      type: Boolean,
      default: false,
    },
    checkedOutAt: Date,
    conditionOnCheckout: String,
    conflictDetected: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Booking = model<IBooking>('Booking', bookingSchema);
