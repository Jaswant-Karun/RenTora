import apiClient from './client';

export interface ISustainabilityConfig {
  costAvoidedPerHourINR: number;
  purchaseAvoidanceThresholdHours: number;
  averageApparatusCapitalCostINR: number;
  lifecycleEmbodiedCarbonEstimateKgPerUnit: number;
  methodologyNotes: string;
}

export interface IEcoShareInsights {
  insufficientData: boolean;
  dataNotice?: string;
  config: ISustainabilityConfig;
  summary: {
    totalCompletedBookings: number;
    totalSharedHours: number;
    activelySharedResourcesCount: number;
    totalRegisteredResources: number;
    sharedAdoptionPercentage: number;
    uniqueBorrowersCount: number;
    reuseMultiplier: number;
    estimatedAvoidedDuplicateUnits: number;
    estimatedCapExAvoidedINR: number;
    estimatedEmbodiedCarbonAvoidedKg: number;
    estimatedUtilizationImprovementPct: number;
  };
  categoryBreakdown: Array<{
    category: string;
    completedBookings: number;
    totalHours: number;
    uniqueResourcesCount: number;
    uniqueBorrowersCount: number;
    estimatedCapExAvoidedINR: number;
    shareOfTotalHoursPct: number;
  }>;
  monthlyImpact: Array<{
    yearMonth: string;
    monthLabel: string;
    completedBookings: number;
    totalHours: number;
    uniqueBorrowersCount: number;
    estimatedCapExAvoidedINR: number;
    estimatedEmbodiedCarbonKg: number;
  }>;
  yearlyImpact: Array<{
    year: string;
    completedBookings: number;
    totalHours: number;
    uniqueBorrowersCount: number;
    estimatedCapExAvoidedINR: number;
    estimatedEmbodiedCarbonKg: number;
  }>;
  actionableInsights: Array<{
    id: string;
    type: 'success' | 'warning' | 'info';
    category: string;
    title: string;
    observation: string;
    recommendation: string;
    isEstimate: boolean;
  }>;
  disclaimers: {
    isEstimate: boolean;
    carbonAccountingStandard: string;
    methodologyExplanation: string;
    assumptionParameters: ISustainabilityConfig;
  };
}

export const getEcoShareInsightsApi = async (institution?: string) => {
  const res = await apiClient.get<{ success: boolean; data: IEcoShareInsights }>('/ecoshare/insights', {
    params: institution ? { institution } : undefined,
  });
  return res.data;
};

export const getSustainabilityAssumptionsApi = async () => {
  const res = await apiClient.get<{ success: boolean; data: ISustainabilityConfig }>('/ecoshare/assumptions');
  return res.data;
};

export const updateSustainabilityAssumptionsApi = async (data: Partial<ISustainabilityConfig>) => {
  const res = await apiClient.put<{ success: boolean; message: string; data: ISustainabilityConfig }>(
    '/ecoshare/assumptions',
    data
  );
  return res.data;
};

export const downloadSustainabilityReportApi = async (institution?: string) => {
  const res = await apiClient.get('/ecoshare/export', {
    params: institution ? { institution } : undefined,
    responseType: 'blob',
  });
  return res.data;
};
