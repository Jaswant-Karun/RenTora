"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FairAllocation = void 0;
const mongoose_1 = require("mongoose");
const fairAllocationSchema = new mongoose_1.Schema({
    institution: {
        type: String,
        required: true,
        unique: true,
    },
    maxWeeklyHoursPerStudent: {
        type: Number,
        default: 16,
    },
    maxActiveBookingsPerStudent: {
        type: Number,
        default: 3,
    },
    peakHourThrottling: {
        type: Boolean,
        default: true,
    },
    emergencyBypassEnabled: {
        type: Boolean,
        default: true,
    },
    priorityTiers: {
        type: [String],
        default: ['Research Scholar', 'Final Year Student', 'Graduate Student', 'Undergraduate'],
    },
    advanceBookingDays: {
        type: Number,
        default: 14,
    },
    cancellationGraceHours: {
        type: Number,
        default: 2,
    },
    maxReservationsPerAssetPer14Days: {
        type: Number,
        default: 3,
    },
    cooldownPeriodDays: {
        type: Number,
        default: 14,
    },
    priorityScoring: {
        phdScholarPoints: { type: Number, default: 30 },
        finalYearPoints: { type: Number, default: 20 },
        undergradPoints: { type: Number, default: 10 },
        deptPriorityPoints: { type: Number, default: 15 },
        lowUsageBonusPoints: { type: Number, default: 25 },
        penaltyDeductionPoints: { type: Number, default: 15 },
    },
}, {
    timestamps: true,
});
exports.FairAllocation = (0, mongoose_1.model)('FairAllocation', fairAllocationSchema);
