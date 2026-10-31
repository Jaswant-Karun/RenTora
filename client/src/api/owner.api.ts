import apiClient from './client';
import { Resource, Booking } from '../types/resource';

export interface OwnerOverviewData {
  stats: {
    totalResources: number;
    availableResources: number;
    currentlyBookedResources: number;
    pendingBookingRequests: number;
    activeReservations: number;
    completedBookings: number;
    utilizationPercentage: string;
    totalListedResources?: number;
    pendingRequestsCount?: number;
    activeBookingsCount?: number;
    completedBookingsCount?: number;
    totalHoursLogged?: number;
    utilizationRate?: string;
    activeIncidents?: number;
  };
  myResources: Resource[];
  recentBookings: (Booking & { conflictDetected?: boolean })[];
  upcomingReservations: (Booking & { conflictDetected?: boolean })[];
  recentActivity: Array<{
    id: string;
    bookingId: string;
    resourceName: string;
    transition: string;
    performedBy: string;
    performedByRole: string;
    timestamp: string;
    note?: string;
  }>;
  conditionReports: any[];
  incidents: any[];
}

export const getOwnerOverviewApi = async () => {
  const res = await apiClient.get<{ success: boolean; data: OwnerOverviewData }>('/owner/overview');
  return res.data;
};

export const getOwnerResourcesApi = async () => {
  const res = await apiClient.get<{ success: boolean; data: Resource[] }>('/owner/resources');
  return res.data;
};

export const addOwnerResourceApi = async (resourceData: any) => {
  const res = await apiClient.post<{ success: boolean; message: string; data: Resource }>('/owner/resources', resourceData);
  return res.data;
};

export const updateOwnerResourceApi = async (id: string, resourceData: any) => {
  const res = await apiClient.patch<{ success: boolean; message: string; data: Resource }>(`/owner/resources/${id}`, resourceData);
  return res.data;
};

export const deleteOwnerResourceApi = async (id: string) => {
  const res = await apiClient.delete<{ success: boolean; message: string }>(`/owner/resources/${id}`);
  return res.data;
};

export const getOwnerBookingsApi = async () => {
  const res = await apiClient.get<{ success: boolean; data: (Booking & { conflictDetected?: boolean; rejectionReason?: string; cancellationReason?: string })[] }>('/owner/bookings');
  return res.data;
};

export const approveBookingApi = async (bookingId: string, note?: string) => {
  const res = await apiClient.post<{ success: boolean; message: string; data: Booking }>(`/owner/bookings/${bookingId}/approve`, { note });
  return res.data;
};

export const rejectBookingApi = async (bookingId: string, reason: string) => {
  const res = await apiClient.post<{ success: boolean; message: string; data: Booking }>(`/owner/bookings/${bookingId}/reject`, { reason });
  return res.data;
};

export const cancelBookingByOwnerApi = async (bookingId: string, reason: string) => {
  const res = await apiClient.post<{ success: boolean; message: string; data: Booking }>(`/owner/bookings/${bookingId}/cancel`, { reason });
  return res.data;
};

export const moveBookingToWaitlistApi = async (bookingId: string, reason?: string) => {
  const res = await apiClient.post<{ success: boolean; message: string; data: Booking }>(`/owner/bookings/${bookingId}/waitlist`, { reason });
  return res.data;
};

export const suggestAlternativeDatesApi = async (
  bookingId: string,
  data: { suggestedDate: string; suggestedTimeSlot: string; note?: string }
) => {
  const res = await apiClient.post<{ success: boolean; message: string; data: Booking }>(
    `/owner/bookings/${bookingId}/suggest-dates`,
    data
  );
  return res.data;
};

export const handleCheckInCheckOutApi = async (data: {
  bookingId: string;
  action: 'check_in' | 'check_out';
  conditionNotes?: string;
  meterReading?: string;
}) => {
  const res = await apiClient.post<{ success: boolean; message: string; data: Booking }>('/owner/checkin-checkout', data);
  return res.data;
};

export const getConditionReportsApi = async () => {
  const res = await apiClient.get<{ success: boolean; data: any[] }>('/owner/condition-reports');
  return res.data;
};

export const createConditionReportApi = async (reportData: any) => {
  const res = await apiClient.post<{ success: boolean; message: string; data: any }>('/owner/condition-reports', reportData);
  return res.data;
};

export const getOwnerIncidentsApi = async () => {
  const res = await apiClient.get<{ success: boolean; data: any[] }>('/owner/incidents');
  return res.data;
};

export const createIncidentApi = async (incidentData: any) => {
  const res = await apiClient.post<{ success: boolean; message: string; data: any }>('/owner/incidents', incidentData);
  return res.data;
};
