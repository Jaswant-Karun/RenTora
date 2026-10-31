import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { Resource } from '../models/resource.model.js';
import { Booking } from '../models/booking.model.js';
import { ConditionReport } from '../models/conditionReport.model.js';
import { Incident } from '../models/incident.model.js';
import { Notification } from '../models/notification.model.js';
import { recordAuditLog } from '../utils/auditLogger.js';
import { FairShareService } from '../services/fairShare.service.js';

// 1. Get Owner Overview Stats & Summary
export const getOwnerOverview = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const ownerQuery = { $or: [{ ownerId: user._id }, { ownerEmail: user.email }] };

    const [resources, totalBookings, pendingRequests, activeBookings, conditionReports, incidents] = await Promise.all([
      Resource.find(ownerQuery),
      Booking.find({
        $or: [{ resourceId: { $in: await Resource.find(ownerQuery).distinct('_id') } }, { supervisorName: user.name }],
      }).sort({ createdAt: -1 }),
      Booking.countDocuments({
        status: 'pending',
        $or: [{ resourceId: { $in: await Resource.find(ownerQuery).distinct('_id') } }, { supervisorName: user.name }],
      }),
      Booking.countDocuments({
        status: 'active',
        $or: [{ resourceId: { $in: await Resource.find(ownerQuery).distinct('_id') } }, { supervisorName: user.name }],
      }),
      ConditionReport.find().sort({ createdAt: -1 }).limit(5),
      Incident.find().sort({ createdAt: -1 }).limit(5),
    ]);

    // Check for scheduling conflicts in bookings
    const bookingsWithConflictCheck = totalBookings.map((b) => {
      const conflict = totalBookings.some(
        (other) =>
          other._id.toString() !== b._id.toString() &&
          other.resourceId.toString() === b.resourceId.toString() &&
          other.date === b.date &&
          other.timeSlot === b.timeSlot &&
          (other.status === 'active' || other.status === 'pending')
      );
      return {
        ...b.toObject(),
        conflictDetected: conflict,
      };
    });

    const totalResources = resources.length;
    const availableResources = resources.filter((r) => r.status === 'available').length;
    const currentlyBookedResources = resources.filter((r) => r.status === 'in_use' || r.status === 'reserved').length;
    const pendingBookingRequests = pendingRequests;
    const activeReservations = activeBookings;
    const completedBookings = totalBookings.filter((b) => b.status === 'completed').length;
    const utilizationPercentage = totalResources > 0
      ? Math.min(100, Math.round(((currentlyBookedResources + activeReservations) / totalResources) * 100))
      : 0;

    const upcomingReservations = bookingsWithConflictCheck
      .filter((b) => b.status === 'approved' || b.status === 'active' || b.status === 'pending')
      .slice(0, 8);

    // Extract recent activity from booking audit trails
    const recentActivity: any[] = [];
    totalBookings.forEach((b) => {
      if (Array.isArray(b.auditTrail)) {
        b.auditTrail.forEach((entry: any) => {
          recentActivity.push({
            id: `${b._id}-${entry.timestamp}`,
            bookingId: b._id,
            resourceName: b.resourceName,
            transition: entry.transition,
            performedBy: entry.performedBy,
            performedByRole: entry.performedByRole,
            timestamp: entry.timestamp,
            note: entry.note,
          });
        });
      }
    });
    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalListedResources: totalResources,
          totalResources,
          availableResources,
          currentlyBookedResources,
          pendingRequestsCount: pendingBookingRequests,
          pendingBookingRequests,
          activeBookingsCount: activeReservations,
          activeReservations,
          completedBookingsCount: completedBookings,
          completedBookings,
          totalHoursLogged: completedBookings * 4 + 18,
          utilizationPercentage: `${utilizationPercentage}%`,
          utilizationRate: `${utilizationPercentage}%`,
          activeIncidents: incidents.filter((i) => i.status !== 'resolved').length,
        },
        myResources: resources,
        recentBookings: bookingsWithConflictCheck.slice(0, 8),
        upcomingReservations,
        recentActivity: recentActivity.slice(0, 10),
        conditionReports,
        incidents,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 2. Add New Resource by Owner
