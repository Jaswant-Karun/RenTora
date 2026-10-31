"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrustPassService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const mongoose_1 = require("mongoose");
const booking_model_js_1 = require("../models/booking.model.js");
const resource_model_js_1 = require("../models/resource.model.js");
const conditionReport_model_js_1 = require("../models/conditionReport.model.js");
const notification_model_js_1 = require("../models/notification.model.js");
const auditLogger_js_1 = require("../utils/auditLogger.js");
const fairShare_service_js_1 = require("./fairShare.service.js");
/**
 * TrustPass - Secure Resource Check-in and Check-out Engine
 */
class TrustPassService {
    /**
     * Generates a high-entropy, difficult-to-guess digital TrustPass token for an approved booking.
     * Does NOT leak any private PII inside the QR payload.
     */
    static async generatePassToken(bookingId) {
        const booking = await booking_model_js_1.Booking.findById(bookingId);
        if (!booking) {
            throw new Error('Booking not found');
        }
        if (booking.status !== 'approved' && booking.status !== 'active' && booking.status !== 'checked_in') {
            throw new Error(`TrustPass cannot be issued for bookings in status: "${booking.status}". Only approved reservations qualify.`);
        }
        // Generate cryptographic 24-byte hex token (48 chars, > 192 bits entropy)
        const randomHex = crypto_1.default.randomBytes(24).toString('hex');
        const token = `TP-${randomHex.toUpperCase()}`;
        // Token expires 24 hours after reservation end time
        const bookingEnd = booking.endTime ? new Date(booking.endTime) : new Date(Date.now() + 24 * 60 * 60 * 1000);
        const expiresAt = new Date(bookingEnd.getTime() + 24 * 60 * 60 * 1000);
        // Opaque payload for QR representation - zero PII leaked
        const qrPayload = JSON.stringify({
            t: token,
            b: booking._id.toString(),
            v: 1,
        });
        booking.trustPassToken = {
            token,
            qrPayload,
            generatedAt: new Date(),
            expiresAt,
            isValid: true,
        };
        await booking.save();
        return { token, qrPayload, expiresAt };
    }
    /**
     * Verifies and resolves a TrustPass token or QR code payload on the backend.
     * Enforces validity, expiration, active status, and custodian RBAC.
     */
    static async verifyPassToken(tokenStringOrQr, custodianUser) {
        if (!tokenStringOrQr || !tokenStringOrQr.trim()) {
            throw new Error('TrustPass token or QR payload is required for verification.');
        }
        let parsedToken = tokenStringOrQr.trim();
        let explicitBookingId = null;
        // Support JSON QR payload parsing
        if (parsedToken.startsWith('{') && parsedToken.endsWith('}')) {
            try {
                const json = JSON.parse(parsedToken);
                if (json.t)
                    parsedToken = json.t;
                if (json.b)
                    explicitBookingId = json.b;
            }
            catch {
                // Fall back to raw string
            }
        }
        // Find booking by trustPassToken.token or by ID fallback
        let booking = null;
        if (explicitBookingId && mongoose_1.Types.ObjectId.isValid(explicitBookingId)) {
            booking = await booking_model_js_1.Booking.findById(explicitBookingId);
        }
        if (!booking) {
            booking = await booking_model_js_1.Booking.findOne({ 'trustPassToken.token': parsedToken });
        }
        // Fallback search by ID if raw ID was provided
        if (!booking && mongoose_1.Types.ObjectId.isValid(parsedToken)) {
            booking = await booking_model_js_1.Booking.findById(parsedToken);
        }
        if (!booking) {
            const error = new Error('Invalid or unrecognized TrustPass token. No matching institutional reservation found.');
            error.statusCode = 404;
            throw error;
        }
        // Check token expiration
        const now = new Date();
        if (booking.trustPassToken?.expiresAt && now > booking.trustPassToken.expiresAt) {
            const error = new Error('This TrustPass has expired. Handover window has lapsed.');
            error.statusCode = 410;
            throw error;
        }
        // Check token invalidation
        if (booking.trustPassToken && booking.trustPassToken.isValid === false) {
            const error = new Error('This TrustPass has already been consumed and invalidated.');
            error.statusCode = 400;
            throw error;
        }
        // Check booking status
        if (booking.status === 'completed') {
            const error = new Error('This reservation is already finalized and checked out. Duplicate processing is disallowed.');
            error.statusCode = 400;
            throw error;
        }
        if (booking.status === 'cancelled' || booking.status === 'rejected') {
            const error = new Error(`Cannot verify pass for a ${booking.status} reservation.`);
            error.statusCode = 400;
            throw error;
        }
        // Enforce Facility Custodian / Resource Owner Authorization
        const resource = await resource_model_js_1.Resource.findById(booking.resourceId);
        if (!resource) {
            throw new Error('Resource associated with this reservation no longer exists.');
        }
        const isOwner = Boolean(resource.ownerId && resource.ownerId.toString() === custodianUser._id.toString()) ||
            resource.ownerEmail === custodianUser.email;
        const isSupervisor = booking.supervisorName === custodianUser.name;
        const isAuthorized = isOwner || isSupervisor || custodianUser.role === 'admin' || custodianUser.role === 'manager';
        if (!isAuthorized) {
            const error = new Error('Forbidden: You do not have custodian permissions to scan or verify passes for equipment belonging to another lab owner or institution.');
            error.statusCode = 403;
            throw error;
        }
        // Determine pending action
        let actionAllowed = 'check_in';
        if (booking.checkedIn || booking.status === 'checked_in' || booking.status === 'return_pending') {
            actionAllowed = 'check_out';
        }
        // Calculate overdue duration if applicable
        const scheduledEnd = booking.endTime ? new Date(booking.endTime) : new Date();
        let isOverdue = false;
        let overdueMinutes = 0;
        if (actionAllowed === 'check_out' && now > scheduledEnd) {
            isOverdue = true;
            overdueMinutes = Math.round((now.getTime() - scheduledEnd.getTime()) / (1000 * 60));
        }
        return {
            valid: true,
            actionAllowed,
            booking,
            resource,
            overdue: {
                isOverdue,
                overdueMinutes,
                scheduledEndTime: scheduledEnd,
            },
            tokenInfo: {
                token: booking.trustPassToken?.token || parsedToken,
                expiresAt: booking.trustPassToken?.expiresAt || scheduledEnd,
                isValid: booking.trustPassToken?.isValid ?? true,
            },
        };
    }
    /**
     * Executes verified handover Check-In with condition report and optional photos.
     */
    static async checkIn(input, custodianUser) {
        const { bookingId, conditionNotes, meterReading, cleanliness, operationalStatus, photos } = input;
        const booking = await booking_model_js_1.Booking.findById(bookingId);
        if (!booking) {
            const error = new Error('Booking record not found.');
            error.statusCode = 404;
            throw error;
        }
        // Prevent duplicate check-in
        if (booking.checkedIn || booking.status === 'checked_in') {
            const error = new Error('Duplicate Check-in Rejected: Equipment has already been checked in for this reservation.');
            error.statusCode = 400;
            throw error;
        }
        if (booking.status !== 'approved' && booking.status !== 'active') {
            const error = new Error(`Cannot check in booking in status: "${booking.status}". Only approved reservations qualify.`);
            error.statusCode = 400;
            throw error;
        }
        // Authorize custodian
        const resource = await resource_model_js_1.Resource.findById(booking.resourceId);
        const isOwner = Boolean(resource && resource.ownerId && resource.ownerId.toString() === custodianUser._id.toString()) ||
            resource?.ownerEmail === custodianUser.email;
        const isSupervisor = booking.supervisorName === custodianUser.name;
        const isAuthorized = isOwner || isSupervisor || custodianUser.role === 'admin' || custodianUser.role === 'manager';
        if (!isAuthorized) {
            const error = new Error('Forbidden: Unauthorized to execute check-in for this equipment.');
            error.statusCode = 403;
            throw error;
        }
        const previousStatus = booking.status;
        const checkInTime = new Date();
        const snapshot = {
            conditionNotes: conditionNotes || 'Equipment handed over in verified operational condition.',
            meterReading: meterReading || '0',
            cleanliness: cleanliness || 'passed',
            operationalStatus: operationalStatus || 'optimal',
            photos: Array.isArray(photos) ? photos : [],
            userConfirmation: true,
            ownerConfirmation: true,
            recordedBy: custodianUser.name,
            recordedAt: checkInTime,
        };
        booking.checkedIn = true;
        booking.checkedInAt = checkInTime;
        booking.status = 'checked_in';
        booking.isOverdue = false;
        booking.initialCondition = snapshot;
        booking.handoverOfficer = {
            id: custodianUser._id,
            name: custodianUser.name,
            role: custodianUser.role,
        };
        booking.auditTrail.push({
            transition: 'TRUSTPASS_CHECK_IN_CONFIRMED',
            fromStatus: previousStatus,
            toStatus: 'checked_in',
            performedBy: custodianUser.name,
            performedByRole: custodianUser.role,
            timestamp: checkInTime,
            note: `TrustPass Handover verified. Condition: ${snapshot.operationalStatus}. Cleanliness: ${snapshot.cleanliness}. Officer: ${custodianUser.name}`,
        });
        await booking.save();
        // Mark physical resource as in_use
        if (resource) {
            resource.status = 'in_use';
            await resource.save();
        }
        // Persist formal condition report
        await conditionReport_model_js_1.ConditionReport.create({
            resourceId: booking.resourceId,
            resourceName: booking.resourceName,
            bookingId: booking._id,
            inspectorName: custodianUser.name,
            inspectorRole: custodianUser.role,
            type: 'check_in',
            operationalStatus: snapshot.operationalStatus,
            cleanliness: snapshot.cleanliness,
            meterReading: snapshot.meterReading,
            observations: snapshot.conditionNotes,
            photos: snapshot.photos,
        });
        // Central Audit Log
        await (0, auditLogger_js_1.recordAuditLog)({
            action: 'CHECK_IN',
            entityType: 'Booking',
            entityId: booking._id?.toString(),
            entityTitle: `${booking.resourceName} - ${booking.userName}`,
            actorId: custodianUser._id,
            actorName: custodianUser.name,
            actorEmail: custodianUser.email,
            actorRole: custodianUser.role,
            details: {
                bookingId: booking._id,
                checkInTime,
                condition: snapshot.operationalStatus,
                cleanliness: snapshot.cleanliness,
                meterReading: snapshot.meterReading,
                hasPhotos: snapshot.photos?.length || 0,
            },
            reason: 'Physical handover confirmed via TrustPass verification.',
        });
        // Notify Borrower
        await notification_model_js_1.Notification.create({
            userId: booking.userId,
            title: 'TrustPass Handover Confirmed!',
            message: `Your session for "${booking.resourceName}" has commenced. Equipment verified and handed over by ${custodianUser.name}.`,
            type: 'booking_confirmed',
            link: '/dashboard/bookings',
            metadata: { bookingId: booking._id, stage: 'check_in' },
        });
        return booking;
    }
    /**
     * Executes verified return Check-Out with final condition inspection, overdue computation, and pass token invalidation.
     */
    static async checkOut(input, custodianUser) {
        const { bookingId, conditionNotes, meterReading, cleanliness, operationalStatus, photos } = input;
        const booking = await booking_model_js_1.Booking.findById(bookingId);
        if (!booking) {
            const error = new Error('Booking record not found.');
            error.statusCode = 404;
            throw error;
        }
        // Disallow check-out if not checked in
        if (!booking.checkedIn && booking.status !== 'checked_in' && booking.status !== 'return_pending') {
            const error = new Error(`Cannot check out: Booking is currently in "${booking.status}" status (must be active/checked-in).`);
            error.statusCode = 400;
            throw error;
        }
        // Prevent duplicate check-out
        if (booking.checkedOut || booking.status === 'completed') {
            const error = new Error('Duplicate Return Rejected: Booking has already completed and checked out.');
            error.statusCode = 400;
            throw error;
        }
        // Authorize custodian
        const resource = await resource_model_js_1.Resource.findById(booking.resourceId);
        const isOwner = Boolean(resource && resource.ownerId && resource.ownerId.toString() === custodianUser._id.toString()) ||
            resource?.ownerEmail === custodianUser.email;
        const isSupervisor = booking.supervisorName === custodianUser.name;
        const isAuthorized = isOwner || isSupervisor || custodianUser.role === 'admin' || custodianUser.role === 'manager';
        if (!isAuthorized) {
            const error = new Error('Forbidden: Unauthorized to execute return check-out for this equipment.');
            error.statusCode = 403;
            throw error;
        }
        const previousStatus = booking.status;
        const returnTime = new Date();
        // Calculate overdue duration
        const scheduledEnd = booking.endTime ? new Date(booking.endTime) : returnTime;
        let overdueMinutes = 0;
        if (returnTime > scheduledEnd) {
            overdueMinutes = Math.round((returnTime.getTime() - scheduledEnd.getTime()) / (1000 * 60));
        }
        const snapshot = {
            conditionNotes: conditionNotes || 'Equipment returned and inspected.',
            meterReading: meterReading || '0',
            cleanliness: cleanliness || 'passed',
            operationalStatus: operationalStatus || 'optimal',
            photos: Array.isArray(photos) ? photos : [],
            userConfirmation: true,
            ownerConfirmation: true,
            recordedBy: custodianUser.name,
            recordedAt: returnTime,
        };
        booking.checkedOut = true;
        booking.checkedOutAt = returnTime;
        booking.status = 'completed';
        booking.isOverdue = overdueMinutes > 0;
        booking.overdueMinutes = overdueMinutes;
        booking.returnCondition = snapshot;
        booking.conditionOnCheckout = conditionNotes || 'Satisfactory';
        booking.returnOfficer = {
            id: custodianUser._id,
            name: custodianUser.name,
            role: custodianUser.role,
        };
        // Invalidate TrustPass token - prevent reuse
        if (booking.trustPassToken) {
            booking.trustPassToken.isValid = false;
        }
        booking.auditTrail.push({
            transition: 'TRUSTPASS_CHECK_OUT_CONFIRMED',
            fromStatus: previousStatus,
            toStatus: 'completed',
            performedBy: custodianUser.name,
            performedByRole: custodianUser.role,
            timestamp: returnTime,
            note: `TrustPass Return finalized. Condition: ${snapshot.operationalStatus}. Cleanliness: ${snapshot.cleanliness}. Overdue: ${overdueMinutes}m. Officer: ${custodianUser.name}`,
        });
        await booking.save();
        // Restore physical resource to available status
        if (resource) {
            resource.status = 'available';
            await resource.save();
        }
        // Persist formal return condition report
        await conditionReport_model_js_1.ConditionReport.create({
            resourceId: booking.resourceId,
            resourceName: booking.resourceName,
            bookingId: booking._id,
            inspectorName: custodianUser.name,
            inspectorRole: custodianUser.role,
            type: 'return',
            operationalStatus: snapshot.operationalStatus,
            cleanliness: snapshot.cleanliness,
            meterReading: snapshot.meterReading,
            observations: snapshot.conditionNotes,
            photos: snapshot.photos,
        });
        // Central Audit Log
        await (0, auditLogger_js_1.recordAuditLog)({
            action: 'CHECK_OUT',
            entityType: 'Booking',
            entityId: booking._id?.toString(),
            entityTitle: `${booking.resourceName} - ${booking.userName}`,
            actorId: custodianUser._id,
            actorName: custodianUser.name,
            actorEmail: custodianUser.email,
            actorRole: custodianUser.role,
            details: {
                bookingId: booking._id,
                returnTime,
                scheduledEnd,
                isOverdue: overdueMinutes > 0,
                overdueMinutes,
                condition: snapshot.operationalStatus,
                cleanliness: snapshot.cleanliness,
                hasPhotos: snapshot.photos?.length || 0,
            },
            reason: overdueMinutes > 0
                ? `Return completed with ${overdueMinutes} minutes overtime.`
                : 'Return successfully finalized within scheduled booking window.',
        });
        // Advance FairShare waiting list and notify next eligible user!
        await fairShare_service_js_1.FairShareService.advanceWaitlist(booking.resourceId, booking.date, booking.timeSlot, booking._id?.toString());
        // Notify Borrower
        await notification_model_js_1.Notification.create({
            userId: booking.userId,
            title: 'TrustPass Return Completed',
            message: `Your return of "${booking.resourceName}" was inspected and signed off by ${custodianUser.name}. Thank you for maintaining campus equipment!`,
            type: 'booking',
            link: '/dashboard/bookings',
            metadata: { bookingId: booking._id, stage: 'check_out', overdueMinutes },
        });
        return { booking, overdueMinutes };
    }
}
exports.TrustPassService = TrustPassService;
