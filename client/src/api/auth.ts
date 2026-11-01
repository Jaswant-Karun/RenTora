import apiClient from './client';
import { AuthResponse, DemoAccount, User } from '../types/auth';

export const loginApi = async (credentials: {
  email: string;
  password: string;
  rememberMe?: boolean;
}): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
  return response.data;
};

export const registerApi = async (userData: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'student' | 'owner';
  institution: string;
  department: string;
  phone: string;
  agreeTerms: boolean;
}): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/register', userData);
  return response.data;
};

export const logoutApi = async (): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post('/auth/logout');
  return response.data;
};

export const forgotPasswordApi = async (email: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post('/auth/forgot-password', { email });
  return response.data;
};

export const getMeApi = async (): Promise<{ success: boolean; data: { user: User } }> => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};

export const getDemoAccountsApi = async (): Promise<{ success: boolean; enabled?: boolean; message?: string; data: DemoAccount[] }> => {
  const response = await apiClient.get('/auth/demo-accounts');
  return response.data;
};

export const getHealthApi = async (): Promise<any> => {
  const response = await apiClient.get('/health');
  return response.data;
};

export const updateProfileApi = async (data: {
  name?: string;
  phone?: string;
  department?: string;
  avatar?: string;
  bio?: string;
  academicQualification?: string;
}): Promise<{ success: boolean; message: string; data: User }> => {
  const response = await apiClient.put('/auth/profile', data);
  return response.data;
};

export const changePasswordApi = async (data: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.put('/auth/change-password', data);
  return response.data;
};
