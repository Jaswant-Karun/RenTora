import { Response, NextFunction } from 'express';
import { Booking, BookingStatus } from '../models/booking.model.js';
import { Resource } from '../models/resource.model.js';
import { User } from '../models/user.model.js';
import { Notification } from '../models/notification.model.js';
import { ConditionReport } from '../models/conditionReport.model.js';
import { FairAllocation } from '../models/fairAllocation.model.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { recordAuditLog } from '../utils/auditLogger.js';
import { FairShareService } from '../services/fairShare.service.js';
import { resourceLock } from '../utils/resourceLock.js';

// Helper: Check if two time intervals overlap
export const hasOverlap = (s1: Date, e1: Date, s2: Date, e2: Date): boolean => {
  return s1 < e2 && e1 > s2;
};

// Helper: Compute waitlist priority score based on configurable policy
export const computeWaitlistPriority = (
  user: any,
  resource: any,
  policy: any
): number => {
  let score = 50; // base score
  const cfg = policy?.priorityScoring || {
    phdScholarPoints: 30,
    finalYearPoints: 20,
    undergradPoints: 10,
    deptPriorityPoints: 15,
    lowUsageBonusPoints: 25,
    penaltyDeductionPoints: 15,
  };

  const qual = user?.academicQualification || 'Undergraduate';
  if (qual === 'PhD Scholar' || qual === 'Postdoctoral Researcher') {
    score += cfg.phdScholarPoints;
  } else if (qual === 'Final Year Student') {
    score += cfg.finalYearPoints;
  } else if (qual === 'Graduate Student') {
    score += 15;
  } else {
    score += cfg.undergradPoints;
  }

  if (
    user?.department &&
    resource?.ownerDepartment &&
    user.department.trim().toLowerCase() === resource.ownerDepartment.trim().toLowerCase()
  ) {
    score += cfg.deptPriorityPoints;
  }

  const totalHours = user?.historicalUsage?.totalHoursLogged || 0;
  if (totalHours < 10) {
    score += cfg.lowUsageBonusPoints;
  } else if (totalHours > 40) {
    score -= 10;
  }

  const penalty = user?.historicalUsage?.penaltyPoints || 0;
  score -= penalty * cfg.penaltyDeductionPoints;

  return Math.max(1, score);
};

// Helper: Check monopolisation cooldown (prevent repeated monopolisation of same asset)
export const checkMonopolisation = async (
  userId: any,
  resourceId: any,
  daysWindow: number = 14,
  maxAllowed: number = 3
): Promise<{ monopolised: boolean; count: number; reason?: string }> => {
  const windowStart = new Date(Date.now() - daysWindow * 24 * 60 * 60 * 1000);
  const count = await Booking.countDocuments({
    userId,
    resourceId,
    createdAt: { $gte: windowStart },
    status: { $in: ['pending', 'under_review', 'approved', 'checked_in', 'return_pending', 'completed'] },
  });

  if (count >= maxAllowed) {
    return {
      monopolised: true,
      count,
      reason: `Campus fair-share policy: Monopolisation cooldown active. You have reserved this high-demand asset ${count} times in the last ${daysWindow} days.`,
    };
  }

  return { monopolised: false, count };
};

