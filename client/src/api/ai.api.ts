import apiClient from './client';
import { Resource } from '../types/resource';

export interface SmartMatchAlternative {
  resourceId: string;
  name: string;
  category: string;
  location: string;
  institution: string;
  status: string;
  reason: string;
}

export interface SmartMatchTimeSlot {
  timeSlot: string;
  isAvailable: boolean;
  conflictReason?: string;
}

export interface ParsedSearchIntent {
  rawQuery: string;
  detectedCategory?: string;
  detectedKeywords: string[];
  detectedDate?: string;
  detectedTimeSlot?: string;
  detectedSpecs: string[];
  confidence: number;
}

export interface SmartMatchItem {
  resource: Resource;
  matchScore: number;
  whyRecommended: string[];
  eligibilityStatus: {
    eligible: boolean;
    membershipVerified: boolean;
    qualificationMet: boolean;
    certificationsCovered: boolean;
    missingCertifications?: string[];
    isRestricted: boolean;
    actionRequired?: string;
  };
  availabilityStatus: {
    availableOnDate: boolean;
    operatingHoursMatch: boolean;
    reason?: string;
    recommendedTimeSlots?: SmartMatchTimeSlot[];
  };
  specificationsMatched: string[];
  alternatives?: SmartMatchAlternative[];
}

export interface SmartMatchResponse {
  results: SmartMatchItem[];
  totalMatched: number;
  parsedIntent?: ParsedSearchIntent;
  aiProvider: string;
  disclosure: string;
}

export interface UtilizationAnalyticsData {
  totalResources: number;
  availableResources: number;
  inUseResources: number;
  maintenanceResources: number;
  overallUtilizationRate: number;
  bookingFrequency: {
    totalBookingsMonth: number;
    avgBookingsPerAsset: number;
    avgDurationHours: number;
    weeklyTrend: Array<{ day: string; count: number; hours: number }>;
  };
  categoryUtilization: Array<{
    category: string;
    totalAssets: number;
    activeBookings: number;
    utilizationRate: number;
  }>;
  mostRequestedResources: Array<{
    resourceId: string;
    name: string;
    category: string;
    totalBookings: number;
    utilizationRate: number;
    demandLevel: 'high' | 'very_high' | 'critical';
  }>;
  underutilizedResources: Array<{
    resourceId: string;
    name: string;
    category: string;
    totalBookings: number;
    daysInactive: number;
    suggestedRemedy: string;
  }>;
  peakDemandPeriods: {
    peakDays: string[];
    peakHoursSummary: string;
    hourlyDistribution: Array<{
      period: string;
      timeRange: string;
      demandPercentage: number;
      isPeak: boolean;
    }>;
  };
  aiRecommendations: string[];
  aiProvider: string;
}

export interface ConflictDetectionResponse {
  hasConflict: boolean;
  canProceedToWaitlist: boolean;
  conflicts: Array<{
    type:
      | 'overlapping_request'
      | 'unavailable_time_slot'
      | 'resource_maintenance_period'
      | 'conflicting_approved_booking';
    severity: 'blocking' | 'warning';
    title: string;
    explanation: string;
    conflictingBooking?: {
      bookingId: string;
      userName: string;
      timeSlot: string;
      status: string;
    };
  }>;
  overallExplanation: string;
  suggestedAlternativeSlots: Array<{
    date: string;
    timeSlot: string;
    startTime: string;
    endTime: string;
    confidenceScore: number;
  }>;
  aiProvider: string;
}

export interface IncidentSummaryResponse {
  incidentId?: string;
  title: string;
  executiveSummary: string;
  keyFindings: string[];
  riskAssessment: {
    severity: 'low' | 'medium' | 'high' | 'critical';
    hardwareImpact: string;
    safetyHazardRating: string;
    operationalDisruption: string;
  };
  historicalCorrelation: {
    repeatIncidentsByReporter: number;
    assetPastIncidentsCount: number;
    correlationNote: string;
  };
  suggestedManagerActionItems: string[];
  aiDecisionGuard: string;
  aiProvider: string;
}

export interface AiStatusResponse {
  provider: string;
  isExternal: boolean;
  model: string;
  disclosureText: string;
  safetyGuardrail: string;
  capabilities: string[];
}

export const getAiStatusApi = async (): Promise<{ success: boolean; data: AiStatusResponse }> => {
  const response = await apiClient.get('/ai/status');
  return response.data;
};

export const smartMatchResourcesApi = async (payload: {
  requirements?: string;
  category?: string;
  location?: string;
  date?: string;
  timeSlot?: string;
  equipmentSpecs?: Record<string, string>;
  minRating?: number;
}): Promise<{ success: boolean; data: SmartMatchResponse }> => {
  const response = await apiClient.post('/ai/match-resources', payload);
  return response.data;
};

export const getUtilizationAnalyticsApi = async (
  institution?: string
): Promise<{ success: boolean; data: UtilizationAnalyticsData }> => {
  const response = await apiClient.get('/ai/utilization-analytics', {
    params: { institution },
  });
  return response.data;
};

export const detectSchedulingConflictsApi = async (payload: {
  resourceId: string;
  startTime: string;
  endTime: string;
  date: string;
  timeSlot: string;
  excludeBookingId?: string;
}): Promise<{ success: boolean; data: ConflictDetectionResponse }> => {
  const response = await apiClient.post('/ai/detect-conflicts', payload);
  return response.data;
};

export const summarizeIncidentApi = async (payload: {
  incidentId?: string;
  description?: string;
  category?: string;
  evidence?: string[];
  resourceName?: string;
  reportedBy?: string;
  severity?: string;
}): Promise<{ success: boolean; data: IncidentSummaryResponse }> => {
  const response = await apiClient.post('/ai/summarize-incident', payload);
  return response.data;
};
