import apiClient from './client';
import { Resource, Booking, NotificationItem, ResourceFilterParams } from '../types/resource';
import { DashboardSummaryResponse } from '../types/dashboard';

export const getResourcesApi = async (params?: ResourceFilterParams) => {
  const response = await apiClient.get<{
    success: boolean;
    data: Resource[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      filterOptions: {
        institutions: string[];
        locations: string[];
        categories: string[];
      };
    };
  }>('/resources', { params });
  return response.data;
};

export const getResourceByIdApi = async (id: string) => {
  const response = await apiClient.get<{
    success: boolean;
    data: Resource;
  }>(`/resources/${id}`);
  return response.data;
};

export const getDashboardSummaryApi = async () => {
  const response = await apiClient.get<DashboardSummaryResponse>('/dashboard');
  return response.data;
};

export const getBookingsApi = async (status?: string) => {
  const response = await apiClient.get<{
    success: boolean;
    data: Booking[];
  }>('/bookings', { params: { status } });
  return response.data;
};

export const createBookingApi = async (bookingData: {
  resourceId: string;
  date: string;
  timeSlot: string;
  purpose: string;
  supervisorName?: string;
  notes?: string;
}) => {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
    data: Booking;
  }>('/bookings', bookingData);
  return response.data;
};

export const updateBookingStatusApi = async (id: string, status: string) => {
  const response = await apiClient.patch<{
    success: boolean;
    message: string;
    data: Booking;
  }>(`/bookings/${id}/status`, { status });
  return response.data;
};

export const getNotificationsApi = async () => {
  const response = await apiClient.get<{
    success: boolean;
    data: NotificationItem[];
  }>('/notifications');
  return response.data;
};

export const markNotificationReadApi = async (id: string) => {
  const response = await apiClient.patch<{
    success: boolean;
    data: NotificationItem;
  }>(`/notifications/${id}/read`);
  return response.data;
};
