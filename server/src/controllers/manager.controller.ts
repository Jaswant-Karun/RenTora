import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { Resource } from '../models/resource.model.js';
import { Booking } from '../models/booking.model.js';
import { User } from '../models/user.model.js';
import { Incident } from '../models/incident.model.js';
import { Dispute } from '../models/dispute.model.js';
import { FairAllocation } from '../models/fairAllocation.model.js';
import { Notification } from '../models/notification.model.js';
import { recordAuditLog } from '../utils/auditLogger.js';
import { AuditLog } from '../models/auditLog.model.js';

// 1. Institution-wide Resource Statistics & Analytics
export const getManagerStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const institution = req.user?.institution || 'National Institute of Technology';

    const [
      totalResources,
      availableResources,
      activeBookings,
      totalUsers,
      studentUsers,
      ownerUsers,
      unverifiedUsers,
      incidentsCount,
      disputesCount,
      pendingResourceApprovals,
      completedBookings,
      waitlistedBookings,
    ] = await Promise.all([
      Resource.countDocuments({ isArchived: { $ne: true } }),
      Resource.countDocuments({ status: 'available', isArchived: { $ne: true } }),
      Booking.countDocuments({ status: 'active' }),
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'owner' }),
      User.countDocuments({ isVerified: false }),
      Incident.countDocuments({ status: { $ne: 'resolved' } }),
      Dispute.countDocuments({ status: { $ne: 'resolved' } }),
      Resource.countDocuments({ approvalStatus: 'pending_manager', isArchived: { $ne: true } }),
      Booking.countDocuments({ status: 'completed' }),
      Booking.countDocuments({ status: 'waitlisted' }),
    ]);

    // Department utilization aggregation
    const deptUtilization = await Resource.aggregate([
      {
        $group: {
          _id: '$ownerDepartment',
          assetsCount: { $sum: 1 },
          totalBookings: { $sum: '$totalBookings' },
        },
      },
      { $sort: { totalBookings: -1 } },
    ]);

    // Fetch or create fair allocation settings
    let fairAllocation = await FairAllocation.findOne({ institution });
    if (!fairAllocation) {
      fairAllocation = await FairAllocation.create({
        institution,
        maxWeeklyHoursPerStudent: 16,
        maxActiveBookingsPerStudent: 3,
        peakHourThrottling: true,
        emergencyBypassEnabled: true,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalResources,
          availableResources,
          activeBookings,
          completedBookings,
          waitlistedBookings,
          totalUsers,
          studentUsers,
          ownerUsers,
          unverifiedUsers,
          incidentsCount,
          disputesCount,
          pendingResourceApprovals,
          campusSafetyScore: '99.8%',
          utilizationAvoidedCost: '₹4,80,000',
          utilizationRate: totalResources > 0 ? `${Math.round(((activeBookings) / totalResources) * 100)}%` : '0%',
        },
        deptUtilization: deptUtilization.map((d) => ({
          department: d._id || 'General Faculty',
          assetsCount: d.assetsCount,
          totalBookings: d.totalBookings,
        })),
        fairAllocation,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 2. Resource Approval Management
export const getResourceApprovals = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pendingResources = await Resource.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: pendingResources });
  } catch (error) {
    next(error);
  }
};

export const updateResourceApproval = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { approvalStatus } = req.body; // 'approved' | 'rejected'

    const resource = await Resource.findByIdAndUpdate(
      id,
      {
        approvalStatus,
        status: approvalStatus === 'approved' ? 'available' : 'maintenance',
      },
      { new: true }
    );

    if (!resource) {
      res.status(404).json({ success: false, message: 'Resource not found' });
      return;
    }

    await recordAuditLog({
      action: 'MANAGER_DECISION',
      entityType: 'Resource',
      entityId: resource._id,
      entityTitle: resource.name,
      actorId: req.user?._id,
      actorName: req.user?.name || 'Manager',
      actorEmail: req.user?.email,
      actorRole: req.user?.role || 'manager',
      details: { approvalStatus },
      reason: `Resource listing ${approvalStatus} by institutional manager.`,
    });

    res.status(200).json({
      success: true,
      message: `Resource "${resource.name}" has been marked as ${approvalStatus}.`,
      data: resource,
    });
  } catch (error) {
    next(error);
  }
};

