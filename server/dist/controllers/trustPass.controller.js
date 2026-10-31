"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrustPassHistory = exports.checkOutTrustPass = exports.checkInTrustPass = exports.verifyTrustPass = exports.getTrustPassToken = void 0;
const trustPass_service_js_1 = require("../services/trustPass.service.js");
const booking_model_js_1 = require("../models/booking.model.js");
const resource_model_js_1 = require("../models/resource.model.js");
// 1. Generate or Retrieve TrustPass Token
const getTrustPassToken = async (req, res, next) => {
    try {
        const { bookingId } = req.params;
        const user = req.user;
        const booking = await booking_model_js_1.Booking.findById(bookingId);
        if (!booking) {
            res.status(404).json({ success: false, message: 'Booking not found.' });
            return;
        }
        // Authorization: User must be the borrower, the resource owner, or a manager/admin
        const isBorrower = booking.userId.toString() === user._id.toString();
        const resource = await resource_model_js_1.Resource.findById(booking.resourceId);
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
        if (booking.trustPassToken &&
            booking.trustPassToken.isValid &&
            booking.trustPassToken.expiresAt &&
            new Date() < new Date(booking.trustPassToken.expiresAt)) {
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
        const pass = await trustPass_service_js_1.TrustPassService.generatePassToken(booking._id);
        res.status(200).json({
            success: true,
            message: 'TrustPass access token generated securely.',
            data: {
                ...pass,
                status: booking.status,
                bookingId: booking._id,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getTrustPassToken = getTrustPassToken;
// 2. Scan or Verify TrustPass Token
const verifyTrustPass = async (req, res, next) => {
    try {
        const { token } = req.body;
        if (!token || !token.trim()) {
            res.status(400).json({
                success: false,
                message: 'TrustPass token, QR code payload, or reservation ID is required.',
            });
            return;
        }
        const verification = await trustPass_service_js_1.TrustPassService.verifyPassToken(token.trim(), req.user);
        res.status(200).json({
            success: true,
            message: 'TrustPass verified successfully against institutional ledger.',
            data: verification,
        });
    }
    catch (error) {
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
exports.verifyTrustPass = verifyTrustPass;
// 3. Confirm Handover Check-In
const checkInTrustPass = async (req, res, next) => {
    try {
        const { bookingId, conditionNotes, meterReading, cleanliness, operationalStatus, photos } = req.body;
        if (!bookingId) {
            res.status(400).json({ success: false, message: 'Booking ID is required.' });
            return;
        }
        const booking = await trustPass_service_js_1.TrustPassService.checkIn({
            bookingId,
            conditionNotes,
            meterReading,
            cleanliness,
            operationalStatus,
            photos,
        }, req.user);
        res.status(200).json({
            success: true,
            message: `Equipment handover confirmed. Session started for ${booking.userName}.`,
            data: booking,
        });
    }
    catch (error) {
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
exports.checkInTrustPass = checkInTrustPass;
// 4. Confirm Return Check-Out
const checkOutTrustPass = async (req, res, next) => {
    try {
        const { bookingId, conditionNotes, meterReading, cleanliness, operationalStatus, photos } = req.body;
        if (!bookingId) {
            res.status(400).json({ success: false, message: 'Booking ID is required.' });
            return;
        }
        const { booking, overdueMinutes } = await trustPass_service_js_1.TrustPassService.checkOut({
            bookingId,
            conditionNotes,
            meterReading,
            cleanliness,
            operationalStatus,
            photos,
        }, req.user);
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
    }
    catch (error) {
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
exports.checkOutTrustPass = checkOutTrustPass;
// 5. Complete TrustPass Transaction History
const getTrustPassHistory = async (req, res, next) => {
    try {
        const { bookingId } = req.params;
        const booking = await booking_model_js_1.Booking.findById(bookingId);
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
    }
    catch (error) {
        next(error);
    }
};
exports.getTrustPassHistory = getTrustPassHistory;
