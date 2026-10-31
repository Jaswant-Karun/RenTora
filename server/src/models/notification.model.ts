import { Schema, model, Document, Types } from 'mongoose';

export type NotificationType = 'booking' | 'approval' | 'maintenance' | 'system';

export interface INotification extends Document {
  userId?: Types.ObjectId;
  targetRole?: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  isRead: boolean;
  createdAt: Date;
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
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['booking', 'approval', 'maintenance', 'system'],
      default: 'system',
    },
    link: String,
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Notification = model<INotification>('Notification', notificationSchema);
