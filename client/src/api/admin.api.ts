import apiClient from './client';
import { Resource } from '../types/resource';

export interface AdminStatsData {
  totalUsers: number;
  totalInstitutions: number;
  totalResources: number;
  totalBookings: number;
  pendingApprovals: number;
  activeIncidents: number;
  resourceUtilization: string;
}

export interface AdminUserItem {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'faculty' | 'owner' | 'manager' | 'admin';
  institution: string;
  department?: string;
  isVerified: boolean;
  institutionMembershipVerified?: boolean;
  academicQualification?: string;
  trainingCertifications?: string[];
  historicalUsage?: {
    totalHoursLogged: number;
    penaltyPoints: number;
  };
  createdAt: string;
}

export interface AdminInstitutionItem {
  _id: string;
  name: string;
  code: string;
  domain: string;
  campusLocation: string;
  contactEmail: string;
  status: 'active' | 'pending' | 'suspended';
  totalMembers: number;
  totalAssets: number;
  partnershipTier: 'Tier 1 Research' | 'Associate Campus' | 'Consortium Partner';
  joinedDate: string;
}

export interface SystemSettingsData {
  platformName: string;
  supportEmail: string;
  allowPublicRegistration: boolean;
  defaultSessionDurationDays: number;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  maxActiveBookingsPerUser: number;
  maxWeeklyReservationHours: number;
  monopolisationWindowDays: number;
  enforceAuditLedgerIntegrity: boolean;
  aiEngineProvider: string;
  updatedBy?: string;
}

export const getAdminOverviewApi = async (): Promise<{
  success: boolean;
  data: { stats: AdminStatsData; institutionsSummary: string[] };
}> => {
  const response = await apiClient.get('/admin/overview');
  return response.data;
};

export const getAdminUsersApi = async (params?: {
  search?: string;
  role?: string;
  institution?: string;
  page?: number;
  limit?: number;
}): Promise<{
  success: boolean;
  data: AdminUserItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}> => {
  const response = await apiClient.get('/admin/users', { params });
  return response.data;
};

export const updateAdminUserRoleApi = async (
  id: string,
  payload: {
    role?: string;
    isVerified?: boolean;
    institutionMembershipVerified?: boolean;
  }
): Promise<{ success: boolean; message: string; data: AdminUserItem }> => {
  const response = await apiClient.patch(`/admin/users/${id}/role`, payload);
  return response.data;
};

export const deleteAdminUserApi = async (
  id: string
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete(`/admin/users/${id}`);
  return response.data;
};

export const getAdminResourcesApi = async (params?: {
  search?: string;
  category?: string;
  status?: string;
  institution?: string;
  page?: number;
  limit?: number;
}): Promise<{
  success: boolean;
  data: Resource[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}> => {
  const response = await apiClient.get('/admin/resources', { params });
  return response.data;
};

export const updateAdminResourceApi = async (
  id: string,
  payload: {
    status?: string;
    approvalStatus?: string;
    isRestricted?: boolean;
    requiredQualification?: string;
  }
): Promise<{ success: boolean; message: string; data: Resource }> => {
  const response = await apiClient.patch(`/admin/resources/${id}`, payload);
  return response.data;
};

export const deleteAdminResourceApi = async (
  id: string
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete(`/admin/resources/${id}`);
  return response.data;
};

export const getAdminInstitutionsApi = async (): Promise<{
  success: boolean;
  data: AdminInstitutionItem[];
}> => {
  const response = await apiClient.get('/admin/institutions');
  return response.data;
};

export const createAdminInstitutionApi = async (payload: {
  name: string;
  code: string;
  domain: string;
  campusLocation: string;
  contactEmail: string;
  partnershipTier: string;
}): Promise<{ success: boolean; message: string; data: AdminInstitutionItem }> => {
  const response = await apiClient.post('/admin/institutions', payload);
  return response.data;
};

export const getAdminSettingsApi = async (): Promise<{
  success: boolean;
  data: SystemSettingsData;
}> => {
  const response = await apiClient.get('/admin/settings');
  return response.data;
};

export const updateAdminSettingsApi = async (
  payload: Partial<SystemSettingsData>
): Promise<{ success: boolean; message: string; data: SystemSettingsData }> => {
  const response = await apiClient.put('/admin/settings', payload);
  return response.data;
};
