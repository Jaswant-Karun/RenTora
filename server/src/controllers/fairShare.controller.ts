import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { FairShareService } from '../services/fairShare.service.js';
import { FairShareDecision } from '../models/fairShareDecision.model.js';
import { FairAllocation } from '../models/fairAllocation.model.js';
import { Booking } from '../models/booking.model.js';
import { recordAuditLog } from '../utils/auditLogger.js';

// 1. Transparent Pre-Evaluation Endpoint
export const evaluateFairShare = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { resourceId, date, timeSlot, startTime, endTime } = req.body;
    if (!resourceId || !date || !timeSlot) {
      res.status(400).json({
        success: false,
        message: 'Resource ID, date, and timeslot are required for FairShare evaluation.',
      });
      return;
    }

    const evaluation = await FairShareService.evaluateAllocation({
      userId: req.user!._id,
      resourceId,
      date,
      timeSlot,
      startTime,
      endTime,
    });

    res.status(200).json({
      success: true,
      data: evaluation,
    });
  } catch (error) {
    next(error);
  }
};

// 2. FairShare Decision History (For authorized managers & users)
export const getFairShareHistory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { decision, resourceId, search, limit = '50', page = '1' } = req.query;
    const query: any = {};

    // Students only view their own allocation evaluations; managers and owners view institution records
    if (req.user?.role === 'student') {
      query.userId = req.user._id;
    } else if (req.user?.role === 'manager' || req.user?.role === 'admin') {
      if (req.user.institution) {
        query.institution = req.user.institution;
      }
    }

    if (decision && typeof decision === 'string') {
      query.finalDecision = decision.toUpperCase();
    }

    if (resourceId && typeof resourceId === 'string') {
      query.resourceId = resourceId;
    }

    if (search && typeof search === 'string') {
      query.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { resourceName: { $regex: search, $options: 'i' } },
        { reason: { $regex: search, $options: 'i' } },
      ];
    }

    const pageSize = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const pageNum = Math.max(1, parseInt(page as string, 10));

    const [decisions, totalCount] = await Promise.all([
      FairShareDecision.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize),
      FairShareDecision.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        decisions,
        pagination: {
          total: totalCount,
          page: pageNum,
          pageSize,
          pages: Math.ceil(totalCount / pageSize),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get Institutional FairShare Allocation Policy
export const getFairSharePolicy = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const institution = req.user?.institution || 'Apex Institute of Technology';
    const policy = await FairShareService.getPolicy(institution);
    res.status(200).json({
      success: true,
      data: policy,
    });
  } catch (error) {
    next(error);
  }
};

// 4. Update Institutional FairShare Allocation Policy (Managers & Admins only)
export const updateFairSharePolicy = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const institution = req.user?.institution || 'Apex Institute of Technology';
    const updated = await FairAllocation.findOneAndUpdate(
      { institution },
      { ...req.body, institution },
      { new: true, upsert: true }
    );

    await recordAuditLog({
      action: 'MANAGER_DECISION',
      entityType: 'Policy',
      entityTitle: `FairShare Allocation Policy (${institution})`,
      actorId: req.user?._id,
      actorName: req.user?.name || 'Manager',
      actorEmail: req.user?.email,
      actorRole: req.user?.role || 'manager',
      details: req.body,
      reason: 'Institutional FairShare resource allocation limits and priority scoring modified.',
    });

    res.status(200).json({
      success: true,
      message: 'Institutional FairShare allocation policy updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// 5. Manager Override with Mandatory Reason
export const managerOverrideAllocation = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason, action = 'approve' } = req.body;

    if (!reason || !reason.trim()) {
      res.status(400).json({
        success: false,
        message: 'A mandatory operational justification is required for manager override.',
      });
      return;
    }

    const bookingId = Array.isArray(id) ? id[0] : id;
    const overriddenBooking = await FairShareService.managerOverride(
      bookingId,
      req.user as any,
      reason.trim(),
      action
    );

    res.status(200).json({
      success: true,
      message: `Allocation decision overridden to ${overriddenBooking.status} by institutional manager.`,
      data: overriddenBooking,
    });
  } catch (error) {
    next(error);
  }
};

// 6. Transparent Resource Waiting List with Queue Positions
export const getResourceWaitlist = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { resourceId } = req.params;
    const resId = Array.isArray(resourceId) ? resourceId[0] : resourceId;
    const waitlist = await Booking.find({
      resourceId: resId,
      status: 'waitlisted',
    }).sort({ waitlistPriority: -1, createdAt: 1 });

    const enrichedWaitlist = waitlist.map((b, index) => ({
      ...b.toObject(),
      queuePosition: index + 1,
      estimatedAvailability: b.estimatedReleaseTime,
    }));

    res.status(200).json({
      success: true,
      data: enrichedWaitlist,
    });
  } catch (error) {
    next(error);
  }
};