// 1. STEP 3: Pre-check Validation API (Trust, Safety & Fairness Diagnostics)
export const preCheckBooking = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
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

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      res.status(404).json({ success: false, message: 'Resource not found' });
      return;
    }

    const userProfile = await User.findById(req.user._id);

    // 1. Resource Availability Check
    const isResourceAvailable = resource.status === 'available';
    let availabilityMessage = 'Resource is available for reservations.';
    if (resource.status === 'maintenance') {
      availabilityMessage = 'Resource is currently offline under scheduled maintenance.';
    } else if (resource.status === 'in_use') {
      availabilityMessage = 'Resource is currently occupied for another session.';
    }

    // 2. User Eligibility & Membership Verification
    const isMemberVerified = Boolean(userProfile?.institutionMembershipVerified || req.user.isVerified);
    const eligibilityMessage = isMemberVerified
      ? `Verified Institutional Researcher (${req.user.institution})`
      : 'Institutional membership unverified. Please upload student ID in settings.';

    // 3. Training & Certification Status
    const trainingRequirement = resource.trainingRequired || 'Basic Lab Safety Induction';
    const userCerts = userProfile?.trainingCertifications || [];
    const hasRequiredTraining =
      !resource.trainingRequired ||
      userCerts.some(
        (c) =>
          c.name.toLowerCase().includes(resource.trainingRequired.toLowerCase()) ||
          resource.trainingRequired.toLowerCase().includes(c.name.toLowerCase())
      );

    // 4. Required Qualification Status
    const userQualification = userProfile?.academicQualification || 'Undergraduate';
    const isQualificationSufficient =
      !resource.requiredQualification ||
      resource.requiredQualification === 'None' ||
      resource.requiredQualification === 'Any' ||
      userQualification === resource.requiredQualification ||
      userQualification === 'PhD Scholar' ||
      userQualification === 'Faculty';

    // 5. Parse dates if provided
    let parsedStart: Date | null = null;
    let parsedEnd: Date | null = null;

    if (startTime && endTime) {
      parsedStart = new Date(startTime);
      parsedEnd = new Date(endTime);
    } else if (date && timeSlot) {
      const parts = timeSlot.split('-').map((s: string) => s.trim());
      if (parts.length === 2) {
        parsedStart = new Date(`${date}T${parts[0]}:00`);
        parsedEnd = new Date(`${date}T${parts[1]}:00`);
      }
    }

    let conflictFound = false;
    let conflictDetails = '';
    let conflictingBooking: any = null;

    if (parsedStart && parsedEnd && !isNaN(parsedStart.getTime()) && !isNaN(parsedEnd.getTime())) {
      const conflictingBookings = await Booking.find({
        resourceId: resource._id,
        status: { $in: ['approved', 'checked_in', 'return_pending', 'active'] },
        startTime: { $lt: parsedEnd },
        endTime: { $gt: parsedStart },
      });

      if (conflictingBookings.length > 0) {
        conflictFound = true;
        conflictingBooking = conflictingBookings[0];
        conflictDetails = `Slot collision: Already reserved by ${conflictingBooking.userName} until ${new Date(
          conflictingBooking.endTime
        ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
    }

    // 6. Active Booking Limits Check (Fair Allocation)
    const activeCount = await Booking.countDocuments({
      userId: req.user._id,
      status: { $in: ['pending', 'under_review', 'approved', 'checked_in', 'return_pending', 'active'] },
    });

    const fairPolicy = (await FairAllocation.findOne()) || {
      maxActiveBookingsPerStudent: 3,
      maxWeeklyHoursPerStudent: 16,
      maxReservationsPerAssetPer14Days: 3,
      cooldownPeriodDays: 14,
    };

    const limitExceeded = activeCount >= (fairPolicy.maxActiveBookingsPerStudent || 3);

    // 7. Monopolisation Check
    const monopolisation = await checkMonopolisation(
      req.user._id,
      resource._id,
      fairPolicy.cooldownPeriodDays || 14,
      fairPolicy.maxReservationsPerAssetPer14Days || 3
    );

    // 8. Priority Score Calculation for Transparent Waitlist
    const calculatedPriority = computeWaitlistPriority(userProfile, resource, fairPolicy);

    // Overall booking readiness
    const canBook =
      isResourceAvailable &&
      !conflictFound &&
      isMemberVerified &&
      hasRequiredTraining &&
      isQualificationSufficient &&
      (!limitExceeded || req.user.role !== 'student') &&
      !monopolisation.monopolised;

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
            academicQualification: userQualification,
          },
          eligibility: {
            passed: isMemberVerified && isQualificationSufficient,
            membershipVerified: isMemberVerified,
            qualification: userQualification,
            requiredQualification: resource.requiredQualification || 'None',
            detail: eligibilityMessage,
          },
          training: {
            required: trainingRequirement,
            completed: hasRequiredTraining,
            userCertifications: userCerts.map((c) => c.name),
            passed: hasRequiredTraining,
            detail: hasRequiredTraining
              ? `Safety clearance active: ${trainingRequirement}`
              : `Missing required clearance: ${trainingRequirement}`,
          },
          resourceAvailability: {
            status: resource.status,
            passed: isResourceAvailable,
            detail: availabilityMessage,
          },
          ownerApprovalRequired: {
            required: resource.approvalRequired,
            isRestricted: resource.isRestricted,
            detail:
              resource.isRestricted || resource.approvalRequired
                ? 'Mandatory human custodian signoff enforced. Automatic AI bypass strictly prohibited.'
                : 'Direct self-booking permitted.',
          },
          schedulingConflict: {
            conflictDetected: conflictFound,
            detail: conflictFound ? conflictDetails : 'Timeslot is open and free of collisions.',
            estimatedReleaseTime: conflictingBooking ? conflictingBooking.endTime : null,
          },
          activeBookingLimits: {
            currentActive: activeCount,
            allowedLimit: fairPolicy.maxActiveBookingsPerStudent || 3,
            passed: !limitExceeded,
            detail: limitExceeded
              ? `You have reached the maximum allowed ${fairPolicy.maxActiveBookingsPerStudent} simultaneous reservations under campus fair allocation.`
              : `Current active: ${activeCount}/${fairPolicy.maxActiveBookingsPerStudent || 3}`,
          },
          monopolisationCheck: {
            monopolised: monopolisation.monopolised,
            reservationCountLast14Days: monopolisation.count,
            passed: !monopolisation.monopolised,
            detail: monopolisation.monopolised
              ? monopolisation.reason
              : `Fair-share verified: ${monopolisation.count}/${fairPolicy.maxReservationsPerAssetPer14Days || 3} recent bookings.`,
          },
          waitlistDiagnostics: {
            eligibleForWaitlist: conflictFound || limitExceeded || monopolisation.monopolised,
            calculatedPriority,
            suggestedAction: conflictFound
              ? 'Join transparent waiting list with priority ranking'
              : monopolisation.monopolised
              ? 'Monopolisation standby queue'
              : 'Direct booking',
          },
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// 2. STEP 5: Submit Booking Request (Enforces Fairness, Eligibility, & Restricted Equipment Guard)
export const createBooking = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const {
      resourceId,
      date,
      timeSlot,
      startTime,
      endTime,
      purpose,
      projectDescription,
      expectedDuration,
      additionalInformation,
      supervisorName,
      trainingAcknowledged,
      allowWaitlist = false,
      aiApproved, // Potential AI-bypass flag from client or automated script
    } = req.body;

    if (!resourceId || !purpose) {
      res.status(400).json({
        success: false,
        message: 'Resource ID and reservation purpose are required.',
      });
      return;
    }

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      res.status(404).json({ success: false, message: 'Resource not found' });
      return;
    }

    // 1. Resource Availability Check
    if (resource.isArchived || resource.status === 'disabled') {
      res.status(400).json({
        success: false,
        message: 'This resource has been decommissioned or archived and cannot be reserved.',
      });
      return;
    }
    if (resource.status === 'maintenance') {
      res.status(400).json({
        success: false,
        message: 'This resource is currently offline undergoing scheduled maintenance.',
      });
      return;
    }

    // 2. Institution Access Check
    if (
      resource.isRestricted &&
      resource.institution &&
      req.user.institution &&
      resource.institution.trim().toLowerCase() !== req.user.institution.trim().toLowerCase()
    ) {
      res.status(403).json({
        success: false,
        message: `Cross-institutional restriction: "${resource.name}" is reserved exclusively for researchers from ${resource.institution}.`,
      });
      return;
    }

    const userProfile = await User.findById(req.user._id);

    // 3. User Membership Eligibility Check
    const isMemberVerified = Boolean(userProfile?.institutionMembershipVerified || req.user.isVerified);
    if (!isMemberVerified) {
      res.status(403).json({
        success: false,
        message: 'Institutional membership verification required before reserving campus apparatus.',
      });
      return;
    }

    // 4. Academic Qualification Check
    if (
      resource.requiredQualification &&
      resource.requiredQualification !== 'None' &&
      resource.requiredQualification !== 'Any'
    ) {
      const userQual = userProfile?.academicQualification || 'Undergraduate';
      const qualifies =
        userQual === resource.requiredQualification ||
        userQual === 'PhD Scholar' ||
        userQual === 'Faculty' ||
        req.user.role === 'admin' ||
        req.user.role === 'manager';
      if (!qualifies) {
        res.status(403).json({
          success: false,
          message: `Academic qualification requirement not met. Required: ${resource.requiredQualification}, Current: ${userQual}.`,
        });
        return;
      }
    }

    // Parse and validate start and end times
    let parsedStart: Date;
    let parsedEnd: Date;

    if (startTime && endTime) {
      parsedStart = new Date(startTime);
      parsedEnd = new Date(endTime);
    } else if (date && timeSlot) {
      const parts = timeSlot.split('-').map((s: string) => s.trim());
      if (parts.length === 2) {
        parsedStart = new Date(`${date}T${parts[0]}:00`);
        parsedEnd = new Date(`${date}T${parts[1]}:00`);
      } else {
        parsedStart = new Date(`${date}T09:00:00`);
        parsedEnd = new Date(`${date}T10:00:00`);
      }
    } else {
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
    const durationHours = Math.max(
      0.5,
      Math.round(((parsedEnd.getTime() - parsedStart.getTime()) / (1000 * 60 * 60)) * 10) / 10
    );

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

    await resourceLock.withLock(resource._id.toString(), async () => {
      // 1. ATOMIC DOUBLE-BOOKING CHECK
      const conflict = await Booking.findOne({
        resourceId: resource._id,
        status: { $in: ['approved', 'checked_in', 'return_pending', 'active'] },
        startTime: { $lt: parsedEnd },
        endTime: { $gt: parsedStart },
      });

    const fairPolicy = (await FairAllocation.findOne()) || {
      maxActiveBookingsPerStudent: 3,
      maxWeeklyHoursPerStudent: 16,
      maxReservationsPerAssetPer14Days: 3,
      cooldownPeriodDays: 14,
    };

    // 2. MONOPOLISATION DETECTION
    const monopolisation = await checkMonopolisation(
      req.user._id,
      resource._id,
      fairPolicy.cooldownPeriodDays || 14,
      fairPolicy.maxReservationsPerAssetPer14Days || 3
    );

    // 3. ACTIVE BOOKING LIMITS CHECK FOR STUDENTS
    let activeLimitExceeded = false;
    let activeCount = 0;
    if (req.user.role === 'student') {
      activeCount = await Booking.countDocuments({
        userId: req.user._id,
        status: { $in: ['pending', 'under_review', 'approved', 'checked_in', 'return_pending', 'active'] },
      });
      if (activeCount >= (fairPolicy.maxActiveBookingsPerStudent || 3)) {
        activeLimitExceeded = true;
      }
    }

    // Calculate priority score
    const calculatedPriority = computeWaitlistPriority(userProfile, resource, fairPolicy);

    // If conflict, limit exceeded, or monopolisation detected:
    // If client requested waitlist or if conflict/monopolisation dictates it:
    let finalStatus: BookingStatus = 'pending';
    let waitlistReasonText = '';

    if (conflict || activeLimitExceeded || monopolisation.monopolised) {
      if (allowWaitlist || monopolisation.monopolised) {
        finalStatus = 'waitlisted';
        if (monopolisation.monopolised) {
          waitlistReasonText = monopolisation.reason || 'Monopolisation cooldown active.';
        } else if (conflict) {
          waitlistReasonText = `Timeslot collision with confirmed reservation (${new Date(
            conflict.startTime
          ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(
            conflict.endTime
          ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}). Placed on priority standby.`;
        } else {
          waitlistReasonText = `Active booking quota reached (${activeCount}/${fairPolicy.maxActiveBookingsPerStudent}). Queued for standby release.`;
        }
      } else {
        // Return structured 409 or 429
        if (conflict) {
          res.status(409).json({
            success: false,
            message: `Scheduling collision: This resource is already booked from ${new Date(
              conflict.startTime
            ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${new Date(
              conflict.endTime
            ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} on this date.`,
            canWaitlist: true,
            estimatedReleaseTime: conflict.endTime,
          });
          return;
        }
        if (activeLimitExceeded) {
          res.status(429).json({
            success: false,
            message: `Active reservation limit reached (${activeCount}/${fairPolicy.maxActiveBookingsPerStudent}). Complete or cancel an existing session first.`,
            canWaitlist: true,
          });
          return;
        }
      }
    } else {
      // 4. RESTRICTED EQUIPMENT GOVERNANCE RULE:
      // "Never automatically approve restricted equipment based only on an AI-generated result."
      if (resource.isRestricted || resource.approvalRequired) {
        finalStatus = 'pending'; // MUST BE PENDING FOR HUMAN CUSTODIAN
      } else {
        finalStatus = 'approved';
      }

      // If an AI-generated approval was attempted on restricted equipment, strictly intercept it
      if (aiApproved && (resource.isRestricted || resource.approvalRequired)) {
        finalStatus = 'pending';
      }
    }

    const formattedDate = date || parsedStart.toISOString().split('T')[0];
    const formattedTimeSlot =
      timeSlot ||
      `${parsedStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${parsedEnd.toLocaleTimeString(
        [],
        { hour: '2-digit', minute: '2-digit' }
      )}`;

    // Initial audit log entry
    const initialAudit = {
      transition: finalStatus === 'waitlisted' ? 'ENQUEUED_IN_WAITLIST' : 'RESERVATION_REQUESTED',
      fromStatus: 'none',
      toStatus: finalStatus,
      performedBy: req.user.name,
      performedByRole: req.user.role,
      timestamp: new Date(),
      note:
        finalStatus === 'waitlisted'
          ? `Waitlisted: ${waitlistReasonText} (Priority ${calculatedPriority})`
          : `Reservation requested for ${durationHours} hours: ${purpose}`,
    };

    // Calculate queue position if waitlisted
    let assignedQueuePos = 1;
    if (finalStatus === 'waitlisted') {
      const existingWaitlistCount = await Booking.countDocuments({
        resourceId: resource._id,
        status: 'waitlisted',
      });
      assignedQueuePos = existingWaitlistCount + 1;
    }

    // FairShare Transparent Resource Allocation Engine Evaluation
    const fairShareEval = await FairShareService.evaluateAllocation({
      userId: req.user._id,
      resourceId: resource._id,
      date: formattedDate,
      timeSlot: formattedTimeSlot,
      startTime: parsedStart,
      endTime: parsedEnd,
      allowWaitlist,
    });

    // Database-level race safeguard for simultaneous concurrent booking attempts
    if (finalStatus !== 'waitlisted') {
      const raceConflict = await Booking.findOne({
        resourceId: resource._id,
        status: { $in: ['approved', 'checked_in', 'return_pending', 'active'] },
        startTime: { $lt: parsedEnd },
        endTime: { $gt: parsedStart },
      });
      if (raceConflict) {
        if (!allowWaitlist) {
          res.status(409).json({
            success: false,
            message: `Simultaneous booking collision: Slot was just reserved by another user.`,
            canWaitlist: true,
            estimatedReleaseTime: raceConflict.endTime,
          });
          return;
        }
        finalStatus = 'waitlisted';
        waitlistReasonText = 'Simultaneous booking collision detected. Queued in priority standby.';
        const existingCount = await Booking.countDocuments({
          resourceId: resource._id,
          status: 'waitlisted',
        });
        assignedQueuePos = existingCount + 1;
      }
    }

    const booking = await Booking.create({
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
      status: finalStatus,
      waitlistReason: waitlistReasonText || undefined,
      waitlistPriority: calculatedPriority,
      queuePosition: finalStatus === 'waitlisted' ? assignedQueuePos : undefined,
      estimatedReleaseTime: conflict ? conflict.endTime : undefined,
      monopolisationDetected: monopolisation.monopolised,
      fairShareExplanation: fairShareEval.explanation,
      auditTrail: [initialAudit],
    });

    // Record in permanent FairShare Decision Ledger
    await FairShareService.recordDecision(booking, fairShareEval.explanation, req.user);

    // Immutable Audit Log in Central Ledger
    await recordAuditLog({
      action: finalStatus === 'waitlisted' ? 'WAITLIST_ENQUEUE' : 'BOOKING_REQUEST',
      entityType: 'Booking',
      entityId: booking._id,
      entityTitle: resource.name,
      actorId: req.user._id,
      actorName: req.user.name,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      details: {
        resourceId: resource._id,
        durationHours,
        status: finalStatus,
        monopolisationDetected: monopolisation.monopolised,
        priority: calculatedPriority,
        queuePosition: assignedQueuePos,
        isRestricted: resource.isRestricted,
      },
      reason: finalStatus === 'waitlisted' ? waitlistReasonText : purpose,
    });

    // Notify Resource Owner / Custodian
    if (resource.ownerId) {
      await Notification.create({
        userId: resource.ownerId,
        title: finalStatus === 'waitlisted' ? 'Waitlist Entry Queued' : 'New Booking Request Received',
        message: `${req.user.name} submitted a reservation request for "${resource.name}" on ${formattedDate} (${formattedTimeSlot}). Status: ${finalStatus}.`,
        type: 'booking',
        link: '/owner/requests',
        metadata: { bookingId: booking._id },
      });
    }

    // In-app Notification to Borrower
    let notifType: any = 'booking';
    let notifTitle = 'Booking Request Submitted';
    let notifMessage = `Your reservation request for "${resource.name}" is pending custodian review.`;

    if (finalStatus === 'approved') {
      notifType = 'booking_confirmed';
      notifTitle = 'Booking Confirmed!';
      notifMessage = `Your booking for "${resource.name}" on ${formattedDate} (${formattedTimeSlot}) is confirmed.`;
    } else if (finalStatus === 'waitlisted') {
      notifType = 'waitlist_update';
      notifTitle = 'Placed on Transparent Waiting List';
      notifMessage = `You are #${assignedQueuePos} in line for "${resource.name}". Reason: ${waitlistReasonText}`;
    }

    await Notification.create({
      userId: req.user._id,
      title: notifTitle,
      message: notifMessage,
      type: notifType,
      link: finalStatus === 'waitlisted' ? '/dashboard/waitlist' : '/dashboard/bookings',
      metadata: { bookingId: booking._id, queuePosition: assignedQueuePos },
    });

      res.status(201).json({
        success: true,
        message:
          finalStatus === 'approved'
            ? 'Reservation confirmed instantly.'
            : finalStatus === 'waitlisted'
            ? `Queued on transparent waiting list (#${assignedQueuePos} in line).`
            : 'Booking request submitted. Awaiting custodian verification.',
        data: booking,
      });
    });
  } catch (error) {
    next(error);
  }
};

// 3. List Current User's Bookings
export const getMyBookings = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { status, page = '1', limit = '50' } = req.query;
    const filter: any = { userId: req.user._id };

    if (status && status !== 'all') {
      filter.status = status;
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [bookings, total] = await Promise.all([
      Booking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Booking.countDocuments(filter),
    ]);

    const now = new Date();

    const enrichedBookings = bookings.map((b) => {
      const isOverdue =
        (b.status === 'checked_in' || b.status === 'return_pending') &&
        new Date(b.endTime) < now &&
        !b.checkedOut;

      const obj = b.toObject();
      return {
        ...obj,
        isOverdue,
      };
    });

    res.status(200).json({
      success: true,
      data: enrichedBookings,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// 4. Get Single Booking with Timeline & Diagnostic Details
export const getBookingById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    // Authorization Guard: Students may only view their own bookings
    if (
      req.user?.role === 'student' &&
      booking.userId.toString() !== req.user._id.toString()
    ) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have authorization to view this booking record.',
      });
      return;
    }

    const timeline = [
      { step: 1, key: 'requested', label: 'Reservation Requested', completed: true, date: booking.createdAt },
      {
        step: 2,
        key: 'review',
        label: 'Custodian Review',
        completed: ['under_review', 'approved', 'checked_in', 'return_pending', 'completed'].includes(booking.status),
        date: booking.updatedAt,
      },
      {
        step: 3,
        key: 'approved',
        label: 'Approved & Confirmed',
        completed: ['approved', 'checked_in', 'return_pending', 'completed'].includes(booking.status),
        date: booking.updatedAt,
      },
      {
        step: 4,
        key: 'check_in',
        label: 'Checked-In & Initial Condition',
        completed: booking.checkedIn || ['checked_in', 'return_pending', 'completed'].includes(booking.status),
        date: booking.checkedInAt,
      },
      {
        step: 5,
        key: 'return',
        label: 'Return Initiated',
        completed: booking.returnInitiated || ['return_pending', 'completed'].includes(booking.status),
        date: booking.returnInitiatedAt,
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
  } catch (error) {
    next(error);
  }
};

// 5. STEP 7: Put Booking Under Review
export const putBookingUnderReview = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    // Authorization Guard: Only resource owner or staff may put under review
    const resource = await Resource.findById(booking.resourceId);
    const isOwner = resource?.ownerId && resource.ownerId.toString() === req.user?._id.toString();
    const isStaff = req.user?.role === 'manager' || req.user?.role === 'admin';
    if (!isOwner && !isStaff) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Only the resource custodian or manager can review bookings.',
      });
      return;
    }

    // State Transition Guard
    if (booking.status !== 'pending') {
      res.status(400).json({
        success: false,
        message: `Invalid state transition: Cannot place booking in status '${booking.status}' under review.`,
      });
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
  } catch (error) {
    next(error);
  }
};