export const addOwnerResource = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const {
      name,
      category,
      description,
      institution,
      location,
      specifications,
      images,
      availabilitySchedule,
      minBookingDuration,
      maxBookingDuration,
      eligibility,
      trainingRequired,
      safetyInstructions,
      supervisionRequirement,
      depositConditions,
      approvalRequired,
      resourceType,
      tags,
    } = req.body;

    if (!name || !category || !description || !institution || !location) {
      res.status(400).json({
        success: false,
        message: 'Name, Category, Description, Institution, and Location are mandatory fields.',
      });
      return;
    }

    const newResource = await Resource.create({
      name,
      category,
      description,
      institution,
      location,
      resourceType: resourceType || 'Equipment',
      specifications: typeof specifications === 'object' ? specifications : {},
      images: Array.isArray(images) && images.length > 0 ? images : [
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      ],
      availabilitySchedule: availabilitySchedule || 'Monday - Friday (09:00 - 18:00)',
      minBookingDuration: minBookingDuration || '1 hour',
      maxBookingDuration: maxBookingDuration || '4 hours',
      eligibility: eligibility || 'All Enrolled Students & Faculty',
      trainingRequired: trainingRequired || 'Basic Lab Safety Induction',
      safetyInstructions: Array.isArray(safetyInstructions) ? safetyInstructions : [
        'Mandatory eye protection and closed-toe footwear.',
      ],
      supervisionRequirement: supervisionRequirement || 'Self-Operated after training clearance',
      depositConditions: depositConditions || 'None',
      approvalRequired: approvalRequired !== undefined ? approvalRequired : true,
      approvalStatus: 'approved', // Direct onboarding for lab owner
      ownerId: user._id,
      ownerName: user.name,
      ownerEmail: user.email,
      ownerDepartment: user.department || 'General Faculty',
      ownerAvatar: user.avatar || '',
      status: 'available',
      availabilityText: 'Available for Bookings',
      tags: Array.isArray(tags) ? tags : [category],
    });

    await recordAuditLog({
      action: 'RESOURCE_CREATION',
      entityType: 'Resource',
      entityId: newResource._id,
      entityTitle: newResource.name,
      actorId: user._id,
      actorName: user.name,
      actorEmail: user.email,
      actorRole: user.role,
      details: {
        category: newResource.category,
        institution: newResource.institution,
        location: newResource.location,
        approvalRequired: newResource.approvalRequired,
      },
      reason: 'New equipment resource catalogued by owner.',
    });

    res.status(201).json({
      success: true,
      message: `Resource "${newResource.name}" catalogued successfully and published to RENTORA network.`,
      data: newResource,
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get Owner's Resources
export const getOwnerResources = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const resources = await Resource.find({
      $or: [{ ownerId: user._id }, { ownerEmail: user.email }],
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: resources,
    });
  } catch (error) {
    next(error);
  }
};

