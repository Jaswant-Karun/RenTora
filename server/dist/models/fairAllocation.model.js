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
}, {
    timestamps: true,
});
exports.FairAllocation = (0, mongoose_1.model)('FairAllocation', fairAllocationSchema);
