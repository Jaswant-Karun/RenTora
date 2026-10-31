import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { ConditionGuardService } from '../services/conditionGuard.service.js';
import { ConditionReport } from '../models/conditionReport.model.js';
import { Booking } from '../models/booking.model.js';

export const recordBeforeCheckIn = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      bookingId,
      operationalStatus,
      cleanliness,
      meterReading,
      existingDamage,
      conditionNotes,
      observations,
      photos,
      userConfirmation,
    } = req.body;

    if (!bookingId) {
      res.status(400).json({ success: false, message: 'bookingId is required.' });
      return;
    }

    const report = await ConditionGuardService.recordBeforeCheckIn(
      {
        bookingId,
        operationalStatus,
        cleanliness,
        meterReading,
        existingDamage,
        conditionNotes,
        observations,
        photos,
        userConfirmation,
      },
      {
        id: req.user!._id,
        name: req.user!.name,
        email: req.user!.email,
        role: req.user!.role,
      }
    );

    res.status(201).json({
      success: true,
      message: 'Before check-in condition report and baseline recorded successfully.',
      data: report,
    });
  } catch (error: any) {
    next(error);
  }
};

export const recordAfterCheckOut = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      bookingId,
      operationalStatus,
      cleanliness,
      meterReading,
      conditionNotes,
      observations,
      photos,
      userConfirmation,
    } = req.body;

    if (!bookingId) {
      res.status(400).json({ success: false, message: 'bookingId is required.' });
      return;
    }

    const result = await ConditionGuardService.recordAfterCheckOut(
      {
        bookingId,
        operationalStatus,
        cleanliness,
        meterReading,
        conditionNotes,
        observations,
        photos,
        userConfirmation,
      },
      {
        id: req.user!._id,
        name: req.user!.name,
        email: req.user!.email,
        role: req.user!.role,
      }
    );

    res.status(201).json({
      success: true,
      message: 'After check-out condition report recorded and comparative analysis generated.',
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

export const getComparison = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { bookingId } = req.params;
    if (!bookingId) {
      res.status(400).json({ success: false, message: 'bookingId is required.' });
      return;
    }

    const comparison = await ConditionGuardService.compareConditionReports(bookingId);

    res.status(200).json({
      success: true,
      data: comparison,
    });
  } catch (error: any) {
    next(error);
  }
};

export const getConditionReports = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { resourceId, bookingId, type, limit = 50 } = req.query;
    const query: any = {};

    if (resourceId) query.resourceId = resourceId;
    if (bookingId) query.bookingId = bookingId;
    if (type) query.type = type;

    // Student role only sees reports for their own bookings
    if (req.user?.role === 'student') {
      const userBookings = await Booking.find({ userId: req.user._id }).select('_id');
      const bookingIds = userBookings.map((b) => b._id);
      query.$or = [{ responsibleUserId: req.user._id }, { bookingId: { $in: bookingIds } }];
    }

    const reports = await ConditionReport.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error: any) {
    next(error);
  }
};
