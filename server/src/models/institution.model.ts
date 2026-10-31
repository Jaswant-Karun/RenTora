import { Schema, model, Document } from 'mongoose';

export interface IInstitution extends Document {
  name: string;
  code: string;
  domain: string;
  campusLocation: string;
  contactEmail: string;
  status: 'active' | 'pending' | 'suspended';
  totalMembers: number;
  totalAssets: number;
  partnershipTier: 'Tier 1 Research' | 'Associate Campus' | 'Consortium Partner';
  joinedDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const institutionSchema = new Schema<IInstitution>(
  {
    name: {
      type: String,
      required: [true, 'Institution name is required'],
      unique: true,
      trim: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    domain: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    campusLocation: {
      type: String,
      required: true,
    },
    contactEmail: {
      type: String,
      required: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'suspended'],
      default: 'active',
      index: true,
    },
    totalMembers: {
      type: Number,
      default: 0,
    },
    totalAssets: {
      type: Number,
      default: 0,
    },
    partnershipTier: {
      type: String,
      enum: ['Tier 1 Research', 'Associate Campus', 'Consortium Partner'],
      default: 'Tier 1 Research',
    },
    joinedDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const Institution = model<IInstitution>('Institution', institutionSchema);