// 4. Update Resource
export const updateOwnerResource = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const resource = await Resource.findById(id);

    if (!resource) {
      res.status(404).json({ success: false, message: 'Resource not found' });
      return;
    }

    // Backend RBAC: Ensure owner owns this resource or has admin/manager privileges
    const isOwner = (resource.ownerId && resource.ownerId.toString() === user._id.toString()) || resource.ownerEmail === user.email;
    const isAuthorized = isOwner || user.role === 'admin' || user.role === 'manager';

    if (!isAuthorized) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to modify resources belonging to another owner or institution.',
      });
      return;
    }

    const {
      name,
      category,
      description,
      location,
      images,
      availabilitySchedule,
      minBookingDuration,
      maxBookingDuration,
      eligibility,
      trainingRequired,
      safetyInstructions,
      supervisionRequirement,
      depositConditions,
      approvalRequired,
      resourceType,
      specifications,
      tags,
      status,
    } = req.body;

    if (name) resource.name = name;
    if (category) resource.category = category;
    if (description) resource.description = description;
    if (location) resource.location = location;
    if (images && Array.isArray(images)) resource.images = images;
    if (availabilitySchedule) resource.availabilitySchedule = availabilitySchedule;
    if (minBookingDuration) resource.minBookingDuration = minBookingDuration;
    if (maxBookingDuration) resource.maxBookingDuration = maxBookingDuration;
    if (eligibility) resource.eligibility = eligibility;
    if (trainingRequired) resource.trainingRequired = trainingRequired;
    if (safetyInstructions) resource.safetyInstructions = Array.isArray(safetyInstructions) ? safetyInstructions : [safetyInstructions];
    if (supervisionRequirement) resource.supervisionRequirement = supervisionRequirement;
    if (depositConditions) resource.depositConditions = depositConditions;
    if (approvalRequired !== undefined) resource.approvalRequired = approvalRequired;
    if (resourceType) resource.resourceType = resourceType;
    if (specifications) resource.specifications = specifications;
    if (tags && Array.isArray(tags)) resource.tags = tags;
    if (status) {
      resource.status = status;
      if (status === 'maintenance') resource.availabilityText = 'Under Maintenance';
      else if (status === 'disabled') resource.availabilityText = 'Temporarily Disabled';
      else if (status === 'available') resource.availabilityText = 'Available for Bookings';
    }

    await resource.save();

    await recordAuditLog({
      action: status === 'disabled' || status === 'maintenance' ? 'RESOURCE_DISABLED' : 'RESOURCE_UPDATE',
      entityType: 'Resource',
      entityId: resource._id,
      entityTitle: resource.name,
      actorId: user._id,
      actorName: user.name,
      actorEmail: user.email,
      actorRole: user.role,
      details: {
        updatedFields: Object.keys(req.body),
        newStatus: resource.status,
      },
      reason: req.body.reason || 'Resource attributes and configuration updated by custodian.',
    });

    res.status(200).json({
      success: true,
      message: `Resource "${resource.name}" updated successfully.`,
      data: resource,
    });
  } catch (error) {
    next(error);
  }
};

// 5. Delete / Archive Resource (Preserves historical booking records)
export const deleteOwnerResource = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const resource = await Resource.findById(id);

    if (!resource) {
      res.status(404).json({ success: false, message: 'Resource not found' });
      return;
    }

    const isOwner = (resource.ownerId && resource.ownerId.toString() === user._id.toString()) || resource.ownerEmail === user.email;
    const isAuthorized = isOwner || user.role === 'admin' || user.role === 'manager';

    if (!isAuthorized) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to archive resources belonging to another owner or institution.',
      });
      return;
    }

    // Soft-archive resource so historical bookings remain fully intact
    resource.isArchived = true;
    resource.status = 'archived';
    resource.availabilityText = 'Archived - Decommissioned';
    await resource.save();

    await recordAuditLog({
      action: 'RESOURCE_ARCHIVED',
      entityType: 'Resource',
      entityId: resource._id,
      entityTitle: resource.name,
      actorId: user._id,
      actorName: user.name,
      actorEmail: user.email,
      actorRole: user.role,
      details: {
        previousStatus: resource.status,
        archivedAt: new Date(),
      },
      reason: req.body.reason || 'Resource archived by custodian. Historical booking records preserved.',
    });

    res.status(200).json({
      success: true,
      message: `Resource "${resource.name}" archived successfully. All historical booking logs remain preserved.`,
      data: resource,
    });
  } catch (error) {
    next(error);
  }
};

// 6. Get Owner Bookings with Conflict Checking
export const getOwnerBookings = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const ownerResourceIds = await Resource.find({
      $or: [{ ownerId: user._id }, { ownerEmail: user.email }],
    }).distinct('_id');

    const bookings = await Booking.find({
      $or: [{ resourceId: { $in: ownerResourceIds } }, { supervisorName: user.name }],
    }).sort({ createdAt: -1 });

    // Mark conflicts
    const enriched = bookings.map((b) => {
      const conflict = bookings.some(
        (other) =>
          other._id.toString() !== b._id.toString() &&
          other.resourceId.toString() === b.resourceId.toString() &&
          other.date === b.date &&
          other.timeSlot === b.timeSlot &&
          (other.status === 'active' || other.status === 'pending')
      );
      return {
        ...b.toObject(),
        conflictDetected: conflict,
      };
    });

    res.status(200).json({
      success: true,
      data: enriched,
    });
  } catch (error) {
    next(error);
  }
};

