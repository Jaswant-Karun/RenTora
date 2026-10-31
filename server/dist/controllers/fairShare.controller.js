"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResourceWaitlist = exports.managerOverrideAllocation = exports.updateFairSharePolicy = exports.getFairSharePolicy = exports.getFairShareHistory = exports.evaluateFairShare = void 0;
const fairShare_service_js_1 = require("../services/fairShare.service.js");
const fairShareDecision_model_js_1 = require("../models/fairShareDecision.model.js");
const fairAllocation_model_js_1 = require("../models/fairAllocation.model.js");
const booking_model_js_1 = require("../models/booking.model.js");
const auditLogger_js_1 = require("../utils/auditLogger.js");
// 1. Transparent Pre-Evaluation Endpoint
const evaluateFairShare = async (req, res, next) => {
    try {
        const { resourceId, date, timeSlot, startTime, endTime } = req.body;
        if (!resourceId || !date || !timeSlot) {
            res.status(400).json({
                success: false,
                message: 'Resource ID, date, and timeslot are required for FairShare evaluation.',
            });
            return;
        }
        const evaluation = await fairShare_service_js_1.FairShareService.evaluateAllocation({
            userId: req.user._id,
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
    }
    catch (error) {
        next(error);
    }
};
exports.evaluateFairShare = evaluateFairShare;
// 2. FairShare Decision History (For authorized managers & users)
const getFairShareHistory = async (req, res, next) => {
    try {
        const { decision, resourceId, search, limit = '50', page = '1' } = req.query;
        const query = {};
        // Students only view their own allocation evaluations; managers and owners view institution records
        if (req.user?.role === 'student') {
            query.userId = req.user._id;
        }
        else if (req.user?.role === 'manager' || req.user?.role === 'admin') {
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
        const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10)));
        const pageNum = Math.max(1, parseInt(page, 10));
        const [decisions, totalCount] = await Promise.all([
            fairShareDecision_model_js_1.FairShareDecision.find(query)
                .sort({ createdAt: -1 })
                .skip((pageNum - 1) * pageSize)
                .limit(pageSize),
            fairShareDecision_model_js_1.FairShareDecision.countDocuments(query),
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
    }
    catch (error) {
        next(error);
    }
};
exports.getFairShareHistory = getFairShareHistory;
// 3. Get Institutional FairShare Allocation Policy
const getFairSharePolicy = async (req, res, next) => {
    try {
        const institution = req.user?.institution || 'Apex Institute of Technology';
        const policy = await fairShare_service_js_1.FairShareService.getPolicy(institution);
        res.status(200).json({
            success: true,
            data: policy,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getFairSharePolicy = getFairSharePolicy;
// 4. Update Institutional FairShare Allocation Policy (Managers & Admins only)
const updateFairSharePolicy = async (req, res, next) => {
    try {
        const institution = req.user?.institution || 'Apex Institute of Technology';
        const updated = await fairAllocation_model_js_1.FairAllocation.findOneAndUpdate({ institution }, { ...req.body, institution }, { new: true, upsert: true });
        await (0, auditLogger_js_1.recordAuditLog)({
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
    }
    catch (error) {
        next(error);
    }
};
exports.updateFairSharePolicy = updateFairSharePolicy;
// 5. Manager Override with Mandatory Reason
const managerOverrideAllocation = async (req, res, next) => {
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
        const overriddenBooking = await fairShare_service_js_1.FairShareService.managerOverride(bookingId, req.user, reason.trim(), action);
        res.status(200).json({
            success: true,
            message: `Allocation decision overridden to ${overriddenBooking.status} by institutional manager.`,
            data: overriddenBooking,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.managerOverrideAllocation = managerOverrideAllocation;
// 6. Transparent Resource Waiting List with Queue Positions
const getResourceWaitlist = async (req, res, next) => {
    try {
        const { resourceId } = req.params;
        const resId = Array.isArray(resourceId) ? resourceId[0] : resourceId;
        const waitlist = await booking_model_js_1.Booking.find({
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
    }
    catch (error) {
        next(error);
    }
};
exports.getResourceWaitlist = getResourceWaitlist;
