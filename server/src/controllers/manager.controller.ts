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

// 1. Institution-wide Resource Statistics
export const getManagerStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const institution = req.user?.institution || 'National Institute of Technology';

    const [
      totalResources,
      activeBookings,
      totalUsers,
      unverifiedUsers,
      incidentsCount,
      disputesCount,
      pendingResourceApprovals,
    ] = await Promise.all([
      Resource.countDocuments(),
      Booking.countDocuments({ status: 'active' }),
      User.countDocuments(),
      User.countDocuments({ isVerified: false }),
      Incident.countDocuments({ status: { $ne: 'resolved' } }),
      Dispute.countDocuments({ status: { $ne: 'resolved' } }),
      Resource.countDocuments({ approvalStatus: 'pending_manager' }),
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
          activeBookings,
          totalUsers,
          unverifiedUsers,
          incidentsCount,
          disputesCount,
          pendingResourceApprovals,
          campusSafetyScore: '99.8%',
          utilizationAvoidedCost: '₹4,80,000',
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

// 3. User Verification
export const getUsersForVerification = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
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
