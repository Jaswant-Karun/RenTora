"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FairShareService = void 0;
const resource_model_js_1 = require("../models/resource.model.js");
const booking_model_js_1 = require("../models/booking.model.js");
const user_model_js_1 = require("../models/user.model.js");
const fairAllocation_model_js_1 = require("../models/fairAllocation.model.js");
const notification_model_js_1 = require("../models/notification.model.js");
const auditLogger_js_1 = require("../utils/auditLogger.js");
const fairShareDecision_model_js_1 = require("../models/fairShareDecision.model.js");
/**
 * FairShare Transparent Resource Allocation Engine
 * Enforces institutional fairness without arbitrary or unexplained AI black-box decisions.
 */
class FairShareService {
    /**
     * Helper to fetch institutional policy with default fallbacks
     */
    static async getPolicy(institution) {
        const query = institution ? { institution } : {};
        let policy = await fairAllocation_model_js_1.FairAllocation.findOne(query);
        if (!policy) {
            policy = (await fairAllocation_model_js_1.FairAllocation.findOne()) || {
                institution: institution || 'Apex Institute of Technology',
                maxWeeklyHoursPerStudent: 16,
                maxActiveBookingsPerStudent: 3,
                peakHourThrottling: true,
                emergencyBypassEnabled: true,
                priorityTiers: ['Research Scholar', 'Final Year Student', 'Graduate Student', 'Undergraduate'],
                advanceBookingDays: 14,
                cancellationGraceHours: 2,
                maxReservationsPerAssetPer14Days: 3,
                cooldownPeriodDays: 14,
                priorityScoring: {
                    phdScholarPoints: 30,
                    finalYearPoints: 20,
                    undergradPoints: 10,
                    deptPriorityPoints: 15,
                    lowUsageBonusPoints: 25,
                    penaltyDeductionPoints: 15,
                },
            };
        }
        return policy;
    }
    /**
     * Evaluates a resource booking request transparently across all 6 core criteria.
     */
    static async evaluateAllocation(input) {
        const { userId, resourceId, date, timeSlot } = input;
        const [user, resource] = await Promise.all([
            user_model_js_1.User.findById(userId),
            resource_model_js_1.Resource.findById(resourceId),
        ]);
        if (!user)
            throw new Error('User account not found for allocation evaluation.');
        if (!resource)
            throw new Error('Resource not found for allocation evaluation.');
        const policy = await this.getPolicy(user.institution || resource.institution);
        // 1. Parse Start and End Times
        let parsedStart = input.startTime ? new Date(input.startTime) : null;
        let parsedEnd = input.endTime ? new Date(input.endTime) : null;
        if ((!parsedStart || !parsedEnd || isNaN(parsedStart.getTime()) || isNaN(parsedEnd.getTime())) && date && timeSlot) {
            const parts = timeSlot.split('-').map((s) => s.trim());
            if (parts.length === 2) {
                parsedStart = new Date(`${date}T${parts[0]}:00`);
                parsedEnd = new Date(`${date}T${parts[1]}:00`);
            }
        }
        if (!parsedStart || !parsedEnd || isNaN(parsedStart.getTime()) || isNaN(parsedEnd.getTime())) {
            parsedStart = new Date();
            parsedEnd = new Date(Date.now() + 2 * 60 * 60 * 1000);
        }
        // ----------------------------------------------------
        // CHECK 1: ELIGIBILITY EVALUATION
        // ----------------------------------------------------
        const isMemberVerified = Boolean(user.institutionMembershipVerified || user.isVerified);
        const userQualification = user.academicQualification || 'Undergraduate';
        const requiredQualification = resource.requiredQualification || 'None';
        const isQualificationSatisfied = !resource.requiredQualification ||
            resource.requiredQualification === 'None' ||
            resource.requiredQualification === 'Any' ||
            userQualification === resource.requiredQualification ||
            userQualification === 'PhD Scholar' ||
            userQualification === 'Postdoctoral Researcher' ||
            userQualification === 'Faculty';
        const trainingRequirement = resource.trainingRequired;
        const userCerts = user.trainingCertifications || [];
        const hasRequiredTraining = !trainingRequirement ||
            trainingRequirement === 'None' ||
            userCerts.some((c) => c.name.toLowerCase().includes(trainingRequirement.toLowerCase()) ||
                trainingRequirement.toLowerCase().includes(c.name.toLowerCase()));
        const eligibilityPassed = isMemberVerified && isQualificationSatisfied && hasRequiredTraining;
        let eligibilityDetails = 'Institutional eligibility checks satisfied.';
        if (!isMemberVerified) {
            eligibilityDetails = 'Institutional identity unverified. Student ID or faculty verification required.';
        }
        else if (!hasRequiredTraining) {
            eligibilityDetails = `Mandatory training prerequisite missing: "${trainingRequirement}".`;
        }
        else if (!isQualificationSatisfied) {
            eligibilityDetails = `Academic qualification insufficient. Requires: ${requiredQualification}. Current: ${userQualification}.`;
        }
        // ----------------------------------------------------
        // CHECK 2: RESOURCE AVAILABILITY EVALUATION
        // ----------------------------------------------------
        const isArchived = Boolean(resource.isArchived);
        const resourceStatus = resource.status || 'available';
        const isAvailable = !isArchived && resourceStatus === 'available';
        let availabilityDetails = 'Resource is operational and open for bookings.';
        if (isArchived) {
            availabilityDetails = 'Resource has been archived by the laboratory custodian.';
        }
        else if (resourceStatus === 'maintenance') {
            availabilityDetails = 'Resource is temporarily offline for scheduled calibration/maintenance.';
        }
        else if (resourceStatus === 'disabled') {
            availabilityDetails = 'Resource has been temporarily disabled by the facility manager.';
        }
        else if (resourceStatus === 'in_use') {
            availabilityDetails = 'Resource is currently occupied for an ongoing session.';
        }
        // ----------------------------------------------------
        // CHECK 3: BOOKING CONFLICT & OVERLAP EVALUATION
        // ----------------------------------------------------
        const conflictingBookings = await booking_model_js_1.Booking.find({
            resourceId: resource._id,
            status: { $in: ['approved', 'checked_in', 'return_pending', 'active'] },
            startTime: { $lt: parsedEnd },
            endTime: { $gt: parsedStart },
        });
        const hasConflict = conflictingBookings.length > 0;
        const conflictingBooking = hasConflict ? conflictingBookings[0] : null;
        let conflictDetails = 'Timeslot is open without overlap conflicts.';
        if (hasConflict && conflictingBooking) {
            conflictDetails = `Slot collision detected with confirmed reservation by ${conflictingBooking.userName} (${conflictingBooking.timeSlot}).`;
        }
        // ----------------------------------------------------
        // CHECK 4: ACTIVE BOOKING LIMITS EVALUATION
        // ----------------------------------------------------
        const activeCount = await booking_model_js_1.Booking.countDocuments({
            userId: user._id,
            status: { $in: ['pending', 'under_review', 'approved', 'checked_in', 'return_pending', 'active'] },
        });
        const maxAllowedActive = policy.maxActiveBookingsPerStudent || 3;
        const isUnderActiveLimit = user.role !== 'student' || activeCount < maxAllowedActive;
        const activeLimitDetails = isUnderActiveLimit
            ? `User has ${activeCount}/${maxAllowedActive} active bookings (within quota).`
            : `Active reservation quota reached (${activeCount}/${maxAllowedActive}). Complete or cancel an existing session first.`;
        // ----------------------------------------------------
        // CHECK 5: PREVIOUS RESOURCE USAGE & MONOPOLISATION
        // ----------------------------------------------------
        const cooldownDays = policy.cooldownPeriodDays || 14;
        const maxAssetReservations = policy.maxReservationsPerAssetPer14Days || 3;
        const cutoffDate = new Date(Date.now() - cooldownDays * 24 * 60 * 60 * 1000);
        const recentAssetBookings = await booking_model_js_1.Booking.find({
            userId: user._id,
            resourceId: resource._id,
            createdAt: { $gte: cutoffDate },
            status: { $nin: ['cancelled', 'rejected'] },
        });
        const recentHoursLogged = recentAssetBookings.reduce((sum, b) => sum + (b.durationHours || 2), 0);
        const isMonopolising = recentAssetBookings.length >= maxAssetReservations;
        const previousUsagePassed = !isMonopolising || user.role !== 'student';
        const previousUsageDetails = isMonopolising
            ? `FairShare Cooldown: User has completed ${recentAssetBookings.length} sessions on this asset within ${cooldownDays} days (Limit: ${maxAssetReservations}).`
            : `Previous usage balanced: ${recentAssetBookings.length}/${maxAssetReservations} sessions in past ${cooldownDays} days (${recentHoursLogged} hours logged).`;
        // ----------------------------------------------------
        // CHECK 6: TRANSPARENT PRIORITY RULE EVALUATION
        // ----------------------------------------------------
        let priorityScore = 50; // base score
        const factors = ['Baseline campus allocation priority (+50)'];
        let appliedRule = 'Standard Institutional Priority';
        // Academic qualification tier
        if (userQualification === 'PhD Scholar' || userQualification === 'Postdoctoral Researcher') {
            priorityScore += policy.priorityScoring?.phdScholarPoints || 30;
            factors.push(`Advanced Doctoral/Postdoctoral Research Tier (+${policy.priorityScoring?.phdScholarPoints || 30})`);
            appliedRule = 'Doctoral & Postdoc Research Priority';
        }
        else if (userQualification === 'Final Year Student') {
            priorityScore += policy.priorityScoring?.finalYearPoints || 20;
            factors.push(`Final Year Capstone Project Tier (+${policy.priorityScoring?.finalYearPoints || 20})`);
            appliedRule = 'Final Year Capstone Priority';
        }
        else if (userQualification === 'Graduate Student') {
            priorityScore += 15;
            factors.push('Graduate Student Research Tier (+15)');
        }
        else {
            priorityScore += policy.priorityScoring?.undergradPoints || 10;
            factors.push(`Undergraduate Educational Access Tier (+${policy.priorityScoring?.undergradPoints || 10})`);
        }
        // Home Department affinity
        if (user.department &&
            resource.ownerDepartment &&
            user.department.trim().toLowerCase() === resource.ownerDepartment.trim().toLowerCase()) {
            priorityScore += policy.priorityScoring?.deptPriorityPoints || 15;
            factors.push(`Host Department Facility Custody Affinity (+${policy.priorityScoring?.deptPriorityPoints || 15})`);
            appliedRule += ' + Home Department Priority';
        }
        // Fair Usage Balance / Low Usage Reward
        if (recentAssetBookings.length === 0) {
            priorityScore += policy.priorityScoring?.lowUsageBonusPoints || 25;
            factors.push(`First-time reservation in current cycle bonus (+${policy.priorityScoring?.lowUsageBonusPoints || 25})`);
            appliedRule += ' + Low-Usage Balance';
        }
        else if (recentAssetBookings.length === 1) {
            priorityScore += 10;
            factors.push('Moderate usage balance bonus (+10)');
        }
        const priorityRuleDetails = `Calculated Priority: ${priorityScore} points. Factors: ${factors.join('; ')}.`;
        // ----------------------------------------------------
        // SYNTHESIS: FINAL DECISION & REASON
        // ----------------------------------------------------
        let finalDecision = 'APPROVED';
        let finalReason = '';
        if (!eligibilityPassed) {
            finalDecision = 'REJECTED';
            finalReason = `Eligibility requirement failed: ${eligibilityDetails}`;
        }
        else if (!isAvailable) {
            finalDecision = 'REJECTED';
            finalReason = `Resource unavailable: ${availabilityDetails}`;
        }
        else if (hasConflict || !isUnderActiveLimit || isMonopolising) {
            finalDecision = 'WAITLISTED';
            if (hasConflict) {
                finalReason = `Scheduling collision with confirmed booking for ${conflictingBooking?.timeSlot}. Enqueued in transparent priority waitlist.`;
            }
            else if (!isUnderActiveLimit) {
                finalReason = `Active reservation limit reached (${activeCount}/${maxAllowedActive}). Enqueued for standby release.`;
            }
            else {
                finalReason = `FairShare asset cooldown active (${recentAssetBookings.length}/${maxAssetReservations} bookings in ${cooldownDays}d). Placed on priority waitlist.`;
            }
        }
        else {
            // Unrestricted vs Restricted Equipment Governance
            // "Do not let AI independently approve access to restricted equipment or impose penalties."
            if (resource.isRestricted || resource.approvalRequired) {
                finalDecision = 'PENDING_REVIEW';
                finalReason = 'Prerequisites passed. Restricted equipment requires human custodian verification before access pass generation.';
            }
            else {
                finalDecision = 'APPROVED';
                finalReason = 'All FairShare transparent criteria passed. Immediate confirmation granted.';
            }
        }
        const explanation = {
            eligibilityResult: {
                passed: eligibilityPassed,
                membershipVerified: isMemberVerified,
                trainingSatisfied: hasRequiredTraining,
                qualificationSatisfied: isQualificationSatisfied,
                details: eligibilityDetails,
            },
            availabilityResult: {
                passed: isAvailable,
                resourceStatus,
                details: availabilityDetails,
            },
            conflictResult: {
                hasConflict,
                conflictingBookingId: conflictingBooking?._id?.toString(),
                conflictingUser: conflictingBooking?.userName,
                conflictingSlot: conflictingBooking?.timeSlot,
                details: conflictDetails,
            },
            priorityRule: {
                appliedRule,
                priorityTier: userQualification,
                score: priorityScore,
                factors,
                details: priorityRuleDetails,
            },
            activeLimitResult: {
                passed: isUnderActiveLimit,
                currentActiveCount: activeCount,
                maxAllowed: maxAllowedActive,
                details: activeLimitDetails,
            },
            previousUsageResult: {
                passed: previousUsagePassed,
                recentBookingsCount: recentAssetBookings.length,
                recentHoursLogged,
                cooldownPeriodDays: cooldownDays,
                details: previousUsageDetails,
            },
            finalDecision,
            reason: finalReason,
            timestamp: new Date(),
        };
        return {
            canBook: finalDecision === 'APPROVED' || finalDecision === 'PENDING_REVIEW',
            finalDecision,
            reason: finalReason,
            explanation,
            conflictingBooking,
            activeLimitExceeded: !isUnderActiveLimit,
        };
    }
    /**
     * Persists an evaluated FairShare decision into the permanent audit ledger.
     */
    static async recordDecision(booking, explanation, user) {
        const decision = await fairShareDecision_model_js_1.FairShareDecision.create({
            bookingId: booking._id,
            userId: user._id,
            userName: user.name,
            userEmail: user.email,
            userRole: user.role,
            userDepartment: user.department,
            userQualification: user.academicQualification,
            resourceId: booking.resourceId,
            resourceName: booking.resourceName,
            institution: booking.userInstitution || 'Apex Institute of Technology',
            date: booking.date,
            timeSlot: booking.timeSlot,
            startTime: booking.startTime,
            endTime: booking.endTime,
            explanation,
            finalDecision: explanation.finalDecision,
            reason: explanation.reason,
        });
        await (0, auditLogger_js_1.recordAuditLog)({
            action: 'FAIRSHARE_DECISION',
            entityType: 'Booking',
            entityId: booking._id?.toString(),
            entityTitle: `${booking.resourceName} (${explanation.finalDecision})`,
            actorId: user._id,
            actorName: user.name,
            actorEmail: user.email,
            actorRole: user.role,
            details: {
                decision: explanation.finalDecision,
                priorityScore: explanation.priorityRule.score,
                appliedRule: explanation.priorityRule.appliedRule,
                hasConflict: explanation.conflictResult.hasConflict,
                activeLimitPassed: explanation.activeLimitResult.passed,
            },
            reason: explanation.reason,
        });
        return decision;
    }
    /**
     * Advances the waiting list and notifies the next eligible candidate when a slot frees up.
     */
    static async advanceWaitlist(resourceId, date, timeSlot, freedBookingId) {
        const resource = await resource_model_js_1.Resource.findById(resourceId);
        if (!resource)
            return null;
        // Find next waitlisted booking for this resource, ordered by priority score descending and arrival time ascending
        const nextCandidate = await booking_model_js_1.Booking.findOne({
            resourceId,
            status: 'waitlisted',
        }).sort({ waitlistPriority: -1, createdAt: 1 });
        if (!nextCandidate)
            return null;
        // Advance candidate queue position or upgrade to pending
        const previousQueuePos = nextCandidate.queuePosition || 1;
        nextCandidate.queuePosition = 1;
        // Add audit entry to booking
        nextCandidate.auditTrail.push({
            transition: 'WAITLIST_SLOT_RELEASE_NOTIFIED',
            fromStatus: 'waitlisted',
            toStatus: 'waitlisted',
            performedBy: 'FairShare Allocation Engine',
            performedByRole: 'system',
            timestamp: new Date(),
            note: `Slot on ${date} (${timeSlot}) released. Candidate notified as next in line.`,
        });
        await nextCandidate.save();
        // Re-index remaining waitlisted queue positions
        const remainingWaitlist = await booking_model_js_1.Booking.find({
            resourceId,
            status: 'waitlisted',
            _id: { $ne: nextCandidate._id },
        }).sort({ waitlistPriority: -1, createdAt: 1 });
        let pos = 2;
        for (const b of remainingWaitlist) {
            if (b.queuePosition !== pos) {
                b.queuePosition = pos;
                await b.save();
            }
            pos++;
        }
        // High-Priority In-App Notification to next candidate
        await notification_model_js_1.Notification.create({
            userId: nextCandidate.userId,
            title: 'FairShare Alert: Reserved Slot Released!',
            message: `A previously reserved slot for "${resource.name}" on ${date} (${timeSlot}) has become available! You are now #1 in the priority queue.`,
            type: 'approval',
            link: '/dashboard/bookings',
            metadata: { bookingId: nextCandidate._id, freedBookingId },
        });
        // Record in central audit log
        await (0, auditLogger_js_1.recordAuditLog)({
            action: 'SLOT_RELEASE_NOTIFICATION',
            entityType: 'Booking',
            entityId: nextCandidate._id?.toString(),
            entityTitle: resource.name,
            actorName: 'FairShare Allocation Engine',
            actorRole: 'system',
            details: {
                resourceId,
                notifiedUserId: nextCandidate.userId,
                notifiedUserName: nextCandidate.userName,
                date,
                timeSlot,
                previousQueuePos,
                currentQueuePos: 1,
            },
            reason: 'Slot cancellation triggered automated transparent queue advancement.',
        });
        return nextCandidate;
    }
    /**
     * Applies an authorized Manager Override with mandatory reason.
     */
    static async managerOverride(bookingId, managerUser, overrideReason, action = 'approve') {
        if (!overrideReason || !overrideReason.trim()) {
            throw new Error('A mandatory operational reason is required for institutional manager override.');
        }
        const booking = await booking_model_js_1.Booking.findById(bookingId);
        if (!booking)
            throw new Error('Booking record not found for manager override.');
        const previousStatus = booking.status;
        let newStatus = 'approved';
        if (action === 'reject')
            newStatus = 'rejected';
        booking.status = newStatus;
        booking.managerOverrideReason = overrideReason.trim();
        booking.managerOverriddenBy = managerUser.name;
        // Update FairShare explanation if exists
        if (booking.fairShareExplanation) {
            booking.fairShareExplanation.finalDecision = newStatus === 'approved' ? 'APPROVED' : 'REJECTED';
            booking.fairShareExplanation.reason = `Overridden by Manager ${managerUser.name}: ${overrideReason.trim()}`;
        }
        booking.auditTrail.push({
            transition: 'MANAGER_OVERRIDE',
            fromStatus: previousStatus,
            toStatus: newStatus,
            performedBy: managerUser.name,
            performedByRole: managerUser.role,
            timestamp: new Date(),
            note: `Manager Override (${action.toUpperCase()}): ${overrideReason.trim()}`,
        });
        await booking.save();
        // Update or create FairShareDecision record
        await fairShareDecision_model_js_1.FairShareDecision.findOneAndUpdate({ bookingId: booking._id }, {
            isOverridden: true,
            overriddenBy: managerUser.name,
            overrideReason: overrideReason.trim(),
            overriddenAt: new Date(),
            finalDecision: newStatus === 'approved' ? 'APPROVED' : 'REJECTED',
        });
        // Record in central audit log
        await (0, auditLogger_js_1.recordAuditLog)({
            action: 'MANAGER_OVERRIDE',
            entityType: 'Booking',
            entityId: booking._id?.toString(),
            entityTitle: `${booking.resourceName} - ${booking.userName}`,
            actorId: managerUser._id,
            actorName: managerUser.name,
            actorEmail: managerUser.email,
            actorRole: managerUser.role,
            details: {
                action,
                previousStatus,
                newStatus,
                bookingId: booking._id,
            },
            reason: overrideReason.trim(),
        });
        // Notify user
        await notification_model_js_1.Notification.create({
            userId: booking.userId,
            title: 'Allocation Decision Overridden by Institutional Manager',
            message: `Your reservation request for "${booking.resourceName}" was ${newStatus} via institutional manager override. Reason: ${overrideReason.trim()}`,
            type: 'approval',
            link: '/dashboard/bookings',
            metadata: { bookingId: booking._id, managerOverride: true },
        });
        return booking;
    }
}
exports.FairShareService = FairShareService;
