import { Schema, model, Document, Types } from 'mongoose';

export type BookingStatus =
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'waitlisted'
  | 'checked_in'
  | 'return_pending'
  | 'completed'
  | 'cancelled'
  | 'overdue'
  | 'active'; // Legacy alias for 'approved'

export interface IAuditEntry {
  transition: string;
  fromStatus: string;
  toStatus: string;
  performedBy: string;
  performedByRole: string;
  timestamp: Date;
  note?: string;
}

export interface IConditionSnapshot {
  conditionNotes: string;
  meterReading?: string;
  cleanliness: 'passed' | 'needs_cleaning';
  operationalStatus: 'optimal' | 'minor_wear' | 'damaged' | 'offline';
  photos?: string[];
  userConfirmation?: boolean;
  ownerConfirmation?: boolean;
  timestamp?: Date;
  recordedBy: string;
  recordedAt: Date;
}

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
  
  // Date & Time Scheduling
  date: string;
  timeSlot: string;
  startTime: Date;
  endTime: Date;
  durationHours: number;
  
  // Step 4 User Specifications
  purpose: string;
  projectDescription?: string;
  expectedDuration?: string;
  additionalInformation?: string;
  supervisorName?: string;
  trainingAcknowledged?: boolean;

  // Lifecycle Status & Reasons
  status: BookingStatus;
  rejectionReason?: string;
  cancellationReason?: string;
  waitlistReason?: string;
  waitlistPriority?: number;
  queuePosition?: number;
  estimatedReleaseTime?: Date;
  monopolisationDetected?: boolean;
  managerOverrideReason?: string;
  managerOverriddenBy?: string;
  notes?: string;

  // Step 9 & 10: Check-In & Initial Condition
  checkedIn: boolean;
  checkedInAt?: Date;
  initialCondition?: IConditionSnapshot;

  // Step 12: Return Initiation & Return Condition
  returnInitiated: boolean;
  returnInitiatedAt?: Date;
  returnCondition?: IConditionSnapshot;

  // Step 13 & 14: Completed & Checked Out
  checkedOut: boolean;
  checkedOutAt?: Date;
  conditionOnCheckout?: string;

  // Audit History Trail
  auditTrail: IAuditEntry[];

  suggestedAlternative?: {
    date: string;
    timeSlot: string;
    note?: string;
    offeredAt?: Date;
  };
  conflictDetected?: boolean;
  isOverdue?: boolean;
  overdueMinutes?: number;
  fairShareExplanation?: any;

  trustPassToken?: {
    token: string;
    qrPayload: string;
    generatedAt: Date;
    expiresAt: Date;
    isValid: boolean;
  };
  handoverOfficer?: {
    id: Types.ObjectId;
    name: string;
    role: string;
  };
  returnOfficer?: {
    id: Types.ObjectId;
    name: string;
    role: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

const auditEntrySchema = new Schema<IAuditEntry>(
  {
    transition: { type: String, required: true },
    fromStatus: { type: String, required: true },
    toStatus: { type: String, required: true },
    performedBy: { type: String, required: true },
    performedByRole: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    note: String,
  },
  { _id: false }
);

const conditionSnapshotSchema = new Schema<IConditionSnapshot>(
  {
    conditionNotes: { type: String, required: true },
    meterReading: String,
    cleanliness: { type: String, enum: ['passed', 'needs_cleaning'], default: 'passed' },
    operationalStatus: { type: String, enum: ['optimal', 'minor_wear', 'damaged', 'offline'], default: 'optimal' },
    photos: { type: [String], default: [] },
    userConfirmation: { type: Boolean, default: false },
    ownerConfirmation: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
    recordedBy: { type: String, required: true },
    recordedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

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
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
      required: true,
      index: true,
    },
    durationHours: {
      type: Number,
      default: 1,
    },
    purpose: {
      type: String,
      required: [true, 'Purpose of reservation is required'],
    },
    projectDescription: String,
    expectedDuration: String,
    additionalInformation: String,
    supervisorName: {
      type: String,
      default: 'Faculty Sponsor',
    },
    trainingAcknowledged: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: [
        'pending',
        'under_review',
        'approved',
        'rejected',
        'waitlisted',
        'checked_in',
        'return_pending',
        'completed',
        'cancelled',
        'overdue',
        'active', // legacy compatibility
      ],
      default: 'pending',
      index: true,
    },
    rejectionReason: String,
    cancellationReason: String,
    waitlistReason: String,
    waitlistPriority: {
      type: Number,
      default: 1,
    },
    queuePosition: Number,
    estimatedReleaseTime: Date,
    monopolisationDetected: {
      type: Boolean,
      default: false,
    },
    managerOverrideReason: String,
    managerOverriddenBy: String,
    notes: String,
    suggestedAlternative: {
      date: String,
      timeSlot: String,
      note: String,
      offeredAt: { type: Date, default: Date.now },
    },
    checkedIn: {
      type: Boolean,
      default: false,
    },
    checkedInAt: Date,
    initialCondition: conditionSnapshotSchema,
    returnInitiated: {
      type: Boolean,
      default: false,
    },
    returnInitiatedAt: Date,
    returnCondition: conditionSnapshotSchema,
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
    isOverdue: {
      type: Boolean,
      default: false,
    },
    overdueMinutes: {
      type: Number,
      default: 0,
    },
    fairShareExplanation: {
      type: Schema.Types.Mixed,
    },
    trustPassToken: {
      token: { type: String, index: true },
      qrPayload: String,
      generatedAt: Date,
      expiresAt: Date,
      isValid: { type: Boolean, default: true },
    },
    handoverOfficer: {
      id: Schema.Types.ObjectId,
      name: String,
      role: String,
    },
    returnOfficer: {
      id: Schema.Types.ObjectId,
      name: String,
      role: String,
    },
    auditTrail: {
      type: [auditEntrySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for high performance overlap checks and preventing concurrent double booking
bookingSchema.index({ resourceId: 1, startTime: 1, endTime: 1, status: 1 });
bookingSchema.index({ userId: 1, status: 1 });

export const Booking = model<IBooking>('Booking', bookingSchema);