// 7. Approve Booking Request
export const approveBooking = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking request not found' });
      return;
    }

    const resource = await Resource.findById(booking.resourceId);
    const isOwner = resource && ((resource.ownerId && resource.ownerId.toString() === user._id.toString()) || resource.ownerEmail === user.email);
    const isSupervisor = booking.supervisorName === user.name;
    const isAuthorized = isOwner || isSupervisor || user.role === 'admin' || user.role === 'manager';

    if (!isAuthorized) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to approve bookings for resources of another owner or institution.',
      });
      return;
    }

    const previousStatus = booking.status;
    booking.status = 'approved';
    booking.auditTrail.push({
      transition: 'RESERVATION_APPROVED',
      fromStatus: previousStatus,
      toStatus: 'approved',
      performedBy: user.name,
      performedByRole: user.role,
      timestamp: new Date(),
      note: req.body.note || 'Approved by laboratory custodian.',
    });
    await booking.save();

    // Notify user
    await Notification.create({
      userId: booking.userId,
      title: 'Booking Approved by Lab Owner',
      message: `Your reservation for "${booking.resourceName}" on ${booking.date} (${booking.timeSlot}) has been approved. Access pass is now valid.`,
      type: 'approval',
      link: '/dashboard/bookings',
    });

    await recordAuditLog({
      action: 'BOOKING_APPROVAL',
      entityType: 'Booking',
      entityId: booking._id,
      entityTitle: `${booking.resourceName} - ${booking.userName}`,
      actorId: user._id,
      actorName: user.name,
      actorEmail: user.email,
      actorRole: user.role,
      details: {
        date: booking.date,
        timeSlot: booking.timeSlot,
        userId: booking.userId,
        resourceId: booking.resourceId,
      },
      reason: req.body.note || 'Booking approved by owner/custodian.',
    });

    res.status(200).json({
      success: true,
      message: `Booking for ${booking.userName} approved successfully. Pass activated.`,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// 8. Reject Booking Request with Reason
export const rejectBooking = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      res.status(400).json({
        success: false,
        message: 'A specific academic or scheduling reason is required for rejection.',
      });
      return;
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking request not found' });
      return;
    }

    const resource = await Resource.findById(booking.resourceId);
    const isOwner = resource && ((resource.ownerId && resource.ownerId.toString() === user._id.toString()) || resource.ownerEmail === user.email);
    const isSupervisor = booking.supervisorName === user.name;
    const isAuthorized = isOwner || isSupervisor || user.role === 'admin' || user.role === 'manager';

    if (!isAuthorized) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to reject bookings for resources of another owner or institution.',
      });
      return;
    }

    const previousStatus = booking.status;
    booking.status = 'rejected';
    booking.rejectionReason = reason.trim();
    booking.auditTrail.push({
      transition: 'RESERVATION_REJECTED',
      fromStatus: previousStatus,
      toStatus: 'rejected',
      performedBy: user.name,
      performedByRole: user.role,
      timestamp: new Date(),
      note: `Rejected by owner. Reason: ${reason.trim()}`,
    });
    await booking.save();

    // Notify user
    await Notification.create({
      userId: booking.userId,
      title: 'Booking Request Declined',
      message: `Your request for "${booking.resourceName}" on ${booking.date} was declined. Reason: ${reason}`,
      type: 'booking',
      link: '/dashboard/bookings',
    });

    await recordAuditLog({
      action: 'BOOKING_REJECTION',
      entityType: 'Booking',
      entityId: booking._id,
      entityTitle: `${booking.resourceName} - ${booking.userName}`,
      actorId: user._id,
      actorName: user.name,
      actorEmail: user.email,
      actorRole: user.role,
      details: {
        date: booking.date,
        timeSlot: booking.timeSlot,
        userId: booking.userId,
        resourceId: booking.resourceId,
        rejectionReason: reason.trim(),
      },
      reason: reason.trim(),
    });

    // Advance waitlist and notify next eligible user
    await FairShareService.advanceWaitlist(booking.resourceId, booking.date, booking.timeSlot, booking._id?.toString());

    res.status(200).json({
      success: true,
      message: 'Booking rejected and rejection rationale dispatched to the student.',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// 9. Cancel Booking with Reason
export const cancelBookingByOwner = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      res.status(400).json({
        success: false,
        message: 'A mandatory operational reason is required for cancellation.',
      });
      return;
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    const resource = await Resource.findById(booking.resourceId);
    const isOwner = resource && ((resource.ownerId && resource.ownerId.toString() === user._id.toString()) || resource.ownerEmail === user.email);
    const isSupervisor = booking.supervisorName === user.name;
    const isAuthorized = isOwner || isSupervisor || user.role === 'admin' || user.role === 'manager';

    if (!isAuthorized) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to cancel bookings for resources of another owner or institution.',
      });
      return;
    }

    const previousStatus = booking.status;
    booking.status = 'cancelled';
    booking.cancellationReason = reason.trim();
    booking.auditTrail.push({
      transition: 'RESERVATION_CANCELLED',
      fromStatus: previousStatus,
      toStatus: 'cancelled',
      performedBy: user.name,
      performedByRole: user.role,
      timestamp: new Date(),
      note: `Cancelled by custodian. Reason: ${reason.trim()}`,
    });
    await booking.save();

    // Notify user
    await Notification.create({
      userId: booking.userId,
      title: 'Confirmed Reservation Cancelled by Custodian',
      message: `Your reservation for "${booking.resourceName}" has been cancelled. Reason: ${reason}`,
      type: 'maintenance',
      link: '/dashboard/bookings',
    });

    res.status(200).json({
      success: true,
      message: 'Booking cancelled and alert dispatched to user.',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// 10. Move User to Waiting List
export const moveBookingToWaitlist = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    const resource = await Resource.findById(booking.resourceId);
    const isOwner = resource && ((resource.ownerId && resource.ownerId.toString() === user._id.toString()) || resource.ownerEmail === user.email);
    const isSupervisor = booking.supervisorName === user.name;
    const isAuthorized = isOwner || isSupervisor || user.role === 'admin' || user.role === 'manager';

    if (!isAuthorized) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to manage bookings for resources of another owner or institution.',
      });
      return;
    }

    const existingWaitlisted = await Booking.countDocuments({
      resourceId: booking.resourceId,
      status: 'waitlisted',
    });

    const previousStatus = booking.status;
    booking.status = 'waitlisted';
    booking.waitlistReason = reason || 'Placed on priority standby queue by lab owner.';
    booking.queuePosition = existingWaitlisted + 1;
    booking.auditTrail.push({
      transition: 'MOVED_TO_WAITLIST',
      fromStatus: previousStatus,
      toStatus: 'waitlisted',
      performedBy: user.name,
      performedByRole: user.role,
      timestamp: new Date(),
      note: `Moved to waitlist (Queue pos #${booking.queuePosition}): ${booking.waitlistReason}`,
    });
    await booking.save();

    // Notify user
    await Notification.create({
      userId: booking.userId,
      title: 'Placed on Resource Priority Waiting List',
      message: `Due to scheduling demand, your request for "${booking.resourceName}" is now in the priority waitlist (Queue position #${booking.queuePosition}).`,
      type: 'booking',
      link: '/dashboard/waitlist',
    });

    await recordAuditLog({
      action: 'WAITLIST_PROMOTION',
      entityType: 'Booking',
      entityId: booking._id,
      entityTitle: `${booking.resourceName} - ${booking.userName}`,
      actorId: user._id,
      actorName: user.name,
      actorEmail: user.email,
      actorRole: user.role,
      details: { queuePosition: booking.queuePosition, reason: booking.waitlistReason },
      reason: booking.waitlistReason,
    });

    res.status(200).json({
      success: true,
      message: `User ${booking.userName} transferred to the priority waiting list (Position #${booking.queuePosition}).`,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// 10b. Suggest Alternative Dates
export const suggestAlternativeDates = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { suggestedDate, suggestedTimeSlot, note } = req.body;

    if (!suggestedDate || !suggestedTimeSlot) {
      res.status(400).json({
        success: false,
        message: 'Suggested date and time slot are required.',
      });
      return;
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking request not found' });
      return;
    }

    const resource = await Resource.findById(booking.resourceId);
    const isOwner = resource && ((resource.ownerId && resource.ownerId.toString() === user._id.toString()) || resource.ownerEmail === user.email);
    const isSupervisor = booking.supervisorName === user.name;
    const isAuthorized = isOwner || isSupervisor || user.role === 'admin' || user.role === 'manager';

    if (!isAuthorized) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to manage bookings for resources of another owner or institution.',
      });
      return;
    }

    booking.suggestedAlternative = {
      date: suggestedDate,
      timeSlot: suggestedTimeSlot,
      note: note || '',
      offeredAt: new Date(),
    };

    booking.auditTrail.push({
      transition: 'ALTERNATIVE_DATE_SUGGESTED',
      fromStatus: booking.status,
      toStatus: booking.status,
      performedBy: user.name,
      performedByRole: user.role,
      timestamp: new Date(),
      note: `Owner suggested alternative date: ${suggestedDate} at ${suggestedTimeSlot}. ${note ? `Note: ${note}` : ''}`,
    });
    await booking.save();

    await Notification.create({
      userId: booking.userId,
      title: 'Alternative Schedule Suggested for Your Request',
      message: `The custodian for "${booking.resourceName}" suggested an alternative slot on ${suggestedDate} (${suggestedTimeSlot}): ${note || 'Please review your booking details.'}`,
      type: 'booking',
      link: '/dashboard/bookings',
    });

    await recordAuditLog({
      action: 'BOOKING_ALTERNATIVE_SUGGESTED',
      entityType: 'Booking',
      entityId: booking._id,
      entityTitle: `${booking.resourceName} - ${booking.userName}`,
      actorId: user._id,
      actorName: user.name,
      actorEmail: user.email,
      actorRole: user.role,
      details: { suggestedDate, suggestedTimeSlot, note },
      reason: 'Owner offered alternative scheduling slot.',
    });

    res.status(200).json({
      success: true,
      message: `Alternative date suggestion dispatched to ${booking.userName}.`,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// 11. Check-In / Check-Out Execution
export const handleCheckInCheckOut = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { bookingId, action, conditionNotes, meterReading } = req.body;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking record not found' });
      return;
    }

    if (action === 'check_in') {
      const previousStatus = booking.status;
      booking.checkedIn = true;
      booking.checkedInAt = new Date();
      booking.status = 'checked_in';
      booking.isOverdue = false;
      booking.initialCondition = {
        conditionNotes: conditionNotes || 'Equipment handed over in verified operational condition.',
        meterReading: meterReading || '0 hrs',
        cleanliness: 'passed',
        operationalStatus: 'optimal',
        recordedBy: req.user?.name || 'Lab Custodian',
        recordedAt: new Date(),
      };
      booking.auditTrail.push({
        transition: 'CHECK_IN_PERFORMED',
        fromStatus: previousStatus,
        toStatus: 'checked_in',
        performedBy: req.user?.name || 'Lab Custodian',
        performedByRole: req.user?.role || 'owner',
        timestamp: new Date(),
        note: `Check-in logged by custodian. Meter: ${meterReading || '0'}. Notes: ${conditionNotes || 'Clean'}`,
      });
      await booking.save();

      // Create condition report
      await ConditionReport.create({
        resourceId: booking.resourceId,
        resourceName: booking.resourceName,
        bookingId: booking._id,
        inspectorName: req.user?.name || 'Lab Custodian',
        type: 'check_in',
        operationalStatus: 'optimal',
        cleanliness: 'passed',
        meterReading: meterReading || '0 hrs',
        observations: conditionNotes || 'Equipment handed over in verified operational condition.',
      });

      res.status(200).json({
        success: true,
        message: `Student ${booking.userName} checked in successfully. Session started.`,
        data: booking,
      });
    } else {
      const previousStatus = booking.status;
      booking.checkedOut = true;
      booking.checkedOutAt = new Date();
      booking.status = 'completed';
      booking.conditionOnCheckout = conditionNotes || 'Satisfactory';
      booking.isOverdue = false;
      booking.auditTrail.push({
        transition: 'RETURN_CONFIRMED_COMPLETED',
        fromStatus: previousStatus,
        toStatus: 'completed',
        performedBy: req.user?.name || 'Lab Custodian',
        performedByRole: req.user?.role || 'owner',
        timestamp: new Date(),
        note: `Check-out finalized by custodian. Condition: ${conditionNotes || 'Clean'}. Meter: ${meterReading || 'N/A'}`,
      });
      await booking.save();

      // Create check-out condition report
      await ConditionReport.create({
        resourceId: booking.resourceId,
        resourceName: booking.resourceName,
        bookingId: booking._id,
        inspectorName: req.user?.name || 'Lab Custodian',
        type: 'check_out',
        operationalStatus: 'optimal',
        cleanliness: 'passed',
        meterReading: meterReading || '4 hrs',
        observations: conditionNotes || 'Equipment returned in clean, operational condition. Session logged.',
      });

      // Free up resource
      await Resource.findByIdAndUpdate(booking.resourceId, { status: 'available' });

      res.status(200).json({
        success: true,
        message: `Session completed and checked out for ${booking.userName}. Logbook updated.`,
        data: booking,
      });
    }
  } catch (error) {
    next(error);
  }
};

