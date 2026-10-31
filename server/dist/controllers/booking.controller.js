"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelBooking = exports.confirmReturnAndComplete = exports.initiateReturn = exports.checkInBooking = exports.waitlistBookingRequest = exports.rejectBookingRequest = exports.approveBookingRequest = exports.putBookingUnderReview = exports.getBookingById = exports.getMyBookings = exports.createBooking = exports.preCheckBooking = exports.hasOverlap = void 0;
const booking_model_js_1 = require("../models/booking.model.js");
const resource_model_js_1 = require("../models/resource.model.js");
const notification_model_js_1 = require("../models/notification.model.js");
const conditionReport_model_js_1 = require("../models/conditionReport.model.js");
const fairAllocation_model_js_1 = require("../models/fairAllocation.model.js");
// Helper: Check if two time intervals overlap
// [s1, e1] and [s2, e2] overlap if s1 < e2 && e1 > s2
const hasOverlap = (s1, e1, s2, e2) => {
    return s1 < e2 && e1 > s2;
};
exports.hasOverlap = hasOverlap;
// 1. STEP 3: Pre-check Validation API
const preCheckBooking = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const { resourceId, startTime, endTime, date, timeSlot } = req.body;
        if (!resourceId) {
            res.status(400).json({ success: false, message: 'Resource ID is required for pre-check.' });
            return;
        }
        const resource = await resource_model_js_1.Resource.findById(resourceId);
        if (!resource) {
            res.status(404).json({ success: false, message: 'Resource not found' });
            return;
        }
        // 1. Resource Availability Check
        const isResourceAvailable = resource.status === 'available';
        let availabilityMessage = 'Resource is available for reservations.';
        if (resource.status === 'maintenance') {
            availabilityMessage = 'Resource is currently offline under scheduled maintenance.';
        }
        else if (resource.status === 'in_use') {
            availabilityMessage = 'Resource is currently occupied for another session.';
        }
        // 2. User Eligibility Check
        // If resource requires verified institutional affiliation
        const isEligible = req.user.isVerified;
        const eligibilityMessage = isEligible
            ? `Verified Institutional Researcher (${req.user.institution})`
            : 'Unverified Account. Verification with institutional credentials recommended.';
        // 3. Training Requirements
        const trainingRequirement = resource.trainingRequired || 'Standard Laboratory Safety Briefing';
        // Parse dates if provided
        let parsedStart = null;
        let parsedEnd = null;
        if (startTime && endTime) {
            parsedStart = new Date(startTime);
            parsedEnd = new Date(endTime);
        }
        else if (date && timeSlot) {
            const parts = timeSlot.split('-').map((s) => s.trim());
            if (parts.length === 2) {
                parsedStart = new Date(`${date}T${parts[0]}:00`);
                parsedEnd = new Date(`${date}T${parts[1]}:00`);
            }
        }
        let conflictFound = false;
        let conflictDetails = '';
        if (parsedStart && parsedEnd && !isNaN(parsedStart.getTime()) && !isNaN(parsedEnd.getTime())) {
            // 4. Existing Booking Conflict Check
            const conflictingBookings = await booking_model_js_1.Booking.find({
                resourceId: resource._id,
                status: { $in: ['approved', 'checked_in', 'return_pending', 'active'] },
                startTime: { $lt: parsedEnd },
                endTime: { $gt: parsedStart },
            });
            if (conflictingBookings.length > 0) {
                conflictFound = true;
                const conf = conflictingBookings[0];
                conflictDetails = `Slot collision: Already reserved by ${conf.userName} from ${new Date(conf.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${new Date(conf.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            }
        }
        // 5. Active Booking Limits Check (Fair Allocation)
        const activeCount = await booking_model_js_1.Booking.countDocuments({
            userId: req.user._id,
            status: { $in: ['pending', 'under_review', 'approved', 'checked_in', 'return_pending', 'active'] },
        });
        const fairPolicy = (await fairAllocation_model_js_1.FairAllocation.findOne()) || {
            maxActiveBookingsPerStudent: 3,
            maxWeeklyHoursPerStudent: 16,
        };
        const limitExceeded = activeCount >= fairPolicy.maxActiveBookingsPerStudent;
        const canBook = isResourceAvailable && !conflictFound && (!limitExceeded || req.user.role !== 'student');
        res.status(200).json({
            success: true,
            data: {
                canBook,
                checks: {
                    authenticated: true,
                    user: {
                        name: req.user.name,
                        email: req.user.email,
                        role: req.user.role,
                        isVerified: req.user.isVerified,
                    },
                    eligibility: {
                        passed: isEligible,
                        detail: eligibilityMessage,
                    },
                    training: {
                        required: trainingRequirement,
                        acknowledged: true,
                    },
                    resourceAvailability: {
                        status: resource.status,
                        passed: isResourceAvailable,
                        detail: availabilityMessage,
                    },
                    schedulingConflict: {
                        conflictDetected: conflictFound,
                        detail: conflictFound ? conflictDetails : 'Timeslot is open and free of collisions.',
                    },
                    activeBookingLimits: {
                        currentActive: activeCount,
                        allowedLimit: fairPolicy.maxActiveBookingsPerStudent,
                        passed: !limitExceeded,
                        detail: limitExceeded
                            ? `You have reached the maximum allowed ${fairPolicy.maxActiveBookingsPerStudent} simultaneous reservations under campus fair allocation.`
                            : `Current active: ${activeCount}/${fairPolicy.maxActiveBookingsPerStudent}`,
                    },
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.preCheckBooking = preCheckBooking;
// 2. STEP 5: Submit Booking Request
const createBooking = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const { resourceId, date, timeSlot, startTime, endTime, purpose, projectDescription, expectedDuration, additionalInformation, supervisorName, trainingAcknowledged, } = req.body;
        if (!resourceId || !purpose) {
            res.status(400).json({
                success: false,
                message: 'Resource ID and reservation purpose are required.',
            });
            return;
        }
        const resource = await resource_model_js_1.Resource.findById(resourceId);
        if (!resource) {
            res.status(404).json({ success: false, message: 'Resource not found' });
            return;
        }
        // Parse and validate start and end times
        let parsedStart;
        let parsedEnd;
        if (startTime && endTime) {
            parsedStart = new Date(startTime);
            parsedEnd = new Date(endTime);
        }
        else if (date && timeSlot) {
            const parts = timeSlot.split('-').map((s) => s.trim());
            if (parts.length === 2) {
                parsedStart = new Date(`${date}T${parts[0]}:00`);
                parsedEnd = new Date(`${date}T${parts[1]}:00`);
            }
            else {
                parsedStart = new Date(`${date}T09:00:00`);
                parsedEnd = new Date(`${date}T10:00:00`);
            }
        }
        else {
            res.status(400).json({
                success: false,
                message: 'Valid date/time slot or start/end timestamp is required.',
            });
            return;
        }
        if (isNaN(parsedStart.getTime()) || isNaN(parsedEnd.getTime())) {
            res.status(400).json({ success: false, message: 'Invalid date/time format.' });
            return;
        }
        if (parsedEnd <= parsedStart) {
            res.status(400).json({
                success: false,
                message: 'Reservation end time must be after start time.',
            });
            return;
        }
        // Duration in hours
        const durationHours = Math.max(0.5, Math.round(((parsedEnd.getTime() - parsedStart.getTime()) / (1000 * 60 * 60)) * 10) / 10);
        // Duration limits validation
        const minDur = Number(resource.minBookingDuration) || 0.5;
        const maxDur = Number(resource.maxBookingDuration) || 12;
        if (durationHours < minDur) {
            res.status(400).json({
                success: false,
                message: `Booking duration (${durationHours}h) is shorter than minimum required (${minDur}h) for this asset.`,
            });
            return;
        }
        if (durationHours > maxDur) {
            res.status(400).json({
                success: false,
                message: `Booking duration (${durationHours}h) exceeds maximum allowed (${maxDur}h) for this asset.`,
            });
            return;
        }
        // Active booking limits check for students
        if (req.user.role === 'student') {
            const activeCount = await booking_model_js_1.Booking.countDocuments({
                userId: req.user._id,
                status: { $in: ['pending', 'under_review', 'approved', 'checked_in', 'return_pending', 'active'] },
            });
            const fairPolicy = (await fairAllocation_model_js_1.FairAllocation.findOne()) || { maxActiveBookingsPerStudent: 3 };
            if (activeCount >= fairPolicy.maxActiveBookingsPerStudent) {
                res.status(429).json({
                    success: false,
                    message: `Active reservation limit reached (${activeCount}/${fairPolicy.maxActiveBookingsPerStudent}). Complete or cancel an existing session first.`,
                });
                return;
            }
        }
        // ATOMIC DOUBLE-BOOKING CHECK
        // Query for any approved or in-session booking overlapping the requested interval
        const conflict = await booking_model_js_1.Booking.findOne({
            resourceId: resource._id,
            status: { $in: ['approved', 'checked_in', 'return_pending', 'active'] },
            startTime: { $lt: parsedEnd },
            endTime: { $gt: parsedStart },
        });
        if (conflict) {
            res.status(409).json({
                success: false,
                message: `Scheduling collision: This resource is already booked from ${new Date(conflict.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${new Date(conflict.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} on this date.`,
            });
            return;
        }
        // Determine initial status:
        // If custodian approval is required, initial status is 'pending'
        // If no approval is required, initial status is 'approved'
        const initialStatus = resource.approvalRequired ? 'pending' : 'approved';
        const formattedDate = date || parsedStart.toISOString().split('T')[0];
        const formattedTimeSlot = timeSlot ||
            `${parsedStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${parsedEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        // Initial audit log entry
        const initialAudit = {
            transition: 'RESERVATION_REQUESTED',
            fromStatus: 'none',
            toStatus: initialStatus,
            performedBy: req.user.name,
            performedByRole: req.user.role,
            timestamp: new Date(),
            note: `Reservation requested for ${durationHours} hours: ${purpose}`,
        };
        const booking = await booking_model_js_1.Booking.create({
            userId: req.user._id,
            userName: req.user.name,
            userEmail: req.user.email,
            userDepartment: req.user.department,
            userInstitution: req.user.institution,
            userEligibility: req.user.isVerified ? 'Verified Institutional Researcher' : 'Standard Student Account',
            resourceId: resource._id,
            resourceName: resource.name,
            resourceCategory: resource.category,
            resourceLocation: resource.location,
            resourceImage: resource.images?.[0] || '',
            date: formattedDate,
            timeSlot: formattedTimeSlot,
            startTime: parsedStart,
            endTime: parsedEnd,
            durationHours,
            purpose,
            projectDescription,
            expectedDuration: expectedDuration || `${durationHours} hrs`,
            additionalInformation,
            supervisorName: supervisorName || 'Faculty Sponsor',
            trainingAcknowledged: !!trainingAcknowledged,
            status: initialStatus,
            auditTrail: [initialAudit],
        });
        // STEP 6: Notify Owner
        // Find owner if ownerId exists, or create notification for custodian role
        if (resource.ownerId) {
            await notification_model_js_1.Notification.create({
                userId: resource.ownerId,
                title: 'New Booking Request Received',
                message: `${req.user.name} submitted a reservation request for "${resource.name}" on ${formattedDate} (${formattedTimeSlot}).`,
                type: 'booking',
                link: '/owner/requests',
            });
        }
        // Confirmation notification to User
        await notification_model_js_1.Notification.create({
            userId: req.user._id,
            title: initialStatus === 'approved' ? 'Reservation Confirmed' : 'Booking Request Submitted',
            message: initialStatus === 'approved'
                ? `Your booking for "${resource.name}" on ${formattedDate} (${formattedTimeSlot}) is confirmed.`
                : `Your request for "${resource.name}" has been routed to the laboratory custodian for review.`,
            type: 'booking',
            link: '/dashboard/bookings',
        });
        res.status(201).json({
            success: true,
            message: initialStatus === 'approved'
                ? 'Booking confirmed instantly!'
                : 'Booking request registered. Laboratory custodian has been notified.',
            data: booking,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createBooking = createBooking;
// 3. Get User Bookings with Auto-Overdue Check
const getMyBookings = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const { status } = req.query;
        const query = {};
        if (req.user.role === 'student') {
            query.userId = req.user._id;
        }
        if (status && status !== 'all') {
            if (status === 'active') {
                query.status = { $in: ['approved', 'checked_in', 'active'] };
            }
            else {
                query.status = status;
            }
        }
        const bookings = await booking_model_js_1.Booking.find(query).sort({ createdAt: -1 });
        // Dynamic overdue check
        const now = new Date();
        for (const b of bookings) {
            if ((b.status === 'checked_in' || b.status === 'approved' || b.status === 'active') &&
                b.endTime &&
                new Date(b.endTime) < now &&
                !b.checkedOut) {
                b.isOverdue = true;
                b.status = 'overdue';
                b.auditTrail.push({
                    transition: 'SESSION_FLAGGED_OVERDUE',
                    fromStatus: 'checked_in',
                    toStatus: 'overdue',
                    performedBy: 'System Monitor',
                    performedByRole: 'system',
                    timestamp: now,
                    note: `Booking exceeded scheduled end time (${new Date(b.endTime).toLocaleTimeString()}) without return initiation.`,
                });
                await b.save();
            }
        }
        res.status(200).json({
            success: true,
            data: bookings,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMyBookings = getMyBookings;
// 4. Get Single Booking with Full Visual Timeline & Audit History
const getBookingById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const booking = await booking_model_js_1.Booking.findById(id);
        if (!booking) {
            res.status(404).json({ success: false, message: 'Booking not found' });
            return;
        }
        // Build timeline stages
        const timeline = [
            {
                step: 1,
                key: 'pending',
                label: 'Request Submitted',
                completed: true,
                date: booking.createdAt,
                actor: booking.userName,
            },
            {
                step: 2,
                key: 'under_review',
                label: 'Custodian Review',
                completed: ['under_review', 'approved', 'checked_in', 'return_pending', 'completed', 'active'].includes(booking.status),
                date: booking.updatedAt,
            },
            {
                step: 3,
                key: 'approved',
                label: 'Approved & Confirmed',
                completed: ['approved', 'checked_in', 'return_pending', 'completed', 'active'].includes(booking.status),
                date: booking.status === 'approved' ? booking.updatedAt : undefined,
            },
            {
                step: 4,
                key: 'checked_in',
                label: 'Checked In (Initial Condition)',
                completed: ['checked_in', 'return_pending', 'completed'].includes(booking.status) || !!booking.checkedIn,
                date: booking.checkedInAt,
                condition: booking.initialCondition,
            },
            {
                step: 5,
                key: 'return_pending',
                label: 'Return Initiated',
                completed: ['return_pending', 'completed'].includes(booking.status) || !!booking.returnInitiated,
                date: booking.returnInitiatedAt,
                condition: booking.returnCondition,
            },
            {
                step: 6,
                key: 'completed',
                label: 'Completed & Inspected',
                completed: booking.status === 'completed',
                date: booking.checkedOutAt,
            },
        ];
        res.status(200).json({
            success: true,
            data: {
                booking,
                timeline,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getBookingById = getBookingById;
// 5. STEP 7: Put Booking Under Review
const putBookingUnderReview = async (req, res, next) => {
    try {
        const { id } = req.params;
        const booking = await booking_model_js_1.Booking.findById(id);
        if (!booking) {
            res.status(404).json({ success: false, message: 'Booking not found' });
            return;
        }
        const previousStatus = booking.status;
        booking.status = 'under_review';
        booking.auditTrail.push({
            transition: 'PLACED_UNDER_REVIEW',
            fromStatus: previousStatus,
            toStatus: 'under_review',
            performedBy: req.user?.name || 'Custodian',
            performedByRole: req.user?.role || 'owner',
            timestamp: new Date(),
            note: 'Lab owner is reviewing user qualifications and schedule availability.',
        });
        await booking.save();
        res.status(200).json({
            success: true,
            message: 'Booking placed under active custodian review.',
            data: booking,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.putBookingUnderReview = putBookingUnderReview;
// 6. STEP 7 & 8: Approve Booking Request
const approveBookingRequest = async (req, res, next) => {
    try {
        const { id } = req.params;
        const booking = await booking_model_js_1.Booking.findById(id);
        if (!booking) {
            res.status(404).json({ success: false, message: 'Booking not found' });
            return;
        }
        // Double check conflict before approving
        const conflict = await booking_model_js_1.Booking.findOne({
            _id: { $ne: booking._id },
            resourceId: booking.resourceId,
            status: { $in: ['approved', 'checked_in', 'return_pending', 'active'] },
            startTime: { $lt: booking.endTime },
            endTime: { $gt: booking.startTime },
        });
        if (conflict) {
            res.status(409).json({
                success: false,
                message: `Collision alert: Another reservation was already confirmed for this timeslot (${conflict.timeSlot}).`,
            });
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
            note: 'Custodian verified eligibility and approved session reservation.',
        });
        await booking.save();
        // STEP 8: Send confirmation notification to user
        await notification_model_js_1.Notification.create({
            userId: booking.userId,
            title: 'Reservation Request Approved!',
            message: `Your booking for "${booking.resourceName}" on ${booking.date} (${booking.timeSlot}) has been approved. You may check in when your session starts.`,
            type: 'approval',
            link: '/dashboard/bookings',
        });
        res.status(200).json({
            success: true,
            message: 'Reservation approved and confirmed. User notified.',
            data: booking,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.approveBookingRequest = approveBookingRequest;
// 7. STEP 7: Reject Booking Request with Reason
const rejectBookingRequest = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        if (!reason || !reason.trim()) {
            res.status(400).json({
                success: false,
                message: 'A clear stated reason is mandatory when rejecting a reservation.',
            });
            return;
        }
        const booking = await booking_model_js_1.Booking.findById(id);
        if (!booking) {
            res.status(404).json({ success: false, message: 'Booking not found' });
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
            note: `Rejection justification: ${reason.trim()}`,
        });
        await booking.save();
        // Notify user with reason
        await notification_model_js_1.Notification.create({
            userId: booking.userId,
            title: 'Reservation Request Rejected',
            message: `Your booking for "${booking.resourceName}" was rejected. Reason: ${reason.trim()}`,
            type: 'maintenance',
            link: '/dashboard/bookings',
        });
        res.status(200).json({
            success: true,
            message: 'Reservation rejected and explanation dispatched to user.',
            data: booking,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.rejectBookingRequest = rejectBookingRequest;
// 8. Move to Waitlist with Reason
const waitlistBookingRequest = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason, priority } = req.body;
        const booking = await booking_model_js_1.Booking.findById(id);
        if (!booking) {
            res.status(404).json({ success: false, message: 'Booking not found' });
            return;
        }
        const previousStatus = booking.status;
        booking.status = 'waitlisted';
        booking.waitlistReason = reason || 'Placed on standby queue due to high demand.';
        booking.waitlistPriority = priority || 1;
        booking.auditTrail.push({
            transition: 'MOVED_TO_WAITLIST',
            fromStatus: previousStatus,
            toStatus: 'waitlisted',
            performedBy: req.user?.name || 'Lab Custodian',
            performedByRole: req.user?.role || 'owner',
            timestamp: new Date(),
            note: `Waitlisted: ${booking.waitlistReason} (Priority ${booking.waitlistPriority})`,
        });
        await booking.save();
        await notification_model_js_1.Notification.create({
            userId: booking.userId,
            title: 'Placed on Priority Waitlist',
            message: `Your booking for "${booking.resourceName}" has been waitlisted. If an earlier slot opens, you will be notified.`,
            type: 'booking',
            link: '/dashboard/waitlist',
        });
        res.status(200).json({
            success: true,
            message: 'User moved to priority waitlist.',
            data: booking,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.waitlistBookingRequest = waitlistBookingRequest;
// 9. STEP 9 & 10: Check-In & Initial Condition Recording
const checkInBooking = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { conditionNotes, meterReading, cleanliness, operationalStatus } = req.body;
        const booking = await booking_model_js_1.Booking.findById(id);
        if (!booking) {
            res.status(404).json({ success: false, message: 'Booking not found' });
            return;
        }
        const previousStatus = booking.status;
        booking.checkedIn = true;
        booking.checkedInAt = new Date();
        booking.status = 'checked_in';
        booking.isOverdue = false;
        booking.initialCondition = {
            conditionNotes: conditionNotes || 'Equipment handed over in verified operational state.',
            meterReading: meterReading || '0 hrs',
            cleanliness: cleanliness || 'passed',
            operationalStatus: operationalStatus || 'optimal',
            recordedBy: req.user?.name || 'Borrower/Custodian',
            recordedAt: new Date(),
        };
        booking.auditTrail.push({
            transition: 'CHECK_IN_PERFORMED',
            fromStatus: previousStatus,
            toStatus: 'checked_in',
            performedBy: req.user?.name || booking.userName,
            performedByRole: req.user?.role || 'student',
            timestamp: new Date(),
            note: `Check-in completed. Condition: ${booking.initialCondition.operationalStatus}. Notes: ${booking.initialCondition.conditionNotes}`,
        });
        await booking.save();
        // STEP 10: Create Initial Condition Report
        await conditionReport_model_js_1.ConditionReport.create({
            resourceId: booking.resourceId,
            resourceName: booking.resourceName,
            bookingId: booking._id,
            inspectorName: req.user?.name || 'Lab Staff',
            inspectorRole: req.user?.role || 'owner',
            type: 'check_in',
            operationalStatus: operationalStatus || 'optimal',
            cleanliness: cleanliness || 'passed',
            meterReading: meterReading || '0',
            observations: conditionNotes || 'Initial check-in inspection passed.',
        });
        // Mark resource as in_use
        await resource_model_js_1.Resource.findByIdAndUpdate(booking.resourceId, { status: 'in_use' });
        res.status(200).json({
            success: true,
            message: `Check-in verified! Initial condition recorded. Session active.`,
            data: booking,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.checkInBooking = checkInBooking;
// 10. STEP 12: User Initiates Check-Out & Records Return Condition
const initiateReturn = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { conditionNotes, meterReading, cleanliness, operationalStatus } = req.body;
        const booking = await booking_model_js_1.Booking.findById(id);
        if (!booking) {
            res.status(404).json({ success: false, message: 'Booking not found' });
            return;
        }
        const previousStatus = booking.status;
        booking.returnInitiated = true;
        booking.returnInitiatedAt = new Date();
        booking.status = 'return_pending';
        booking.isOverdue = false;
        booking.returnCondition = {
            conditionNotes: conditionNotes || 'Equipment session completed and ready for custodian handback.',
            meterReading: meterReading || '',
            cleanliness: cleanliness || 'passed',
            operationalStatus: operationalStatus || 'optimal',
            recordedBy: req.user?.name || booking.userName,
            recordedAt: new Date(),
        };
        booking.auditTrail.push({
            transition: 'RETURN_INITIATED',
            fromStatus: previousStatus,
            toStatus: 'return_pending',
            performedBy: req.user?.name || booking.userName,
            performedByRole: req.user?.role || 'student',
            timestamp: new Date(),
            note: `Return initiated by borrower. Return condition: ${booking.returnCondition.operationalStatus}. Notes: ${booking.returnCondition.conditionNotes}`,
        });
        await booking.save();
        // Alert owner to perform final sign-off inspection
        const resource = await resource_model_js_1.Resource.findById(booking.resourceId);
        if (resource?.ownerId) {
            await notification_model_js_1.Notification.create({
                userId: resource.ownerId,
                title: 'Return Inspection Requested',
                message: `${booking.userName} completed their session with "${booking.resourceName}" and requested return sign-off.`,
                type: 'maintenance',
                link: '/owner/checkin',
            });
        }
        res.status(200).json({
            success: true,
            message: 'Return submitted successfully. Custodian notified for handover inspection.',
            data: booking,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.initiateReturn = initiateReturn;
// 11. STEP 13 & 14: Owner Confirms Return & Booking Becomes Completed
const confirmReturnAndComplete = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { finalNotes, meterReading, conditionStatus } = req.body;
        const booking = await booking_model_js_1.Booking.findById(id);
        if (!booking) {
            res.status(404).json({ success: false, message: 'Booking not found' });
            return;
        }
        const previousStatus = booking.status;
        booking.checkedOut = true;
        booking.checkedOutAt = new Date();
        booking.status = 'completed';
        booking.conditionOnCheckout = finalNotes || booking.returnCondition?.conditionNotes || 'Pristine return';
        booking.isOverdue = false;
        booking.auditTrail.push({
            transition: 'RETURN_CONFIRMED_COMPLETED',
            fromStatus: previousStatus,
            toStatus: 'completed',
            performedBy: req.user?.name || 'Lab Custodian',
            performedByRole: req.user?.role || 'owner',
            timestamp: new Date(),
            note: `Return confirmed & inspected by custodian. Final condition: ${conditionStatus || 'optimal'}. ${finalNotes || ''}`,
        });
        await booking.save();
        // Create final condition report
        await conditionReport_model_js_1.ConditionReport.create({
            resourceId: booking.resourceId,
            resourceName: booking.resourceName,
            bookingId: booking._id,
            inspectorName: req.user?.name || 'Lab Custodian',
            inspectorRole: req.user?.role || 'owner',
            type: 'check_out',
            operationalStatus: conditionStatus || 'optimal',
            cleanliness: 'passed',
            meterReading: meterReading || booking.returnCondition?.meterReading || '0',
            observations: finalNotes || 'Return inspection finalized and logged into institutional ledger.',
        });
        // Reset resource status to available
        await resource_model_js_1.Resource.findByIdAndUpdate(booking.resourceId, {
            status: 'available',
            $inc: { totalBookings: 1 },
        });
        // Notify user of completed reservation
        await notification_model_js_1.Notification.create({
            userId: booking.userId,
            title: 'Session Successfully Completed',
            message: `Your return of "${booking.resourceName}" was inspected and signed off. Thank you for maintaining campus equipment!`,
            type: 'booking',
            link: '/dashboard/bookings',
        });
        res.status(200).json({
            success: true,
            message: 'Return confirmed. Booking lifecycle successfully completed!',
            data: booking,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.confirmReturnAndComplete = confirmReturnAndComplete;
// 12. Cancel Booking with Stated Reason
const cancelBooking = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        if (!reason || !reason.trim()) {
            res.status(400).json({
                success: false,
                message: 'A cancellation reason is required.',
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
            performedBy: req.user?.name || 'User',
            performedByRole: req.user?.role || 'student',
            timestamp: new Date(),
            note: `Cancelled: ${reason.trim()}`,
        });
        await booking.save();
        // If resource was in_use, free it up
        await resource_model_js_1.Resource.findByIdAndUpdate(booking.resourceId, { status: 'available' });
        // Notify user or owner
        await notification_model_js_1.Notification.create({
            userId: booking.userId,
            title: 'Reservation Cancelled',
            message: `Your booking for "${booking.resourceName}" has been cancelled. Reason: ${reason.trim()}`,
            type: 'booking',
        });
        res.status(200).json({
            success: true,
            message: 'Booking cancelled.',
            data: booking,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.cancelBooking = cancelBooking;
