import apiClient from './client';
import { Booking } from '../types/resource';

export interface PreCheckResult {
  canBook: boolean;
  checks: {
    authenticated: boolean;
    user: {
      name: string;
      email: string;
      role: string;
      isVerified: boolean;
    };
    eligibility: {
      passed: boolean;
      detail: string;
    };
    training: {
      required: string;
      acknowledged: boolean;
    };
    resourceAvailability: {
      status: string;
      passed: boolean;
      detail: string;
    };
    schedulingConflict: {
      conflictDetected: boolean;
      detail: string;
    };
    activeBookingLimits: {
      currentActive: number;
      allowedLimit: number;
      passed: boolean;
      detail: string;
    };
  };
}

export interface TimelineStage {
  step: number;
  key: string;
  label: string;
  completed: boolean;
  date?: string;
  actor?: string;
  condition?: any;
}

// Step 3: Pre-check validation
export const preCheckBookingApi = async (data: {
  resourceId: string;
  startTime?: string;
  endTime?: string;
  date?: string;
  timeSlot?: string;
}) => {
  const res = await apiClient.post<{ success: boolean; data: PreCheckResult }>('/bookings/pre-check', data);
  return res.data;
};

// Step 4 & 5: Create Booking
export const createBookingApi = async (bookingData: {
  resourceId: string;
  date: string;
  timeSlot: string;
  startTime: string;
  endTime: string;
  purpose: string;
  projectDescription?: string;
  expectedDuration?: string;
  additionalInformation?: string;
  supervisorName?: string;
  trainingAcknowledged?: boolean;
}) => {
  const res = await apiClient.post<{ success: boolean; message: string; data: Booking }>('/bookings', bookingData);
  return res.data;
};

// List user bookings
export const getBookingsApi = async (status?: string) => {
  const res = await apiClient.get<{ success: boolean; data: Booking[] }>('/bookings', {
    params: { status },
  });
  return res.data;
};

// Get single booking with visual timeline & audit trail
export const getBookingByIdApi = async (id: string) => {
  const res = await apiClient.get<{
    success: boolean;
    data: {
      booking: Booking;
      timeline: TimelineStage[];
    };
  }>(`/bookings/${id}`);
  return res.data;
};

// Step 7: Custodian marks request under review
export const putBookingUnderReviewApi = async (id: string) => {
  const res = await apiClient.post<{ success: boolean; message: string; data: Booking }>(`/bookings/${id}/review`);
  return res.data;
};

// Step 7 & 8: Custodian approves request
export const approveBookingRequestApi = async (id: string) => {
  const res = await apiClient.post<{ success: boolean; message: string; data: Booking }>(`/bookings/${id}/approve`);
  return res.data;
};

// Step 7: Custodian rejects request with reason
export const rejectBookingRequestApi = async (id: string, reason: string) => {
  const res = await apiClient.post<{ success: boolean; message: string; data: Booking }>(`/bookings/${id}/reject`, { reason });
  return res.data;
};

// Move to waitlist
export const waitlistBookingApi = async (id: string, reason?: string, priority?: number) => {
  const res = await apiClient.post<{ success: boolean; message: string; data: Booking }>(`/bookings/${id}/waitlist`, {
    reason,
    priority,
  });
  return res.data;
};

// Step 9 & 10: Check-In & Initial Condition
export const checkInBookingApi = async (
  id: string,
  data: {
    conditionNotes?: string;
    meterReading?: string;
    cleanliness?: 'passed' | 'needs_cleaning';
    operationalStatus?: 'optimal' | 'minor_wear' | 'damaged' | 'offline';
  }
) => {
  const res = await apiClient.post<{ success: boolean; message: string; data: Booking }>(`/bookings/${id}/check-in`, data);
  return res.data;
};

// Step 12: User initiates return & records condition
export const initiateReturnApi = async (
  id: string,
  data: {
    conditionNotes?: string;
    meterReading?: string;
    cleanliness?: 'passed' | 'needs_cleaning';
    operationalStatus?: 'optimal' | 'minor_wear' | 'damaged' | 'offline';
  }
) => {
  const res = await apiClient.post<{ success: boolean; message: string; data: Booking }>(`/bookings/${id}/initiate-return`, data);
  return res.data;
};

// Step 13 & 14: Custodian confirms return inspection & completes session
export const confirmReturnAndCompleteApi = async (
  id: string,
  data: {
    finalNotes?: string;
    meterReading?: string;
    conditionStatus?: 'optimal' | 'minor_wear' | 'damaged' | 'offline';
  }
) => {
  const res = await apiClient.post<{ success: boolean; message: string; data: Booking }>(`/bookings/${id}/confirm-return`, data);
  return res.data;
};

// Cancel booking with reason
export const cancelBookingApi = async (id: string, reason: string) => {
  const res = await apiClient.post<{ success: boolean; message: string; data: Booking }>(`/bookings/${id}/cancel`, { reason });
  return res.data;
};
