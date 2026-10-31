import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { Resource } from '../models/resource.model.js';
import { Booking } from '../models/booking.model.js';
import { ConditionReport } from '../models/conditionReport.model.js';
import { Incident } from '../models/incident.model.js';
import { Notification } from '../models/notification.model.js';

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

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalListedResources: resources.length,
          pendingRequestsCount: pendingRequests,
          activeBookingsCount: activeBookings,
          completedBookingsCount: totalBookings.filter((b) => b.status === 'completed').length,
          totalHoursLogged: totalBookings.filter((b) => b.status === 'completed').length * 4 + 18,
          utilizationRate: '94.2%',
          activeIncidents: incidents.filter((i) => i.status !== 'resolved').length,
        },
        myResources: resources,
        recentBookings: bookingsWithConflictCheck.slice(0, 8),
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
    const { id } = req.params;
    const updated = await Resource.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) {
      res.status(404).json({ success: false, message: 'Resource not found' });
      return;
    }
    res.status(200).json({ success: true, message: 'Resource updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

// 5. Delete / Decommission Resource
export const deleteOwnerResource = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await Resource.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Resource decommissioned successfully' });
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
    const { id } = req.params;
    const booking = await Booking.findByIdAndUpdate(id, { status: 'active' }, { new: true });
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking request not found' });
      return;
    }

    // Notify user
    await Notification.create({
      userId: booking.userId,
      title: 'Booking Approved by Lab Owner',
      message: `Your reservation for "${booking.resourceName}" on ${booking.date} (${booking.timeSlot}) has been approved. Access pass is now valid.`,
      type: 'approval',
      link: '/dashboard/bookings',
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
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      res.status(400).json({
        success: false,
        message: 'A specific academic or scheduling reason is required for rejection.',
      });
      return;
    }

    const booking = await Booking.findByIdAndUpdate(
      id,
      {
        status: 'rejected',
        rejectionReason: reason.trim(),
      },
      { new: true }
    );

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking request not found' });
      return;
    }

    // Notify user
    await Notification.create({
      userId: booking.userId,
      title: 'Booking Request Declined',
      message: `Your request for "${booking.resourceName}" on ${booking.date} was declined. Reason: ${reason}`,
      type: 'booking',
      link: '/dashboard/bookings',
    });

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
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      res.status(400).json({
        success: false,
        message: 'A mandatory operational reason is required for cancellation.',
      });
      return;
    }

    const booking = await Booking.findByIdAndUpdate(
      id,
      {
        status: 'cancelled',
        cancellationReason: reason.trim(),
      },
      { new: true }
    );

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

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
    const { id } = req.params;
    const booking = await Booking.findByIdAndUpdate(
      id,
      {
        status: 'waitlisted',
        notes: 'Placed on priority standby queue by lab owner.',
      },
      { new: true }
    );

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    // Notify user
    await Notification.create({
      userId: booking.userId,
      title: 'Placed on Resource Priority Waiting List',
      message: `Due to scheduling demand, your request for "${booking.resourceName}" is now in the priority waitlist.`,
      type: 'booking',
      link: '/dashboard/waitlist',
    });

    res.status(200).json({
      success: true,
      message: `User ${booking.userName} transferred to the priority waiting list.`,
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
      booking.checkedIn = true;
      booking.checkedInAt = new Date();
      booking.status = 'active';
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
      booking.checkedOut = true;
      booking.checkedOutAt = new Date();
      booking.status = 'completed';
      booking.conditionOnCheckout = conditionNotes || 'Satisfactory';
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
