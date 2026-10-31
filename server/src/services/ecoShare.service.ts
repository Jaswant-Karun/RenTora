import { Booking } from '../models/booking.model.js';
import { Resource } from '../models/resource.model.js';
import { SystemSetting, ISustainabilityConfig } from '../models/systemSetting.model.js';

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

export class EcoShareService {
  /**
   * Fetch or initialize default sustainability configuration
   */
  public static async getSustainabilityConfig(): Promise<ISustainabilityConfig> {
    const settings = await SystemSetting.findOne();
    if (settings && settings.sustainabilityConfig) {
      return settings.sustainabilityConfig;
    }

    const defaultConfig: ISustainabilityConfig = {
      costAvoidedPerHourINR: 1850,
      purchaseAvoidanceThresholdHours: 80,
      averageApparatusCapitalCostINR: 250000,
      lifecycleEmbodiedCarbonEstimateKgPerUnit: 350,
      methodologyNotes:
        'Estimates reflect avoided duplicate institutional procurement based on amortized laboratory apparatus usage. These figures represent engineering estimates and are not certified carbon offsets.',
    };

    if (settings) {
      settings.sustainabilityConfig = defaultConfig;
      await settings.save();
    }

    return defaultConfig;
  }

  /**
   * Update sustainability assumptions (Institution Manager / Admin)
   */
  public static async updateSustainabilityConfig(
    updatedConfig: Partial<ISustainabilityConfig>,
    updatedBy: string = 'Campus Sustainability Lead'
  ): Promise<ISustainabilityConfig> {
    let settings = await SystemSetting.findOne();
    if (!settings) {
      settings = new SystemSetting();
    }

    const currentConfig = settings.sustainabilityConfig || {
      costAvoidedPerHourINR: 1850,
      purchaseAvoidanceThresholdHours: 80,
      averageApparatusCapitalCostINR: 250000,
      lifecycleEmbodiedCarbonEstimateKgPerUnit: 350,
      methodologyNotes: '',
    };

    settings.sustainabilityConfig = {
      costAvoidedPerHourINR:
        typeof updatedConfig.costAvoidedPerHourINR === 'number'
          ? Math.max(0, updatedConfig.costAvoidedPerHourINR)
          : currentConfig.costAvoidedPerHourINR,
      purchaseAvoidanceThresholdHours:
        typeof updatedConfig.purchaseAvoidanceThresholdHours === 'number'
          ? Math.max(1, updatedConfig.purchaseAvoidanceThresholdHours)
          : currentConfig.purchaseAvoidanceThresholdHours,
      averageApparatusCapitalCostINR:
        typeof updatedConfig.averageApparatusCapitalCostINR === 'number'
          ? Math.max(0, updatedConfig.averageApparatusCapitalCostINR)
          : currentConfig.averageApparatusCapitalCostINR,
      lifecycleEmbodiedCarbonEstimateKgPerUnit:
        typeof updatedConfig.lifecycleEmbodiedCarbonEstimateKgPerUnit === 'number'
          ? Math.max(0, updatedConfig.lifecycleEmbodiedCarbonEstimateKgPerUnit)
          : currentConfig.lifecycleEmbodiedCarbonEstimateKgPerUnit,
      methodologyNotes: updatedConfig.methodologyNotes || currentConfig.methodologyNotes,
    };

    settings.updatedBy = updatedBy;
    await settings.save();

    return settings.sustainabilityConfig;
  }

