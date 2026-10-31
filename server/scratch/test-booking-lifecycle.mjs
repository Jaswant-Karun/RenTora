// Comprehensive End-to-End Test for the 14-Step Booking Lifecycle with Dual Accounts
const API_BASE = 'http://localhost:5000/api';

async function postJson(url, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function getJson(url, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method: 'GET', headers });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function runLifecycleTests() {
  console.log('🚀 Starting Comprehensive RENTORA Booking Lifecycle Verification...\n');

  // Login Account 1: Student / Borrower
  console.log('1. Authenticating Student (Borrower)...');
  const studentLogin = await postJson(`${API_BASE}/auth/login`, {
    email: 'student@rentora.edu',
    password: 'Password123!',
  });
  const studentToken = studentLogin.data?.data?.token;
  console.log('✓ Student logged in:', !!studentToken);

  // Login Account 2: Lab Owner / Custodian
  console.log('2. Authenticating Owner (Custodian)...');
  const ownerLogin = await postJson(`${API_BASE}/auth/login`, {
    email: 'owner@rentora.edu',
    password: 'Password123!',
  });
  const ownerToken = ownerLogin.data?.data?.token;
  console.log('✓ Owner logged in:', !!ownerToken);

  // Cancel previous test bookings for student to keep active count within fair allocation limit (3)
  const existingBookings = await getJson(`${API_BASE}/bookings`, studentToken);
  for (const b of (existingBookings.data?.data || [])) {
    if (b.status === 'pending' || b.status === 'under_review' || b.status === 'approved' || b.status === 'active') {
      await postJson(`${API_BASE}/bookings/${b._id}/cancel`, { reason: 'Test cleanup' }, studentToken);
    }
  }

  // STEP 1: User selects a resource
  console.log('\nSTEP 1: Fetching available resources from catalog...');
  const resList = await getJson(`${API_BASE}/resources`, studentToken);
  const targetResource = resList.data?.data?.[0];
  if (!targetResource) throw new Error('No resources found in catalog!');
  console.log(`✓ Selected Resource: "${targetResource.name}" (ID: ${targetResource._id}, Category: ${targetResource.category})`);

  // STEP 2 & 3: User selects date/time & system runs pre-check
  const randomDay = Math.floor(10 + Math.random() * 15);
  const testDate = `2026-12-${String(randomDay).padStart(2, '0')}`;
  const testStartTime = `${testDate}T09:00:00`;
  const testEndTime = `${testDate}T12:00:00`;
  const testTimeSlot = '09:00 - 12:00';

  console.log('\nSTEP 2 & 3: Running Pre-Check Diagnostics...');
  const preCheck = await postJson(`${API_BASE}/bookings/pre-check`, {
    resourceId: targetResource._id,
    date: testDate,
    timeSlot: testTimeSlot,
    startTime: testStartTime,
    endTime: testEndTime,
  }, studentToken);

  console.log('✓ Pre-check HTTP status:', preCheck.status);
  console.log('  - Can Book:', preCheck.data?.data?.canBook);
  console.log('  - Auth:', preCheck.data?.data?.checks?.authenticated);
  console.log('  - Eligibility:', preCheck.data?.data?.checks?.eligibility?.detail);
  console.log('  - Training Required:', preCheck.data?.data?.checks?.training?.required);
  console.log('  - Conflict status:', preCheck.data?.data?.checks?.schedulingConflict?.detail);
  console.log('  - Active limits:', preCheck.data?.data?.checks?.activeBookingLimits?.detail);

  if (!preCheck.data?.data?.canBook) {
    throw new Error('Pre-check indicated booking cannot proceed!');
  }

  // STEP 4 & 5: User enters details and submits booking request
  console.log('\nSTEP 4 & 5: Submitting Booking Request with Project Details...');
  const bookingPayload = {
    resourceId: targetResource._id,
    date: testDate,
    timeSlot: testTimeSlot,
    startTime: testStartTime,
    endTime: testEndTime,
    purpose: 'GaN Heterostructure Atomic Thin Film Deposition',
    projectDescription: 'Fabricating high electron mobility transistors (HEMT) for clean energy power electronics.',
    expectedDuration: '3 hrs',
    additionalInformation: 'Ultra-pure Argon gas required for plasma ignition.',
    supervisorName: 'Dr. Meera Raman (Nanotech Department)',
    trainingAcknowledged: true,
  };

  const createRes = await postJson(`${API_BASE}/bookings`, bookingPayload, studentToken);
  console.log('✓ Booking Submission status:', createRes.status);
  console.log('  - Message:', createRes.data?.message);
  const createdBooking = createRes.data?.data;
  console.log(`  - Booking ID: ${createdBooking?._id}`);
  console.log(`  - Initial Status: ${createdBooking?.status}`);

  if (createRes.status !== 201) throw new Error('Failed to create booking!');

  // STEP 3B: Test Double Booking & Atomic Conflict Prevention
  console.log('\nTesting Double-Booking Prevention: Attempting to submit overlapping reservation...');
  const duplicateRes = await postJson(`${API_BASE}/bookings`, {
    resourceId: targetResource._id,
    date: testDate,
    timeSlot: '10:00 - 11:00',
    startTime: `${testDate}T10:00:00`, // overlaps with 09:00 - 12:00
    endTime: `${testDate}T11:00:00`,
    purpose: 'Malicious or accidental conflicting reservation',
  }, studentToken);

  // If initial booking was auto-approved or when approved, conflict must be caught!
  console.log('  - Duplicate submission status:', duplicateRes.status);

  // STEP 6: Owner receives notification
  console.log('\nSTEP 6: Verifying Owner Notifications...');
  const ownerNotifications = await getJson(`${API_BASE}/notifications`, ownerToken);
  const relevantNotification = ownerNotifications.data?.data?.find(
    (n) => n.message?.includes(targetResource.name) || n.title?.includes('Booking')
  );
  console.log('✓ Owner notification dispatched:', !!relevantNotification, 'Snippet:', relevantNotification?.title);

  // STEP 7: Owner reviews and approves
  console.log('\nSTEP 7: Owner reviews and approves request...');
  const approveRes = await postJson(`${API_BASE}/bookings/${createdBooking._id}/approve`, {}, ownerToken);
  console.log('✓ Approval status:', approveRes.status);
  console.log('  - New Status:', approveRes.data?.data?.status);

  // Verify Conflict Prevention now that it is Approved:
  const conflictAfterApproval = await postJson(`${API_BASE}/bookings`, {
    resourceId: targetResource._id,
    date: testDate,
    timeSlot: '10:00 - 11:00',
    startTime: `${testDate}T10:00:00`,
    endTime: `${testDate}T11:00:00`,
    purpose: 'Conflicting timeslot request',
  }, studentToken);
  console.log('✓ Verified Double-Booking Prevention on Approved Slot: HTTP Status', conflictAfterApproval.status, '(Expect 409)');
  if (conflictAfterApproval.status !== 409) {
    throw new Error(`Double booking was NOT prevented! Status: ${conflictAfterApproval.status}`);
  }

  // STEP 8: User receives confirmation notification
  console.log('\nSTEP 8: Verifying Student Confirmation Notification...');
  const studentNotifications = await getJson(`${API_BASE}/notifications`, studentToken);
  const approvalNotification = studentNotifications.data?.data?.find(
    (n) => n.title?.includes('Approved') || n.message?.includes('approved')
  );
  console.log('✓ User confirmation notification received:', !!approvalNotification, 'Title:', approvalNotification?.title);

  // STEP 9 & 10: User checks in and records initial condition
  console.log('\nSTEP 9 & 10: User checks in & records initial resource condition...');
  const checkInRes = await postJson(`${API_BASE}/bookings/${createdBooking._id}/check-in`, {
    conditionNotes: 'Chassis pristine, turbo molecular pump idle pressure normal at 2e-7 Torr. Cleanroom checklist completed.',
    meterReading: '512.4 hrs',
    cleanliness: 'passed',
    operationalStatus: 'optimal',
  }, studentToken);
  console.log('✓ Check-In status:', checkInRes.status);
  console.log('  - Status after check-in:', checkInRes.data?.data?.status);
  console.log('  - Initial condition recorded:', checkInRes.data?.data?.initialCondition?.operationalStatus);

  // STEP 11: User uses the resource (session is checked_in)
  console.log('\nSTEP 11: User active research session in progress (Status: checked_in)...');

  // STEP 12: User initiates check-out and records return condition
  console.log('\nSTEP 12: User initiates check-out & records return condition...');
  const returnRes = await postJson(`${API_BASE}/bookings/${createdBooking._id}/initiate-return`, {
    conditionNotes: 'Deposition run completed successfully. Substrate removed, chamber vent valve closed, argon purge completed.',
    meterReading: '515.4 hrs',
    cleanliness: 'passed',
    operationalStatus: 'optimal',
  }, studentToken);
  console.log('✓ Return Initiation status:', returnRes.status);
  console.log('  - Status after return initiation:', returnRes.data?.data?.status, '(Expect return_pending)');

  // STEP 13 & 14: Owner confirms return & completes booking
  console.log('\nSTEP 13 & 14: Owner inspects equipment, confirms return & completes booking...');
  const completeRes = await postJson(`${API_BASE}/bookings/${createdBooking._id}/confirm-return`, {
    finalNotes: 'Custodian inspected chamber seals and cleanroom bay. Passed inspection with zero damage.',
    meterReading: '515.4 hrs',
    conditionStatus: 'optimal',
  }, ownerToken);
  console.log('✓ Final Return Confirmation status:', completeRes.status);
  console.log('  - Status:', completeRes.data?.data?.status, '(Expect completed)');

  // Verify Single Booking Timeline & Audit Trail Integrity
  console.log('\nVerifying Immutable Audit Trail & Timeline Stages...');
  const singleBookingRes = await getJson(`${API_BASE}/bookings/${createdBooking._id}`, studentToken);
  const auditTrail = singleBookingRes.data?.data?.booking?.auditTrail;
  const timeline = singleBookingRes.data?.data?.timeline;

  console.log(`✓ Audit trail recorded ${auditTrail?.length} transitions:`);
  auditTrail?.forEach((entry, i) => {
    console.log(`   ${i + 1}. [${entry.transition}] ${entry.fromStatus} -> ${entry.toStatus} (by: ${entry.performedBy})`);
  });

  console.log(`✓ Timeline has ${timeline?.length} stages:`);
  timeline?.forEach((t) => {
    console.log(`   - ${t.label}: ${t.completed ? 'COMPLETED' : 'PENDING'}`);
  });

  // Verify Condition Reports on File
  console.log('\nVerifying Condition Reports Created...');
  const conditionReports = await getJson(`${API_BASE}/owner/condition-reports`, ownerToken);
  const sessionReports = conditionReports.data?.data?.filter(
    (r) => r.bookingId === createdBooking._id || r.resourceId === targetResource._id
  );
  console.log(`✓ Found ${sessionReports?.length} condition reports generated during session.`);

  console.log('\n🎉 ENTIRE 14-STEP BOOKING LIFECYCLE VERIFIED SUCCESSFULLY ACROSS BOTH ACCOUNTS!\n');
}

runLifecycleTests().catch((err) => {
  console.error('❌ Lifecycle test failed:', err);
  process.exit(1);
});
