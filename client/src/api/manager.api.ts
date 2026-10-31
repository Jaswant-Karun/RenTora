import apiClient from './client';

export interface ManagerStatsData {
  stats: {
    totalResources: number;
    availableResources?: number;
    activeBookings: number;
    completedBookings?: number;
    waitlistedBookings?: number;
    totalUsers: number;
    studentUsers?: number;
    ownerUsers?: number;
    unverifiedUsers: number;
    incidentsCount: number;
    disputesCount: number;
    pendingResourceApprovals: number;
    campusSafetyScore: string;
    utilizationAvoidedCost: string;
    utilizationRate?: string;
  };
  deptUtilization: {
    department: string;
    assetsCount: number;
    totalBookings: number;
  }[];
  fairAllocation: any;
}

export const getManagerStatsApi = async () => {
  const res = await apiClient.get<{ success: boolean; data: ManagerStatsData }>('/manager/stats');
  return res.data;
};

export const getResourceApprovalsApi = async () => {
  const res = await apiClient.get<{ success: boolean; data: any[] }>('/manager/resource-approvals');
  return res.data;
};

export const updateResourceApprovalApi = async (id: string, approvalStatus: 'approved' | 'rejected') => {
  const res = await apiClient.patch<{ success: boolean; message: string; data: any }>(`/manager/resource-approvals/${id}`, { approvalStatus });
  return res.data;
};

export const getUsersForVerificationApi = async (params?: { role?: string; isVerified?: boolean | string; search?: string }) => {
  const res = await apiClient.get<{ success: boolean; data: any[] }>('/manager/users', { params });
  return res.data;
};

export const toggleUserVerificationApi = async (id: string, isVerified: boolean) => {
  const res = await apiClient.patch<{ success: boolean; message: string; data: any }>(`/manager/users/${id}/verify`, { isVerified });
  return res.data;
};

export const getManagerBookingsApi = async (params?: { status?: string; search?: string; date?: string }) => {
  const res = await apiClient.get<{ success: boolean; data: any[] }>('/manager/bookings', { params });
  return res.data;
};

export const getManagerWaitlistsApi = async () => {
  const res = await apiClient.get<{ success: boolean; data: any[] }>('/manager/waitlists');
  return res.data;
};

export const promoteWaitlistBookingApi = async (id: string) => {
  const res = await apiClient.post<{ success: boolean; message: string; data: any }>(`/manager/waitlists/${id}/promote`);
  return res.data;
};

export const getManagerAuditLogsApi = async (params?: { action?: string; entityType?: string; limit?: number }) => {
  const res = await apiClient.get<{ success: boolean; data: any[] }>('/manager/audit-logs', { params });
  return res.data;
};

export const getSchedulingConflictsApi = async () => {
  const res = await apiClient.get<{ success: boolean; data: any[] }>('/manager/conflicts');
  return res.data;
};

export const resolveConflictApi = async (data: { approvedBookingId: string; alternateBookingId: string; action: string }) => {
  const res = await apiClient.post<{ success: boolean; message: string }>('/manager/conflicts/resolve', data);
  return res.data;
};

export const getManagerIncidentsApi = async () => {
  const res = await apiClient.get<{ success: boolean; data: any[] }>('/manager/incidents');
  return res.data;
};

export const updateIncidentStatusApi = async (id: string, data: { status: string; resolutionNotes?: string; actionTaken?: string }) => {
  const res = await apiClient.patch<{ success: boolean; message: string; data: any }>(`/manager/incidents/${id}`, data);
  return res.data;
};

export const getManagerDisputesApi = async () => {
  const res = await apiClient.get<{ success: boolean; data: any[] }>('/manager/disputes');
  return res.data;
};

export const resolveDisputeApi = async (id: string, resolution: string) => {
  const res = await apiClient.post<{ success: boolean; message: string; data: any }>(`/manager/disputes/${id}/resolve`, { resolution });
  return res.data;
};

export const getFairAllocationSettingsApi = async () => {
  const res = await apiClient.get<{ success: boolean; data: any }>('/manager/fair-allocation');
  return res.data;
};

export const updateFairAllocationSettingsApi = async (data: any) => {
  const res = await apiClient.put<{ success: boolean; message: string; data: any }>('/manager/fair-allocation', data);
  return res.data;
};
