import { Schema, model, Document, Types } from 'mongoose';

export type NotificationType =
  | 'booking_submitted'
  | 'booking_confirmed'
  | 'approval'
  | 'rejection'
  | 'waitlist_update'
  | 'upcoming_booking'
  | 'checkin_ready'
  | 'return_reminder'
  | 'overdue_alert'
  | 'incident_update'
  | 'resource_availability'
  | 'booking'
  | 'maintenance'
  | 'system';

export interface INotification extends Document {
  userId?: Types.ObjectId;
  targetRole?: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    targetRole: {
      type: String,
      default: 'all',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'booking_submitted',
        'booking_confirmed',
        'approval',
        'rejection',
        'waitlist_update',
        'upcoming_booking',
        'checkin_ready',
        'return_reminder',
        'overdue_alert',
        'incident_update',
        'resource_availability',
        'booking',
        'maintenance',
        'system',
      ],
      default: 'system',
      index: true,
    },
    link: {
      type: String,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export const Notification = model<INotification>('Notification', notificationSchema);
