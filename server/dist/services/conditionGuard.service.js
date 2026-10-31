"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConditionGuardService = void 0;
const conditionReport_model_js_1 = require("../models/conditionReport.model.js");
const booking_model_js_1 = require("../models/booking.model.js");
const resource_model_js_1 = require("../models/resource.model.js");
const auditLogger_js_1 = require("../utils/auditLogger.js");
class ConditionGuardService {
    /**
     * 1. Record Before Check-In Inspection
     * Displays equipment specs, records baseline condition, existing damage, photos, and borrower details.
     */
    static async recordBeforeCheckIn(input, inspector) {
        const booking = await booking_model_js_1.Booking.findById(input.bookingId);
        if (!booking) {
            throw new Error(`Booking record "${input.bookingId}" not found.`);
        }
        const resource = await resource_model_js_1.Resource.findById(booking.resourceId);
        const resourceName = resource ? resource.name : booking.resourceName;
        const existingDamageList = Array.isArray(input.existingDamage)
            ? input.existingDamage.filter((d) => d && d.trim())
            : [];
        const notes = input.conditionNotes?.trim() || input.observations?.trim() || 'Pre-check-in verification completed.';
        // Create Pre-Use Condition Report
        const report = await conditionReport_model_js_1.ConditionReport.create({
            resourceId: booking.resourceId,
            resourceName,
            bookingId: booking._id,
            inspectorName: inspector.name,
            inspectorRole: inspector.role || 'Lab Custodian',
            responsibleUserId: booking.userId,
            responsibleUserName: booking.userName,
            responsibleUserEmail: booking.userEmail,
            type: 'check_in',
            operationalStatus: input.operationalStatus || 'optimal',
            cleanliness: input.cleanliness || 'passed',
            meterReading: input.meterReading || '0',
            existingDamage: existingDamageList,
            conditionNotes: notes,
            observations: notes,
            photos: Array.isArray(input.photos) ? input.photos : [],
            requiresHumanReview: false,
            userConfirmation: !!input.userConfirmation,
            userConfirmedAt: input.userConfirmation ? new Date() : undefined,
            ownerConfirmation: true,
            ownerConfirmedAt: new Date(),
            signoffConfirmed: true,
            timestamp: new Date(),
        });
        // Update booking initial condition snapshot
        booking.initialCondition = {
            conditionNotes: notes,
            meterReading: input.meterReading || '0',
            cleanliness: input.cleanliness || 'passed',
            operationalStatus: input.operationalStatus || 'optimal',
            photos: report.photos,
            recordedBy: inspector.name,
            recordedAt: new Date(),
        };
        await booking.save();
        // Immutable Audit Log
        await (0, auditLogger_js_1.recordAuditLog)({
            action: 'CONDITION_REPORT_CHECK_IN',
            entityType: 'ConditionReport',
            entityId: report._id,
            entityTitle: `Pre-use Inspection: ${resourceName}`,
            actorId: inspector.id,
            actorName: inspector.name,
            actorEmail: inspector.email,
            actorRole: inspector.role,
            details: {
                bookingId: booking._id,
                resourceId: booking.resourceId,
                operationalStatus: report.operationalStatus,
                cleanliness: report.cleanliness,
                meterReading: report.meterReading,
                existingDamageCount: existingDamageList.length,
                photoCount: report.photos.length,
            },
            reason: notes,
        });
        return report;
    }
    /**
     * 2. Record After Check-Out Inspection
     * Records returned condition and calculates side-by-side differences for authorized human review.
     */
    static async recordAfterCheckOut(input, inspector) {
        const booking = await booking_model_js_1.Booking.findById(input.bookingId);
        if (!booking) {
            throw new Error(`Booking record "${input.bookingId}" not found.`);
        }
        const resource = await resource_model_js_1.Resource.findById(booking.resourceId);
        const resourceName = resource ? resource.name : booking.resourceName;
        // Fetch pre-use report for baseline comparison
        const beforeReport = await conditionReport_model_js_1.ConditionReport.findOne({
            bookingId: booking._id,
            type: 'check_in',
        }).sort({ createdAt: -1 });
        const notes = input.conditionNotes?.trim() || input.observations?.trim() || 'Post-return verification completed.';
        const returnStatus = input.operationalStatus || 'optimal';
        const returnCleanliness = input.cleanliness || 'passed';
        const returnMeter = input.meterReading || '0';
        const returnPhotos = Array.isArray(input.photos) ? input.photos : [];
        // Analyze differences
        const differences = [];
        if (beforeReport) {
            // 1. Operational status difference
            if (beforeReport.operationalStatus !== returnStatus) {
                differences.push({
                    category: 'Operational Status Deterioration',
                    before: `Pre-use: ${beforeReport.operationalStatus}`,
                    after: `Post-use: ${returnStatus}`,
                    requiresReview: true,
                });
            }
            // 2. Cleanliness difference
            if (beforeReport.cleanliness !== returnCleanliness) {
                differences.push({
                    category: 'Cleanliness Deviation',
                    before: `Pre-use: ${beforeReport.cleanliness}`,
                    after: `Post-use: ${returnCleanliness}`,
                    requiresReview: true,
                });
            }
            // 3. Significant meter change
            const beforeMeterNum = parseFloat(beforeReport.meterReading || '0');
            const afterMeterNum = parseFloat(returnMeter || '0');
            if (!isNaN(beforeMeterNum) && !isNaN(afterMeterNum) && afterMeterNum > beforeMeterNum) {
                differences.push({
                    category: 'Telemetry / Runtime Meter Delta',
                    before: `Baseline Meter: ${beforeReport.meterReading}`,
                    after: `Return Meter: ${returnMeter} (+${(afterMeterNum - beforeMeterNum).toFixed(1)} units)`,
                    requiresReview: false,
                });
            }
        }
        const hasDifferences = differences.length > 0;
        const requiresHumanReview = differences.some((d) => d.requiresReview) || returnStatus === 'damaged';
        const humanReviewNotice = 'IMPORTANT REGULATORY SAFEGUARD: Automated penalty or fault attribution from condition comparison is strictly prohibited. All detected differences require authorized human review by an institutional manager or lab owner.';
        // Create After-Use Report
        const report = await conditionReport_model_js_1.ConditionReport.create({
            resourceId: booking.resourceId,
            resourceName,
            bookingId: booking._id,
            inspectorName: inspector.name,
            inspectorRole: inspector.role || 'Lab Custodian',
            responsibleUserId: booking.userId,
            responsibleUserName: booking.userName,
            responsibleUserEmail: booking.userEmail,
            type: 'check_out',
            operationalStatus: returnStatus,
            cleanliness: returnCleanliness,
            meterReading: returnMeter,
            existingDamage: beforeReport?.existingDamage || [],
            conditionNotes: notes,
            observations: notes,
            photos: returnPhotos,
            differences: {
                hasDifferences,
                summary: hasDifferences
                    ? `${differences.length} condition difference(s) flagged for human verification.`
                    : 'Apparatus returned consistent with pre-use baseline condition.',
                items: differences,
            },
            requiresHumanReview,
            userConfirmation: !!input.userConfirmation,
            userConfirmedAt: input.userConfirmation ? new Date() : undefined,
            ownerConfirmation: true,
            ownerConfirmedAt: new Date(),
            signoffConfirmed: true,
            timestamp: new Date(),
        });
        // Update booking condition checkout
        booking.conditionOnCheckout = notes;
        await booking.save();
        // Immutable Audit Log
        await (0, auditLogger_js_1.recordAuditLog)({
            action: 'CONDITION_REPORT_CHECK_OUT',
            entityType: 'ConditionReport',
            entityId: report._id,
            entityTitle: `Post-use Inspection: ${resourceName}`,
            actorId: inspector.id,
            actorName: inspector.name,
            actorEmail: inspector.email,
            actorRole: inspector.role,
            details: {
                bookingId: booking._id,
                resourceId: booking.resourceId,
                operationalStatus: returnStatus,
                cleanliness: returnCleanliness,
                meterReading: returnMeter,
                hasDifferences,
                flaggedDifferences: differences,
                requiresHumanReview,
            },
            reason: notes,
        });
        const comparison = {
            bookingId: booking._id.toString(),
            resourceId: booking.resourceId.toString(),
            resourceName,
            borrower: {
                name: booking.userName,
                email: booking.userEmail,
                role: booking.userRole,
            },
            beforeReport,
            afterReport: report,
            hasDifferences,
            differences,
            humanReviewNotice,
            requiresHumanReview,
            incidentEligible: requiresHumanReview,
        };
        return { report, comparison };
    }
    /**
     * 3. Compare Before-Use and After-Use Condition Reports
     */
    static async compareConditionReports(bookingId) {
        const booking = await booking_model_js_1.Booking.findById(bookingId);
        if (!booking) {
            throw new Error(`Booking record "${bookingId}" not found.`);
        }
        const [beforeReport, afterReport] = await Promise.all([
            conditionReport_model_js_1.ConditionReport.findOne({ bookingId: booking._id, type: 'check_in' }).sort({ createdAt: -1 }),
            conditionReport_model_js_1.ConditionReport.findOne({ bookingId: booking._id, type: 'check_out' }).sort({ createdAt: -1 }),
        ]);
        const differences = [];
        if (beforeReport && afterReport) {
            if (beforeReport.operationalStatus !== afterReport.operationalStatus) {
                differences.push({
                    category: 'Operational Status Change',
                    before: beforeReport.operationalStatus,
                    after: afterReport.operationalStatus,
                    requiresReview: true,
                });
            }
            if (beforeReport.cleanliness !== afterReport.cleanliness) {
                differences.push({
                    category: 'Cleanliness Rating Change',
                    before: beforeReport.cleanliness,
                    after: afterReport.cleanliness,
                    requiresReview: true,
                });
            }
            if (beforeReport.meterReading !== afterReport.meterReading) {
                differences.push({
                    category: 'Runtime Meter Reading Delta',
                    before: beforeReport.meterReading || '0',
                    after: afterReport.meterReading || '0',
                    requiresReview: false,
                });
            }
        }
        const hasDifferences = differences.length > 0;
        const requiresHumanReview = differences.some((d) => d.requiresReview) || afterReport?.operationalStatus === 'damaged';
        return {
            bookingId: booking._id.toString(),
            resourceId: booking.resourceId.toString(),
            resourceName: booking.resourceName,
            borrower: {
                name: booking.userName,
                email: booking.userEmail,
                role: booking.userRole,
            },
            beforeReport,
            afterReport,
            hasDifferences,
            differences,
            humanReviewNotice: 'IMPORTANT REGULATORY SAFEGUARD: Automated penalty or fault attribution from condition comparison is strictly prohibited. All detected differences require authorized human review by an institutional manager or lab owner.',
            requiresHumanReview,
            incidentEligible: requiresHumanReview,
        };
    }
}
exports.ConditionGuardService = ConditionGuardService;
