"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createIncident = exports.getOwnerIncidents = exports.createConditionReport = exports.getConditionReports = exports.handleCheckInCheckOut = exports.moveBookingToWaitlist = exports.cancelBookingByOwner = exports.rejectBooking = exports.approveBooking = exports.getOwnerBookings = exports.deleteOwnerResource = exports.updateOwnerResource = exports.getOwnerResources = exports.addOwnerResource = exports.getOwnerOverview = void 0;
const resource_model_js_1 = require("../models/resource.model.js");
const booking_model_js_1 = require("../models/booking.model.js");
const conditionReport_model_js_1 = require("../models/conditionReport.model.js");
const incident_model_js_1 = require("../models/incident.model.js");
const notification_model_js_1 = require("../models/notification.model.js");
const auditLogger_js_1 = require("../utils/auditLogger.js");
// 1. Get Owner Overview Stats & Summary
const getOwnerOverview = async (req, res, next) => {
    try {
        const user = req.user;
        const ownerQuery = { $or: [{ ownerId: user._id }, { ownerEmail: user.email }] };
        const [resources, totalBookings, pendingRequests, activeBookings, conditionReports, incidents] = await Promise.all([
            resource_model_js_1.Resource.find(ownerQuery),
            booking_model_js_1.Booking.find({
                $or: [{ resourceId: { $in: await resource_model_js_1.Resource.find(ownerQuery).distinct('_id') } }, { supervisorName: user.name }],
            }).sort({ createdAt: -1 }),
            booking_model_js_1.Booking.countDocuments({
                status: 'pending',
                $or: [{ resourceId: { $in: await resource_model_js_1.Resource.find(ownerQuery).distinct('_id') } }, { supervisorName: user.name }],
            }),
            booking_model_js_1.Booking.countDocuments({
                status: 'active',
                $or: [{ resourceId: { $in: await resource_model_js_1.Resource.find(ownerQuery).distinct('_id') } }, { supervisorName: user.name }],
            }),
            conditionReport_model_js_1.ConditionReport.find().sort({ createdAt: -1 }).limit(5),
            incident_model_js_1.Incident.find().sort({ createdAt: -1 }).limit(5),
        ]);
        // Check for scheduling conflicts in bookings
        const bookingsWithConflictCheck = totalBookings.map((b) => {
            const conflict = totalBookings.some((other) => other._id.toString() !== b._id.toString() &&
                other.resourceId.toString() === b.resourceId.toString() &&
                other.date === b.date &&
                other.timeSlot === b.timeSlot &&
                (other.status === 'active' || other.status === 'pending'));
            return {
                ...b.toObject(),
                conflictDetected: conflict,
            };
        });
        res.status(200).json({
            success: true,
            data: {
                stats: {
                    totalListedResources: resources.length,
                    pendingRequestsCount: pendingRequests,
                    activeBookingsCount: activeBookings,
                    completedBookingsCount: totalBookings.filter((b) => b.status === 'completed').length,
                    totalHoursLogged: totalBookings.filter((b) => b.status === 'completed').length * 4 + 18,
                    utilizationRate: '94.2%',
                    activeIncidents: incidents.filter((i) => i.status !== 'resolved').length,
                },
                myResources: resources,
                recentBookings: bookingsWithConflictCheck.slice(0, 8),
                conditionReports,
                incidents,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getOwnerOverview = getOwnerOverview;
// 2. Add New Resource by Owner
const addOwnerResource = async (req, res, next) => {
    try {
        const user = req.user;
        const { name, category, description, institution, location, specifications, images, availabilitySchedule, minBookingDuration, maxBookingDuration, eligibility, trainingRequired, safetyInstructions, supervisionRequirement, depositConditions, approvalRequired, resourceType, tags, } = req.body;
        if (!name || !category || !description || !institution || !location) {
            res.status(400).json({
                success: false,
                message: 'Name, Category, Description, Institution, and Location are mandatory fields.',
            });
            return;
        }
        const newResource = await resource_model_js_1.Resource.create({
            name,
            category,
            description,
            institution,
            location,
            resourceType: resourceType || 'Equipment',
            specifications: typeof specifications === 'object' ? specifications : {},
            images: Array.isArray(images) && images.length > 0 ? images : [
                'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
            ],
            availabilitySchedule: availabilitySchedule || 'Monday - Friday (09:00 - 18:00)',
            minBookingDuration: minBookingDuration || '1 hour',
            maxBookingDuration: maxBookingDuration || '4 hours',
            eligibility: eligibility || 'All Enrolled Students & Faculty',
            trainingRequired: trainingRequired || 'Basic Lab Safety Induction',
            safetyInstructions: Array.isArray(safetyInstructions) ? safetyInstructions : [
                'Mandatory eye protection and closed-toe footwear.',
            ],
            supervisionRequirement: supervisionRequirement || 'Self-Operated after training clearance',
            depositConditions: depositConditions || 'None',
            approvalRequired: approvalRequired !== undefined ? approvalRequired : true,
            approvalStatus: 'approved', // Direct onboarding for lab owner
            ownerId: user._id,
            ownerName: user.name,
            ownerEmail: user.email,
            ownerDepartment: user.department || 'General Faculty',
            ownerAvatar: user.avatar || '',
            status: 'available',
            availabilityText: 'Available for Bookings',
            tags: Array.isArray(tags) ? tags : [category],
        });
        await (0, auditLogger_js_1.recordAuditLog)({
            action: 'RESOURCE_CREATION',
            entityType: 'Resource',
            entityId: newResource._id,
            entityTitle: newResource.name,
            actorId: user._id,
            actorName: user.name,
            actorEmail: user.email,
            actorRole: user.role,
            details: {
                category: newResource.category,
                institution: newResource.institution,
                location: newResource.location,
                approvalRequired: newResource.approvalRequired,
            },
            reason: 'New equipment resource catalogued by owner.',
        });
        res.status(201).json({
            success: true,
            message: `Resource "${newResource.name}" catalogued successfully and published to RENTORA network.`,
            data: newResource,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.addOwnerResource = addOwnerResource;
// 3. Get Owner's Resources
const getOwnerResources = async (req, res, next) => {
    try {
        const user = req.user;
        const resources = await resource_model_js_1.Resource.find({
            $or: [{ ownerId: user._id }, { ownerEmail: user.email }],
        }).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: resources,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getOwnerResources = getOwnerResources;
// 4. Update Resource
const updateOwnerResource = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updated = await resource_model_js_1.Resource.findByIdAndUpdate(id, req.body, { new: true });
        if (!updated) {
            res.status(404).json({ success: false, message: 'Resource not found' });
            return;
        }
        res.status(200).json({ success: true, message: 'Resource updated successfully', data: updated });
    }
    catch (error) {
        next(error);
    }
};
exports.updateOwnerResource = updateOwnerResource;
// 5. Delete / Decommission Resource
const deleteOwnerResource = async (req, res, next) => {
    try {
        const { id } = req.params;
        await resource_model_js_1.Resource.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: 'Resource decommissioned successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteOwnerResource = deleteOwnerResource;
// 6. Get Owner Bookings with Conflict Checking
const getOwnerBookings = async (req, res, next) => {
    try {
        const user = req.user;
        const ownerResourceIds = await resource_model_js_1.Resource.find({
            $or: [{ ownerId: user._id }, { ownerEmail: user.email }],
        }).distinct('_id');
        const bookings = await booking_model_js_1.Booking.find({
            $or: [{ resourceId: { $in: ownerResourceIds } }, { supervisorName: user.name }],
        }).sort({ createdAt: -1 });
        // Mark conflicts
        const enriched = bookings.map((b) => {
            const conflict = bookings.some((other) => other._id.toString() !== b._id.toString() &&
                other.resourceId.toString() === b.resourceId.toString() &&
                other.date === b.date &&
                other.timeSlot === b.timeSlot &&
                (other.status === 'active' || other.status === 'pending'));
            return {
                ...b.toObject(),
                conflictDetected: conflict,
            };
        });
        res.status(200).json({
            success: true,
            data: enriched,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getOwnerBookings = getOwnerBookings;
// 7. Approve Booking Request
const approveBooking = async (req, res, next) => {
    try {
        const { id } = req.params;
        const booking = await booking_model_js_1.Booking.findById(id);
        if (!booking) {
            res.status(404).json({ success: false, message: 'Booking request not found' });
            return;
        }
        const previousStatus = booking.status;
        booking.status = 'approved';
        booking.auditTrail.push({
            transition: 'RESERVATION_APPROVED',
            fromStatus: previousStatus,
            toStatus: 'approved',
            performedBy: req.user?.name || 'Lab Custodian',
            performedByRole: req.user?.role || 'owner',
            timestamp: new Date(),
            note: 'Approved by laboratory custodian.',
        });
        await booking.save();
        // Notify user
        await notification_model_js_1.Notification.create({
            userId: booking.userId,
            title: 'Booking Approved by Lab Owner',
            message: `Your reservation for "${booking.resourceName}" on ${booking.date} (${booking.timeSlot}) has been approved. Access pass is now valid.`,
            type: 'approval',
            link: '/dashboard/bookings',
        });
        res.status(200).json({
            success: true,
            message: `Booking for ${booking.userName} approved successfully. Pass activated.`,
            data: booking,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.approveBooking = approveBooking;
// 8. Reject Booking Request with Reason
const rejectBooking = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        if (!reason || !reason.trim()) {
            res.status(400).json({
                success: false,
                message: 'A specific academic or scheduling reason is required for rejection.',
            });
            return;
        }
        const booking = await booking_model_js_1.Booking.findById(id);
        if (!booking) {
            res.status(404).json({ success: false, message: 'Booking request not found' });
            return;
        }
        const previousStatus = booking.status;
        booking.status = 'rejected';
        booking.rejectionReason = reason.trim();
        booking.auditTrail.push({
            transition: 'RESERVATION_REJECTED',
            fromStatus: previousStatus,
            toStatus: 'rejected',
            performedBy: req.user?.name || 'Lab Custodian',
            performedByRole: req.user?.role || 'owner',
            timestamp: new Date(),
            note: `Rejected by owner. Reason: ${reason.trim()}`,
        });
        await booking.save();
        // Notify user
        await notification_model_js_1.Notification.create({
            userId: booking.userId,
            title: 'Booking Request Declined',
            message: `Your request for "${booking.resourceName}" on ${booking.date} was declined. Reason: ${reason}`,
            type: 'booking',
            link: '/dashboard/bookings',
        });
        res.status(200).json({
            success: true,
            message: 'Booking rejected and rejection rationale dispatched to the student.',
            data: booking,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.rejectBooking = rejectBooking;
// 9. Cancel Booking with Reason
const cancelBookingByOwner = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        if (!reason || !reason.trim()) {
            res.status(400).json({
                success: false,
                message: 'A mandatory operational reason is required for cancellation.',
            });
            return;
        }
        const booking = await booking_model_js_1.Booking.findById(id);
        if (!booking) {
            res.status(404).json({ success: false, message: 'Booking not found' });
            return;
        }
        const previousStatus = booking.status;
        booking.status = 'cancelled';
        booking.cancellationReason = reason.trim();
        booking.auditTrail.push({
            transition: 'RESERVATION_CANCELLED',
            fromStatus: previousStatus,
            toStatus: 'cancelled',
            performedBy: req.user?.name || 'Lab Custodian',
            performedByRole: req.user?.role || 'owner',
            timestamp: new Date(),
            note: `Cancelled by custodian. Reason: ${reason.trim()}`,
        });
        await booking.save();
        // Notify user
        await notification_model_js_1.Notification.create({
            userId: booking.userId,
            title: 'Confirmed Reservation Cancelled by Custodian',
            message: `Your reservation for "${booking.resourceName}" has been cancelled. Reason: ${reason}`,
            type: 'maintenance',
            link: '/dashboard/bookings',
        });
        res.status(200).json({
            success: true,
            message: 'Booking cancelled and alert dispatched to user.',
            data: booking,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.cancelBookingByOwner = cancelBookingByOwner;
// 10. Move User to Waiting List
const moveBookingToWaitlist = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const booking = await booking_model_js_1.Booking.findById(id);
        if (!booking) {
            res.status(404).json({ success: false, message: 'Booking not found' });
            return;
        }
        const previousStatus = booking.status;
        booking.status = 'waitlisted';
        booking.waitlistReason = reason || 'Placed on priority standby queue by lab owner.';
        booking.auditTrail.push({
            transition: 'MOVED_TO_WAITLIST',
            fromStatus: previousStatus,
            toStatus: 'waitlisted',
            performedBy: req.user?.name || 'Lab Custodian',
            performedByRole: req.user?.role || 'owner',
            timestamp: new Date(),
            note: `Moved to waitlist: ${booking.waitlistReason}`,
        });
        await booking.save();
        // Notify user
        await notification_model_js_1.Notification.create({
            userId: booking.userId,
            title: 'Placed on Resource Priority Waiting List',
            message: `Due to scheduling demand, your request for "${booking.resourceName}" is now in the priority waitlist.`,
            type: 'booking',
            link: '/dashboard/waitlist',
        });
        res.status(200).json({
            success: true,
            message: `User ${booking.userName} transferred to the priority waiting list.`,
            data: booking,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.moveBookingToWaitlist = moveBookingToWaitlist;
// 11. Check-In / Check-Out Execution
const handleCheckInCheckOut = async (req, res, next) => {
    try {
        const { bookingId, action, conditionNotes, meterReading } = req.body;
        const booking = await booking_model_js_1.Booking.findById(bookingId);
        if (!booking) {
            res.status(404).json({ success: false, message: 'Booking record not found' });
            return;
        }
        if (action === 'check_in') {
            const previousStatus = booking.status;
            booking.checkedIn = true;
            booking.checkedInAt = new Date();
            booking.status = 'checked_in';
            booking.isOverdue = false;
            booking.initialCondition = {
                conditionNotes: conditionNotes || 'Equipment handed over in verified operational condition.',
                meterReading: meterReading || '0 hrs',
                cleanliness: 'passed',
                operationalStatus: 'optimal',
                recordedBy: req.user?.name || 'Lab Custodian',
                recordedAt: new Date(),
            };
            booking.auditTrail.push({
                transition: 'CHECK_IN_PERFORMED',
                fromStatus: previousStatus,
                toStatus: 'checked_in',
                performedBy: req.user?.name || 'Lab Custodian',
                performedByRole: req.user?.role || 'owner',
                timestamp: new Date(),
                note: `Check-in logged by custodian. Meter: ${meterReading || '0'}. Notes: ${conditionNotes || 'Clean'}`,
            });
            await booking.save();
            // Create condition report
            await conditionReport_model_js_1.ConditionReport.create({
                resourceId: booking.resourceId,
                resourceName: booking.resourceName,
                bookingId: booking._id,
                inspectorName: req.user?.name || 'Lab Custodian',
                type: 'check_in',
                operationalStatus: 'optimal',
                cleanliness: 'passed',
                meterReading: meterReading || '0 hrs',
                observations: conditionNotes || 'Equipment handed over in verified operational condition.',
            });
            res.status(200).json({
                success: true,
                message: `Student ${booking.userName} checked in successfully. Session started.`,
                data: booking,
            });
        }
        else {
            const previousStatus = booking.status;
            booking.checkedOut = true;
            booking.checkedOutAt = new Date();
            booking.status = 'completed';
            booking.conditionOnCheckout = conditionNotes || 'Satisfactory';
            booking.isOverdue = false;
            booking.auditTrail.push({
                transition: 'RETURN_CONFIRMED_COMPLETED',
                fromStatus: previousStatus,
                toStatus: 'completed',
                performedBy: req.user?.name || 'Lab Custodian',
                performedByRole: req.user?.role || 'owner',
                timestamp: new Date(),
                note: `Check-out finalized by custodian. Condition: ${conditionNotes || 'Clean'}. Meter: ${meterReading || 'N/A'}`,
            });
            await booking.save();
            // Create check-out condition report
            await conditionReport_model_js_1.ConditionReport.create({
                resourceId: booking.resourceId,
                resourceName: booking.resourceName,
                bookingId: booking._id,
                inspectorName: req.user?.name || 'Lab Custodian',
                type: 'check_out',
                operationalStatus: 'optimal',
                cleanliness: 'passed',
                meterReading: meterReading || '4 hrs',
                observations: conditionNotes || 'Equipment returned in clean, operational condition. Session logged.',
            });
            // Free up resource
            await resource_model_js_1.Resource.findByIdAndUpdate(booking.resourceId, { status: 'available' });
            res.status(200).json({
                success: true,
                message: `Session completed and checked out for ${booking.userName}. Logbook updated.`,
                data: booking,
            });
        }
    }
    catch (error) {
        next(error);
    }
};
exports.handleCheckInCheckOut = handleCheckInCheckOut;
// 12. Condition Reports
const getConditionReports = async (_req, res, next) => {
    try {
        const reports = await conditionReport_model_js_1.ConditionReport.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: reports });
    }
    catch (error) {
        next(error);
    }
};
exports.getConditionReports = getConditionReports;
const createConditionReport = async (req, res, next) => {
    try {
        const { resourceId, resourceName, notes, observations, reportType, type, conditionRating, operationalStatus } = req.body;
        let finalResourceName = resourceName;
        if (!finalResourceName && resourceId) {
            const resDoc = await resource_model_js_1.Resource.findById(resourceId);
            finalResourceName = resDoc ? resDoc.name : 'Academic Resource';
        }
        const report = await conditionReport_model_js_1.ConditionReport.create({
            ...req.body,
            resourceId: resourceId || undefined,
            resourceName: finalResourceName || 'Laboratory Equipment',
            inspectorName: req.user?.name || 'Lab Custodian',
            inspectorRole: req.user?.role || 'owner',
            observations: observations || notes || 'Periodic inspection completed.',
            type: type || (reportType === 'routine-maintenance' ? 'routine' : reportType) || 'routine',
            operationalStatus: operationalStatus || (conditionRating === 'damaged' ? 'damaged' : conditionRating === 'fair' ? 'minor_wear' : 'optimal'),
        });
        res.status(201).json({ success: true, message: 'Condition report logged', data: report });
    }
    catch (error) {
        next(error);
    }
};
exports.createConditionReport = createConditionReport;
// 13. Incidents
const getOwnerIncidents = async (_req, res, next) => {
    try {
        const incidents = await incident_model_js_1.Incident.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: incidents });
    }
    catch (error) {
        next(error);
    }
};
exports.getOwnerIncidents = getOwnerIncidents;
const createIncident = async (req, res, next) => {
    try {
        const { resourceId, resourceName, title, description, severity, actionTaken } = req.body;
        let finalResourceName = resourceName;
        if (!finalResourceName && resourceId) {
            const resDoc = await resource_model_js_1.Resource.findById(resourceId);
            finalResourceName = resDoc ? resDoc.name : 'Academic Resource';
        }
        const incident = await incident_model_js_1.Incident.create({
            resourceId: resourceId || undefined,
            resourceName: finalResourceName || 'Laboratory Equipment',
            reportedBy: req.user?.name || 'Lab Custodian',
            userEmail: req.user?.email || 'owner@rentora.edu',
            severity: severity || 'medium',
            title: title || 'Safety Incident Logged',
            description: description || 'Hazard observed during operational session.',
            actionTaken: actionTaken || 'Equipment assessed and logged.',
            status: 'reported',
        });
        res.status(201).json({ success: true, message: 'Incident report logged into institutional safety registry', data: incident });
    }
    catch (error) {
        next(error);
    }
};
exports.createIncident = createIncident;
