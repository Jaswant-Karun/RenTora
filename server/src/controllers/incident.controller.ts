import { Response, NextFunction } from 'express';
import {
  Incident,
  IncidentCategory,
  IncidentStatus,
  IIncidentDecision,
  IIncidentResolution,
} from '../models/incident.model.js';
import { Booking } from '../models/booking.model.js';
import { Resource } from '../models/resource.model.js';
import { User } from '../models/user.model.js';
import { Notification } from '../models/notification.model.js';
import { ConditionReport } from '../models/conditionReport.model.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { recordAuditLog } from '../utils/auditLogger.js';
import { ConditionGuardService } from '../services/conditionGuard.service.js';

export const VALID_INCIDENT_CATEGORIES: IncidentCategory[] = [
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
export const reportIncident = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const {
      title,
      category,
      description,
      evidence = [],
      bookingId,
      bookingReference,
      resourceId,
      resourceName,
      severity = 'medium',
    } = req.body;

    if (!description || !description.trim()) {
      res.status(400).json({
        success: false,
        message: 'A detailed incident description is required.',
      });
      return;
    }

    if (!category || !VALID_INCIDENT_CATEGORIES.includes(category)) {
      res.status(400).json({
        success: false,
        message: `Invalid incident category "${category}". Permitted categories: ${VALID_INCIDENT_CATEGORIES.join(', ')}`,
      });
      return;
    }

    let resolvedResourceName = resourceName;
    let resolvedResourceId = resourceId;
    let resolvedBookingRef = bookingReference;
    let conditionReportBeforeId: any = undefined;
    let conditionReportAfterId: any = undefined;

    // Resolve resource & condition reports from booking if provided
    if (bookingId) {
      const booking = await Booking.findById(bookingId);
      if (booking) {
        resolvedResourceName = resolvedResourceName || booking.resourceName;
        resolvedResourceId = resolvedResourceId || booking.resourceId;
        resolvedBookingRef = resolvedBookingRef || `BK-${booking._id.toString().slice(-6).toUpperCase()}`;

        // Automatically link pre-use and post-use condition reports if they exist
        const [beforeRep, afterRep] = await Promise.all([
          ConditionReport.findOne({ bookingId: booking._id, type: 'check_in' }).sort({ createdAt: -1 }),
          ConditionReport.findOne({ bookingId: booking._id, type: 'check_out' }).sort({ createdAt: -1 }),
        ]);

        if (beforeRep) conditionReportBeforeId = beforeRep._id;
        if (afterRep) conditionReportAfterId = afterRep._id;
      }
    }

    if (!resolvedResourceName && resolvedResourceId) {
      const resource = await Resource.findById(resolvedResourceId);
      if (resource) {
        resolvedResourceName = resource.name;
      }
    }

    // Assign reference number format: INC-YYYY-XXXXX
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    const timeSlice = Date.now().toString().slice(-4);
    const assignedNumber = `INC-${year}-${timeSlice}${rand}`;

    const incident = await Incident.create({
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
    await recordAuditLog({
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
    await Notification.create({
      targetRole: 'manager',
      title: `Incident Alert (${incident.incidentNumber}): ${category.replace(/_/g, ' ').toUpperCase()}`,
      message: `New incident reported by ${req.user.name} regarding "${resolvedResourceName}". Reference: ${incident.incidentNumber}. Requires authorized human review.`,
      type: 'incident_update',
      link: '/owner/incidents',
      metadata: { incidentId: incident._id, incidentNumber: incident.incidentNumber },
    });

    // If resource has an owner, notify the owner specifically
    if (resolvedResourceId) {
      const resource = await Resource.findById(resolvedResourceId);
      if (resource?.ownerId) {
        await Notification.create({
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
  } catch (error) {
    next(error);
  }
};

// 2. Get Incidents List
export const getIncidents = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { category, status, severity, resourceId, bookingId, limit = 50 } = req.query;
    const query: any = {};

    if (category) query.category = category;
    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (resourceId) query.resourceId = resourceId;
    if (bookingId) query.bookingId = bookingId;

    // Students only see incidents they reported or where they are associated
    if (req.user?.role === 'student') {
      query.reportedByUserId = req.user._id;
    }

    const incidents = await Incident.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: incidents,
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get Single Incident by ID (Lifecycle Step 4: Review Evidence & History)
export const getIncidentById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const incident = await Incident.findById(id);

    if (!incident) {
      res.status(404).json({ success: false, message: 'Incident record not found.' });
      return;
    }

    // Fetch linked condition reports if available
    let comparison = null;
    if (incident.bookingId) {
      try {
        comparison = await ConditionGuardService.compareConditionReports(incident.bookingId.toString());
      } catch (e) {
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
  } catch (error) {
    next(error);
  }
};

// 4. Lifecycle Step 5: Add Investigation Notes
export const addInvestigationNote = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note || !note.trim()) {
      res.status(400).json({ success: false, message: 'Investigation note text is required.' });
      return;
    }

    const incident = await Incident.findById(id);
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

    await recordAuditLog({
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
  } catch (error) {
    next(error);
  }
};

// 5. Lifecycle Step 6: Record Decision (Authorized Human Review Enforced)
export const recordDecision = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
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

    const incident = await Incident.findById(id);
    if (!incident) {
      res.status(404).json({ success: false, message: 'Incident record not found.' });
      return;
    }

    const decision: IIncidentDecision = {
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

    await recordAuditLog({
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
  } catch (error) {
    next(error);
  }
};

// 6. Lifecycle Step 7 & 8: Record Resolution & Maintain Full History
export const resolveIncident = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      status = 'resolved',
      resolutionNotes,
      actionTaken,
      sanctionsApplied,
      penaltyPoints = 0,
    } = req.body;

    const incident = await Incident.findById(id);
    if (!incident) {
      res.status(404).json({ success: false, message: 'Incident record not found.' });
      return;
    }

    const resolution: IIncidentResolution = {
      summary: resolutionNotes || 'Incident investigated and resolved by authorized personnel.',
      resolvedBy: req.user?.name || 'Institutional Manager',
      resolvedAt: new Date(),
      actionTaken: actionTaken || 'No punitive sanctions applied.',
    };

    incident.status = status as IncidentStatus;
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
      await User.findByIdAndUpdate(incident.reportedByUserId, {
        $inc: { 'historicalUsage.penaltyPoints': Number(penaltyPoints) },
      });
    }

    // Immutable Audit Log
    await recordAuditLog({
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
      await Notification.create({
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
  } catch (error) {
    next(error);
  }
};

// 7. Get Condition Comparison for an Incident
export const getIncidentConditionComparison = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const incident = await Incident.findById(id);

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

    const comparison = await ConditionGuardService.compareConditionReports(incident.bookingId.toString());

    res.status(200).json({
      success: true,
      data: comparison,
    });
  } catch (error) {
    next(error);
  }
};
