"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourcePulseService = void 0;
const resource_model_js_1 = require("../models/resource.model.js");
const booking_model_js_1 = require("../models/booking.model.js");
class ResourcePulseService {
    /**
     * Resolve date range filter from query
     */
    static resolveDateRange(range, customStart, customEnd) {
        const now = new Date();
        let startDate;
        let label = 'Last 30 Days';
        if (range === 'last_7_days') {
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            label = 'Last 7 Days';
        }
        else if (range === 'last_90_days') {
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            label = 'Last 90 Days';
        }
        else if (range === 'custom' && customStart && customEnd) {
            startDate = new Date(customStart);
            const endDate = new Date(customEnd);
            return {
                startDate: isNaN(startDate.getTime()) ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) : startDate,
                endDate: isNaN(endDate.getTime()) ? now : endDate,
                label: `Custom (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`,
            };
        }
        else {
            // Default: Last 30 days
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            label = 'Last 30 Days';
        }
        return {
            startDate,
            endDate: now,
            label,
        };
    }
    /**
     * Calculate Institutional Resource Pulse Analytics
     */
    static async calculateMetrics(filter, userContext) {
        const { startDate, endDate, label } = filter;
        const daysInPeriod = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
        // Scope query by owner if user is an equipment owner and not a manager/admin
        const resourceScope = { isArchived: { $ne: true } };
        if (userContext && userContext.role === 'owner') {
            resourceScope.$or = [{ ownerId: userContext.id }, { ownerEmail: userContext.email }];
        }
        // 1. Fetch active resources
        const allResources = await resource_model_js_1.Resource.find(resourceScope);
        const totalRegisteredResources = allResources.length;
        const availableResources = allResources.filter((r) => r.status === 'available').length;
        const operationalResources = allResources.filter((r) => r.status !== 'disabled' && r.status !== 'maintenance');
        // 2. Fetch bookings within the date range
        const resourceIds = allResources.map((r) => r._id);
        const bookingQuery = {
            resourceId: { $in: resourceIds },
            createdAt: { $gte: startDate, $lte: endDate },
        };
        const bookingsInPeriod = await booking_model_js_1.Booking.find(bookingQuery);
        const totalBookingsInPeriod = bookingsInPeriod.length;
        const activeBookingsCount = bookingsInPeriod.filter((b) => ['active', 'approved', 'checked_in', 'return_pending'].includes(b.status)).length;
        const completedBookingsCount = bookingsInPeriod.filter((b) => b.status === 'completed').length;
        const cancelledBookingsCount = bookingsInPeriod.filter((b) => ['cancelled', 'rejected'].includes(b.status)).length;
        const waitingListDemandCount = await booking_model_js_1.Booking.countDocuments({
            resourceId: { $in: resourceIds },
            status: 'waitlisted',
        });
        const overdueReturnsCount = bookingsInPeriod.filter((b) => b.isOverdue || (b.overdueMinutes && b.overdueMinutes > 0)).length;
        const cancellationRate = totalBookingsInPeriod > 0
            ? parseFloat(((cancelledBookingsCount / totalBookingsInPeriod) * 100).toFixed(1))
            : 0;
        // 3. Precise Utilization Calculation:
        // Bookable operating hours = active operational resources * 8 bookable hours/day * days in period
        const totalBookableHours = operationalResources.length * 8 * daysInPeriod;
        // Sum actual duration of non-cancelled bookings in the period
        let totalBookedHours = 0;
        const resourceUsageMap = {};
        allResources.forEach((r) => {
            resourceUsageMap[r._id.toString()] = {
                resourceId: r._id.toString(),
                name: r.name,
                category: r.category,
                count: 0,
                hours: 0,
            };
        });
        bookingsInPeriod.forEach((b) => {
            if (b.status !== 'cancelled' && b.status !== 'rejected') {
                const hours = b.durationHours || 2;
                totalBookedHours += hours;
                const rid = b.resourceId ? b.resourceId.toString() : '';
                if (resourceUsageMap[rid]) {
                    resourceUsageMap[rid].count += 1;
                    resourceUsageMap[rid].hours += hours;
                }
            }
        });
        const utilizationRate = totalBookableHours > 0
            ? parseFloat(Math.min(100, (totalBookedHours / totalBookableHours) * 100).toFixed(1))
            : 0;
        // 4. Frequently Booked vs Underutilized
        const resourceUsageArray = Object.values(resourceUsageMap);
        resourceUsageArray.sort((a, b) => b.hours - a.hours);
        const frequentlyBookedResources = resourceUsageArray.slice(0, 5).map((item) => ({
            resourceId: item.resourceId,
            name: item.name,
            category: item.category,
            bookingCount: item.count,
            totalHours: item.hours,
            utilizationPercent: daysInPeriod * 8 > 0
                ? parseFloat(Math.min(100, (item.hours / (daysInPeriod * 8)) * 100).toFixed(1))
                : 0,
        }));
        const underutilizedResources = resourceUsageArray
            .filter((item) => item.count <= 1 || item.hours < 4)
            .slice(0, 6)
            .map((item) => {
            const resObj = allResources.find((r) => r._id.toString() === item.resourceId);
            return {
                resourceId: item.resourceId,
                name: item.name,
                category: item.category,
                bookingCount: item.count,
                totalHours: item.hours,
                status: resObj ? resObj.status : 'available',
                reason: item.count === 0 ? 'Zero booking reservations logged in period' : 'Low demand runtime (< 4 hrs)',
            };
        });
        // 5. Booking Trends (Daily Time-Series Aggregation)
        const trendsMap = {};
        // Pre-populate timeline dates to avoid gaps
        for (let i = 0; i < Math.min(daysInPeriod, 30); i++) {
            const d = new Date(startDate.getTime() + i * (daysInPeriod <= 14 ? 1 : Math.ceil(daysInPeriod / 30)) * 24 * 60 * 60 * 1000);
            if (d <= endDate) {
                const key = d.toISOString().split('T')[0];
                trendsMap[key] = { bookings: 0, hours: 0, dateObj: d };
            }
        }
        bookingsInPeriod.forEach((b) => {
            const key = new Date(b.createdAt).toISOString().split('T')[0];
            if (!trendsMap[key]) {
                trendsMap[key] = { bookings: 0, hours: 0, dateObj: new Date(b.createdAt) };
            }
            trendsMap[key].bookings += 1;
            trendsMap[key].hours += b.durationHours || 2;
        });
        const bookingTrends = Object.entries(trendsMap)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([dateStr, val]) => ({
            date: dateStr,
            label: new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            bookings: val.bookings,
            hours: val.hours,
        }));
        // 6. Category-wise Usage
        const categoryAggMap = {};
        allResources.forEach((r) => {
            if (!categoryAggMap[r.category]) {
                categoryAggMap[r.category] = { count: 0, hours: 0, resources: new Set() };
            }
            categoryAggMap[r.category].resources.add(r._id.toString());
        });
        bookingsInPeriod.forEach((b) => {
            const cat = b.resourceCategory || 'Institutional Research Apparatus';
            if (!categoryAggMap[cat]) {
                categoryAggMap[cat] = { count: 0, hours: 0, resources: new Set() };
            }
            categoryAggMap[cat].count += 1;
            categoryAggMap[cat].hours += b.durationHours || 2;
        });
        const categoryUsage = Object.entries(categoryAggMap)
            .map(([cat, val]) => ({
            category: cat,
            bookingCount: val.count,
            totalHours: val.hours,
            resourceCount: val.resources.size,
            percentage: totalBookingsInPeriod > 0
                ? parseFloat(((val.count / totalBookingsInPeriod) * 100).toFixed(1))
                : 0,
        }))
            .sort((a, b) => b.bookingCount - a.bookingCount);
        // 7. Peak Usage Periods (Time Slot Histogram)
        const slotMap = {};
        bookingsInPeriod.forEach((b) => {
            const slot = b.timeSlot || 'Standard Operating Slot';
            slotMap[slot] = (slotMap[slot] || 0) + 1;
        });
        const peakUsagePeriods = Object.entries(slotMap)
            .map(([timeSlot, count]) => ({
            timeSlot,
            bookingCount: count,
            percentage: totalBookingsInPeriod > 0
                ? parseFloat(((count / totalBookingsInPeriod) * 100).toFixed(1))
                : 0,
        }))
            .sort((a, b) => b.bookingCount - a.bookingCount)
            .slice(0, 5);
        // 8. Generate Real Actionable Observations from Actual Database Metrics
        const insights = [];
        // Observation 1: Underutilized Resources
        if (underutilizedResources.length > 0) {
            const first = underutilizedResources[0];
            insights.push({
                id: 'INS-UNDERUTILIZED',
                type: 'warning',
                title: `Underutilized Asset: ${first.name}`,
                message: `"${first.name}" has logged only ${first.totalHours} runtime hours (${first.bookingCount} sessions) during ${label}. Consider reviewing eligibility prerequisites or promoting campus visibility.`,
                metricContext: `${first.totalHours} hrs / ${daysInPeriod * 8} bookable hrs`,
            });
        }
        // Observation 2: Category Concentration / High Booking Demand
        if (categoryUsage.length > 0 && categoryUsage[0].percentage >= 35) {
            const topCat = categoryUsage[0];
            insights.push({
                id: 'INS-CATEGORY-DEMAND',
                type: 'info',
                title: `High Demand in Category: ${topCat.category}`,
                message: `${topCat.category} represents ${topCat.percentage}% of all reservation bookings across ${topCat.resourceCount} units. Heavy lab traffic detected.`,
                metricContext: `${topCat.bookingCount} bookings (${topCat.totalHours} hrs)`,
            });
        }
        // Observation 3: Waitlist Pressure
        if (waitingListDemandCount > 0) {
            insights.push({
                id: 'INS-WAITLIST-PRESSURE',
                type: 'action_required',
                title: `Active Queue Demand: ${waitingListDemandCount} Waitlisted Request(s)`,
                message: `${waitingListDemandCount} researchers are currently on priority waiting queues. Extending daily lab operational windows or configuring slot limits can reduce peer wait times.`,
                metricContext: `${waitingListDemandCount} researchers in queue`,
            });
        }
        // Observation 4: Peak Slot Congestion
        if (peakUsagePeriods.length > 0) {
            const peak = peakUsagePeriods[0];
            insights.push({
                id: 'INS-PEAK-SLOT',
                type: 'info',
                title: `Peak Demand Period: ${peak.timeSlot}`,
                message: `The ${peak.timeSlot} window experiences peak reservation volume (${peak.percentage}% of all sessions). Incentivizing morning or evening off-peak bookings could smooth laboratory utilization.`,
                metricContext: `${peak.bookingCount} sessions scheduled`,
            });
        }
        // Observation 5: Overdue Returns Alert
        if (overdueReturnsCount > 0) {
            insights.push({
                id: 'INS-OVERDUE-RETURNS',
                type: 'warning',
                title: `Overdue Handover Friction: ${overdueReturnsCount} Delayed Return(s)`,
                message: `${overdueReturnsCount} equipment returns exceeded their scheduled slot. Consider adding automated TrustPass reminder notifications before session conclusion.`,
                metricContext: `${overdueReturnsCount} overdue return(s)`,
            });
        }
        else {
            insights.push({
                id: 'INS-RETURN-COMPLIANCE',
                type: 'success',
                title: 'Optimal Return Compliance',
                message: `100% on-time return compliance recorded during ${label}. Zero delayed handovers on record.`,
                metricContext: 'Zero overdue incidents',
            });
        }
        return {
            timeRange: {
                label,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                daysCount: daysInPeriod,
            },
            overview: {
                totalRegisteredResources,
                availableResources,
                activeBookingsCount,
                completedBookingsCount,
                totalBookingsInPeriod,
                cancelledBookingsCount,
                cancellationRate,
                overdueReturnsCount,
                waitingListDemandCount,
                totalBookedHours,
                totalBookableHours,
                utilizationRate,
            },
            frequentlyBookedResources,
            underutilizedResources,
            bookingTrends,
            categoryUsage,
            peakUsagePeriods,
            insights,
        };
    }
    /**
     * Generate CSV Report from ResourcePulse Analytics
     */
    static generateCSVReport(metrics) {
        const lines = [];
        // Header
        lines.push('RENTORA INSTITUTIONAL RESOURCE INTELLIGENCE REPORT');
        lines.push(`Reporting Period,${metrics.timeRange.label}`);
        lines.push(`Date Range,${metrics.timeRange.startDate} to ${metrics.timeRange.endDate}`);
        lines.push(`Generated On,${new Date().toISOString()}`);
        lines.push('');
        // Overview KPIs
        lines.push('1. EXECUTIVE UTILIZATION METRICS');
        lines.push('Metric,Value');
        lines.push(`Total Registered Resources,${metrics.overview.totalRegisteredResources}`);
        lines.push(`Available Resources,${metrics.overview.availableResources}`);
        lines.push(`Active Bookings,${metrics.overview.activeBookingsCount}`);
        lines.push(`Completed Bookings,${metrics.overview.completedBookingsCount}`);
        lines.push(`Total Bookings in Period,${metrics.overview.totalBookingsInPeriod}`);
        lines.push(`Cancellation Rate,${metrics.overview.cancellationRate}%`);
        lines.push(`Overdue Returns,${metrics.overview.overdueReturnsCount}`);
        lines.push(`Waiting List Demand,${metrics.overview.waitingListDemandCount}`);
        lines.push(`Actual Booked Hours,${metrics.overview.totalBookedHours} hrs`);
        lines.push(`Total Bookable Operating Hours,${metrics.overview.totalBookableHours} hrs`);
        lines.push(`Resource Utilization Rate,${metrics.overview.utilizationRate}%`);
        lines.push('');
        // Top Resources
        lines.push('2. FREQUENTLY BOOKED APPARATUS');
        lines.push('Resource Name,Category,Bookings Count,Total Hours,Utilization %');
        metrics.frequentlyBookedResources.forEach((r) => {
            lines.push(`"${r.name.replace(/"/g, '""')}","${r.category}",${r.bookingCount},${r.totalHours},${r.utilizationPercent}%`);
        });
        lines.push('');
        // Underutilized Resources
        lines.push('3. UNDERUTILIZED APPARATUS');
        lines.push('Resource Name,Category,Bookings Count,Runtime Hours,Operational Status,Observation');
        metrics.underutilizedResources.forEach((r) => {
            lines.push(`"${r.name.replace(/"/g, '""')}","${r.category}",${r.bookingCount},${r.totalHours},"${r.status}","${r.reason}"`);
        });
        lines.push('');
        // Category Breakdown
        lines.push('4. CATEGORY BREAKDOWN');
        lines.push('Category,Bookings Count,Total Hours,Units Count,Share %');
        metrics.categoryUsage.forEach((c) => {
            lines.push(`"${c.category}",${c.bookingCount},${c.totalHours},${c.resourceCount},${c.percentage}%`);
        });
        lines.push('');
        // Peak Slots
        lines.push('5. PEAK USAGE PERIODS');
        lines.push('Time Slot,Bookings Count,Share %');
        metrics.peakUsagePeriods.forEach((p) => {
            lines.push(`"${p.timeSlot}",${p.bookingCount},${p.percentage}%`);
        });
        lines.push('');
        // Actionable Observations
        lines.push('6. ACTIONABLE INSTITUTIONAL INSIGHTS');
        lines.push('Type,Title,Observation,Context');
        metrics.insights.forEach((ins) => {
            lines.push(`"${ins.type}","${ins.title.replace(/"/g, '""')}","${ins.message.replace(/"/g, '""')}","${ins.metricContext || ''}"`);
        });
        return lines.join('\n');
    }
}
exports.ResourcePulseService = ResourcePulseService;
