"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordAuditLog = void 0;
const auditLog_model_js_1 = require("../models/auditLog.model.js");
const mongoose_1 = require("mongoose");
/**
 * Creates an immutable audit log entry in the centralized institutional ledger.
 * Cannot be modified or deleted once recorded.
 */
const recordAuditLog = async (params) => {
    try {
        await auditLog_model_js_1.AuditLog.create({
            action: params.action,
            entityType: params.entityType,
            entityId: params.entityId ? params.entityId.toString() : undefined,
            entityTitle: params.entityTitle || '',
            actorId: params.actorId ? new mongoose_1.Types.ObjectId(params.actorId.toString()) : undefined,
            actorName: params.actorName || 'System',
            actorEmail: params.actorEmail,
            actorRole: params.actorRole || 'system',
            ipAddress: params.ipAddress || '127.0.0.1',
            details: params.details || {},
            reason: params.reason,
            timestamp: new Date(),
            isImmutable: true,
        });
    }
    catch (error) {
        // Audit failure should be logged to console but not crash caller flow unless critical
        console.error('Failed to write immutable audit log entry:', error);
    }
};
exports.recordAuditLog = recordAuditLog;
