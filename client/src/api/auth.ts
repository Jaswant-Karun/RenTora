import apiClient from './client';
import { AuthResponse, DemoAccount, User } from '../types/auth';

export const loginApi = async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
  return response.data;
};

export const registerApi = async (userData: {
  name: string;
  email: string;
  password: string;
  role: string;
  institution: string;
  department?: string;
  phone?: string;
}): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/register', userData);
  return response.data;
};

export const getMeApi = async (): Promise<{ success: boolean; data: { user: User } }> => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};

export const getDemoAccountsApi = async (): Promise<{ success: boolean; data: DemoAccount[] }> => {
  const response = await apiClient.get('/auth/demo-accounts');
  return response.data;
};

export const getHealthApi = async (): Promise<any> => {
  const response = await apiClient.get('/health');
  return response.data;
};