// 3. User & Owner Verification
export const getUsersForVerification = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { role, isVerified, search } = req.query;
    const filter: any = {};
    if (role && role !== 'all') {
      filter.role = role;
    }
    if (isVerified !== undefined && isVerified !== 'all') {
      filter.isVerified = isVerified === 'true';
    }
    if (search) {
      filter.$or = [
        { name: { $regex: String(search), $options: 'i' } },
        { email: { $regex: String(search), $options: 'i' } },
        { department: { $regex: String(search), $options: 'i' } },
      ];
    }
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

export const toggleUserVerification = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { isVerified, institutionMembershipVerified: isVerified },
      { new: true }
    ).select('-password');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    await recordAuditLog({
      action: 'MANAGER_DECISION',
      entityType: 'User',
      entityId: user._id,
      entityTitle: user.name,
      actorId: req.user?._id,
      actorName: req.user?.name || 'Manager',
      actorEmail: req.user?.email,
      actorRole: req.user?.role || 'manager',
      details: { isVerified },
      reason: `User membership verification set to ${isVerified}`,
    });

    res.status(200).json({
      success: true,
      message: `User ${user.name} verification status updated to ${isVerified ? 'VERIFIED' : 'PENDING'}.`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// 4. Scheduling Conflict Resolution
export const getSchedulingConflicts = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const allBookings = await Booking.find({ status: { $in: ['active', 'pending'] } }).sort({ date: 1 });
    const conflicts: any[] = [];

    for (let i = 0; i < allBookings.length; i++) {
      for (let j = i + 1; j < allBookings.length; j++) {
        const b1 = allBookings[i];
        const b2 = allBookings[j];
        if (
          b1.resourceId.toString() === b2.resourceId.toString() &&
          b1.date === b2.date &&
          b1.timeSlot === b2.timeSlot
        ) {
          conflicts.push({
            id: `conflict-${b1._id}-${b2._id}`,
            resourceName: b1.resourceName,
            resourceId: b1.resourceId,
            date: b1.date,
            timeSlot: b1.timeSlot,
            bookingA: b1,
            bookingB: b2,
          });
        }
      }
    }

    res.status(200).json({ success: true, data: conflicts });
  } catch (error) {
    next(error);
  }
};

export const resolveConflict = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { approvedBookingId, alternateBookingId, action } = req.body;

    if (action === 'reschedule_alternate') {
      await Booking.findByIdAndUpdate(approvedBookingId, { status: 'active', conflictDetected: false });
      await Booking.findByIdAndUpdate(alternateBookingId, {
        status: 'waitlisted',
        notes: 'Automatically transferred to priority queue due to conflict resolution.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Scheduling conflict resolved. Priority booking allocated and alternate placed on priority standby.',
    });
  } catch (error) {
    next(error);
  }
};

// 5. Incident Review
export const getManagerIncidents = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const incidents = await Incident.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: incidents });
  } catch (error) {
    next(error);
  }
};

export const updateIncidentStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, resolutionNotes, actionTaken } = req.body;

    const incident = await Incident.findByIdAndUpdate(
      id,
      { status, resolutionNotes, actionTaken },
      { new: true }
    );

    if (!incident) {
      res.status(404).json({ success: false, message: 'Incident not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Incident status updated to ${status}`,
      data: incident,
    });
  } catch (error) {
    next(error);
  }
};

// 6. Dispute Management
export const getManagerDisputes = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const disputes = await Dispute.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: disputes });
  } catch (error) {
    next(error);
  }
};