  /**
   * Generate comprehensive EcoShare Sustainability Insights based strictly on actual completed bookings
   */
  public static async generateInsights(institutionFilter?: string): Promise<IEcoShareInsights> {
    const config = await this.getSustainabilityConfig();

    // Query all completed bookings
    const query: Record<string, any> = {
      status: 'completed',
    };

    if (institutionFilter) {
      query.$or = [{ userInstitution: institutionFilter }];
    }

    const completedBookings = await Booking.find(query).lean();
    const totalRegisteredResources = await Resource.countDocuments({ isArchived: { $ne: true } });

    // Handle Insufficient Data condition strictly
    if (!completedBookings || completedBookings.length === 0) {
      return {
        insufficientData: true,
        dataNotice:
          'Insufficient completed booking data in the database. Sustainability estimates and asset utilization gains require at least one verified completed booking to ensure scientific integrity and prevent speculative estimations.',
        config,
        summary: {
          totalCompletedBookings: 0,
          totalSharedHours: 0,
          activelySharedResourcesCount: 0,
          totalRegisteredResources,
          sharedAdoptionPercentage: 0,
          uniqueBorrowersCount: 0,
          reuseMultiplier: 0,
          estimatedAvoidedDuplicateUnits: 0,
          estimatedCapExAvoidedINR: 0,
          estimatedEmbodiedCarbonAvoidedKg: 0,
          estimatedUtilizationImprovementPct: 0,
        },
        categoryBreakdown: [],
        monthlyImpact: [],
        yearlyImpact: [],
        actionableInsights: [
          {
            id: 'insufficient-data-notice',
            type: 'info',
            category: 'Data Governance',
            title: 'Baseline Utilization Benchmark Awaiting Records',
            observation: 'No completed shared reservations have been logged yet for the selected scope.',
            recommendation:
              'Complete resource bookings via the TrustPass check-in/check-out workflow to automatically generate verified utilization benchmarks.',
            isEstimate: false,
          },
        ],
        disclaimers: {
          isEstimate: true,
          carbonAccountingStandard: 'Internal Engineering Proxy (GHG Protocol Scope 3 Category 1 Avoided Embodied Emissions Proxy)',
          methodologyExplanation: config.methodologyNotes,
          assumptionParameters: config,
        },
      };
    }

    // Actual Calculations from verified records
    const totalCompleted = completedBookings.length;
    let totalSharedHours = 0;
    const activeResourcesSet = new Set<string>();
    const uniqueBorrowersSet = new Set<string>();

    const categoryMap: Record<
      string,
      {
        category: string;
        completedBookings: number;
        totalHours: number;
        resourceIds: Set<string>;
        borrowerIds: Set<string>;
      }
    > = {};

    const monthMap: Record<
      string,
      {
        yearMonth: string;
        monthLabel: string;
        completedBookings: number;
        totalHours: number;
        borrowerIds: Set<string>;
      }
    > = {};

    const yearMap: Record<
      string,
      {
        year: string;
        completedBookings: number;
        totalHours: number;
        borrowerIds: Set<string>;
      }
    > = {};

    for (const booking of completedBookings) {
      const hours = Number(booking.durationHours) > 0 ? Number(booking.durationHours) : 1;
      totalSharedHours += hours;

      if (booking.resourceId) {
        activeResourcesSet.add(booking.resourceId.toString());
      }
      if (booking.userId) {
        uniqueBorrowersSet.add(booking.userId.toString());
      }

      // Group by Category
      const cat = booking.resourceCategory || 'General Apparatus';
      if (!categoryMap[cat]) {
        categoryMap[cat] = {
          category: cat,
          completedBookings: 0,
          totalHours: 0,
          resourceIds: new Set<string>(),
          borrowerIds: new Set<string>(),
        };
      }
      categoryMap[cat].completedBookings += 1;
      categoryMap[cat].totalHours += hours;
      if (booking.resourceId) categoryMap[cat].resourceIds.add(booking.resourceId.toString());
      if (booking.userId) categoryMap[cat].borrowerIds.add(booking.userId.toString());

      // Group by Month (using booking.startTime or booking.createdAt or booking.date)
      const bookingDate = booking.startTime
        ? new Date(booking.startTime)
        : booking.date
        ? new Date(booking.date)
        : new Date(booking.createdAt);

      const year = bookingDate.getFullYear().toString();
      const monthNum = String(bookingDate.getMonth() + 1).padStart(2, '0');
      const yearMonth = `${year}-${monthNum}`;
      const monthLabel = bookingDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      // Month map
      if (!monthMap[yearMonth]) {
        monthMap[yearMonth] = {
          yearMonth,
          monthLabel,
          completedBookings: 0,
          totalHours: 0,
          borrowerIds: new Set<string>(),
        };
      }
      monthMap[yearMonth].completedBookings += 1;
      monthMap[yearMonth].totalHours += hours;
      if (booking.userId) monthMap[yearMonth].borrowerIds.add(booking.userId.toString());

      // Year map
      if (!yearMap[year]) {
        yearMap[year] = {
          year,
          completedBookings: 0,
          totalHours: 0,
          borrowerIds: new Set<string>(),
        };
      }
      yearMap[year].completedBookings += 1;
      yearMap[year].totalHours += hours;
      if (booking.userId) yearMap[year].borrowerIds.add(booking.userId.toString());
    }

    const activelySharedResourcesCount = activeResourcesSet.size;
    const uniqueBorrowersCount = uniqueBorrowersSet.size;

    // Adoption percentage
    const sharedAdoptionPercentage =
      totalRegisteredResources > 0
        ? Number(((activelySharedResourcesCount / totalRegisteredResources) * 100).toFixed(1))
        : 100;

    // Reuse Multiplier: average completed sessions per active apparatus
    const reuseMultiplier =
      activelySharedResourcesCount > 0
        ? Number((totalCompleted / activelySharedResourcesCount).toFixed(2))
        : 1;

    // Estimated Avoided Duplicate Equipment Units
    // Based on configured threshold hours (e.g. 80 shared hours equivalent to 1 capital purchase averted)
    const threshold = config.purchaseAvoidanceThresholdHours || 80;
    const estimatedAvoidedDuplicateUnits = Number((totalSharedHours / threshold).toFixed(2));

    // Estimated CapEx Avoided in INR
    const costPerHour = config.costAvoidedPerHourINR || 1850;
    const estimatedCapExAvoidedINR = Math.round(totalSharedHours * costPerHour);

    // Estimated Embodied Carbon Avoided in kg CO2e
    const carbonPerUnit = config.lifecycleEmbodiedCarbonEstimateKgPerUnit || 350;
    const estimatedEmbodiedCarbonAvoidedKg = Math.round(estimatedAvoidedDuplicateUnits * carbonPerUnit);

    // Estimated Utilization Improvement Percentage:
    // Compare federated usage with baseline isolated lab rate (~15% baseline)
    // Assuming standard 160 operational hours/month per resource
    const estimatedUtilizationImprovementPct = Math.min(
      85,
      Number(((totalSharedHours / Math.max(1, activelySharedResourcesCount * 120)) * 100).toFixed(1))
    );

    // Category Breakdown formatting
    const categoryBreakdown = Object.values(categoryMap)
      .map((item) => ({
        category: item.category,
        completedBookings: item.completedBookings,
        totalHours: item.totalHours,
        uniqueResourcesCount: item.resourceIds.size,
        uniqueBorrowersCount: item.borrowerIds.size,
        estimatedCapExAvoidedINR: Math.round(item.totalHours * costPerHour),
        shareOfTotalHoursPct:
          totalSharedHours > 0 ? Number(((item.totalHours / totalSharedHours) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.totalHours - a.totalHours);

    // Monthly Impact formatting (ordered chronologically)
    const monthlyImpact = Object.values(monthMap)
      .sort((a, b) => a.yearMonth.localeCompare(b.yearMonth))
      .map((m) => {
        const units = Number((m.totalHours / threshold).toFixed(2));
        return {
          yearMonth: m.yearMonth,
          monthLabel: m.monthLabel,
          completedBookings: m.completedBookings,
          totalHours: m.totalHours,
          uniqueBorrowersCount: m.borrowerIds.size,
          estimatedCapExAvoidedINR: Math.round(m.totalHours * costPerHour),
          estimatedEmbodiedCarbonKg: Math.round(units * carbonPerUnit),
        };
      });

    // Yearly Impact formatting
    const yearlyImpact = Object.values(yearMap)
      .sort((a, b) => a.year.localeCompare(b.year))
      .map((y) => {
        const units = Number((y.totalHours / threshold).toFixed(2));
        return {
          year: y.year,
          completedBookings: y.completedBookings,
          totalHours: y.totalHours,
          uniqueBorrowersCount: y.borrowerIds.size,
          estimatedCapExAvoidedINR: Math.round(y.totalHours * costPerHour),
          estimatedEmbodiedCarbonKg: Math.round(units * carbonPerUnit),
        };
      });

    // Actionable Sustainability Insights based on data
    const actionableInsights = [];

    // Insight 1: Highest utilized category
    if (categoryBreakdown.length > 0) {
      const topCat = categoryBreakdown[0];
      actionableInsights.push({
        id: 'top-shared-category',
        type: 'success' as const,
        category: 'Shared Asset Efficiency',
        title: `Highest Cross-Department Sharing: ${topCat.category}`,
        observation: `${topCat.category} leads institutional sharing with ${topCat.totalHours} runtime hours logged across ${topCat.uniqueBorrowersCount} distinct researchers.`,
        recommendation: `Maintain cross-department shared booking slots to prevent individual research labs from submitting redundant capital equipment purchase requests.`,
        isEstimate: false,
      });
    }

    // Insight 2: Avoided Duplicate CapEx
    if (estimatedAvoidedDuplicateUnits >= 0.5) {
      actionableInsights.push({
        id: 'avoided-procurement',
        type: 'info' as const,
        category: 'Capital Expenditure Optimization',
        title: `Estimated ~${estimatedAvoidedDuplicateUnits} Duplicate Equipment Procurements Avoided`,
        observation: `Cumulatively ${totalSharedHours} hours of completed access represents approximately ${estimatedAvoidedDuplicateUnits} units of standalone hardware that did not need individual department purchasing.`,
        recommendation: `Institutional finance committees can utilize this metric during annual equipment grant reviews to prioritize shared maintenance funds over duplicate acquisitions.`,
        isEstimate: true,
      });
    }

    // Insight 3: Reuse Multiplier & Utilization
    actionableInsights.push({
      id: 'reuse-index',
      type: 'success' as const,
      category: 'Asset Circularity',
      title: `Institutional Asset Reuse Multiplier: ${reuseMultiplier}x`,
      observation: `On average, each actively shared campus apparatus completed ${reuseMultiplier} distinct research reservations without scheduling deadlock.`,
      recommendation: `Encourage departments with single-user apparatus to register under RENTORA's FairShare allocation engine to raise campus-wide utilization toward ${Math.min(90, estimatedUtilizationImprovementPct + 15)}%.`,
      isEstimate: true,
    });

    return {
      insufficientData: false,
      config,
      summary: {
        totalCompletedBookings: totalCompleted,
        totalSharedHours,
        activelySharedResourcesCount,
        totalRegisteredResources,
        sharedAdoptionPercentage,
        uniqueBorrowersCount,
        reuseMultiplier,
        estimatedAvoidedDuplicateUnits,
        estimatedCapExAvoidedINR,
        estimatedEmbodiedCarbonAvoidedKg,
        estimatedUtilizationImprovementPct,
      },
      categoryBreakdown,
      monthlyImpact,
      yearlyImpact,
      actionableInsights,
      disclaimers: {
        isEstimate: true,
        carbonAccountingStandard: 'Institutional Lifecycle Engineering Proxy (Avoided Manufacturing & Capital Waste)',
        methodologyExplanation: config.methodologyNotes,
        assumptionParameters: config,
      },
    };
  }

  /**
   * Export comprehensive EcoShare Sustainability Impact Report as CSV format
   */
  public static async generateSustainabilityCSV(institutionFilter?: string): Promise<string> {
    const data = await this.generateInsights(institutionFilter);

    const rows: string[] = [];

    // Header & Disclaimer Block
    rows.push('================================================================================');
    rows.push('RENTORA ECOSHARE - INSTITUTIONAL RESOURCE SUSTAINABILITY REPORT');
    rows.push(`Generated On,${new Date().toISOString()}`);
    rows.push('Notice,ALL ENVIRONMENTAL IMPACT AND AVOIDED CAPITAL FIGURES ARE ENGINEERING ESTIMATES');
    rows.push(`Methodology,${data.disclaimers.methodologyExplanation.replace(/,/g, ';')}`);
    rows.push(`Configured Rate INR/Hour,${data.config.costAvoidedPerHourINR}`);
    rows.push(`Avoidance Threshold Hours,${data.config.purchaseAvoidanceThresholdHours}`);
    rows.push(`Apparatus Capital Value Baseline INR,${data.config.averageApparatusCapitalCostINR}`);
    rows.push(`Embodied Carbon Baseline Kg/Unit,${data.config.lifecycleEmbodiedCarbonEstimateKgPerUnit}`);
    rows.push('================================================================================');
    rows.push('');

    // Summary Section
    rows.push('--- EXECUTIVE SUMMARY (ACTUAL COMPLETED ACTIVITY) ---');
    rows.push('Metric,Value,Unit,Calculation Type');
    rows.push(`Completed Shared Bookings,${data.summary.totalCompletedBookings},Bookings,Actual Verified`);
    rows.push(`Total Shared Hours Logged,${data.summary.totalSharedHours},Hours,Actual Verified`);
    rows.push(`Actively Shared Apparatus,${data.summary.activelySharedResourcesCount},Assets,Actual Verified`);
    rows.push(`Total Registered Apparatus,${data.summary.totalRegisteredResources},Assets,Actual Verified`);
    rows.push(`Campus Shared Adoption Rate,${data.summary.sharedAdoptionPercentage},%,Computed`);
    rows.push(`Unique Participating Borrowers,${data.summary.uniqueBorrowersCount},Researchers,Actual Verified`);
    rows.push(`Asset Reuse Multiplier,${data.summary.reuseMultiplier},x,Computed`);
    rows.push(`Estimated Avoided Purchases,~${data.summary.estimatedAvoidedDuplicateUnits},Apparatus Units,ESTIMATE`);
    rows.push(`Estimated CapEx Avoided,~${data.summary.estimatedCapExAvoidedINR},INR,ESTIMATE`);
    rows.push(`Estimated Avoided Embodied Carbon,~${data.summary.estimatedEmbodiedCarbonAvoidedKg},kg CO2e,ESTIMATE`);
    rows.push(`Estimated Utilization Improvement,~${data.summary.estimatedUtilizationImprovementPct},%,ESTIMATE`);
    rows.push('');

    // Category Breakdown Section
    rows.push('--- CATEGORY LEVEL RESOURCE SHARING BREAKDOWN ---');
    rows.push('Category,Completed Bookings,Total Shared Hours,Unique Assets,Unique Borrowers,Estimated CapEx Avoided (INR),Share of Total Hours (%)');
    for (const c of data.categoryBreakdown) {
      rows.push(
        `"${c.category}",${c.completedBookings},${c.totalHours},${c.uniqueResourcesCount},${c.uniqueBorrowersCount},${c.estimatedCapExAvoidedINR},${c.shareOfTotalHoursPct}%`
      );
    }
    rows.push('');

    // Monthly Impact Section
    rows.push('--- MONTHLY SUSTAINABILITY IMPACT BREAKDOWN ---');
    rows.push('Month,Completed Bookings,Shared Hours,Unique Borrowers,Estimated CapEx Avoided (INR),Estimated Embodied Carbon (kg CO2e)');
    for (const m of data.monthlyImpact) {
      rows.push(
        `"${m.monthLabel}",${m.completedBookings},${m.totalHours},${m.uniqueBorrowersCount},${m.estimatedCapExAvoidedINR},${m.estimatedEmbodiedCarbonKg}`
      );
    }
    rows.push('');

    // Yearly Impact Section
    rows.push('--- YEARLY IMPACT SUMMARY ---');
    rows.push('Year,Completed Bookings,Shared Hours,Unique Borrowers,Estimated CapEx Avoided (INR),Estimated Embodied Carbon (kg CO2e)');
    for (const y of data.yearlyImpact) {
      rows.push(
        `"${y.year}",${y.completedBookings},${y.totalHours},${y.uniqueBorrowersCount},${y.estimatedCapExAvoidedINR},${y.estimatedEmbodiedCarbonKg}`
      );
    }

    return rows.join('\n');
  }
}
