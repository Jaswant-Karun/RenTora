import { Response, NextFunction } from 'express';
import { Booking } from '../models/booking.model.js';
import { Resource } from '../models/resource.model.js';
import { Notification } from '../models/notification.model.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export const getMyBookings = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { status } = req.query;
    const query: any = {};

    // If student/researcher, only their own bookings.
    // If owner/manager/admin, they can query by role or all
    if (req.user.role === 'student') {
      query.userId = req.user._id;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const bookings = await Booking.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

export const createBooking = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { resourceId, date, timeSlot, purpose, supervisorName, notes } = req.body;

    if (!resourceId || !date || !timeSlot || !purpose) {
      res.status(400).json({
        success: false,
        message: 'Resource ID, date, timeslot, and purpose of reservation are required.',
      });
      return;
    }

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      res.status(404).json({ success: false, message: 'Resource not found' });
      return;
    }

    // Determine initial status: if approval required, status is 'pending', else 'active'
    const status = resource.approvalRequired ? 'pending' : 'active';

    const booking = await Booking.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      userDepartment: req.user.department,
      userInstitution: req.user.institution,
      resourceId: resource._id,
      resourceName: resource.name,
      resourceCategory: resource.category,
      resourceLocation: resource.location,
      resourceImage: resource.images?.[0] || '',
      date,
      timeSlot,
      purpose,
      supervisorName: supervisorName || 'Faculty Sponsor',
      status,
      notes,
    });

    // Increment resource booking count
    await Resource.findByIdAndUpdate(resource._id, { $inc: { totalBookings: 1 } });

    // Create system notification
    await Notification.create({
      userId: req.user._id,
      title: status === 'active' ? 'Booking Confirmed' : 'Reservation Submitted for Approval',
      message: `Your booking request for "${resource.name}" on ${date} (${timeSlot}) has been ${status === 'active' ? 'confirmed' : 'forwarded to the lab in-charge'}.`,
      type: 'booking',
      link: '/dashboard/bookings',
    });

    res.status(201).json({
      success: true,
      message:
        status === 'active'
          ? 'Booking confirmed instantly!'
          : 'Booking request registered and awaiting institutional endorsement.',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

export const updateBookingStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'pending', 'completed', 'cancelled'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid booking status' });
      return;
    }

    const booking = await Booking.findByIdAndUpdate(id, { status }, { new: true });
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    // Notify user
    await Notification.create({
      userId: booking.userId,
      title: `Booking Status: ${status.toUpperCase()}`,
      message: `Your reservation for "${booking.resourceName}" is now marked as ${status}.`,
      type: 'booking',
    });

    res.status(200).json({
      success: true,
      message: `Booking status updated to ${status}`,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};
