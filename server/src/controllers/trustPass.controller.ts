import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { TrustPassService } from '../services/trustPass.service.js';
import { Booking } from '../models/booking.model.js';
import { Resource } from '../models/resource.model.js';

// 1. Generate or Retrieve TrustPass Token
export const getTrustPassToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { bookingId } = req.params;
    const user = req.user!;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found.' });
      return;
    }

    // Authorization: User must be the borrower, the resource owner, or a manager/admin
    const isBorrower = booking.userId.toString() === user._id.toString();
    const resource = await Resource.findById(booking.resourceId);
    const isOwner = Boolean(resource && resource.ownerId && resource.ownerId.toString() === user._id.toString()) || resource?.ownerEmail === user.email;
    const isAuthorized = isBorrower || isOwner || user.role === 'admin' || user.role === 'manager';

    if (!isAuthorized) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to access the TrustPass for this booking.',
      });
      return;
    }

    // Return existing token if valid and unexpired, otherwise generate fresh token
    if (
      booking.trustPassToken &&
      booking.trustPassToken.isValid &&
      booking.trustPassToken.expiresAt &&
      new Date() < new Date(booking.trustPassToken.expiresAt)
    ) {
      res.status(200).json({
        success: true,
        data: {
          token: booking.trustPassToken.token,
          qrPayload: booking.trustPassToken.qrPayload,
          expiresAt: booking.trustPassToken.expiresAt,
          status: booking.status,
          bookingId: booking._id,
        },
      });
      return;
    }

    const pass = await TrustPassService.generatePassToken(booking._id);

    res.status(200).json({
      success: true,
      message: 'TrustPass access token generated securely.',
      data: {
        ...pass,
        status: booking.status,
        bookingId: booking._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 2. Scan or Verify TrustPass Token
export const verifyTrustPass = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.body;
    if (!token || !token.trim()) {
      res.status(400).json({
        success: false,
        message: 'TrustPass token, QR code payload, or reservation ID is required.',
      });
      return;
    }

    const verification = await TrustPassService.verifyPassToken(token.trim(), req.user as any);

    res.status(200).json({
      success: true,
      message: 'TrustPass verified successfully against institutional ledger.',
      data: verification,
    });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }
    next(error);
  }
};

// 3. Confirm Handover Check-In
export const checkInTrustPass = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { bookingId, conditionNotes, meterReading, cleanliness, operationalStatus, photos } = req.body;
    if (!bookingId) {
      res.status(400).json({ success: false, message: 'Booking ID is required.' });
      return;
    }

    const booking = await TrustPassService.checkIn(
      {
        bookingId,
        conditionNotes,
        meterReading,
        cleanliness,
        operationalStatus,
        photos,
      },
      req.user as any
    );

    res.status(200).json({
      success: true,
      message: `Equipment handover confirmed. Session started for ${booking.userName}.`,
      data: booking,
    });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }
    next(error);
  }
};

// 4. Confirm Return Check-Out
export const checkOutTrustPass = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { bookingId, conditionNotes, meterReading, cleanliness, operationalStatus, photos } = req.body;
    if (!bookingId) {
      res.status(400).json({ success: false, message: 'Booking ID is required.' });
      return;
    }

    const { booking, overdueMinutes } = await TrustPassService.checkOut(
      {
        bookingId,
        conditionNotes,
        meterReading,
        cleanliness,
        operationalStatus,
        photos,
      },
      req.user as any
    );

    res.status(200).json({
      success: true,
      message: overdueMinutes > 0
        ? `Equipment return verified with ${overdueMinutes}m overtime. Session completed.`
        : `Equipment return verified in optimal condition. Session successfully closed.`,
      data: {
        booking,
        overdueMinutes,
      },
    });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }
    next(error);
  }
};

// 5. Complete TrustPass Transaction History
export const getTrustPassHistory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        bookingId: booking._id,
        resourceName: booking.resourceName,
        userName: booking.userName,
        status: booking.status,
        date: booking.date,
        timeSlot: booking.timeSlot,
        scheduledStart: booking.startTime,
        scheduledEnd: booking.endTime,
        checkedIn: booking.checkedIn,
        checkedInAt: booking.checkedInAt,
        handoverOfficer: booking.handoverOfficer,
        initialCondition: booking.initialCondition,
        checkedOut: booking.checkedOut,
        checkedOutAt: booking.checkedOutAt,
        returnOfficer: booking.returnOfficer,
        returnCondition: booking.returnCondition,
        isOverdue: booking.isOverdue,
        overdueMinutes: booking.overdueMinutes,
        auditTrail: booking.auditTrail,
        trustPassToken: {
          token: booking.trustPassToken?.token,
          expiresAt: booking.trustPassToken?.expiresAt,
          isValid: booking.trustPassToken?.isValid,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
