"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewIncident = exports.getIncidentById = exports.getIncidents = exports.reportIncident = exports.VALID_INCIDENT_CATEGORIES = void 0;
const incident_model_js_1 = require("../models/incident.model.js");
const booking_model_js_1 = require("../models/booking.model.js");
const resource_model_js_1 = require("../models/resource.model.js");
const user_model_js_1 = require("../models/user.model.js");
const notification_model_js_1 = require("../models/notification.model.js");
const auditLogger_js_1 = require("../utils/auditLogger.js");
exports.VALID_INCIDENT_CATEGORIES = [
    'equipment_damage',
    'late_return',
    'missing_components',
    'misuse',
    'scheduling_conflicts',
    'other',
];
// 1. Report an Incident
const reportIncident = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const { title, category, description, evidence = [], bookingId, bookingReference, resourceId, resourceName, severity = 'medium', } = req.body;
        if (!description || !description.trim()) {
            res.status(400).json({
                success: false,
                message: 'A detailed incident description is required.',
            });
            return;
        }
        if (!category || !exports.VALID_INCIDENT_CATEGORIES.includes(category)) {
            res.status(400).json({
                success: false,
                message: `Invalid incident category. Permitted categories: ${exports.VALID_INCIDENT_CATEGORIES.join(', ')}`,
            });
            return;
        }
        let resolvedResourceName = resourceName;
        let resolvedResourceId = resourceId;
        let resolvedBookingRef = bookingReference;
        // Resolve resource from booking if bookingId provided
        if (bookingId) {
            const booking = await booking_model_js_1.Booking.findById(bookingId);
            if (booking) {
                resolvedResourceName = resolvedResourceName || booking.resourceName;
                resolvedResourceId = resolvedResourceId || booking.resourceId;
                resolvedBookingRef = resolvedBookingRef || `BK-${booking._id.toString().slice(-6).toUpperCase()}`;
            }
        }
        if (!resolvedResourceName && resolvedResourceId) {
            const resource = await resource_model_js_1.Resource.findById(resolvedResourceId);
            if (resource) {
                resolvedResourceName = resource.name;
            }
        }
        const incident = await incident_model_js_1.Incident.create({
            category,
            title: title || `${category.replace(/_/g, ' ').toUpperCase()}: ${resolvedResourceName || 'Campus Asset'}`,
            description: description.trim(),
            evidence: Array.isArray(evidence) ? evidence : [evidence].filter(Boolean),
            bookingId: resolvedResourceId ? bookingId : undefined,
            bookingReference: resolvedBookingRef || 'N/A',
            resourceId: resolvedResourceId,
            resourceName: resolvedResourceName || 'Institutional Asset',
            reportedBy: req.user.name,
            reportedByUserId: req.user._id,
            reportedByRole: req.user.role,
            userEmail: req.user.email,
            severity,
            status: 'reported',
        });
        // Immutable Audit Log
        await (0, auditLogger_js_1.recordAuditLog)({
            action: 'INCIDENT_REPORT',
            entityType: 'Incident',
            entityId: incident._id,
            entityTitle: incident.title,
            actorId: req.user._id,
            actorName: req.user.name,
            actorEmail: req.user.email,
            actorRole: req.user.role,
            details: {
                category,
                severity,
                resourceName: resolvedResourceName,
                bookingReference: resolvedBookingRef,
                evidenceCount: incident.evidence.length,
            },
            reason: incident.description,
        });
        // Notify institutional managers
        await notification_model_js_1.Notification.create({
            targetRole: 'manager',
            title: `Safety Alert: ${category.replace(/_/g, ' ').toUpperCase()}`,
            message: `New incident reported by ${req.user.name} regarding "${resolvedResourceName}". Severity: ${severity}.`,
            type: 'incident_update',
            link: '/manager/incidents',
            metadata: { incidentId: incident._id },
        });
        res.status(201).json({
            success: true,
            message: 'Incident reported successfully. Institutional Trust & Safety staff have been dispatched.',
            data: incident,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.reportIncident = reportIncident;
// 2. Get Incidents List
const getIncidents = async (req, res, next) => {
    try {
        const { category, status, severity, limit = 50 } = req.query;
        const query = {};
        if (category)
            query.category = category;
        if (status)
            query.status = status;
        if (severity)
            query.severity = severity;
        // Students only see incidents they reported
        if (req.user?.role === 'student') {
            query.reportedByUserId = req.user._id;
        }
        const incidents = await incident_model_js_1.Incident.find(query)
            .sort({ createdAt: -1 })
            .limit(Number(limit));
        res.status(200).json({
            success: true,
            data: incidents,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getIncidents = getIncidents;
// 3. Get Single Incident
const getIncidentById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const incident = await incident_model_js_1.Incident.findById(id);
        if (!incident) {
            res.status(404).json({ success: false, message: 'Incident record not found.' });
            return;
        }
        res.status(200).json({ success: true, data: incident });
    }
    catch (error) {
        next(error);
    }
};
exports.getIncidentById = getIncidentById;
// 4. Review / Resolve Incident (Manager / Admin / Custodian)
const reviewIncident = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, managerResponse, resolutionNotes, sanctionsApplied, penaltyPoints = 0, } = req.body;
        const incident = await incident_model_js_1.Incident.findById(id);
        if (!incident) {
            res.status(404).json({ success: false, message: 'Incident record not found.' });
            return;
        }
        if (status)
            incident.status = status;
        if (managerResponse)
            incident.managerResponse = managerResponse.trim();
        if (resolutionNotes)
            incident.resolutionNotes = resolutionNotes.trim();
        if (sanctionsApplied)
            incident.sanctionsApplied = sanctionsApplied;
        if (status === 'resolved' || status === 'dismissed') {
            incident.resolvedAt = new Date();
            incident.resolvedBy = req.user?.name || 'Institutional Manager';
        }
        await incident.save();
        // If sanctions/penalty points applied, update student's profile
        if (Number(penaltyPoints) > 0 && incident.reportedByUserId) {
            await user_model_js_1.User.findByIdAndUpdate(incident.reportedByUserId, {
                $inc: { 'historicalUsage.penaltyPoints': Number(penaltyPoints) },
            });
        }
        // Immutable Audit Log
        await (0, auditLogger_js_1.recordAuditLog)({
            action: 'INCIDENT_RESOLUTION',
            entityType: 'Incident',
            entityId: incident._id,
            entityTitle: incident.title,
            actorId: req.user?._id,
            actorName: req.user?.name || 'Manager',
            actorEmail: req.user?.email,
            actorRole: req.user?.role || 'manager',
            details: {
                newStatus: incident.status,
                sanctionsApplied: incident.sanctionsApplied,
                penaltyPoints,
            },
            reason: incident.resolutionNotes || incident.managerResponse || 'Incident review signed off.',
        });
        // Notify Reporter of status update
        if (incident.reportedByUserId) {
            await notification_model_js_1.Notification.create({
                userId: incident.reportedByUserId,
                title: `Incident Review Update: ${incident.status.toUpperCase()}`,
                message: `Your incident report regarding "${incident.resourceName}" was updated. Manager Note: ${incident.managerResponse || incident.resolutionNotes || 'Case reviewed.'}`,
                type: 'incident_update',
                link: '/dashboard/activity',
                metadata: { incidentId: incident._id, status: incident.status },
            });
        }
        res.status(200).json({
            success: true,
            message: 'Incident review saved and audit ledger updated.',
            data: incident,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.reviewIncident = reviewIncident;
