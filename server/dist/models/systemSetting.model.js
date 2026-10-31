"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemSetting = void 0;
const mongoose_1 = require("mongoose");
const systemSettingSchema = new mongoose_1.Schema({
    platformName: {
        type: String,
        default: 'RENTORA Institutional Resource Sharing Platform',
    },
    supportEmail: {
        type: String,
        default: 'support@rentora.edu',
    },
    allowPublicRegistration: {
        type: Boolean,
        default: true,
    },
    defaultSessionDurationDays: {
        type: Number,
        default: 7,
    },
    maintenanceMode: {
        type: Boolean,
        default: false,
    },
    maintenanceMessage: {
        type: String,
        default: 'RENTORA platform undergoing scheduled campus-wide database sync. Back shortly.',
    },
    maxActiveBookingsPerUser: {
        type: Number,
        default: 3,
    },
    maxWeeklyReservationHours: {
        type: Number,
        default: 16,
    },
    monopolisationWindowDays: {
        type: Number,
        default: 14,
    },
    enforceAuditLedgerIntegrity: {
        type: Boolean,
        default: true,
    },
    aiEngineProvider: {
        type: String,
        default: 'RENTORA Embedded Intelligence Engine',
    },
    updatedBy: {
        type: String,
        default: 'Platform Administrator',
    },
}, {
    timestamps: true,
});
exports.SystemSetting = (0, mongoose_1.model)('SystemSetting', systemSettingSchema);