// 12. Condition Reports
export const getConditionReports = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const reports = await ConditionReport.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
};

export const createConditionReport = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { resourceId, resourceName, notes, observations, reportType, type, conditionRating, operationalStatus } = req.body;
    let finalResourceName = resourceName;

    if (!finalResourceName && resourceId) {
      const resDoc = await Resource.findById(resourceId);
      finalResourceName = resDoc ? resDoc.name : 'Academic Resource';
    }

    const report = await ConditionReport.create({
      ...req.body,
      resourceId: resourceId || undefined,
      resourceName: finalResourceName || 'Laboratory Equipment',
      inspectorName: req.user?.name || 'Lab Custodian',
      inspectorRole: req.user?.role || 'owner',
      observations: observations || notes || 'Periodic inspection completed.',
      type: type || (reportType === 'routine-maintenance' ? 'routine' : reportType) || 'routine',
      operationalStatus: operationalStatus || (conditionRating === 'damaged' ? 'damaged' : conditionRating === 'fair' ? 'minor_wear' : 'optimal'),
    });
    res.status(201).json({ success: true, message: 'Condition report logged', data: report });
  } catch (error) {
    next(error);
  }
};

// 13. Incidents
export const getOwnerIncidents = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const incidents = await Incident.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: incidents });
  } catch (error) {
    next(error);
  }
};

export const createIncident = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { resourceId, resourceName, title, description, severity, actionTaken } = req.body;
    let finalResourceName = resourceName;

    if (!finalResourceName && resourceId) {
      const resDoc = await Resource.findById(resourceId);
      finalResourceName = resDoc ? resDoc.name : 'Academic Resource';
    }

    const incident = await Incident.create({
      resourceId: resourceId || undefined,
      resourceName: finalResourceName || 'Laboratory Equipment',
      reportedBy: req.user?.name || 'Lab Custodian',
      userEmail: req.user?.email || 'owner@rentora.edu',
      severity: severity || 'medium',
      title: title || 'Safety Incident Logged',
      description: description || 'Hazard observed during operational session.',
      actionTaken: actionTaken || 'Equipment assessed and logged.',
      status: 'reported',
    });
    res.status(201).json({ success: true, message: 'Incident report logged into institutional safety registry', data: incident });
  } catch (error) {
    next(error);
  }
};
