import { Response, NextFunction } from 'express';
import { Incident, IncidentCategory, IncidentStatus } from '../models/incident.model.js';
import { Booking } from '../models/booking.model.js';
import { Resource } from '../models/resource.model.js';
import { User } from '../models/user.model.js';
import { Notification } from '../models/notification.model.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { recordAuditLog } from '../utils/auditLogger.js';

export const VALID_INCIDENT_CATEGORIES: IncidentCategory[] = [
  'equipment_damage',
  'late_return',
  'missing_components',
  'misuse',
  'scheduling_conflicts',
  'other',
];

// 1. Report an Incident
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
        message: `Invalid incident category. Permitted categories: ${VALID_INCIDENT_CATEGORIES.join(', ')}`,
      });
      return;
    }

    let resolvedResourceName = resourceName;
    let resolvedResourceId = resourceId;
    let resolvedBookingRef = bookingReference;

    // Resolve resource from booking if bookingId provided
    if (bookingId) {
      const booking = await Booking.findById(bookingId);
      if (booking) {
        resolvedResourceName = resolvedResourceName || booking.resourceName;
        resolvedResourceId = resolvedResourceId || booking.resourceId;
        resolvedBookingRef = resolvedBookingRef || `BK-${booking._id.toString().slice(-6).toUpperCase()}`;
      }
    }

    if (!resolvedResourceName && resolvedResourceId) {
      const resource = await Resource.findById(resolvedResourceId);
      if (resource) {
        resolvedResourceName = resource.name;
      }
    }

    const incident = await Incident.create({
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
    await recordAuditLog({
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
    await Notification.create({
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
    const { category, status, severity, limit = 50 } = req.query;
    const query: any = {};

    if (category) query.category = category;
    if (status) query.status = status;
    if (severity) query.severity = severity;

    // Students only see incidents they reported
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

// 3. Get Single Incident
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

    res.status(200).json({ success: true, data: incident });
  } catch (error) {
    next(error);
  }
};

// 4. Review / Resolve Incident (Manager / Admin / Custodian)
export const reviewIncident = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      status,
      managerResponse,
      resolutionNotes,
      sanctionsApplied,
      penaltyPoints = 0,
    } = req.body;

    const incident = await Incident.findById(id);
    if (!incident) {
      res.status(404).json({ success: false, message: 'Incident record not found.' });
      return;
    }

    if (status) incident.status = status as IncidentStatus;
    if (managerResponse) incident.managerResponse = managerResponse.trim();
    if (resolutionNotes) incident.resolutionNotes = resolutionNotes.trim();
    if (sanctionsApplied) incident.sanctionsApplied = sanctionsApplied;

    if (status === 'resolved' || status === 'dismissed') {
      incident.resolvedAt = new Date();
      incident.resolvedBy = req.user?.name || 'Institutional Manager';
    }

    await incident.save();

    // If sanctions/penalty points applied, update student's profile
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
      await Notification.create({
        userId: incident.reportedByUserId,
        title: `Incident Review Update: ${incident.status.toUpperCase()}`,
        message: `Your incident report regarding "${incident.resourceName}" was updated. Manager Note: ${
          incident.managerResponse || incident.resolutionNotes || 'Case reviewed.'
        }`,
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
  } catch (error) {
    next(error);
  }
};