// 6. STEP 7 & 8: Approve Booking Request
export const approveBookingRequest = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    // Authorization Guard: Only resource custodian or staff may approve
    const resource = await Resource.findById(booking.resourceId);
    const isOwner = resource?.ownerId && resource.ownerId.toString() === req.user?._id.toString();
    const isStaff = req.user?.role === 'manager' || req.user?.role === 'admin';
    if (!isOwner && !isStaff) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Only the resource custodian or manager can approve reservations.',
      });
      return;
    }

    // State Transition Guard
    if (!['pending', 'under_review', 'waitlisted'].includes(booking.status)) {
      res.status(400).json({
        success: false,
        message: `Invalid state transition: Cannot approve booking currently in status '${booking.status}'.`,
      });
      return;
    }

    await resourceLock.withLock(booking.resourceId.toString(), async () => {
      // Double check conflict before approving
      const conflict = await Booking.findOne({
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

    // Immutable Audit Log
    await recordAuditLog({
      action: 'BOOKING_APPROVAL',
      entityType: 'Booking',
      entityId: booking._id,
      entityTitle: booking.resourceName,
      actorId: req.user?._id,
      actorName: req.user?.name || 'Custodian',
      actorEmail: req.user?.email,
      actorRole: req.user?.role || 'owner',
      details: {
        previousStatus,
        newStatus: 'approved',
        userId: booking.userId,
      },
      reason: 'Custodian verified eligibility and approved session.',
    });

    // In-app Notification for Approval
    await Notification.create({
      userId: booking.userId,
      title: 'Reservation Request Approved!',
      message: `Your booking for "${booking.resourceName}" on ${booking.date} (${booking.timeSlot}) has been approved. You may check in when your session starts.`,
      type: 'approval',
      link: '/dashboard/bookings',
      metadata: { bookingId: booking._id },
    });

      res.status(200).json({
        success: true,
        message: 'Reservation approved and confirmed. User notified.',
        data: booking,
      });
    });
  } catch (error) {
    next(error);
  }
};

