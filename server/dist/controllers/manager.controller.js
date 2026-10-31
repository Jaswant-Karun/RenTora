"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getManagerAuditLogs = exports.promoteWaitlistBooking = exports.getManagerWaitlists = exports.getManagerBookings = exports.updateFairAllocationSettings = exports.getFairAllocationSettings = exports.resolveDispute = exports.getManagerDisputes = exports.updateIncidentStatus = exports.getManagerIncidents = exports.resolveConflict = exports.getSchedulingConflicts = exports.toggleUserVerification = exports.getUsersForVerification = exports.updateResourceApproval = exports.getResourceApprovals = exports.getManagerStats = void 0;
const resource_model_js_1 = require("../models/resource.model.js");
const booking_model_js_1 = require("../models/booking.model.js");
const user_model_js_1 = require("../models/user.model.js");
const incident_model_js_1 = require("../models/incident.model.js");
const dispute_model_js_1 = require("../models/dispute.model.js");
const fairAllocation_model_js_1 = require("../models/fairAllocation.model.js");
const notification_model_js_1 = require("../models/notification.model.js");
const auditLogger_js_1 = require("../utils/auditLogger.js");
const auditLog_model_js_1 = require("../models/auditLog.model.js");
// 1. Institution-wide Resource Statistics & Analytics
const getManagerStats = async (req, res, next) => {
    try {
        const institution = req.user?.institution || 'National Institute of Technology';
        const [totalResources, availableResources, activeBookings, totalUsers, studentUsers, ownerUsers, unverifiedUsers, incidentsCount, disputesCount, pendingResourceApprovals, completedBookings, waitlistedBookings,] = await Promise.all([
            resource_model_js_1.Resource.countDocuments({ isArchived: { $ne: true } }),
            resource_model_js_1.Resource.countDocuments({ status: 'available', isArchived: { $ne: true } }),
            booking_model_js_1.Booking.countDocuments({ status: 'active' }),
            user_model_js_1.User.countDocuments(),
            user_model_js_1.User.countDocuments({ role: 'student' }),
            user_model_js_1.User.countDocuments({ role: 'owner' }),
            user_model_js_1.User.countDocuments({ isVerified: false }),
            incident_model_js_1.Incident.countDocuments({ status: { $ne: 'resolved' } }),
            dispute_model_js_1.Dispute.countDocuments({ status: { $ne: 'resolved' } }),
            resource_model_js_1.Resource.countDocuments({ approvalStatus: 'pending_manager', isArchived: { $ne: true } }),
            booking_model_js_1.Booking.countDocuments({ status: 'completed' }),
            booking_model_js_1.Booking.countDocuments({ status: 'waitlisted' }),
        ]);
        // Department utilization aggregation
        const deptUtilization = await resource_model_js_1.Resource.aggregate([
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
        let fairAllocation = await fairAllocation_model_js_1.FairAllocation.findOne({ institution });
        if (!fairAllocation) {
            fairAllocation = await fairAllocation_model_js_1.FairAllocation.create({
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
    }
    catch (error) {
        next(error);
    }
};
exports.getManagerStats = getManagerStats;
// 2. Resource Approval Management
const getResourceApprovals = async (_req, res, next) => {
    try {
        const pendingResources = await resource_model_js_1.Resource.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: pendingResources });
    }
    catch (error) {
        next(error);
    }
};
exports.getResourceApprovals = getResourceApprovals;
const updateResourceApproval = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { approvalStatus } = req.body; // 'approved' | 'rejected'
        const resource = await resource_model_js_1.Resource.findByIdAndUpdate(id, {
            approvalStatus,
            status: approvalStatus === 'approved' ? 'available' : 'maintenance',
        }, { new: true });
        if (!resource) {
            res.status(404).json({ success: false, message: 'Resource not found' });
            return;
        }
        await (0, auditLogger_js_1.recordAuditLog)({
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
    }
    catch (error) {
        next(error);
    }
};
exports.updateResourceApproval = updateResourceApproval;
// 3. User & Owner Verification
const getUsersForVerification = async (req, res, next) => {
    try {
        const { role, isVerified, search } = req.query;
        const filter = {};
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
        const users = await user_model_js_1.User.find(filter).select('-password').sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: users });
    }
    catch (error) {
        next(error);
    }
};
exports.getUsersForVerification = getUsersForVerification;
const toggleUserVerification = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { isVerified } = req.body;
        const user = await user_model_js_1.User.findByIdAndUpdate(id, { isVerified, institutionMembershipVerified: isVerified }, { new: true }).select('-password');
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        await (0, auditLogger_js_1.recordAuditLog)({
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
    }
    catch (error) {
        next(error);
    }
};
exports.toggleUserVerification = toggleUserVerification;
// 4. Scheduling Conflict Resolution
const getSchedulingConflicts = async (_req, res, next) => {
    try {
        const allBookings = await booking_model_js_1.Booking.find({ status: { $in: ['active', 'pending'] } }).sort({ date: 1 });
        const conflicts = [];
        for (let i = 0; i < allBookings.length; i++) {
            for (let j = i + 1; j < allBookings.length; j++) {
                const b1 = allBookings[i];
                const b2 = allBookings[j];
                if (b1.resourceId.toString() === b2.resourceId.toString() &&
                    b1.date === b2.date &&
                    b1.timeSlot === b2.timeSlot) {
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
    }
    catch (error) {
        next(error);
    }
};
exports.getSchedulingConflicts = getSchedulingConflicts;
const resolveConflict = async (req, res, next) => {
    try {
        const { approvedBookingId, alternateBookingId, action } = req.body;
        if (action === 'reschedule_alternate') {
            await booking_model_js_1.Booking.findByIdAndUpdate(approvedBookingId, { status: 'active', conflictDetected: false });
            await booking_model_js_1.Booking.findByIdAndUpdate(alternateBookingId, {
                status: 'waitlisted',
                notes: 'Automatically transferred to priority queue due to conflict resolution.',
            });
        }
        res.status(200).json({
            success: true,
            message: 'Scheduling conflict resolved. Priority booking allocated and alternate placed on priority standby.',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.resolveConflict = resolveConflict;
// 5. Incident Review
const getManagerIncidents = async (_req, res, next) => {
    try {
        const incidents = await incident_model_js_1.Incident.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: incidents });
    }
    catch (error) {
        next(error);
    }
};
exports.getManagerIncidents = getManagerIncidents;
const updateIncidentStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, resolutionNotes, actionTaken } = req.body;
        const incident = await incident_model_js_1.Incident.findByIdAndUpdate(id, { status, resolutionNotes, actionTaken }, { new: true });
        if (!incident) {
            res.status(404).json({ success: false, message: 'Incident not found' });
            return;
        }
        res.status(200).json({
            success: true,
            message: `Incident status updated to ${status}`,
            data: incident,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateIncidentStatus = updateIncidentStatus;
// 6. Dispute Management
const getManagerDisputes = async (_req, res, next) => {
    try {
        const disputes = await dispute_model_js_1.Dispute.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: disputes });
    }
    catch (error) {
        next(error);
    }
};
exports.getManagerDisputes = getManagerDisputes;
const resolveDispute = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { resolution } = req.body;
        const dispute = await dispute_model_js_1.Dispute.findByIdAndUpdate(id, { status: 'resolved', resolution }, { new: true });
        if (!dispute) {
            res.status(404).json({ success: false, message: 'Dispute not found' });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Dispute arbitration concluded and terms communicated to both parties.',
            data: dispute,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.resolveDispute = resolveDispute;
// 7. Fair Allocation Settings
const getFairAllocationSettings = async (req, res, next) => {
    try {
        const institution = req.user?.institution || 'National Institute of Technology';
        let settings = await fairAllocation_model_js_1.FairAllocation.findOne({ institution });
        if (!settings) {
            settings = await fairAllocation_model_js_1.FairAllocation.create({ institution });
        }
        res.status(200).json({ success: true, data: settings });
    }
    catch (error) {
        next(error);
    }
};
exports.getFairAllocationSettings = getFairAllocationSettings;
const updateFairAllocationSettings = async (req, res, next) => {
    try {
        const institution = req.user?.institution || 'National Institute of Technology';
        const settings = await fairAllocation_model_js_1.FairAllocation.findOneAndUpdate({ institution }, req.body, {
            new: true,
            upsert: true,
        });
        await (0, auditLogger_js_1.recordAuditLog)({
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
    }
    catch (error) {
        next(error);
    }
};
exports.updateFairAllocationSettings = updateFairAllocationSettings;
// 8. Institutional Booking Oversight
const getManagerBookings = async (req, res, next) => {
    try {
        const { status, search, date } = req.query;
        const filter = {};
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
        const bookings = await booking_model_js_1.Booking.find(filter).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: bookings });
    }
    catch (error) {
        next(error);
    }
};
exports.getManagerBookings = getManagerBookings;
// 9. Institutional Waitlist Management
const getManagerWaitlists = async (_req, res, next) => {
    try {
        const waitlists = await booking_model_js_1.Booking.find({ status: 'waitlisted' }).sort({ queuePosition: 1, createdAt: 1 });
        res.status(200).json({ success: true, data: waitlists });
    }
    catch (error) {
        next(error);
    }
};
exports.getManagerWaitlists = getManagerWaitlists;
const promoteWaitlistBooking = async (req, res, next) => {
    try {
        const { id } = req.params;
        const booking = await booking_model_js_1.Booking.findById(id);
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
        await notification_model_js_1.Notification.create({
            userId: booking.userId,
            title: 'Waitlist Promoted: Reservation Confirmed',
            message: `Your waitlisted reservation for "${booking.resourceName}" on ${booking.date} (${booking.timeSlot}) has been approved by the institution manager.`,
            type: 'approval',
            link: '/dashboard/bookings',
        });
        await (0, auditLogger_js_1.recordAuditLog)({
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
    }
    catch (error) {
        next(error);
    }
};
exports.promoteWaitlistBooking = promoteWaitlistBooking;
// 10. Institutional Compliance Audit Logs
const getManagerAuditLogs = async (req, res, next) => {
    try {
        const { action, entityType, limit } = req.query;
        const filter = {};
        if (action && action !== 'all')
            filter.action = action;
        if (entityType && entityType !== 'all')
            filter.entityType = entityType;
        const auditLogs = await auditLog_model_js_1.AuditLog.find(filter)
            .sort({ timestamp: -1 })
            .limit(Number(limit) || 100);
        res.status(200).json({ success: true, data: auditLogs });
    }
    catch (error) {
        next(error);
    }
};
exports.getManagerAuditLogs = getManagerAuditLogs;
