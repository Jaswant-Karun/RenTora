import { apiClient } from './client';

export interface ResourcePulseMetrics {
  timeRange: {
    label: string;
    startDate: string;
    endDate: string;
    daysCount: number;
  };
  overview: {
    totalRegisteredResources: number;
    availableResources: number;
    activeBookingsCount: number;
    completedBookingsCount: number;
    totalBookingsInPeriod: number;
    cancelledBookingsCount: number;
    cancellationRate: number;
    overdueReturnsCount: number;
    waitingListDemandCount: number;
    totalBookedHours: number;
    totalBookableHours: number;
    utilizationRate: number;
  };
  frequentlyBookedResources: Array<{
    resourceId: string;
    name: string;
    category: string;
    bookingCount: number;
    totalHours: number;
    utilizationPercent: number;
  }>;
  underutilizedResources: Array<{
    resourceId: string;
    name: string;
    category: string;
    bookingCount: number;
    totalHours: number;
    status: string;
    reason: string;
  }>;
  bookingTrends: Array<{
    date: string;
    label: string;
    bookings: number;
    hours: number;
  }>;
  categoryUsage: Array<{
    category: string;
    bookingCount: number;
    totalHours: number;
    resourceCount: number;
    percentage: number;
  }>;
  peakUsagePeriods: Array<{
    timeSlot: string;
    bookingCount: number;
    percentage: number;
  }>;
  insights: Array<{
    id: string;
    type: 'warning' | 'info' | 'success' | 'action_required';
    title: string;
    message: string;
    metricContext?: string;
  }>;
}

export const getResourcePulseMetricsApi = async (params?: {
  range?: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'custom';
  startDate?: string;
  endDate?: string;
}): Promise<{ success: boolean; data: ResourcePulseMetrics }> => {
  const response = await apiClient.get('/resource-pulse/metrics', { params });
  return response.data;
};

export const exportResourcePulseCSVApi = async (params?: {
  range?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Blob> => {
  const response = await apiClient.get('/resource-pulse/export', {
    params,
    responseType: 'blob',
  });
  return response.data;
};
