import { apiClient } from './client';
import { Booking } from '../types/resource';

export interface TrustPassTokenData {
  token: string;
  qrPayload: string;
  expiresAt: string;
  status: string;
  bookingId: string;
}

export interface TrustPassVerificationData {
  valid: boolean;
  actionAllowed: 'check_in' | 'check_out';
  booking: Booking;
  resource: {
    _id: string;
    name: string;
    category: string;
    location: string;
    images?: string[];
    ownerName?: string;
    ownerDepartment?: string;
  };
  overdue: {
    isOverdue: boolean;
    overdueMinutes: number;
    scheduledEndTime: string;
  };
  tokenInfo: {
    token: string;
    expiresAt: string;
    isValid: boolean;
  };
}

export interface CheckInPayload {
  bookingId: string;
  token?: string;
  conditionNotes?: string;
  meterReading?: string;
  cleanliness?: 'passed' | 'needs_cleaning';
  operationalStatus?: 'optimal' | 'minor_wear' | 'damaged' | 'offline';
  photos?: string[];
}

export interface CheckOutPayload {
  bookingId: string;
  token?: string;
  conditionNotes?: string;
  meterReading?: string;
  cleanliness?: 'passed' | 'needs_cleaning';
  operationalStatus?: 'optimal' | 'minor_wear' | 'damaged' | 'offline';
  photos?: string[];
}

// 1. Generate or fetch TrustPass token
export const getTrustPassTokenApi = async (
  bookingId: string
): Promise<{ success: boolean; data: TrustPassTokenData }> => {
  const response = await apiClient.get(`/trustpass/token/${bookingId}`);
  return response.data;
};

// 2. Scan or verify TrustPass token
export const verifyTrustPassApi = async (
  token: string
): Promise<{ success: boolean; message: string; data: TrustPassVerificationData }> => {
  const response = await apiClient.post('/trustpass/verify', { token });
  return response.data;
};

// 3. Confirm Handover Check-In
export const checkInTrustPassApi = async (
  payload: CheckInPayload
): Promise<{ success: boolean; message: string; data: Booking }> => {
  const response = await apiClient.post('/trustpass/check-in', payload);
  return response.data;
};

// 4. Confirm Return Check-Out
export const checkOutTrustPassApi = async (
  payload: CheckOutPayload
): Promise<{ success: boolean; message: string; data: { booking: Booking; overdueMinutes: number } }> => {
  const response = await apiClient.post('/trustpass/check-out', payload);
  return response.data;
};

// 5. Complete Transaction Lifecycle History
export const getTrustPassHistoryApi = async (
  bookingId: string
): Promise<{ success: boolean; data: any }> => {
  const response = await apiClient.get(`/trustpass/history/${bookingId}`);
  return response.data;
};
