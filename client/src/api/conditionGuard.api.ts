import { apiClient } from './client';
import { Booking } from '../types/resource';

export interface ReportDifference {
  category: string;
  before: string;
  after: string;
  requiresReview: boolean;
}

export interface ConditionReportItem {
  _id: string;
  resourceId: string;
  resourceName: string;
  bookingId?: string;
  inspectorName: string;
  inspectorRole: string;
  responsibleUserId?: string;
  responsibleUserName?: string;
  responsibleUserEmail?: string;
  type: 'check_in' | 'check_out' | 'routine';
  operationalStatus: 'optimal' | 'minor_wear' | 'damaged' | 'offline';
  cleanliness: 'passed' | 'needs_cleaning';
  meterReading?: string;
  existingDamage?: string[];
  conditionNotes: string;
  observations: string;
  photos: string[];
  differences?: {
    hasDifferences: boolean;
    summary: string;
    items: ReportDifference[];
  };
  requiresHumanReview: boolean;
  timestamp: string;
  createdAt: string;
}

export interface ConditionComparisonData {
  bookingId: string;
  resourceId: string;
  resourceName: string;
  borrower: {
    name: string;
    email: string;
    role?: string;
  };
  beforeReport: ConditionReportItem | null;
  afterReport: ConditionReportItem | null;
  hasDifferences: boolean;
  differences: ReportDifference[];
  humanReviewNotice: string;
  requiresHumanReview: boolean;
  incidentEligible: boolean;
}

export interface IncidentItem {
  _id: string;
  incidentNumber: string;
  category:
    | 'equipment_damage'
    | 'delayed_return'
    | 'late_return'
    | 'missing_components'
    | 'equipment_malfunction'
    | 'safety_concerns'
    | 'disputes'
    | 'misuse'
    | 'scheduling_conflicts'
    | 'other';
  title: string;
  description: string;
  evidence: string[];
  bookingId?: string;
  bookingReference?: string;
  resourceId?: string;
  resourceName: string;
  reportedBy: string;
  reportedByRole: string;
  userEmail: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'reported' | 'investigating' | 'decision_pending' | 'resolved' | 'dismissed';
  requiresHumanReview: boolean;
  investigationNotes: Array<{
    authorName: string;
    authorRole: string;
    note: string;
    createdAt: string;
  }>;
  decision?: {
    outcome: 'no_fault' | 'user_responsible' | 'fair_wear_and_tear' | 'equipment_defect' | 'under_review';
    decidedBy: string;
    decidedAt: string;
    rationale: string;
    sanctions?: string;
  };
  resolution?: {
    summary: string;
    resolvedBy: string;
    resolvedAt: string;
    actionTaken: string;
  };
  createdAt: string;
  comparison?: ConditionComparisonData;
}

// 1. Upload Photographic Evidence
export const uploadEvidenceApi = async (
  files: File[]
): Promise<{ success: boolean; data: { urls: string[]; count: number } }> => {
  const formData = new FormData();
  files.forEach((file) => formData.append('photos', file));

  const response = await apiClient.post('/upload/evidence', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// 2. Before Check-In Condition Report
export const recordBeforeCheckInApi = async (payload: {
  bookingId: string;
  operationalStatus?: 'optimal' | 'minor_wear' | 'damaged' | 'offline';
  cleanliness?: 'passed' | 'needs_cleaning';
  meterReading?: string;
  existingDamage?: string[];
  conditionNotes?: string;
  observations?: string;
  photos?: string[];
  userConfirmation?: boolean;
}): Promise<{ success: boolean; message: string; data: ConditionReportItem }> => {
  const response = await apiClient.post('/condition-guard/before-checkin', payload);
  return response.data;
};

// 3. After Check-Out Condition Report & Comparative Analysis
export const recordAfterCheckOutApi = async (payload: {
  bookingId: string;
  operationalStatus?: 'optimal' | 'minor_wear' | 'damaged' | 'offline';
  cleanliness?: 'passed' | 'needs_cleaning';
  meterReading?: string;
  conditionNotes?: string;
  observations?: string;
  photos?: string[];
  userConfirmation?: boolean;
}): Promise<{
  success: boolean;
  message: string;
  data: { report: ConditionReportItem; comparison: ConditionComparisonData };
}> => {
  const response = await apiClient.post('/condition-guard/after-checkout', payload);
  return response.data;
};

// 4. Get Condition Comparison by Booking ID
export const getConditionComparisonApi = async (
  bookingId: string
): Promise<{ success: boolean; data: ConditionComparisonData }> => {
  const response = await apiClient.get(`/condition-guard/comparison/${bookingId}`);
  return response.data;
};

// 5. Get List of Condition Reports
export const getConditionReportsApi = async (params?: {
  resourceId?: string;
  bookingId?: string;
  type?: string;
  limit?: number;
}): Promise<{ success: boolean; data: ConditionReportItem[] }> => {
  const response = await apiClient.get('/condition-guard/reports', { params });
  return response.data;
};

// 6. Report Incident
export const reportIncidentApi = async (payload: {
  title?: string;
  category: string;
  description: string;
  evidence?: string[];
  bookingId?: string;
  bookingReference?: string;
  resourceId?: string;
  resourceName?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}): Promise<{ success: boolean; message: string; data: IncidentItem }> => {
  const response = await apiClient.post('/incidents', payload);
  return response.data;
};

// 7. Get Incidents List
export const getIncidentsApi = async (params?: {
  category?: string;
  status?: string;
  severity?: string;
  resourceId?: string;
  bookingId?: string;
  limit?: number;
}): Promise<{ success: boolean; data: IncidentItem[] }> => {
  const response = await apiClient.get('/incidents', { params });
  return response.data;
};

// 8. Get Single Incident by ID
export const getIncidentByIdApi = async (
  id: string
): Promise<{ success: boolean; data: IncidentItem }> => {
  const response = await apiClient.get(`/incidents/${id}`);
  return response.data;
};

// 9. Add Investigation Note
export const addInvestigationNoteApi = async (
  id: string,
  note: string
): Promise<{ success: boolean; message: string; data: IncidentItem }> => {
  const response = await apiClient.post(`/incidents/${id}/investigate`, { note });
  return response.data;
};

// 10. Record Decision (Human Review)
export const recordIncidentDecisionApi = async (
  id: string,
  payload: {
    outcome: 'no_fault' | 'user_responsible' | 'fair_wear_and_tear' | 'equipment_defect' | 'under_review';
    rationale: string;
    sanctions?: string;
  }
): Promise<{ success: boolean; message: string; data: IncidentItem }> => {
  const response = await apiClient.post(`/incidents/${id}/decision`, payload);
  return response.data;
};

// 11. Resolve Incident
export const resolveIncidentApi = async (
  id: string,
  payload: {
    status?: 'resolved' | 'dismissed';
    resolutionNotes?: string;
    actionTaken?: string;
    sanctionsApplied?: string;
    penaltyPoints?: number;
  }
): Promise<{ success: boolean; message: string; data: IncidentItem }> => {
  const response = await apiClient.post(`/incidents/${id}/resolve`, payload);
  return response.data;
};
