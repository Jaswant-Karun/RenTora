"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIncidentConditionComparison = exports.resolveIncident = exports.recordDecision = exports.addInvestigationNote = exports.getIncidentById = exports.getIncidents = exports.reportIncident = exports.VALID_INCIDENT_CATEGORIES = void 0;
const incident_model_js_1 = require("../models/incident.model.js");
const booking_model_js_1 = require("../models/booking.model.js");
const resource_model_js_1 = require("../models/resource.model.js");
const user_model_js_1 = require("../models/user.model.js");
const notification_model_js_1 = require("../models/notification.model.js");
const conditionReport_model_js_1 = require("../models/conditionReport.model.js");
const auditLogger_js_1 = require("../utils/auditLogger.js");
const conditionGuard_service_js_1 = require("../services/conditionGuard.service.js");
exports.VALID_INCIDENT_CATEGORIES = [
    'equipment_damage',
    'delayed_return',
    'late_return',
    'missing_components',
    'equipment_malfunction',
    'safety_concerns',
    'disputes',
    'misuse',
    'scheduling_conflicts',
    'other',
];
// 1. Report an Incident (Lifecycle Step 1 & 2: Report & Assign Incident Number)
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
                message: `Invalid incident category "${category}". Permitted categories: ${exports.VALID_INCIDENT_CATEGORIES.join(', ')}`,
            });
            return;
        }
        let resolvedResourceName = resourceName;
        let resolvedResourceId = resourceId;
        let resolvedBookingRef = bookingReference;
        let conditionReportBeforeId = undefined;
        let conditionReportAfterId = undefined;
        // Resolve resource & condition reports from booking if provided
        if (bookingId) {
            const booking = await booking_model_js_1.Booking.findById(bookingId);
            if (booking) {
                resolvedResourceName = resolvedResourceName || booking.resourceName;
                resolvedResourceId = resolvedResourceId || booking.resourceId;
                resolvedBookingRef = resolvedBookingRef || `BK-${booking._id.toString().slice(-6).toUpperCase()}`;
                // Automatically link pre-use and post-use condition reports if they exist
                const [beforeRep, afterRep] = await Promise.all([
                    conditionReport_model_js_1.ConditionReport.findOne({ bookingId: booking._id, type: 'check_in' }).sort({ createdAt: -1 }),
                    conditionReport_model_js_1.ConditionReport.findOne({ bookingId: booking._id, type: 'check_out' }).sort({ createdAt: -1 }),
                ]);
                if (beforeRep)
                    conditionReportBeforeId = beforeRep._id;
                if (afterRep)
                    conditionReportAfterId = afterRep._id;
            }
        }
        if (!resolvedResourceName && resolvedResourceId) {
            const resource = await resource_model_js_1.Resource.findById(resolvedResourceId);
            if (resource) {
                resolvedResourceName = resource.name;
            }
        }
        // Assign reference number format: INC-YYYY-XXXXX
        const year = new Date().getFullYear();
        const rand = Math.floor(1000 + Math.random() * 9000);
        const timeSlice = Date.now().toString().slice(-4);
        const assignedNumber = `INC-${year}-${timeSlice}${rand}`;
        const incident = await incident_model_js_1.Incident.create({
            incidentNumber: assignedNumber,
            category,
            title: title || `${category.replace(/_/g, ' ').toUpperCase()}: ${resolvedResourceName || 'Campus Asset'}`,
            description: description.trim(),
            evidence: Array.isArray(evidence) ? evidence : [evidence].filter(Boolean),
            bookingId: resolvedResourceId ? bookingId : undefined,
            bookingReference: resolvedBookingRef || 'N/A',
            resourceId: resolvedResourceId,
            resourceName: resolvedResourceName || 'Institutional Asset',
            conditionReportBeforeId,
            conditionReportAfterId,
            reportedBy: req.user.name,
            reportedByUserId: req.user._id,
            reportedByRole: req.user.role,
            userEmail: req.user.email,
            severity,
            status: 'reported',
            requiresHumanReview: true,
            investigationNotes: [
                {
                    authorId: req.user._id,
                    authorName: req.user.name,
                    authorRole: req.user.role,
                    note: `Incident registered with reference ${assignedNumber}. Initial classification: ${category}.`,
                    createdAt: new Date(),
                },
            ],
        });
        // Immutable Audit Log
        await (0, auditLogger_js_1.recordAuditLog)({
            action: 'INCIDENT_REPORT',
            entityType: 'Incident',
            entityId: incident._id,
            entityTitle: `Incident ${incident.incidentNumber} - ${incident.title}`,
            actorId: req.user._id,
            actorName: req.user.name,
            actorEmail: req.user.email,
            actorRole: req.user.role,
            details: {
                incidentNumber: incident.incidentNumber,
                category,
                severity,
                resourceName: resolvedResourceName,
                bookingReference: resolvedBookingRef,
                evidenceCount: incident.evidence.length,
            },
            reason: incident.description,
        });
        // Lifecycle Step 3: Notify authorized owner or manager
        await notification_model_js_1.Notification.create({
            targetRole: 'manager',
            title: `Incident Alert (${incident.incidentNumber}): ${category.replace(/_/g, ' ').toUpperCase()}`,
            message: `New incident reported by ${req.user.name} regarding "${resolvedResourceName}". Reference: ${incident.incidentNumber}. Requires authorized human review.`,
            type: 'incident_update',
            link: '/owner/incidents',
            metadata: { incidentId: incident._id, incidentNumber: incident.incidentNumber },
        });
        // If resource has an owner, notify the owner specifically
        if (resolvedResourceId) {
            const resource = await resource_model_js_1.Resource.findById(resolvedResourceId);
            if (resource?.ownerId) {
                await notification_model_js_1.Notification.create({
                    userId: resource.ownerId,
                    title: `Asset Incident (${incident.incidentNumber}): ${resource.name}`,
                    message: `An incident was reported on your asset "${resource.name}". Reference: ${incident.incidentNumber}.`,
                    type: 'incident_update',
                    link: '/owner/incidents',
                    metadata: { incidentId: incident._id, incidentNumber: incident.incidentNumber },
                });
            }
        }
        res.status(201).json({
            success: true,
            message: `Incident reported successfully. Reference ID assigned: ${incident.incidentNumber}.`,
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
        const { category, status, severity, resourceId, bookingId, limit = 50 } = req.query;
        const query = {};
        if (category)
            query.category = category;
        if (status)
            query.status = status;
        if (severity)
            query.severity = severity;
        if (resourceId)
            query.resourceId = resourceId;
        if (bookingId)
            query.bookingId = bookingId;
        // Students only see incidents they reported or where they are associated
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
// 3. Get Single Incident by ID (Lifecycle Step 4: Review Evidence & History)
const getIncidentById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const incident = await incident_model_js_1.Incident.findById(id);
        if (!incident) {
            res.status(404).json({ success: false, message: 'Incident record not found.' });
            return;
        }
        // Fetch linked condition reports if available
        let comparison = null;
        if (incident.bookingId) {
            try {
                comparison = await conditionGuard_service_js_1.ConditionGuardService.compareConditionReports(incident.bookingId.toString());
            }
            catch (e) {
                // Condition comparison optional
            }
        }
        res.status(200).json({
            success: true,
            data: {
                ...incident.toObject(),
                comparison,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getIncidentById = getIncidentById;
// 4. Lifecycle Step 5: Add Investigation Notes
const addInvestigationNote = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { note } = req.body;
        if (!note || !note.trim()) {
            res.status(400).json({ success: false, message: 'Investigation note text is required.' });
            return;
        }
        const incident = await incident_model_js_1.Incident.findById(id);
        if (!incident) {
            res.status(404).json({ success: false, message: 'Incident record not found.' });
            return;
        }
        incident.investigationNotes.push({
            authorId: req.user?._id,
            authorName: req.user?.name || 'Investigator',
            authorRole: req.user?.role || 'manager',
            note: note.trim(),
            createdAt: new Date(),
        });
        if (incident.status === 'reported') {
            incident.status = 'investigating';
        }
        await incident.save();
        await (0, auditLogger_js_1.recordAuditLog)({
            action: 'INCIDENT_INVESTIGATION_UPDATE',
            entityType: 'Incident',
            entityId: incident._id,
            entityTitle: `Incident ${incident.incidentNumber} - Note Added`,
            actorId: req.user?._id,
            actorName: req.user?.name || 'Investigator',
            actorEmail: req.user?.email,
            actorRole: req.user?.role || 'manager',
            details: { incidentNumber: incident.incidentNumber, noteSnippet: note.slice(0, 80) },
            reason: note.trim(),
        });
        res.status(200).json({
            success: true,
            message: 'Investigation note added successfully.',
            data: incident,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.addInvestigationNote = addInvestigationNote;
// 5. Lifecycle Step 6: Record Decision (Authorized Human Review Enforced)
const recordDecision = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { outcome, rationale, sanctions } = req.body;
        const permittedOutcomes = [
            'no_fault',
            'user_responsible',
            'fair_wear_and_tear',
            'equipment_defect',
            'under_review',
        ];
        if (!outcome || !permittedOutcomes.includes(outcome)) {
            res.status(400).json({
                success: false,
                message: `Valid outcome required. Permitted: ${permittedOutcomes.join(', ')}`,
            });
            return;
        }
        if (!rationale || !rationale.trim()) {
            res.status(400).json({
                success: false,
                message: 'A mandatory human-review investigative rationale is required before recording a decision.',
            });
            return;
        }
        const incident = await incident_model_js_1.Incident.findById(id);
        if (!incident) {
            res.status(404).json({ success: false, message: 'Incident record not found.' });
            return;
        }
        const decision = {
            outcome,
            decidedBy: req.user?.name || 'Institutional Manager',
            decidedAt: new Date(),
            rationale: rationale.trim(),
            sanctions: sanctions || 'none',
        };
        incident.decision = decision;
        incident.requiresHumanReview = false;
        incident.status = 'decision_pending';
        incident.investigationNotes.push({
            authorId: req.user?._id,
            authorName: req.user?.name || 'Authorized Reviewer',
            authorRole: req.user?.role || 'manager',
            note: `Human Review Decision recorded by ${decision.decidedBy}: Outcome = ${outcome.toUpperCase()}. Rationale: ${decision.rationale}`,
            createdAt: new Date(),
        });
        await incident.save();
        await (0, auditLogger_js_1.recordAuditLog)({
            action: 'INCIDENT_HUMAN_DECISION',
            entityType: 'Incident',
            entityId: incident._id,
            entityTitle: `Decision Recorded: ${incident.incidentNumber}`,
            actorId: req.user?._id,
            actorName: req.user?.name || 'Manager',
            actorEmail: req.user?.email,
            actorRole: req.user?.role || 'manager',
            details: {
                incidentNumber: incident.incidentNumber,
                outcome,
                rationale,
                sanctions,
            },
            reason: rationale.trim(),
        });
        res.status(200).json({
            success: true,
            message: 'Authorized human review decision recorded successfully.',
            data: incident,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.recordDecision = recordDecision;
// 6. Lifecycle Step 7 & 8: Record Resolution & Maintain Full History
const resolveIncident = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status = 'resolved', resolutionNotes, actionTaken, sanctionsApplied, penaltyPoints = 0, } = req.body;
        const incident = await incident_model_js_1.Incident.findById(id);
        if (!incident) {
            res.status(404).json({ success: false, message: 'Incident record not found.' });
            return;
        }
        const resolution = {
            summary: resolutionNotes || 'Incident investigated and resolved by authorized personnel.',
            resolvedBy: req.user?.name || 'Institutional Manager',
            resolvedAt: new Date(),
            actionTaken: actionTaken || 'No punitive sanctions applied.',
        };
        incident.status = status;
        incident.resolution = resolution;
        incident.resolutionNotes = resolution.summary;
        incident.actionTaken = resolution.actionTaken;
        incident.sanctionsApplied = sanctionsApplied || 'none';
        incident.resolvedAt = new Date();
        incident.resolvedBy = resolution.resolvedBy;
        incident.investigationNotes.push({
            authorId: req.user?._id,
            authorName: resolution.resolvedBy,
            authorRole: req.user?.role || 'manager',
            note: `Incident officially ${status.toUpperCase()} by ${resolution.resolvedBy}. Resolution: ${resolution.summary}. Action: ${resolution.actionTaken}`,
            createdAt: new Date(),
        });
        await incident.save();
        // Human-governed penalty points (only applied if explicitly entered and confirmed by human reviewer)
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
            entityTitle: `Incident Resolved: ${incident.incidentNumber}`,
            actorId: req.user?._id,
            actorName: req.user?.name || 'Manager',
            actorEmail: req.user?.email,
            actorRole: req.user?.role || 'manager',
            details: {
                incidentNumber: incident.incidentNumber,
                status,
                resolution,
                penaltyPoints,
            },
            reason: resolution.summary,
        });
        // Notify Reporter of official resolution
        if (incident.reportedByUserId) {
            await notification_model_js_1.Notification.create({
                userId: incident.reportedByUserId,
                title: `Incident Closed (${incident.incidentNumber}): ${status.toUpperCase()}`,
                message: `Your incident report ${incident.incidentNumber} regarding "${incident.resourceName}" was resolved. Outcome note: ${resolution.summary}`,
                type: 'incident_update',
                link: '/dashboard/activity',
                metadata: { incidentId: incident._id, incidentNumber: incident.incidentNumber, status },
            });
        }
        res.status(200).json({
            success: true,
            message: `Incident ${incident.incidentNumber} successfully resolved and archived.`,
            data: incident,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.resolveIncident = resolveIncident;
// 7. Get Condition Comparison for an Incident
const getIncidentConditionComparison = async (req, res, next) => {
    try {
        const { id } = req.params;
        const incident = await incident_model_js_1.Incident.findById(id);
        if (!incident) {
            res.status(404).json({ success: false, message: 'Incident record not found.' });
            return;
        }
        if (!incident.bookingId) {
            res.status(400).json({
                success: false,
                message: 'This incident is not linked to an equipment reservation booking.',
            });
            return;
        }
        const comparison = await conditionGuard_service_js_1.ConditionGuardService.compareConditionReports(incident.bookingId.toString());
        res.status(200).json({
            success: true,
            data: comparison,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getIncidentConditionComparison = getIncidentConditionComparison;