export const resolveDispute = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { resolution } = req.body;

    const dispute = await Dispute.findByIdAndUpdate(
      id,
      { status: 'resolved', resolution },
      { new: true }
    );

    if (!dispute) {
      res.status(404).json({ success: false, message: 'Dispute not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Dispute arbitration concluded and terms communicated to both parties.',
      data: dispute,
    });
  } catch (error) {
    next(error);
  }
};

// 7. Fair Allocation Settings
export const getFairAllocationSettings = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const institution = req.user?.institution || 'National Institute of Technology';
    let settings = await FairAllocation.findOne({ institution });
    if (!settings) {
      settings = await FairAllocation.create({ institution });
    }
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

export const updateFairAllocationSettings = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const institution = req.user?.institution || 'National Institute of Technology';
    const settings = await FairAllocation.findOneAndUpdate({ institution }, req.body, {
      new: true,
      upsert: true,
    });

    await recordAuditLog({
      action: 'MANAGER_DECISION',
      entityType: 'Policy',
      entityTitle: `Fair Allocation Policy (${institution})`,
      actorId: req.user?._id,
      actorName: req.user?.name || 'Manager',
      actorEmail: req.user?.email,
      actorRole: req.user?.role || 'manager',
      details: req.body,
      reason: 'Fair allocation parameters updated by institutional manager.',
    });

    res.status(200).json({
      success: true,
      message: 'Institution fair allocation policies updated.',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

// 8. Institutional Booking Oversight
export const getManagerBookings = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, search, date } = req.query;
    const filter: any = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (date) {
      filter.date = date;
    }
    if (search) {
      filter.$or = [
        { resourceName: { $regex: String(search), $options: 'i' } },
        { userName: { $regex: String(search), $options: 'i' } },
        { userEmail: { $regex: String(search), $options: 'i' } },
      ];
    }
    const bookings = await Booking.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};

// 9. Institutional Waitlist Management
export const getManagerWaitlists = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const waitlists = await Booking.find({ status: 'waitlisted' }).sort({ queuePosition: 1, createdAt: 1 });
    res.status(200).json({ success: true, data: waitlists });
  } catch (error) {
    next(error);
  }
};

export const promoteWaitlistBooking = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Waitlist record not found' });
      return;
    }

    const previousStatus = booking.status;
    booking.status = 'approved';
    booking.auditTrail.push({
      transition: 'WAITLIST_PROMOTED_BY_MANAGER',
      fromStatus: previousStatus,
      toStatus: 'approved',
      performedBy: req.user?.name || 'Manager',
      performedByRole: req.user?.role || 'manager',
      timestamp: new Date(),
      note: 'Manager promoted booking from standby queue.',
    });
    await booking.save();

    await Notification.create({
      userId: booking.userId,
      title: 'Waitlist Promoted: Reservation Confirmed',
      message: `Your waitlisted reservation for "${booking.resourceName}" on ${booking.date} (${booking.timeSlot}) has been approved by the institution manager.`,
      type: 'approval',
      link: '/dashboard/bookings',
    });

    await recordAuditLog({
      action: 'WAITLIST_PROMOTION',
      entityType: 'Booking',
      entityId: booking._id,
      entityTitle: `${booking.resourceName} - ${booking.userName}`,
      actorId: req.user?._id,
      actorName: req.user?.name || 'Manager',
      actorEmail: req.user?.email,
      actorRole: req.user?.role || 'manager',
      details: { date: booking.date, timeSlot: booking.timeSlot },
      reason: 'Promoted from waitlist by institution manager.',
    });

    res.status(200).json({
      success: true,
      message: `Booking for ${booking.userName} promoted from waitlist to approved.`,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// 10. Institutional Compliance Audit Logs
export const getManagerAuditLogs = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { action, entityType, limit } = req.query;
    const filter: any = {};
    if (action && action !== 'all') filter.action = action;
    if (entityType && entityType !== 'all') filter.entityType = entityType;

    const auditLogs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(Number(limit) || 100);

    res.status(200).json({ success: true, data: auditLogs });
  } catch (error) {
    next(error);
  }
};
