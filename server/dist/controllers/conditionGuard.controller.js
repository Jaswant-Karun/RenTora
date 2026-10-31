"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConditionReports = exports.getComparison = exports.recordAfterCheckOut = exports.recordBeforeCheckIn = void 0;
const conditionGuard_service_js_1 = require("../services/conditionGuard.service.js");
const conditionReport_model_js_1 = require("../models/conditionReport.model.js");
const booking_model_js_1 = require("../models/booking.model.js");
const recordBeforeCheckIn = async (req, res, next) => {
    try {
        const { bookingId, operationalStatus, cleanliness, meterReading, existingDamage, conditionNotes, observations, photos, userConfirmation, } = req.body;
        if (!bookingId) {
            res.status(400).json({ success: false, message: 'bookingId is required.' });
            return;
        }
        const report = await conditionGuard_service_js_1.ConditionGuardService.recordBeforeCheckIn({
            bookingId,
            operationalStatus,
            cleanliness,
            meterReading,
            existingDamage,
            conditionNotes,
            observations,
            photos,
            userConfirmation,
        }, {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
        });
        res.status(201).json({
            success: true,
            message: 'Before check-in condition report and baseline recorded successfully.',
            data: report,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.recordBeforeCheckIn = recordBeforeCheckIn;
const recordAfterCheckOut = async (req, res, next) => {
    try {
        const { bookingId, operationalStatus, cleanliness, meterReading, conditionNotes, observations, photos, userConfirmation, } = req.body;
        if (!bookingId) {
            res.status(400).json({ success: false, message: 'bookingId is required.' });
            return;
        }
        const result = await conditionGuard_service_js_1.ConditionGuardService.recordAfterCheckOut({
            bookingId,
            operationalStatus,
            cleanliness,
            meterReading,
            conditionNotes,
            observations,
            photos,
            userConfirmation,
        }, {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
        });
        res.status(201).json({
            success: true,
            message: 'After check-out condition report recorded and comparative analysis generated.',
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.recordAfterCheckOut = recordAfterCheckOut;
const getComparison = async (req, res, next) => {
    try {
        const { bookingId } = req.params;
        if (!bookingId) {
            res.status(400).json({ success: false, message: 'bookingId is required.' });
            return;
        }
        const comparison = await conditionGuard_service_js_1.ConditionGuardService.compareConditionReports(bookingId);
        res.status(200).json({
            success: true,
            data: comparison,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getComparison = getComparison;
const getConditionReports = async (req, res, next) => {
    try {
        const { resourceId, bookingId, type, limit = 50 } = req.query;
        const query = {};
        if (resourceId)
            query.resourceId = resourceId;
        if (bookingId)
            query.bookingId = bookingId;
        if (type)
            query.type = type;
        // Student role only sees reports for their own bookings
        if (req.user?.role === 'student') {
            const userBookings = await booking_model_js_1.Booking.find({ userId: req.user._id }).select('_id');
            const bookingIds = userBookings.map((b) => b._id);
            query.$or = [{ responsibleUserId: req.user._id }, { bookingId: { $in: bookingIds } }];
        }
        const reports = await conditionReport_model_js_1.ConditionReport.find(query)
            .sort({ createdAt: -1 })
            .limit(Number(limit));
        res.status(200).json({
            success: true,
            data: reports,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getConditionReports = getConditionReports;
