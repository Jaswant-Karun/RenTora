import { apiClient } from './client';

export interface FairShareExplanation {
  eligibilityResult: {
    passed: boolean;
    membershipVerified: boolean;
    trainingSatisfied: boolean;
    qualificationSatisfied: boolean;
    details: string;
  };
  availabilityResult: {
    passed: boolean;
    resourceStatus: string;
    details: string;
  };
  conflictResult: {
    hasConflict: boolean;
    conflictingBookingId?: string;
    conflictingUser?: string;
    conflictingSlot?: string;
    details: string;
  };
  priorityRule: {
    appliedRule: string;
    priorityTier: string;
    score: number;
    factors: string[];
    details: string;
  };
  activeLimitResult: {
    passed: boolean;
    currentActiveCount: number;
    maxAllowed: number;
    details: string;
  };
  previousUsageResult: {
    passed: boolean;
    recentBookingsCount: number;
    recentHoursLogged: number;
    cooldownPeriodDays: number;
    details: string;
  };
  finalDecision: 'APPROVED' | 'PENDING_REVIEW' | 'WAITLISTED' | 'REJECTED';
  reason: string;
  timestamp: string;
}

export interface FairShareEvaluationData {
  canBook: boolean;
  finalDecision: 'APPROVED' | 'PENDING_REVIEW' | 'WAITLISTED' | 'REJECTED';
  reason: string;
  explanation: FairShareExplanation;
  conflictingBooking?: any;
  activeLimitExceeded?: boolean;
}

export interface FairShareDecisionItem {
  _id: string;
  bookingId?: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  userDepartment?: string;
  userQualification?: string;
  resourceId: string;
  resourceName: string;
  institution: string;
  date: string;
  timeSlot: string;
  explanation: FairShareExplanation;
  finalDecision: 'APPROVED' | 'PENDING_REVIEW' | 'WAITLISTED' | 'REJECTED';
  reason: string;
  isOverridden?: boolean;
  overriddenBy?: string;
  overrideReason?: string;
  overriddenAt?: string;
  createdAt: string;
}

export interface FairSharePolicy {
  _id?: string;
  institution: string;
  maxWeeklyHoursPerStudent: number;
  maxActiveBookingsPerStudent: number;
  peakHourThrottling: boolean;
  emergencyBypassEnabled: boolean;
  priorityTiers: string[];
  advanceBookingDays: number;
  cancellationGraceHours: number;
  maxReservationsPerAssetPer14Days: number;
  cooldownPeriodDays: number;
  priorityScoring: {
    phdScholarPoints: number;
    finalYearPoints: number;
    undergradPoints: number;
    deptPriorityPoints: number;
    lowUsageBonusPoints: number;
    penaltyDeductionPoints: number;
  };
  updatedAt?: string;
}

// 1. Evaluate reservation request transparently
export const evaluateFairShareApi = async (data: {
  resourceId: string;
  date: string;
  timeSlot: string;
  startTime?: string;
  endTime?: string;
}): Promise<{ success: boolean; data: FairShareEvaluationData }> => {
  const response = await apiClient.post('/fairshare/evaluate', data);
  return response.data;
};

// 2. Get FairShare decision history
export const getFairShareHistoryApi = async (params?: {
  decision?: string;
  resourceId?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{
  success: boolean;
  data: {
    decisions: FairShareDecisionItem[];
    pagination: {
      total: number;
      page: number;
      pageSize: number;
      pages: number;
    };
  };
}> => {
  const response = await apiClient.get('/fairshare/history', { params });
  return response.data;
};

// 3. Get Institutional Policy
export const getFairSharePolicyApi = async (): Promise<{
  success: boolean;
  data: FairSharePolicy;
}> => {
  const response = await apiClient.get('/fairshare/policy');
  return response.data;
};

// 4. Update Institutional Policy
export const updateFairSharePolicyApi = async (
  policy: Partial<FairSharePolicy>
): Promise<{ success: boolean; data: FairSharePolicy }> => {
  const response = await apiClient.put('/fairshare/policy', policy);
  return response.data;
};

// 5. Manager Override with mandatory reason
export const managerOverrideAllocationApi = async (
  bookingId: string,
  data: { reason: string; action?: 'approve' | 'reject' | 'promote' }
): Promise<{ success: boolean; message: string; data: any }> => {
  const response = await apiClient.post(`/fairshare/override/${bookingId}`, data);
  return response.data;
};

// 6. Get Resource Waitlist
export const getResourceWaitlistApi = async (
  resourceId: string
): Promise<{ success: boolean; data: any[] }> => {
  const response = await apiClient.get(`/fairshare/waitlist/${resourceId}`);
  return response.data;
};
