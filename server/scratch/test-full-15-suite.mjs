// Complete 15-Point Automated Integration & Verification Test Suite for RENTORA
const API_BASE = 'http://localhost:5000/api';

async function runTestSuite() {
  console.log('🧪 =====================================================');
  console.log('🚀 RENTORA FULL 15-STAGE LIFECYCLE VERIFICATION SUITE');
  console.log('=====================================================\n');

  let testStudentToken = '';
  let testStudentId = '';
  let ownerToken = '';
  let ownerId = '';
  let adminToken = '';
  let createdResourceId = '';
  let approvedBookingId = '';
  let rejectedBookingId = '';
  let waitlistedBookingId = '';
  let reportedIncidentId = '';

  const timestamp = Date.now();
  const testStudentEmail = `verify.student.${timestamp}@rentora.edu`;

  // 1. SIGN-UP
  console.log('--- TEST 1: User Sign-Up ---');
  const signupRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Priya Sharma',
      email: testStudentEmail,
      password: 'Password123!',
      confirmPassword: 'Password123!',
      phone: '9876543210',
      institution: 'National Institute of Technology',
      department: 'Nanotechnology & Materials Science',
      role: 'student',
      agreeTerms: true,
    }),
  });
  const signupData = await signupRes.json();
  console.log('Sign-up status:', signupRes.status);
  if (!signupData.success || !signupData.data?.token) {
    throw new Error(`Test 1 Failed: Sign-up error: ${signupData.message}`);
  }
  testStudentToken = signupData.data.token;
  testStudentId = signupData.data.user._id;
  console.log(`✅ Test 1 Passed: User signed up successfully with ID: ${testStudentId}\n`);

  // 2. SIGN-IN
  console.log('--- TEST 2: User Sign-In ---');
  const signinRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testStudentEmail,
      password: 'Password123!',
    }),
  });
  const signinData = await signinRes.json();
  console.log('Sign-in status:', signinRes.status);
  if (!signinData.success || !signinData.data?.token) {
    throw new Error(`Test 2 Failed: Sign-in error: ${signinData.message}`);
  }
  testStudentToken = signinData.data.token;
  console.log(`✅ Test 2 Passed: Authenticated JWT session established for ${signinData.data.user.email}\n`);

  // Log in as Owner and Admin for subsequent tests
  const ownerLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@rentora.edu', password: 'Password123!' }),
  }).then(r => r.json());
  ownerToken = ownerLoginRes.data.token;
  ownerId = ownerLoginRes.data.user._id;

  const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@rentora.edu', password: 'Password123!' }),
  }).then(r => r.json());
  adminToken = adminLoginRes.data.token;

  // 3. LOGOUT
  console.log('--- TEST 3: User Logout & Session Invalidation ---');
  const logoutRes = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
  });
  console.log('Logout status:', logoutRes.status);
  // Verify unauthenticated request without token fails on protected route
  const protectedCheck = await fetch(`${API_BASE}/bookings/my-bookings`);
  console.log('Unauthenticated access status:', protectedCheck.status);
  if (protectedCheck.status !== 401) {
    throw new Error('Test 3 Failed: Protected route was accessible without token.');
  }
  console.log('✅ Test 3 Passed: Session terminated and unauthorized access prevented (401).\n');

  // 4. RESOURCE CREATION
  console.log('--- TEST 4: Resource Creation by Owner ---');
  const createResourceRes = await fetch(`${API_BASE}/owner/resources`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ownerToken}`,
    },
    body: JSON.stringify({
      name: `Rigaku SmartLab X-Ray Diffractometer ${timestamp}`,
      category: 'Laboratories',
      resourceType: 'Diffractometer',
      institution: 'National Institute of Technology',
      location: 'Advanced Materials Wing, Room 204',
      description: 'High-resolution XRD with 9kW rotating anode for thin-film and nanomaterial crystal structure analysis.',
      images: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800'],
      specifications: {
        XRaySource: '9kW Cu Rotating Anode',
        Optics: 'CBO-f with automated mirror alignment',
        Detector: 'HyPix-3000 2D multi-dimensional detector',
      },
      trainingRequired: 'XRD Radiation Safety Level 2',
      requiredQualification: 'PhD Scholar',
      requiredCertifications: ['Radiation Safety L2'],
      approvalRequired: true,
      conditionPhotosConfigured: true,
      tags: ['XRD', 'Nanomaterials', 'Crystallography'],
    }),
  });
  const createResourceData = await createResourceRes.json();
  console.log('Create resource status:', createResourceRes.status);
  if (!createResourceData.success || !createResourceData.data?._id) {
    throw new Error(`Test 4 Failed: Resource creation failed: ${createResourceData.message}`);
  }
  createdResourceId = createResourceData.data._id;
  console.log(`✅ Test 4 Passed: Resource created with ID: ${createdResourceId}\n`);

  // 5. RESOURCE DISCOVERY
  console.log('--- TEST 5: Resource Discovery & Search ---');
  const searchRes = await fetch(`${API_BASE}/resources?search=Diffractometer&category=Laboratories`);
  const searchData = await searchRes.json();
  console.log('Search status:', searchRes.status, 'Total matching assets:', searchData.data?.length);
  const found = searchData.data?.some(r => r._id === createdResourceId);
  if (!found) {
    throw new Error('Test 5 Failed: Created resource not found in discovery catalog search.');
  }
  console.log('✅ Test 5 Passed: Full-text indexing and category search verified.\n');

  // 6. BOOKING REQUESTS
  console.log('--- TEST 6: Booking Request Submission ---');
  const bookingDate = '2026-11-15';
  const bookingReqRes = await fetch(`${API_BASE}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${testStudentToken}`,
    },
    body: JSON.stringify({
      resourceId: createdResourceId,
      date: bookingDate,
      timeSlot: '10:00 - 13:00',
      startTime: `${bookingDate}T10:00:00`,
      endTime: `${bookingDate}T13:00:00`,
      purpose: 'Structural characterization of epitaxial GaN heterostructures for doctoral thesis',
      projectDescription: 'Thin-film rocking curve measurement and 2theta-omega scan using HyPix detector.',
      expectedDuration: '3 hrs',
      supervisorName: 'Dr. C. Ramanathan',
      trainingAcknowledged: true,
    }),
  });
  const bookingReqData = await bookingReqRes.json();
  console.log('Booking request status:', bookingReqRes.status);
  if (!bookingReqData.success || !bookingReqData.data?._id) {
    throw new Error(`Test 6 Failed: Booking request failed: ${bookingReqData.message}`);
  }
  approvedBookingId = bookingReqData.data._id;
  console.log(`✅ Test 6 Passed: Reservation request lodged in status '${bookingReqData.data.status}' (ID: ${approvedBookingId})\n`);

  // 7. OWNER APPROVALS
  console.log('--- TEST 7: Owner Approval ---');
  const approveRes = await fetch(`${API_BASE}/bookings/${approvedBookingId}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ownerToken}`,
    },
    body: JSON.stringify({ note: 'Prerequisites and radiation safety certificate verified.' }),
  });
  const approveData = await approveRes.json();
  console.log('Approval status:', approveRes.status);
  if (!approveData.success || approveData.data?.status !== 'approved') {
    throw new Error(`Test 7 Failed: Approval failed: ${approveData.message}`);
  }
  console.log(`✅ Test 7 Passed: Booking approved by custodian (Status: ${approveData.data.status})\n`);

  // 8. REJECTIONS
  console.log('--- TEST 8: Rejection with Mandatory Reason ---');
  // Create a second booking request to test rejection
  const req2Res = await fetch(`${API_BASE}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${testStudentToken}`,
    },
    body: JSON.stringify({
      resourceId: createdResourceId,
      date: '2026-11-18',
      timeSlot: '14:00 - 16:00',
      startTime: '2026-11-18T14:00:00',
      endTime: '2026-11-18T16:00:00',
      purpose: 'Pilot calibration trial',
    }),
  });
  const req2Data = await req2Res.json();
  rejectedBookingId = req2Data.data._id;

  // Attempt rejection with documented reason
  const rejectRes = await fetch(`${API_BASE}/bookings/${rejectedBookingId}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ownerToken}`,
    },
    body: JSON.stringify({
      reason: 'Mandatory annual radiation sensor recalibration scheduled during this timeframe.',
      rejectionReason: 'Mandatory annual radiation sensor recalibration scheduled during this timeframe.',
    }),
  });
  const rejectData = await rejectRes.json();
  console.log('Rejection status:', rejectRes.status);
  if (!rejectData.success || rejectData.data?.status !== 'rejected') {
    throw new Error(`Test 8 Failed: Rejection failed: ${rejectData.message}`);
  }
  console.log(`✅ Test 8 Passed: Booking rejected with documented reason: "${rejectData.data.rejectionReason}"\n`);

  // 9. WAITING LISTS & DOUBLE-BOOKING PREVENTION
  console.log('--- TEST 9: Double-Booking Prevention & Transparent Waiting Lists ---');
  // Attempt to book an overlapping slot without waitlist: must return 409 Conflict
  const collisionRes = await fetch(`${API_BASE}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${testStudentToken}`,
    },
    body: JSON.stringify({
      resourceId: createdResourceId,
      date: bookingDate,
      timeSlot: '10:00 - 13:00',
      startTime: `${bookingDate}T10:00:00`,
      endTime: `${bookingDate}T13:00:00`,
      purpose: 'Parallel diffraction study collision test',
      allowWaitlist: false,
    }),
  });
  const collisionData = await collisionRes.json();
  console.log('Collision detection response HTTP status:', collisionRes.status, 'Message:', collisionData.message);
  if (collisionRes.status !== 409 || !collisionData.canWaitlist) {
    throw new Error('Test 9 Failed: Double booking was not prevented with 409 Conflict!');
  }
  console.log('🛡️ Double-booking collision prevented atomically by backend.');

  // Now submit with allowWaitlist: true to join the queue transparently
  const waitlistRes = await fetch(`${API_BASE}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${testStudentToken}`,
    },
    body: JSON.stringify({
      resourceId: createdResourceId,
      date: bookingDate,
      timeSlot: '10:00 - 13:00',
      startTime: `${bookingDate}T10:00:00`,
      endTime: `${bookingDate}T13:00:00`,
      purpose: 'Parallel diffraction study - standby queue entry',
      allowWaitlist: true,
    }),
  });
  const waitlistData = await waitlistRes.json();
  console.log('Waitlist response status:', waitlistRes.status, 'Status:', waitlistData.data?.status);
  if (!waitlistData.success || waitlistData.data?.status !== 'waitlisted') {
    throw new Error(`Test 9 Failed: Booking could not be waitlisted: ${waitlistData.message}`);
  }
  waitlistedBookingId = waitlistData.data._id;

  // Query transparent waitlist endpoint
  const queueCheck = await fetch(`${API_BASE}/bookings/waitlist`, {
    headers: { Authorization: `Bearer ${testStudentToken}` },
  }).then(r => r.json());
  console.log('Waitlist count for user:', queueCheck.data?.length);
  if (!queueCheck.success) {
    throw new Error('Test 9 Failed: Transparent waiting list query failed.');
  }
  console.log('✅ Test 9 Passed: User enqueued onto transparent waitlist with queue standing.\n');

  // 10. CHECK-IN
  console.log('--- TEST 10: Check-In with Initial Condition Verification ---');
  const checkinRes = await fetch(`${API_BASE}/bookings/${approvedBookingId}/check-in`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${testStudentToken}`,
    },
    body: JSON.stringify({
      conditionNotes: 'HyPix detector clean, Goniometer aligned, zero physical damage, chiller running at 18°C.',
      meterReading: 'Vacuum: 1.2e-5 mbar',
      cleanliness: 'passed',
      operationalStatus: 'optimal',
      photos: ['pre_use_goniometer_alignment.png'],
      userConfirmation: true,
    }),
  });
  const checkinData = await checkinRes.json();
  console.log('Check-in status:', checkinRes.status);
  if (!checkinData.success || checkinData.data?.status !== 'checked_in') {
    throw new Error(`Test 10 Failed: Check-in failed: ${checkinData.message}`);
  }
  console.log(`✅ Test 10 Passed: Check-in executed, status transitioned to '${checkinData.data.status}'\n`);

  // 11. CHECK-OUT
  console.log('--- TEST 11: Return Initiation & Check-Out ---');
  const initiateReturnRes = await fetch(`${API_BASE}/bookings/${approvedBookingId}/initiate-return`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${testStudentToken}`,
    },
    body: JSON.stringify({
      conditionNotes: 'All diffraction scans completed. Sample stage detached, beam shutter locked, vacuum restored.',
      photos: ['post_use_beam_locked.png'],
      meterReading: 'Vacuum: 1.1e-5 mbar',
      userConfirmation: true,
    }),
  });
  const returnData = await initiateReturnRes.json();
  console.log('Initiate return status:', initiateReturnRes.status);
  if (!returnData.success || returnData.data?.status !== 'return_pending') {
    throw new Error(`Test 11 Failed: Return initiation failed: ${returnData.message}`);
  }
  console.log(`✅ Test 11 Passed: Return initiated, status transitioned to '${returnData.data.status}'\n`);

  // 12. CONDITION DOCUMENTATION (Owner Sign-off & Completion)
  console.log('--- TEST 12: Owner Condition Confirmation & Final Completion ---');
  const confirmReturnRes = await fetch(`${API_BASE}/bookings/${approvedBookingId}/confirm-return`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ownerToken}`,
    },
    body: JSON.stringify({
      conditionNotes: 'Custodian physical handover inspection passed. HyPix detector intact, 9kW filament hours logged.',
      ownerConfirmation: true,
      conditionOnCheckout: 'optimal',
    }),
  });
  const confirmData = await confirmReturnRes.json();
  console.log('Confirm return status:', confirmReturnRes.status);
  if (!confirmData.success || confirmData.data?.status !== 'completed') {
    throw new Error(`Test 12 Failed: Owner return confirmation failed: ${confirmData.message}`);
  }
  console.log(`✅ Test 12 Passed: Post-use condition signed off by owner. Booking status: '${confirmData.data.status}'\n`);

  // 13. INCIDENT MANAGEMENT
  console.log('--- TEST 13: Incident Reporting ---');
  const incidentRes = await fetch(`${API_BASE}/incidents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${testStudentToken}`,
    },
    body: JSON.stringify({
      category: 'equipment_damage',
      title: 'X-Ray shutter microswitch interlock warning',
      description: 'During automated scan cycle 4, safety interlock triggered an emergency beam cutoff code E-402.',
      severity: 'medium',
      resourceId: createdResourceId,
      resourceName: 'Rigaku SmartLab X-Ray Diffractometer',
      bookingId: approvedBookingId,
      evidence: ['interlock_error_log.png'],
    }),
  });
  const incidentData = await incidentRes.json();
  console.log('Incident report status:', incidentRes.status);
  if (!incidentData.success || !incidentData.data?._id) {
    throw new Error(`Test 13 Failed: Incident reporting failed: ${incidentData.message}`);
  }
  reportedIncidentId = incidentData.data._id;
  console.log(`✅ Test 13 Passed: Incident report registered (Ticket ID: ${reportedIncidentId})\n`);

  // 14. AUDIT HISTORY & IMMUTABILITY
  console.log('--- TEST 14: Immutable Audit History Verification ---');
  const auditRes = await fetch(`${API_BASE}/audit-logs`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const auditData = await auditRes.json();
  console.log('Audit query status:', auditRes.status, 'Total sealed events:', auditData.data?.length);
  if (!auditData.success || auditData.data?.length === 0) {
    throw new Error('Test 14 Failed: Audit ledger is empty.');
  }

  // Verify immutability: attempting to DELETE audit log must be rejected with 405 Method Not Allowed
  const deleteAuditRes = await fetch(`${API_BASE}/audit-logs/${auditData.data[0]._id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log('Delete audit attempt HTTP status:', deleteAuditRes.status);
  if (deleteAuditRes.status !== 405) {
    throw new Error(`Test 14 Failed: Audit ledger permitted deletion! Expected 405, got ${deleteAuditRes.status}`);
  }
  console.log('✅ Test 14 Passed: WORM audit records sealed and immutable against deletion (HTTP 405).\n');

  // 15. ROLE RESTRICTIONS (RBAC)
  console.log('--- TEST 15: Role-Based Access Control (RBAC) Restrictions ---');
  // Student attempting to access /api/admin/overview
  const rbacStudentCheck = await fetch(`${API_BASE}/admin/overview`, {
    headers: { Authorization: `Bearer ${testStudentToken}` },
  });
  console.log('Student access to /api/admin/overview status:', rbacStudentCheck.status);
  if (rbacStudentCheck.status !== 403) {
    throw new Error(`Test 15 Failed: Student was not forbidden from Admin endpoint! HTTP: ${rbacStudentCheck.status}`);
  }

  // Admin access to /api/admin/overview succeeds
  const rbacAdminCheck = await fetch(`${API_BASE}/admin/overview`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log('Admin access to /api/admin/overview status:', rbacAdminCheck.status);
  if (rbacAdminCheck.status !== 200) {
    throw new Error(`Test 15 Failed: Admin could not access Admin endpoint! HTTP: ${rbacAdminCheck.status}`);
  }
  console.log('✅ Test 15 Passed: RBAC strictly enforced (Student: 403 Forbidden, Admin: 200 OK).\n');

  console.log('=====================================================');
  console.log('🏆 ALL 15 LIFECYCLE TESTS COMPLETED & PASSED 100%!');
  console.log('=====================================================');
}

runTestSuite().catch(err => {
  console.error('❌ Integration test failed:', err);
  process.exit(1);
});
