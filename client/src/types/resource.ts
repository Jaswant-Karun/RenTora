export type ResourceCategory =
  | 'Laboratories'
  | 'Classrooms'
  | 'Meeting Rooms'
  | 'Computers'
  | 'Cameras'
  | '3D Printers'
  | 'Electronics Equipment'
  | 'Testing Instruments'
  | 'Workshop Tools'
  | 'Other Resources';

export type ResourceStatus = 'available' | 'reserved' | 'maintenance' | 'in_use';

export interface Resource {
  _id: string;
  name: string;
  category: ResourceCategory;
  resourceType: string;
  institution: string;
  location: string;
  description: string;
  images: string[];
  ownerId?: string;
  ownerName: string;
  ownerEmail: string;
  ownerDepartment: string;
  ownerAvatar?: string;
  status: ResourceStatus;
  availabilityText: string;
  availableDates?: string[];
  eligibility: string;
  isRestricted?: boolean;
  requiredQualification?: string;
  requiredCertifications?: string[];
  conditionPhotosConfigured?: boolean;
  approvalRequired: boolean;
  approvalStatus?: 'approved' | 'pending' | 'rejected';
  minBookingDuration?: number;
  maxBookingDuration?: number;
  supervisionRequirement?: boolean;
  depositConditions?: string;
  availabilitySchedule?: string;
  specifications: Record<string, string>;
  usageInstructions: string[];
  trainingRequired: string;
  safetyInstructions: string[];
  bookingConditions: string[];
  tags: string[];
  featured: boolean;
  rating: number;
  totalBookings: number;
  hourlyValueEstimated?: number;
  createdAt: string;
  updatedAt: string;
}

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
  | 'active';

export interface AuditEntry {
  transition: string;
  fromStatus: string;
  toStatus: string;
  performedBy: string;
  performedByRole: string;
  timestamp: string;
  note?: string;
}

export interface ConditionSnapshot {
  conditionNotes: string;
  meterReading?: string;
  cleanliness: 'passed' | 'needs_cleaning';
  operationalStatus: 'optimal' | 'minor_wear' | 'damaged' | 'offline';
  recordedBy: string;
  recordedAt: string;
}

export interface Booking {
  _id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userDepartment?: string;
  userInstitution?: string;
  institution?: string;
  userRole?: string;
  resourceId?: string;
  resourceName?: string;
  resourceCategory?: string;
  resourceLocation?: string;
  resourceImage?: string;
  resource?: {
    _id: string;
    name: string;
    category: string;
    location: string;
    images?: string[];
    institution?: string;
  };
  user?: {
    _id: string;
    name: string;
    email: string;
    institution?: string;
    department?: string;
    role?: string;
    isVerified?: boolean;
  };
  date?: string;
  timeSlot?: string;
  startTime: string;
  endTime: string;
  durationHours?: number;
  purpose: string;
  projectDescription?: string;
  expectedDuration?: string;
  additionalInformation?: string;
  supervisorName?: string;
  trainingAcknowledged?: boolean;
  status: BookingStatus;
  rejectionReason?: string;
  cancellationReason?: string;
  waitlistReason?: string;
  waitlistPriority?: number;
  checkedIn?: boolean;
  checkedInAt?: string;
  initialCondition?: ConditionSnapshot;
  returnInitiated?: boolean;
  returnInitiatedAt?: string;
  returnCondition?: ConditionSnapshot;
  checkedOut?: boolean;
  checkedOutAt?: string;
  conditionOnCheckout?: string;
  conflictDetected?: boolean;
  isOverdue?: boolean;
  auditTrail?: AuditEntry[];
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationItem {
  _id: string;
  userId?: string;
  targetRole?: string;
  title: string;
  message: string;
  type:
    | 'booking'
    | 'approval'
    | 'rejection'
    | 'booking_confirmed'
    | 'waitlist_update'
    | 'upcoming_booking'
    | 'return_reminder'
    | 'overdue_alert'
    | 'incident_update'
    | 'maintenance'
    | 'system';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ResourceFilterParams {
  search?: string;
  category?: string;
  institution?: string;
  location?: string;
  availability?: string;
  resourceType?: string;
  eligibility?: string;
  training?: string;
  date?: string;
  sort?: string;
  page?: number;
  limit?: number;
}
