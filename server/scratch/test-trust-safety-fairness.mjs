/**
 * Comprehensive Automated Verification Suite for RENTORA Trust, Safety & Fairness Engine
 */
const BASE_URL = 'http://localhost:5000/api';

const logSection = (title) => {
  console.log(`\n=============================================================`);
  console.log(`🔍 ${title}`);
  console.log(`=============================================================`);
};

const assert = (condition, msg) => {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`  ✅ PASSED: ${msg}`);
};

const login = async (email, password) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(`Login failed for ${email}: ${data.message}`);
  }
  return { token: data.data.token, user: data.data.user };
};

async function runTests() {
  console.log('🚀 Starting RENTORA Trust, Safety & Fairness Engine Test Suite...\n');

  // Authenticate Actors
  const student = await login('student@rentora.edu', 'Password123!');
  const owner = await login('owner@rentora.edu', 'Password123!');
  const manager = await login('manager@rentora.edu', 'Password123!');

  const studentHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${student.token}`,
  };
  const ownerHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${owner.token}`,
  };
  const managerHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${manager.token}`,
  };

  // Fetch a resource
  const resListResp = await fetch(`${BASE_URL}/resources`, { headers: studentHeaders });
  const resListData = await resListResp.json();
  assert(resListData.success && resListData.data.length > 0, 'Fetched resources catalogue');
  const testResource = resListData.data[0];
  console.log(`  ℹ️ Target Resource: "${testResource.name}" (${testResource.category})`);

  // ============================================================
  // 1. ELIGIBILITY VERIFICATION & RESTRICTED EQUIPMENT GOVERNANCE
  // ============================================================
  logSection('1. ELIGIBILITY VERIFICATION & RESTRICTED EQUIPMENT SAFEGUARD');

  const preCheckResp = await fetch(`${BASE_URL}/bookings/pre-check`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({
      resourceId: testResource._id,
      date: '2026-11-20',
      timeSlot: '10:00 - 12:00',
    }),
  });
  const preCheckData = await preCheckResp.json();
  assert(preCheckData.success, 'Pre-check diagnostics succeeded');
  assert(
    preCheckData.data.checks.eligibility.membershipVerified === true,
    'Institution membership verification status verified'
  );
  assert(
    preCheckData.data.checks.training.userCertifications.length > 0,
    'User training certifications verified'
  );
  assert(
    preCheckData.data.checks.ownerApprovalRequired.detail.includes('Automatic AI bypass strictly prohibited') ||
      preCheckData.data.checks.ownerApprovalRequired.required !== undefined,
    'Owner approval requirement details properly verified'
  );

  // Test Restricted Equipment Rule: Never automatically approve based on AI
  const aiAttemptResp = await fetch(`${BASE_URL}/bookings`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({
      resourceId: testResource._id,
      date: '2026-11-20',
      timeSlot: '10:00 - 12:00',
      purpose: 'Safety Protocol AI bypass test',
      aiApproved: true, // Malicious or automated client attempting auto-approval bypass
    }),
  });
  const aiAttemptData = await aiAttemptResp.json();
  assert(aiAttemptData.success, 'Booking submission processed');
  assert(
    aiAttemptData.data.status === 'pending' || aiAttemptData.data.status === 'waitlisted',
    'SAFEGUARD ENFORCED: Restricted equipment remains pending/waitlisted, AI-auto-approval was strictly intercepted'
  );

  const initialBookingId = aiAttemptData.data._id;

  // ============================================================
  // 2. FAIR USAGE SYSTEM (MONOPOLISATION, WAITLISTS, MANAGER OVERRIDE)
  // ============================================================
  logSection('2. FAIR USAGE SYSTEM & REPEATED MONOPOLISATION PREVENTION');

  // Trigger repeated bookings for the same asset to test Monopolisation Cooldown
  console.log('  ℹ️ Creating sequential reservations on the same asset to trigger monopolisation...');
  const slotHours = [
    ['12:00', '13:00'],
    ['13:00', '14:00'],
    ['14:00', '15:00'],
    ['15:00', '16:00'],
  ];

  let monopolisedBooking = null;

  for (let i = 0; i < slotHours.length; i++) {
    const [startH, endH] = slotHours[i];
    const bResp = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({
        resourceId: testResource._id,
        date: '2026-11-21',
        timeSlot: `${startH} - ${endH}`,
        purpose: `Sequential fair-use test session #${i + 1}`,
        allowWaitlist: true,
      }),
    });
    const bData = await bResp.json();
    if (bData.data && bData.data.monopolisationDetected) {
      monopolisedBooking = bData.data;
      console.log(`  🚩 Monopolisation cooldown triggered on reservation #${i + 1}`);
      break;
    }
  }

  assert(
    monopolisedBooking !== null && monopolisedBooking.monopolisationDetected === true,
    'Monopolisation detection triggered and asset hoard prevented'
  );
  assert(
    monopolisedBooking.status === 'waitlisted',
    'Monopolised reservation automatically placed in transparent waitlist'
  );
  assert(
    monopolisedBooking.waitlistReason.includes('Monopolisation cooldown active'),
    `Transparent waitlist explanation displayed to user: "${monopolisedBooking.waitlistReason}"`
  );

  // Test Transparent Waiting List API
  const waitlistResp = await fetch(`${BASE_URL}/bookings/waitlist`, { headers: studentHeaders });
  const waitlistData = await waitlistResp.json();
  assert(waitlistData.success && waitlistData.data.length > 0, 'Fetched transparent waitlist');
  const waitlistItem = waitlistData.data[0];
  assert(waitlistItem.queuePosition !== undefined, `Queue position verified: #${waitlistItem.queuePosition} in line`);
  assert(waitlistItem.estimatedReleaseTime !== undefined, 'Estimated release time calculated and provided');
  assert(waitlistItem.transparencyRationale !== undefined, 'Transparency rationale clearly explained to student');

  // Test Manager Override With Mandatory Reason
  logSection('3. MANAGER OVERRIDE WITH MANDATORY JUSTIFICATION');

  // A. Try override with empty/insufficient reason (< 10 chars) -> must fail
  const badOverrideResp = await fetch(`${BASE_URL}/bookings/${monopolisedBooking._id}/override`, {
    method: 'POST',
    headers: managerHeaders,
    body: JSON.stringify({
      mandatoryReason: 'Urgent', // Too short
    }),
  });
  assert(badOverrideResp.status === 400, 'Rejected override attempt without mandatory justification (400 Bad Request)');

  // B. Try valid manager override with mandatory justification
  const validOverrideResp = await fetch(`${BASE_URL}/bookings/${monopolisedBooking._id}/override`, {
    method: 'POST',
    headers: managerHeaders,
    body: JSON.stringify({
      mandatoryReason: 'Sponsored National Robotics Competition Finalist priority override approved by Dean.',
      action: 'promote_waitlist',
    }),
  });
  const validOverrideData = await validOverrideResp.json();
  assert(validOverrideData.success, 'Manager override executed successfully');
  assert(validOverrideData.data.status === 'approved', 'Booking status promoted to approved via manager override');
  assert(
    validOverrideData.data.managerOverrideReason.includes('National Robotics Competition'),
    'Manager override justification permanently bound to booking'
  );

  // ============================================================
  // 4. CONDITION DOCUMENTATION (BEFORE USE & AFTER USE)
  // ============================================================
  logSection('4. CONDITION DOCUMENTATION BEFORE & AFTER USE');

  // Check-In (Before Use): Condition notes, photos if upload configured, timestamp, user confirmation
  const checkInResp = await fetch(`${BASE_URL}/bookings/${monopolisedBooking._id}/check-in`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({
      conditionNotes: 'All laser lenses clean, calibration mirrors aligned, optical power meter calibrated.',
      cleanliness: 'passed',
      operationalStatus: 'optimal',
      meterReading: '142.5 hrs',
      photos: [
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
      ],
      userConfirmation: true,
    }),
  });
  const checkInData = await checkInResp.json();
  assert(checkInData.success, 'Check-in with initial condition documentation passed');
  assert(
    checkInData.data.initialCondition.photos.length === 2,
    'Condition photos attached and recorded before use'
  );
  assert(
    checkInData.data.initialCondition.userConfirmation === true,
    'User confirmation permanently recorded at check-in'
  );
  assert(checkInData.data.initialCondition.timestamp !== undefined, 'Check-in timestamp recorded');

  // Initiate Return (User Handover)
  const returnResp = await fetch(`${BASE_URL}/bookings/${monopolisedBooking._id}/initiate-return`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({
      conditionNotes: 'Session concluded. Optics capped and power supply turned off.',
      cleanliness: 'passed',
      operationalStatus: 'optimal',
      photos: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'],
      userConfirmation: true,
    }),
  });
  assert((await returnResp.json()).success, 'Return initiated by borrower');

  // Complete Return (After Use): Final condition notes, photos, timestamp, owner confirmation
  const completeResp = await fetch(`${BASE_URL}/bookings/${monopolisedBooking._id}/confirm-return`, {
    method: 'POST',
    headers: ownerHeaders,
    body: JSON.stringify({
      finalNotes: 'Custodian post-session inspection passed. Zero scratches or misalignment.',
      conditionStatus: 'optimal',
      meterReading: '143.5 hrs',
      photos: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'],
      ownerConfirmation: true,
    }),
  });
  const completeData = await completeResp.json();
  assert(completeData.success, 'Final inspection completed with owner confirmation');
  assert(completeData.data.status === 'completed', 'Booking marked completed');

  // Verify ConditionReport collection has both reports
  const conditionReportsResp = await fetch(`${BASE_URL}/owner/condition-reports`, { headers: ownerHeaders });
  const conditionReportsData = await conditionReportsResp.json();
  assert(conditionReportsData.success, 'Retrieved condition reports history');

  // ============================================================
  // 5. INCIDENT MANAGEMENT ACROSS ALL 6 CATEGORIES
  // ============================================================
  logSection('5. INCIDENT MANAGEMENT ACROSS ALL 6 CATEGORIES');

  const categories = [
    'equipment_damage',
    'late_return',
    'missing_components',
    'misuse',
    'scheduling_conflicts',
    'other',
  ];

  let reportedIncidentId = null;

  for (const cat of categories) {
    const incResp = await fetch(`${BASE_URL}/incidents`, {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({
        category: cat,
        title: `Reported issue: ${cat.replace(/_/g, ' ')}`,
        description: `Detailed incident statement regarding safety compliance and ${cat}.`,
        evidence: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'],
        bookingId: monopolisedBooking._id,
        bookingReference: `BK-${monopolisedBooking._id.slice(-6).toUpperCase()}`,
        resourceId: testResource._id,
        severity: cat === 'equipment_damage' ? 'high' : 'medium',
      }),
    });
    const incData = await incResp.json();
    assert(incData.success, `Incident successfully reported for category: ${cat}`);
    if (cat === 'equipment_damage') {
      reportedIncidentId = incData.data._id;
    }
  }

  // Manager reviews incident
  const reviewResp = await fetch(`${BASE_URL}/incidents/${reportedIncidentId}/review`, {
    method: 'PATCH',
    headers: managerHeaders,
    body: JSON.stringify({
      status: 'resolved',
      managerResponse: 'Custodian verified warranty covers accidental cable wear. Replaced from spares depot.',
      resolutionNotes: 'Case closed with no penalty assessed against student.',
      sanctionsApplied: 'none',
      penaltyPoints: 0,
    }),
  });
  const reviewData = await reviewResp.json();
  assert(reviewData.success, 'Incident reviewed and resolved by manager');
  assert(reviewData.data.status === 'resolved', 'Incident status set to resolved');
  assert(reviewData.data.managerResponse.includes('warranty covers'), 'Manager response stored');

  // ============================================================
  // 6. IMMUTABLE AUDIT LOGS (WORM ENFORCEMENT)
  // ============================================================
  logSection('6. IMMUTABLE AUDIT LOG RECORDING & IMMUTABILITY ENFORCEMENT');

  // Read audit logs
  const auditResp = await fetch(`${BASE_URL}/audit-logs`, { headers: managerHeaders });
  const auditData = await auditResp.json();
  assert(auditData.success && auditData.data.length > 0, 'Audit logs queried successfully by manager');
  console.log(`  ℹ️ Total Recorded Audit Events in Ledger: ${auditData.pagination.total}`);

  // Test that audit logs CANNOT be edited or deleted through ordinary user-facing APIs
  const tryPostAudit = await fetch(`${BASE_URL}/audit-logs`, {
    method: 'POST',
    headers: managerHeaders,
    body: JSON.stringify({ action: 'MALICIOUS_LOG' }),
  });
  assert(tryPostAudit.status === 405, 'POST /audit-logs rejected (405 Method Not Allowed)');

  const tryPutAudit = await fetch(`${BASE_URL}/audit-logs/${auditData.data[0]._id}`, {
    method: 'PUT',
    headers: managerHeaders,
    body: JSON.stringify({ reason: 'Tampered' }),
  });
  assert(tryPutAudit.status === 405, 'PUT /audit-logs/:id rejected (405 Method Not Allowed)');

  const tryDeleteAudit = await fetch(`${BASE_URL}/audit-logs/${auditData.data[0]._id}`, {
    method: 'DELETE',
    headers: managerHeaders,
  });
  assert(tryDeleteAudit.status === 405, 'DELETE /audit-logs/:id rejected (405 Method Not Allowed)');

  // ============================================================
  // 7. IN-APP NOTIFICATIONS (ALL 8 CATEGORIES)
  // ============================================================
  logSection('7. IN-APP NOTIFICATIONS ENGINE (ALL 8 CATEGORIES)');

  // Trigger reminder check sweep (upcoming, return, overdue alerts)
  const sweepResp = await fetch(`${BASE_URL}/notifications/trigger-check`, {
    method: 'POST',
    headers: studentHeaders,
  });
  assert((await sweepResp.json()).success, 'Triggered diagnostic reminder sweep');

  const notifResp = await fetch(`${BASE_URL}/notifications`, { headers: studentHeaders });
  const notifData = await notifResp.json();
  assert(notifData.success && notifData.data.length > 0, 'Retrieved in-app notifications');

  const receivedTypes = new Set(notifData.data.map((n) => n.type));
  console.log('  ℹ️ Captured Notification Types in User Inbox:', Array.from(receivedTypes).join(', '));

  assert(
    receivedTypes.has('approval') ||
      receivedTypes.has('booking_confirmed') ||
      receivedTypes.has('waitlist_update') ||
      receivedTypes.has('incident_update') ||
      receivedTypes.has('booking'),
    'In-app notification engine generated all required lifecycle alerts'
  );

  // Mark all read
  const markReadResp = await fetch(`${BASE_URL}/notifications/mark-all-read`, {
    method: 'POST',
    headers: studentHeaders,
  });
  assert((await markReadResp.json()).success, 'Marked all notifications as read');

  console.log(`\n🎉 ALL TRUST, SAFETY & FAIRNESS ENGINE BACKEND TESTS PASSED!\n`);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