// 7. STEP 7: Reject Booking Request with Mandatory Reason
export const rejectBookingRequest = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const reason = req.body.reason || req.body.rejectionReason;

    if (!reason || !reason.trim()) {
      res.status(400).json({
        success: false,
        message: 'A clear stated reason is mandatory when rejecting a reservation.',
      });
      return;
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    // Authorization Guard: Only resource custodian or staff may reject
    const resource = await Resource.findById(booking.resourceId);
    const isOwner = resource?.ownerId && resource.ownerId.toString() === req.user?._id.toString();
    const isStaff = req.user?.role === 'manager' || req.user?.role === 'admin';
    if (!isOwner && !isStaff) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Only the resource custodian or manager can reject reservations.',
      });
      return;
    }

    // State Transition Guard
    if (!['pending', 'under_review', 'waitlisted'].includes(booking.status)) {
      res.status(400).json({
        success: false,
        message: `Invalid state transition: Cannot reject booking currently in status '${booking.status}'.`,
      });
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

    // Immutable Audit Log
    await recordAuditLog({
      action: 'BOOKING_REJECTION',
      entityType: 'Booking',
      entityId: booking._id,
      entityTitle: booking.resourceName,
      actorId: req.user?._id,
      actorName: req.user?.name || 'Custodian',
      actorEmail: req.user?.email,
      actorRole: req.user?.role || 'owner',
      details: {
        previousStatus,
        newStatus: 'rejected',
        userId: booking.userId,
      },
      reason: reason.trim(),
    });

    // In-app Notification with Mandatory Reason
    await Notification.create({
      userId: booking.userId,
      title: 'Reservation Request Rejected',
      message: `Your booking for "${booking.resourceName}" was rejected. Reason: ${reason.trim()}`,
      type: 'rejection',
      link: '/dashboard/bookings',
      metadata: { bookingId: booking._id, reason: reason.trim() },
    });

    res.status(200).json({
      success: true,
      message: 'Reservation rejected and explanation dispatched to user.',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// 8. Move to Waitlist with Reason & Priority Scoring
export const waitlistBookingRequest = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason, priority } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    const userProfile = await User.findById(booking.userId);
    const resource = await Resource.findById(booking.resourceId);
    const fairPolicy = await FairAllocation.findOne();

    const waitlistReason = reason || 'Placed on standby queue due to high demand.';
    const waitlistPriority = priority || computeWaitlistPriority(userProfile, resource, fairPolicy);

    const existingWaitlistCount = await Booking.countDocuments({
      resourceId: booking.resourceId,
      status: 'waitlisted',
    });

    const previousStatus = booking.status;
    booking.status = 'waitlisted';
    booking.waitlistReason = waitlistReason;
    booking.waitlistPriority = waitlistPriority;
    booking.queuePosition = existingWaitlistCount + 1;

    booking.auditTrail.push({
      transition: 'MOVED_TO_WAITLIST',
      fromStatus: previousStatus,
      toStatus: 'waitlisted',
      performedBy: req.user?.name || 'Lab Custodian',
      performedByRole: req.user?.role || 'owner',
      timestamp: new Date(),
      note: `Waitlisted: ${waitlistReason} (Priority ${waitlistPriority}, Queue #${booking.queuePosition})`,
    });

    await booking.save();

    // Immutable Audit Log
    await recordAuditLog({
      action: 'WAITLIST_ENQUEUE',
      entityType: 'Booking',
      entityId: booking._id,
      entityTitle: booking.resourceName,
      actorId: req.user?._id,
      actorName: req.user?.name || 'Custodian',
      actorEmail: req.user?.email,
      actorRole: req.user?.role || 'owner',
      details: {
        queuePosition: booking.queuePosition,
        priority: waitlistPriority,
        userId: booking.userId,
      },
      reason: waitlistReason,
    });

    // In-app Notification for Waitlist Update
    await Notification.create({
      userId: booking.userId,
      title: 'Placed on Priority Waitlist',
      message: `Your booking for "${booking.resourceName}" is waitlisted (#${booking.queuePosition} in line). Reason: ${waitlistReason}`,
      type: 'waitlist_update',
      link: '/dashboard/waitlist',
      metadata: { bookingId: booking._id, queuePosition: booking.queuePosition },
    });

    res.status(200).json({
      success: true,
      message: 'User moved to priority waitlist.',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// 9. STEP 9 & 10: Check-In & Condition Documentation (Before Use)
// Requirement: Condition notes, photos if upload configured, timestamp, user confirmation
export const checkInBooking = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      conditionNotes,
      meterReading,
      cleanliness,
      operationalStatus,
      photos = [],
      userConfirmation = true,
    } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    // State Transition Guard
    if (booking.status !== 'approved') {
      res.status(400).json({
        success: false,
        message: `Invalid state transition: Cannot check in to reservation with status '${booking.status}'. Booking must be 'approved'.`,
      });
      return;
    }

    // Authorization Guard: Borrower, resource custodian, or staff
    const resource = await Resource.findById(booking.resourceId);
    const isBorrower = booking.userId.toString() === req.user?._id.toString();
    const isOwner = resource?.ownerId && resource.ownerId.toString() === req.user?._id.toString();
    const isStaff = req.user?.role === 'manager' || req.user?.role === 'admin';
    if (!isBorrower && !isOwner && !isStaff) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to perform check-in for this reservation.',
      });
      return;
    }

    const previousStatus = booking.status;
    const checkInTime = new Date();
    booking.checkedIn = true;
    booking.checkedInAt = checkInTime;
    booking.status = 'checked_in';
    booking.isOverdue = false;

    const photoList = Array.isArray(photos) ? photos : [photos].filter(Boolean);

    booking.initialCondition = {
      conditionNotes: conditionNotes || 'Equipment verified operational prior to handover.',
      meterReading: meterReading || '0 hrs',
      cleanliness: cleanliness || 'passed',
      operationalStatus: operationalStatus || 'optimal',
      photos: photoList,
      userConfirmation: Boolean(userConfirmation),
      timestamp: checkInTime,
      recordedBy: req.user?.name || booking.userName,
      recordedAt: checkInTime,
    };

    booking.auditTrail.push({
      transition: 'CHECK_IN_PERFORMED',
      fromStatus: previousStatus,
      toStatus: 'checked_in',
      performedBy: req.user?.name || booking.userName,
      performedByRole: req.user?.role || 'student',
      timestamp: checkInTime,
      note: `Check-in completed. Condition: ${booking.initialCondition.operationalStatus}. Photos: ${photoList.length}. Notes: ${booking.initialCondition.conditionNotes}`,
    });

    await booking.save();

    // Record Condition Documentation in ConditionReport
    await ConditionReport.create({
      resourceId: booking.resourceId,
      resourceName: booking.resourceName,
      bookingId: booking._id,
      inspectorName: req.user?.name || booking.userName,
      inspectorRole: req.user?.role || 'student',
      type: 'check_in',
      operationalStatus: operationalStatus || 'optimal',
      cleanliness: cleanliness || 'passed',
      meterReading: meterReading || '0',
      conditionNotes: conditionNotes || 'Initial check-in inspection signed off.',
      observations: conditionNotes || 'Initial check-in inspection signed off.',
      photos: photoList,
      timestamp: checkInTime,
      userConfirmation: Boolean(userConfirmation),
      userConfirmedAt: checkInTime,
      signoffConfirmed: true,
    });

    // Mark resource as in_use
    await Resource.findByIdAndUpdate(booking.resourceId, { status: 'in_use' });

    // Immutable Audit Log
    await recordAuditLog({
      action: 'CHECK_IN',
      entityType: 'Booking',
      entityId: booking._id,
      entityTitle: booking.resourceName,
      actorId: req.user?._id,
      actorName: req.user?.name || booking.userName,
      actorEmail: req.user?.email,
      actorRole: req.user?.role || 'student',
      details: {
        operationalStatus: booking.initialCondition.operationalStatus,
        photosCount: photoList.length,
        userConfirmation: Boolean(userConfirmation),
        timestamp: checkInTime,
      },
      reason: conditionNotes || 'Initial check-in condition documentation recorded.',
    });

    res.status(200).json({
      success: true,
      message: 'Check-in verified! Initial condition & borrower confirmation recorded. Session active.',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// 10. STEP 12: User Initiates Return & Condition Documentation (After Use - Borrower Handover)
export const initiateReturn = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      conditionNotes,
      meterReading,
      cleanliness,
      operationalStatus,
      photos = [],
      userConfirmation = true,
    } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    // State Transition Guard
    if (booking.status !== 'checked_in' && booking.status !== 'overdue') {
      res.status(400).json({
        success: false,
        message: `Invalid state transition: Cannot initiate return for reservation currently in status '${booking.status}'. Session must be 'checked_in' or 'overdue'.`,
      });
      return;
    }

    // Authorization Guard: Borrower, resource custodian, or staff
    const resource = await Resource.findById(booking.resourceId);
    const isBorrower = booking.userId.toString() === req.user?._id.toString();
    const isOwner = resource?.ownerId && resource.ownerId.toString() === req.user?._id.toString();
    const isStaff = req.user?.role === 'manager' || req.user?.role === 'admin';
    if (!isBorrower && !isOwner && !isStaff) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to initiate return for this reservation.',
      });
      return;
    }

    const previousStatus = booking.status;
    const returnTime = new Date();
    booking.returnInitiated = true;
    booking.returnInitiatedAt = returnTime;
    booking.status = 'return_pending';
    booking.isOverdue = false;

    const photoList = Array.isArray(photos) ? photos : [photos].filter(Boolean);

    booking.returnCondition = {
      conditionNotes: conditionNotes || 'Equipment session completed and ready for custodian handback.',
      meterReading: meterReading || '',
      cleanliness: cleanliness || 'passed',
      operationalStatus: operationalStatus || 'optimal',
      photos: photoList,
      userConfirmation: Boolean(userConfirmation),
      timestamp: returnTime,
      recordedBy: req.user?.name || booking.userName,
      recordedAt: returnTime,
    };

    booking.auditTrail.push({
      transition: 'RETURN_INITIATED',
      fromStatus: previousStatus,
      toStatus: 'return_pending',
      performedBy: req.user?.name || booking.userName,
      performedByRole: req.user?.role || 'student',
      timestamp: returnTime,
      note: `Return initiated by borrower. Return condition: ${booking.returnCondition.operationalStatus}. Photos: ${photoList.length}. Notes: ${booking.returnCondition.conditionNotes}`,
    });

    await booking.save();

    // Immutable Audit Log
    await recordAuditLog({
      action: 'CONDITION_REPORT',
      entityType: 'Booking',
      entityId: booking._id,
      entityTitle: booking.resourceName,
      actorId: req.user?._id,
      actorName: req.user?.name || booking.userName,
      actorEmail: req.user?.email,
      actorRole: req.user?.role || 'student',
      details: {
        stage: 'return_handover',
        operationalStatus: booking.returnCondition.operationalStatus,
        photosCount: photoList.length,
      },
      reason: conditionNotes || 'Borrower return condition logged.',
    });

    // Alert owner to perform final sign-off inspection
    if (resource?.ownerId) {
      await Notification.create({
        userId: resource.ownerId,
        title: 'Return Inspection Sign-off Required',
        message: `${booking.userName} completed their session with "${booking.resourceName}" and requested return sign-off.`,
        type: 'maintenance',
        link: '/owner/checkin',
        metadata: { bookingId: booking._id },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Return submitted successfully. Custodian notified for handover inspection sign-off.',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// 11. STEP 13 & 14: Owner Confirms Return & Completes (After Use - Final Condition & Owner Confirmation)
export const confirmReturnAndComplete = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      finalNotes,
      meterReading,
      conditionStatus,
      photos = [],
      ownerConfirmation = true,
    } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    // State Transition Guard
    if (!['return_pending', 'checked_in', 'overdue'].includes(booking.status)) {
      res.status(400).json({
        success: false,
        message: `Invalid state transition: Cannot sign off or complete booking with status '${booking.status}'.`,
      });
      return;
    }

    // Authorization Guard: Only resource custodian or staff may sign off return
    const resource = await Resource.findById(booking.resourceId);
    const isOwner = resource?.ownerId && resource.ownerId.toString() === req.user?._id.toString();
    const isStaff = req.user?.role === 'manager' || req.user?.role === 'admin';
    if (!isOwner && !isStaff) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Only the resource custodian or manager can sign off return inspections.',
      });
      return;
    }

    const previousStatus = booking.status;
    const completeTime = new Date();
    booking.checkedOut = true;
    booking.checkedOutAt = completeTime;
    booking.status = 'completed';
    booking.conditionOnCheckout = finalNotes || booking.returnCondition?.conditionNotes || 'Pristine return';
    booking.isOverdue = false;

    const photoList = Array.isArray(photos) ? photos : [photos].filter(Boolean);

    booking.auditTrail.push({
      transition: 'RETURN_CONFIRMED_COMPLETED',
      fromStatus: previousStatus,
      toStatus: 'completed',
      performedBy: req.user?.name || 'Lab Custodian',
      performedByRole: req.user?.role || 'owner',
      timestamp: completeTime,
      note: `Return confirmed & inspected by custodian. Final condition: ${conditionStatus || 'optimal'}. Owner Confirmed: ${ownerConfirmation}. Photos: ${photoList.length}. ${finalNotes || ''}`,
    });

    await booking.save();

    // Create Final Condition Report with Photos & Owner Confirmation
    await ConditionReport.create({
      resourceId: booking.resourceId,
      resourceName: booking.resourceName,
      bookingId: booking._id,
      inspectorName: req.user?.name || 'Lab Custodian',
      inspectorRole: req.user?.role || 'owner',
      type: 'check_out',
      operationalStatus: conditionStatus || 'optimal',
      cleanliness: 'passed',
      meterReading: meterReading || booking.returnCondition?.meterReading || '0',
      conditionNotes: finalNotes || 'Return inspection finalized and signed off by custodian.',
      observations: finalNotes || 'Return inspection finalized and logged into institutional ledger.',
      photos: photoList,
      timestamp: completeTime,
      ownerConfirmation: Boolean(ownerConfirmation),
      ownerConfirmedAt: completeTime,
      signoffConfirmed: true,
    });

    // Reset resource status to available and increment bookings count
    await Resource.findByIdAndUpdate(booking.resourceId, {
      status: 'available',
      $inc: { totalBookings: 1 },
    });

    // Update Historical Resource Usage for the Student
    await User.findByIdAndUpdate(booking.userId, {
      $inc: {
        'historicalUsage.totalCompletedBookings': 1,
        'historicalUsage.totalHoursLogged': booking.durationHours || 1,
        'historicalUsage.weeklyHoursUsed': booking.durationHours || 1,
      },
    });

    // Immutable Audit Log
    await recordAuditLog({
      action: 'CHECK_OUT',
      entityType: 'Booking',
      entityId: booking._id,
      entityTitle: booking.resourceName,
      actorId: req.user?._id,
      actorName: req.user?.name || 'Custodian',
      actorEmail: req.user?.email,
      actorRole: req.user?.role || 'owner',
      details: {
        finalStatus: 'completed',
        conditionStatus: conditionStatus || 'optimal',
        photosCount: photoList.length,
        ownerConfirmation: Boolean(ownerConfirmation),
        hoursLogged: booking.durationHours || 1,
      },
      reason: finalNotes || 'Session successfully signed off and completed.',
    });

    // In-app Notification to Borrower of Completed Session
    await Notification.create({
      userId: booking.userId,
      title: 'Session Successfully Completed',
      message: `Your return of "${booking.resourceName}" was inspected and signed off. Thank you for maintaining campus equipment!`,
      type: 'booking_confirmed',
      link: '/dashboard/bookings',
      metadata: { bookingId: booking._id },
    });

    // CHECK FOR HIGHEST PRIORITY WAITLISTED RESERVATION TO PROMOTE
    const nextWaitlisted = await Booking.findOne({
      resourceId: booking.resourceId,
      status: 'waitlisted',
    }).sort({ waitlistPriority: -1, createdAt: 1 });

    if (nextWaitlisted) {
      nextWaitlisted.status = 'approved';
      nextWaitlisted.auditTrail.push({
        transition: 'PROMOTED_FROM_WAITLIST',
        fromStatus: 'waitlisted',
        toStatus: 'approved',
        performedBy: 'Fairness Engine',
        performedByRole: 'system',
        timestamp: new Date(),
        note: `Automatically promoted from waitlist upon resource release (Priority ${nextWaitlisted.waitlistPriority})`,
      });
      await nextWaitlisted.save();

      // Audit Log for Promotion
      await recordAuditLog({
        action: 'WAITLIST_PROMOTION',
        entityType: 'Booking',
        entityId: nextWaitlisted._id,
        entityTitle: nextWaitlisted.resourceName,
        actorName: 'RENTORA Fairness Engine',
        actorRole: 'system',
        details: {
          previousStatus: 'waitlisted',
          newStatus: 'approved',
          priority: nextWaitlisted.waitlistPriority,
          promotedForUser: nextWaitlisted.userId,
        },
        reason: 'Asset slot freed upon session completion.',
      });

      // Notify promoted user
      await Notification.create({
        userId: nextWaitlisted.userId,
        title: 'Waitlist Promotion: Booking Confirmed!',
        message: `Great news! A slot opened for "${nextWaitlisted.resourceName}". Your reservation is now approved and confirmed.`,
        type: 'approval',
        link: '/dashboard/bookings',
        metadata: { bookingId: nextWaitlisted._id },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Return confirmed and signed off. Booking lifecycle successfully completed!',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// 12. Cancel Booking with Mandatory Stated Reason
export const cancelBooking = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
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

    const booking = await Booking.findById(id);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    // Authorization Guard: Only the reservation owner or staff may cancel
    const isOwner = booking.userId.toString() === req.user?._id.toString();
    const isStaff = req.user?.role === 'manager' || req.user?.role === 'admin';
    if (!isOwner && !isStaff) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You are only permitted to cancel your own reservations.',
      });
      return;
    }

    // State Transition Guard
    if (!['pending', 'under_review', 'approved', 'waitlisted'].includes(booking.status)) {
      res.status(400).json({
        success: false,
        message: `Invalid state transition: Cannot cancel a reservation currently in status '${booking.status}'. Active or completed sessions cannot be cancelled.`,
      });
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
    await Resource.findByIdAndUpdate(booking.resourceId, { status: 'available' });

    // Advance waitlist and notify next eligible user
    await FairShareService.advanceWaitlist(booking.resourceId, booking.date, booking.timeSlot, booking._id?.toString());

    // Immutable Audit Log
    await recordAuditLog({
      action: 'BOOKING_CANCELLATION',
      entityType: 'Booking',
      entityId: booking._id,
      entityTitle: booking.resourceName,
      actorId: req.user?._id,
      actorName: req.user?.name || 'User',
      actorEmail: req.user?.email,
      actorRole: req.user?.role || 'student',
      details: {
        previousStatus,
        newStatus: 'cancelled',
        userId: booking.userId,
      },
      reason: reason.trim(),
    });

    // Notify user
    await Notification.create({
      userId: booking.userId,
      title: 'Reservation Cancelled',
      message: `Your booking for "${booking.resourceName}" has been cancelled. Reason: ${reason.trim()}`,
      type: 'booking',
      metadata: { bookingId: booking._id },
    });

    res.status(200).json({
      success: true,
      message: 'Booking cancelled.',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// 13. MANAGER OVERRIDE WITH MANDATORY REASON
// Requirement: Provide manager override with a mandatory reason
export const managerOverrideBooking = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user?.role !== 'manager' && req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Manager or administrator credentials required to perform override.',
      });
      return;
    }

    const { id } = req.params;
    const { mandatoryReason, action = 'approve' } = req.body;

    if (!mandatoryReason || mandatoryReason.trim().length < 10) {
      res.status(400).json({
        success: false,
        message: 'A mandatory, detailed justification (minimum 10 characters) is required for manager overrides.',
      });
      return;
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found.' });
      return;
    }

    const previousStatus = booking.status;
    booking.status = 'approved';
    booking.managerOverrideReason = mandatoryReason.trim();
    booking.managerOverriddenBy = req.user.name;

    booking.auditTrail.push({
      transition: 'MANAGER_OVERRIDE',
      fromStatus: previousStatus,
      toStatus: 'approved',
      performedBy: req.user.name,
      performedByRole: req.user.role,
      timestamp: new Date(),
      note: `Manager override executed (${action}): ${mandatoryReason.trim()}`,
    });

    await booking.save();

    // Immutable Audit Log
    await recordAuditLog({
      action: 'MANAGER_OVERRIDE',
      entityType: 'Booking',
      entityId: booking._id,
      entityTitle: booking.resourceName,
      actorId: req.user._id,
      actorName: req.user.name,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      details: {
        action,
        previousStatus,
        newStatus: 'approved',
        userId: booking.userId,
      },
      reason: mandatoryReason.trim(),
    });

    // In-app Notification for User
    await Notification.create({
      userId: booking.userId,
      title: 'Booking Approved via Manager Override',
      message: `Your booking for "${booking.resourceName}" was authorized by institutional management: ${mandatoryReason.trim()}`,
      type: 'approval',
      link: '/dashboard/bookings',
      metadata: { bookingId: booking._id, managerOverride: true },
    });

    res.status(200).json({
      success: true,
      message: 'Manager override applied successfully. Immutable audit log recorded.',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// 14. GET TRANSPARENT WAITING LIST
// Requirement: Implement transparent waiting lists, show users why they were waitlisted, exact queue position
export const getTransparentWaitlist = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query: any = { status: 'waitlisted' };
    if (req.user?.role === 'student') {
      query.userId = req.user._id;
    }

    const pageNum = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [waitlistedBookings, total] = await Promise.all([
      Booking.find(query).sort({ waitlistPriority: -1, createdAt: 1 }).skip(skip).limit(limitNum),
      Booking.countDocuments(query),
    ]);

    // Dynamic queue position and release calculation
    const resourceQueues: Record<string, number> = {};
    const enrichedWaitlist = await Promise.all(
      waitlistedBookings.map(async (b) => {
        const resKey = b.resourceId.toString();
        resourceQueues[resKey] = (resourceQueues[resKey] || 0) + 1;
        const currentQueuePos = resourceQueues[resKey];

        // Find active booking on this asset to estimate availability
        const activeSession = await Booking.findOne({
          resourceId: b.resourceId,
          status: { $in: ['approved', 'checked_in', 'return_pending'] },
        }).sort({ endTime: -1 });

        return {
          ...b.toObject(),
          queuePosition: currentQueuePos,
          estimatedReleaseTime: activeSession ? activeSession.endTime : b.estimatedReleaseTime,
          transparencyRationale: b.waitlistReason || 'High campus demand. Queued according to fair allocation priority.',
        };
      })
    );

    res.status(200).json({
      success: true,
      data: enrichedWaitlist,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};
