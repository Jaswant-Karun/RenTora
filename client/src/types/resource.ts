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
  approvalRequired: boolean;
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

export interface Booking {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userDepartment?: string;
  userInstitution?: string;
  resourceId: string;
  resourceName: string;
  resourceCategory: string;
  resourceLocation: string;
  resourceImage: string;
  date: string;
  timeSlot: string;
  purpose: string;
  supervisorName?: string;
  status: 'active' | 'pending' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export interface NotificationItem {
  _id: string;
  userId?: string;
  targetRole?: string;
  title: string;
  message: string;
  type: 'booking' | 'approval' | 'maintenance' | 'system';
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
  date?: string;
  sort?: string;
  page?: number;
  limit?: number;
}
