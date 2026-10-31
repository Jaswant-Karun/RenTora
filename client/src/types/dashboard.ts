import { Resource, Booking, NotificationItem } from './resource';

export interface DashboardStats {
  availableResources: number;
  activeBookings: number;
  pendingRequests: number;
  completedBookings: number;
  totalCampusResources: number;
  totalBookings?: number;
  waitlistedCount?: number;
}

export interface CategoryDistribution {
  category: string;
  count: number;
  availableCount: number;
}

export interface BookingActivityItem {
  day: string;
  bookings: number;
  hours: number;
  activeUsers: number;
}

export interface UserActivityTimelineItem {
  _id: string;
  resourceName: string;
  resourceCategory?: string;
  status: string;
  date: string;
  timeSlot: string;
  checkedIn?: boolean;
  checkedOut?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface DashboardSummaryResponse {
  success: boolean;
  data: {
    stats: DashboardStats;
    recentlyAdded: Resource[];
    recommended: Resource[];
    upcomingBookings: Booking[];
    waitlistEntries?: Booking[];
    userActivityTimeline?: UserActivityTimelineItem[];
    bookingActivity: BookingActivityItem[];
    categoryDistribution: CategoryDistribution[];
    notifications: NotificationItem[];
  };
}
