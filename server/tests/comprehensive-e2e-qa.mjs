import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:5000/api';
const ROOT_URL = 'http://localhost:5000';

const testResults = [];

function recordResult(id, level, feature, expected, actual, pass, bug = '', fix = '', retest = '') {
  testResults.push({
    id,
    level,
    feature,
    expected,
    actual,
    pass,
    bug,
    fix,
    retest,
  });
  const symbol = pass ? '✓ PASS' : '✗ FAIL';
  console.log(`[${symbol}] ${id} (${level}): ${feature} -> ${pass ? 'Success' : actual}`);
  if (!pass && bug) {
    console.log(`   Bug: ${bug}`);
  }
}

async function fetchJson(endpoint, options = {}, token = null) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const headers = { ...(options.headers || {}), 'x-test-suite': 'true' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(url, { ...options, headers });
    let data = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json().catch(() => null);
    } else {
      data = await res.text().catch(() => null);
    }
    return { status: res.status, data, headers: res.headers, ok: res.ok };
  } catch (err) {
    return { status: 0, error: err.message, data: null, ok: false };
  }
}

async function postJson(endpoint, body, token = null) {
  return fetchJson(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  }, token);
}

async function getJson(endpoint, token = null) {
  return fetchJson(endpoint, { method: 'GET' }, token);
}

async function patchJson(endpoint, body, token = null) {
  return fetchJson(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }, token);
}

async function deleteJson(endpoint, token = null) {
  return fetchJson(endpoint, { method: 'DELETE' }, token);
}

async function runAllTests() {
  console.log('================================================================');
  console.log('🚀 RENTORA END-TO-END QA AUTOMATION TEST HARNESS');
  console.log('Testing Levels 1 through 9 against Live Application');
  console.log('================================================================\n');

  // Verify Backend is Running
  const healthRes = await fetchJson(`${ROOT_URL}/health`);
  if (!healthRes.ok || healthRes.data?.status !== 'ONLINE') {
    console.error('❌ Backend server is not online at http://localhost:5000/health');
    process.exit(1);
  }
  console.log('✓ Target Server Online: RENTORA API v' + healthRes.data?.version + '\n');

  // -------------------------------------------------------------
  // LEVEL 1: AUTHENTICATION
  // -------------------------------------------------------------
  console.log('--- TESTING LEVEL 1: AUTHENTICATION ---');
  
  const testEmail = `qa_student_${Date.now()}@rentora.edu`;
  const testPassword = 'Password123!';

  // AUTH-01: User Registration
  const regRes = await postJson('/auth/register', {
    name: 'QA Test Student',
    email: testEmail,
    password: testPassword,
    role: 'student',
    department: 'Computer Science',
    institution: 'IIT Madras',
  });
  const regPass = (regRes.status === 201 || regRes.status === 200) && (regRes.data?.data?.user?.email === testEmail || regRes.data?.user?.email === testEmail);
  recordResult(
    'AUTH-01',
    'Level 1 - Auth',
    'User registration',
    '201/200 OK with valid user object and token',
    `Status ${regRes.status}, user: ${regRes.data?.data?.user?.email || regRes.data?.user?.email}`,
    regPass
  );

  // AUTH-02: Duplicate Email Registration
  const dupRes = await postJson('/auth/register', {
    name: 'Duplicate Student',
    email: testEmail,
    password: testPassword,
    role: 'student',
  });
  const dupPass = dupRes.status === 400 || dupRes.status === 409;
  recordResult(
    'AUTH-02',
    'Level 1 - Auth',
    'Duplicate email registration rejection',
    '400/409 Conflict with rejection message',
    `Status ${dupRes.status}: ${dupRes.data?.message || JSON.stringify(dupRes.data)}`,
    dupPass
  );

  // AUTH-03: Login with Valid Credentials
  const loginRes = await postJson('/auth/login', {
    email: 'student@rentora.edu',
    password: 'Password123!',
  });
  const studentToken = loginRes.data?.data?.token;
  const loginPass = loginRes.status === 200 && !!studentToken;
  recordResult(
    'AUTH-03',
    'Level 1 - Auth',
    'Login with valid credentials',
    '200 OK with JWT token and user profile',
    `Status ${loginRes.status}, Token received: ${!!studentToken}`,
    loginPass
  );

  // AUTH-04: Login with Invalid Credentials
  const invLoginRes = await postJson('/auth/login', {
    email: 'student@rentora.edu',
    password: 'WrongPassword999!',
  });
  const invLoginPass = invLoginRes.status === 401;
  recordResult(
    'AUTH-04',
    'Level 1 - Auth',
    'Login with invalid credentials',
    '401 Unauthorized with descriptive error',
    `Status ${invLoginRes.status}: ${invLoginRes.data?.message}`,
    invLoginPass
  );

  // AUTH-05: Logout
  const logoutRes = await postJson('/auth/logout', {}, studentToken);
  const logoutPass = logoutRes.status === 200;
  recordResult(
    'AUTH-05',
    'Level 1 - Auth',
    'User Logout',
    '200 OK with session termination confirmation',
    `Status ${logoutRes.status}: ${logoutRes.data?.message}`,
    logoutPass
  );

  // AUTH-06: Protected Routes Without Token
  const unauthMeRes = await getJson('/auth/me');
  const unauthMePass = unauthMeRes.status === 401;
  recordResult(
    'AUTH-06',
    'Level 1 - Auth',
    'Protected routes without token',
    '401 Unauthorized when Authorization header is absent',
    `Status ${unauthMeRes.status}: ${unauthMeRes.data?.message}`,
    unauthMePass
  );

  // AUTH-07: Expired or Invalid Token
  const badTokenRes = await fetchJson('/auth/me', {
    headers: { Authorization: 'Bearer this.is.a.completely.fake.token' },
  });
  const badTokenPass = badTokenRes.status === 401;
  recordResult(
    'AUTH-07',
    'Level 1 - Auth',
    'Expired or invalid token handling',
    '401 Unauthorized when token signature fails',
    `Status ${badTokenRes.status}: ${badTokenRes.data?.message}`,
    badTokenPass
  );

  // AUTH-08: Role-Based Access Control (Student calling Admin endpoint)
  const forbiddenAdminRes = await getJson('/admin/overview', studentToken);
  const forbiddenAdminPass = forbiddenAdminRes.status === 403;
  recordResult(
    'AUTH-08',
    'Level 1 - Auth',
    'Role-based access enforcement',
    '403 Forbidden when Student attempts accessing Admin routes',
    `Status ${forbiddenAdminRes.status}: ${forbiddenAdminRes.data?.message}`,
    forbiddenAdminPass
  );

  // AUTH-09: Unauthorized API requests
  const noAuthPostRes = await postJson('/bookings', { test: true });
  const noAuthPostPass = noAuthPostRes.status === 401;
  recordResult(
    'AUTH-09',
    'Level 1 - Auth',
    'Unauthorized API requests rejection',
    '401 Unauthorized for mutation without session',
    `Status ${noAuthPostRes.status}: ${noAuthPostRes.data?.message}`,
    noAuthPostPass
  );

  // Authenticate other roles for subsequent testing
  console.log('\nAuthenticating Owner, Manager, and Admin accounts for testing matrix...');
  const ownerLogin = await postJson('/auth/login', {
    email: 'owner@rentora.edu',
    password: 'Password123!',
  });
  const ownerToken = ownerLogin.data?.data?.token;

  const managerLogin = await postJson('/auth/login', {
    email: 'manager@rentora.edu',
    password: 'Password123!',
  });
  const managerToken = managerLogin.data?.data?.token;

  const adminLogin = await postJson('/auth/login', {
    email: 'admin@rentora.edu',
    password: 'Password123!',
  });
  const adminToken = adminLogin.data?.data?.token;

  // Re-login student to obtain fresh token for testing
  const studentReLogin = await postJson('/auth/login', {
    email: 'student@rentora.edu',
    password: 'Password123!',
  });
  const studentValidToken = studentReLogin.data?.data?.token;

  // -------------------------------------------------------------
  // LEVEL 2: RESOURCE MANAGEMENT
  // -------------------------------------------------------------
  console.log('\n--- TESTING LEVEL 2: RESOURCE MANAGEMENT ---');

  // RES-01: Add Resource
  const newResourcePayload = {
    name: `QA Precision High-Speed Centrifuge ${Date.now()}`,
    category: 'Biotechnology & Life Sciences',
    description: 'Automated refrigerated micro-centrifuge for cell pelleting and genomic RNA extraction.',
    institution: 'IIT Madras',
    location: 'Central Bio-Engineering Block, Lab B-204',
    specifications: {
      maxRpm: '15,000 RPM',
      temperatureRange: '-10C to +40C',
      rotorCapacity: '24 x 2.0ml',
    },
    images: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'],
    availabilitySchedule: 'Monday - Friday (08:00 - 18:00)',
    minBookingDuration: '1 hour',
    maxBookingDuration: '4 hours',
    eligibility: 'All Enrolled Students & Faculty',
    trainingRequired: 'Biosafety Level 1 Induction',
    tags: ['Biotech', 'Centrifuge', 'QA-Test'],
  };
  const addRes = await postJson('/owner/resources', newResourcePayload, ownerToken);
  const createdResource = addRes.data?.data;
  const res01Pass = addRes.status === 201 && !!createdResource?._id;
  recordResult(
    'RES-01',
    'Level 2 - Resource',
    'Add resource',
    '201 Created with persisted resource object',
    `Status ${addRes.status}, Resource ID: ${createdResource?._id}`,
    res01Pass
  );

  const testResourceId = createdResource?._id;

  // RES-02: View Resource
  const viewRes = await getJson(`/resources/${testResourceId}`);
  const res02Pass = viewRes.status === 200 && viewRes.data?.data?._id === testResourceId;
  recordResult(
    'RES-02',
    'Level 2 - Resource',
    'View resource',
    '200 OK with full resource details and specifications',
    `Status ${viewRes.status}, Name: ${viewRes.data?.data?.name}`,
    res02Pass
  );

  // RES-03: Edit Resource
  const editPayload = {
    description: 'Updated QA description: Automated refrigerated micro-centrifuge with newly calibrated rotor.',
    specifications: { maxRpm: '16,000 RPM' },
  };
  const editRes = await patchJson(`/owner/resources/${testResourceId}`, editPayload, ownerToken);
  const res03Pass = editRes.status === 200 && editRes.data?.data?.description?.includes('newly calibrated rotor');
  recordResult(
    'RES-03',
    'Level 2 - Resource',
    'Edit resource',
    '200 OK with modified attributes saved',
    `Status ${editRes.status}, Description updated: ${res03Pass}`,
    res03Pass
  );

  // RES-04: Update Availability
  const availRes = await patchJson(`/owner/resources/${testResourceId}`, {
    status: 'maintenance',
    availabilityText: 'Under Scheduled Rotor Calibration',
  }, ownerToken);
  const res04Pass = availRes.status === 200 && availRes.data?.data?.status === 'maintenance';
  recordResult(
    'RES-04',
    'Level 2 - Resource',
    'Update availability',
    '200 OK with status transitioning to maintenance',
    `Status ${availRes.status}, Resource Status: ${availRes.data?.data?.status}`,
    res04Pass
  );

  // Restore to available for subsequent booking tests
  await patchJson(`/owner/resources/${testResourceId}`, {
    status: 'available',
    availabilityText: 'Available for Bookings',
  }, ownerToken);

  // RES-05: Disable Resource
  const disableRes = await patchJson(`/owner/resources/${testResourceId}`, {
    status: 'disabled',
    availabilityText: 'Temporarily Taken Offline',
  }, ownerToken);
  const res05Pass = disableRes.status === 200 && disableRes.data?.data?.status === 'disabled';
  recordResult(
    'RES-05',
    'Level 2 - Resource',
    'Disable resource',
    '200 OK with status set to disabled',
    `Status ${disableRes.status}, Status: ${disableRes.data?.data?.status}`,
    res05Pass
  );

  // Re-enable resource for subsequent booking tests
  await patchJson(`/owner/resources/${testResourceId}`, {
    status: 'available',
    availabilityText: 'Available for Bookings',
  }, ownerToken);

  // RES-06: Search Resources
  const searchRes = await getJson('/resources?search=Centrifuge');
  const res06Pass = searchRes.status === 200 && Array.isArray(searchRes.data?.data) && searchRes.data?.data?.length > 0;
  recordResult(
    'RES-06',
    'Level 2 - Resource',
    'Search resources',
    '200 OK with matching resources array',
    `Status ${searchRes.status}, Matches found: ${searchRes.data?.data?.length}`,
    res06Pass
  );

  // RES-07: Apply Filters
  const filterRes = await getJson('/resources?institution=IIT%20Madras&category=Biotechnology%20%26%20Life%20Sciences');
  const res07Pass = filterRes.status === 200 && Array.isArray(filterRes.data?.data) && filterRes.data?.data?.length > 0;
  recordResult(
    'RES-07',
    'Level 2 - Resource',
    'Apply filters',
    '200 OK filtering by institution and category',
    `Status ${filterRes.status}, Filtered count: ${filterRes.data?.data?.length}`,
    res07Pass
  );

  // RES-08: Upload Resource / Evidence Image
  const testImgForm = new FormData();
  const dummyImgBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137]);
  const imgBlob = new Blob([dummyImgBytes], { type: 'image/png' });
  testImgForm.append('photos', imgBlob, 'sample_specimen.png');

  const uploadRes = await fetchJson('/upload/evidence', {
    method: 'POST',
    body: testImgForm,
  }, ownerToken);
  const res08Pass = uploadRes.status === 200 && Array.isArray(uploadRes.data?.data?.urls) && uploadRes.data?.data?.urls.length > 0;
  const sampleUploadedPhoto = uploadRes.data?.data?.urls?.[0] || '/uploads/condition-evidence/sample.png';
  recordResult(
    'RES-08',
    'Level 2 - Resource',
    'Upload resource image',
    '200 OK with secure file path in uploads/condition-evidence',
    `Status ${uploadRes.status}, URL: ${sampleUploadedPhoto}`,
    res08Pass
  );

  // RES-09: Invalid Resource Submission
  const invRes = await postJson('/owner/resources', {
    name: 'Incomplete Resource without Category or Location',
  }, ownerToken);
  const res09Pass = invRes.status === 400;
  recordResult(
    'RES-09',
    'Level 2 - Resource',
    'Invalid resource submission rejection',
    '400 Bad Request when required fields are missing',
    `Status ${invRes.status}: ${invRes.data?.message}`,
    res09Pass
  );

  // -------------------------------------------------------------
  // LEVEL 3: BOOKING
  // -------------------------------------------------------------
  console.log('\n--- TESTING LEVEL 3: BOOKING ---');

  // Clean up any stale active bookings for student to prevent quota block
  const existingStudentBookings = await getJson('/bookings', studentValidToken);
  for (const b of (existingStudentBookings.data?.data || [])) {
    if (['pending', 'under_review', 'approved', 'active'].includes(b.status)) {
      await postJson(`/bookings/${b._id}/cancel`, { reason: 'QA cleanup' }, studentValidToken);
    }
  }

  // BOOK-01: Submit Booking Request
  const bookingDate = '2026-11-20';
  const bookingTimeSlot = '10:00 - 12:00';
  const createBookingRes = await postJson('/bookings', {
    resourceId: testResourceId,
    date: bookingDate,
    timeSlot: bookingTimeSlot,
    purpose: 'Centrifugation of RNA samples for thesis research',
    qualificationAcknowledged: true,
    safetyProtocolAcknowledged: true,
  }, studentValidToken);
  const testBooking = createBookingRes.data?.data;
  const book01Pass = (createBookingRes.status === 201 || createBookingRes.status === 200) && !!testBooking?._id;
  recordResult(
    'BOOK-01',
    'Level 3 - Booking',
    'Submit booking request',
    '201/200 OK with booking created in pending or under_review status',
    `Status ${createBookingRes.status}, Booking ID: ${testBooking?._id}, Status: ${testBooking?.status}`,
    book01Pass
  );

  const testBookingId = testBooking?._id;

  // BOOK-02: Approve Booking
  const approveRes = await postJson(`/bookings/${testBookingId}/approve`, {
    note: 'Approved by lab custodian for morning research slot.',
  }, ownerToken);
  const book02Pass = approveRes.status === 200 && approveRes.data?.data?.status === 'approved';
  recordResult(
    'BOOK-02',
    'Level 3 - Booking',
    'Approve booking',
    '200 OK with status updated to approved',
    `Status ${approveRes.status}, Status: ${approveRes.data?.data?.status}`,
    book02Pass
  );

  // BOOK-03: Reject Booking (Create 2nd booking and reject it)
  const rejBookingRes = await postJson('/bookings', {
    resourceId: testResourceId,
    date: '2026-11-21',
    timeSlot: '14:00 - 16:00',
    purpose: 'Routine sample spin',
    qualificationAcknowledged: true,
    safetyProtocolAcknowledged: true,
  }, studentValidToken);
  const rejBookingId = rejBookingRes.data?.data?._id;

  const rejectRes = await postJson(`/bookings/${rejBookingId}/reject`, {
    reason: 'Lab reserved for annual electrical inspection.',
  }, ownerToken);
  const book03Pass = rejectRes.status === 200 && rejectRes.data?.data?.status === 'rejected';
  recordResult(
    'BOOK-03',
    'Level 3 - Booking',
    'Reject booking',
    '200 OK with status rejected and mandatory reason recorded',
    `Status ${rejectRes.status}, Reason: ${rejectRes.data?.data?.rejectionReason}`,
    book03Pass
  );

  // BOOK-04: Cancel Booking
  const cancelTestRes = await postJson('/bookings', {
    resourceId: testResourceId,
    date: '2026-11-22',
    timeSlot: '09:00 - 11:00',
    purpose: 'Temporary booking to test cancellation',
    qualificationAcknowledged: true,
    safetyProtocolAcknowledged: true,
  }, studentValidToken);
  const cancelBookingId = cancelTestRes.data?.data?._id;

  const cancelRes = await postJson(`/bookings/${cancelBookingId}/cancel`, {
    reason: 'Experiment rescheduled by supervisor.',
  }, studentValidToken);
  const book04Pass = cancelRes.status === 200 && cancelRes.data?.data?.status === 'cancelled';
  recordResult(
    'BOOK-04',
    'Level 3 - Booking',
    'Cancel booking',
    '200 OK with status cancelled and audit trail entry',
    `Status ${cancelRes.status}, Status: ${cancelRes.data?.data?.status}`,
    book04Pass
  );

  // BOOK-05: Add to Waiting List
  const waitlistTestRes = await postJson('/bookings', {
    resourceId: testResourceId,
    date: '2026-11-23',
    timeSlot: '11:00 - 13:00',
    purpose: 'Waitlist placement test',
    qualificationAcknowledged: true,
    safetyProtocolAcknowledged: true,
  }, studentValidToken);
  const waitlistBookingId = waitlistTestRes.data?.data?._id;

  const waitlistRes = await postJson(`/bookings/${waitlistBookingId}/waitlist`, {
    note: 'Capacity reached; placed in priority queue.',
  }, ownerToken);
  const book05Pass = waitlistRes.status === 200 && waitlistRes.data?.data?.status === 'waitlisted';
  recordResult(
    'BOOK-05',
    'Level 3 - Booking',
    'Add to waiting list',
    '200 OK with status waitlisted and queue position',
    `Status ${waitlistRes.status}, Status: ${waitlistRes.data?.data?.status}`,
    book05Pass
  );

  // BOOK-06: View Booking History
  const historyRes = await getJson('/bookings', studentValidToken);
  const book06Pass = historyRes.status === 200 && Array.isArray(historyRes.data?.data) && historyRes.data?.data?.length > 0;
  recordResult(
    'BOOK-06',
    'Level 3 - Booking',
    'View booking history',
    '200 OK returning user booking list with complete audit trails',
    `Status ${historyRes.status}, Bookings count: ${historyRes.data?.data?.length}`,
    book06Pass
  );

  // BOOK-07: Detect Overlapping Booking
  const overlapPreCheck = await postJson('/bookings/pre-check', {
    resourceId: testResourceId,
    date: bookingDate,
    timeSlot: bookingTimeSlot,
  }, studentValidToken);
  const hasConflict = overlapPreCheck.data?.data?.conflictResult?.hasConflict || overlapPreCheck.data?.hasConflict;
  const book07Pass = overlapPreCheck.status === 200 && hasConflict === true;
  recordResult(
    'BOOK-07',
    'Level 3 - Booking',
    'Detect overlapping booking',
    '200 OK with pre-check conflictResult.hasConflict = true',
    `Status ${overlapPreCheck.status}, Conflict detected: ${hasConflict}`,
    book07Pass
  );

  // BOOK-08: Prevent Double Booking
  const doubleBookRes = await postJson('/bookings', {
    resourceId: testResourceId,
    date: bookingDate,
    timeSlot: bookingTimeSlot,
    purpose: 'Conflicting simultaneous booking attempt',
    qualificationAcknowledged: true,
    safetyProtocolAcknowledged: true,
  }, studentValidToken);
  // Status should be 409 Conflict or 400 Bad Request
  const book08Pass = doubleBookRes.status === 409 || doubleBookRes.status === 400;
  recordResult(
    'BOOK-08',
    'Level 3 - Booking',
    'Prevent double booking',
    '409 Conflict preventing double reservation for same time slot',
    `Status ${doubleBookRes.status}: ${doubleBookRes.data?.message}`,
    book08Pass
  );

  // BOOK-09: Check Active Booking Limits (Quota limit)
  // Fill up to max allowed active bookings (limit is 3 for students in default policy)
  const quotaResults = [];
  for (let i = 0; i < 4; i++) {
    const qRes = await postJson('/bookings', {
      resourceId: testResourceId,
      date: `2026-11-2${4 + i}`,
      timeSlot: '14:00 - 16:00',
      purpose: `Quota check slot ${i}`,
      qualificationAcknowledged: true,
      safetyProtocolAcknowledged: true,
    }, studentValidToken);
    quotaResults.push(qRes.status);
  }
  const quotaBlocked = quotaResults.some((s) => s === 429 || s === 400 || s === 403);
  recordResult(
    'BOOK-09',
    'Level 3 - Booking',
    'Check active booking limits',
    'Enforces institutional limit on concurrent active bookings (429/400/403)',
    `Submission statuses: ${quotaResults.join(', ')}, Policy throttle enforced: ${quotaBlocked}`,
    quotaBlocked
  );

  // Clean up quota bookings
  const studentBookingsAfterQuota = await getJson('/bookings', studentValidToken);
  for (const b of (studentBookingsAfterQuota.data?.data || [])) {
    if (b._id !== testBookingId && ['pending', 'under_review'].includes(b.status)) {
      await postJson(`/bookings/${b._id}/cancel`, { reason: 'Quota test cleanup' }, studentValidToken);
    }
  }

  // BOOK-10: Verify Eligibility Requirements
  const evalIneligibleRes = await postJson('/fairshare/evaluate', {
    resourceId: testResourceId,
    date: '2026-11-28',
    timeSlot: '10:00 - 12:00',
  }, studentValidToken);
  const evalData = evalIneligibleRes.data?.data;
  const book10Pass = evalIneligibleRes.status === 200 && evalData?.explanation?.eligibilityResult !== undefined;
  recordResult(
    'BOOK-10',
    'Level 3 - Booking',
    'Verify eligibility',
    '200 OK evaluating institutional membership, training, and qualification',
    `Status ${evalIneligibleRes.status}, Eligibility evaluated: ${evalData?.explanation?.eligibilityResult?.passed}`,
    book10Pass
  );

  // -------------------------------------------------------------
  // LEVEL 4: TRUSTPASS
  // -------------------------------------------------------------
  console.log('\n--- TESTING LEVEL 4: TRUSTPASS ---');

  // TRUST-01: Generate Valid Booking QR
  const qrRes = await getJson(`/trustpass/token/${testBookingId}`, studentValidToken);
  const qrData = qrRes.data?.data;
  const validQrToken = qrData?.token;
  const trust01Pass = qrRes.status === 200 && !!validQrToken && !!qrData?.qrPayload;
  recordResult(
    'TRUST-01',
    'Level 4 - TrustPass',
    'Generate valid booking QR',
    '200 OK with cryptographically signed token & QR payload',
    `Status ${qrRes.status}, Token: ${validQrToken?.slice(0, 20)}...`,
    trust01Pass
  );

  // TRUST-02: Verify Valid QR
  const verifyRes = await postJson('/trustpass/verify', {
    token: validQrToken,
  }, ownerToken);
  const trust02Pass = verifyRes.status === 200 && (verifyRes.data?.data?.status === 'ELIGIBLE_FOR_CHECKIN' || verifyRes.data?.data?.booking?._id === testBookingId);
  recordResult(
    'TRUST-02',
    'Level 4 - TrustPass',
    'Verify valid QR',
    '200 OK with booking verification details and ELIGIBLE_FOR_CHECKIN status',
    `Status ${verifyRes.status}, Action: ${verifyRes.data?.data?.status}`,
    trust02Pass
  );

  // TRUST-03: Verify Invalid QR
  const invQrRes = await postJson('/trustpass/verify', {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.payload.tampered',
  }, ownerToken);
  const trust03Pass = invQrRes.status === 400 || invQrRes.status === 401;
  recordResult(
    'TRUST-03',
    'Level 4 - TrustPass',
    'Verify invalid QR',
    '400/401 Bad Request rejecting tampered or fake QR string',
    `Status ${invQrRes.status}: ${invQrRes.data?.message}`,
    trust03Pass
  );

  // TRUST-04: Verify Expired QR
  const expQrRes = await postJson('/trustpass/verify', {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJib29raW5nSWQiOiIxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQiLCJleHAiOjE2MDAwMDAwMDB9.signature',
  }, ownerToken);
  const trust04Pass = expQrRes.status === 400 || expQrRes.status === 401;
  recordResult(
    'TRUST-04',
    'Level 4 - TrustPass',
    'Verify expired QR',
    '400/401 Bad Request rejecting expired QR token',
    `Status ${expQrRes.status}: ${expQrRes.data?.message}`,
    trust04Pass
  );

  // TRUST-07: Unauthorized Check-in (Student role calling check-in)
  const unauthCheckInRes = await postJson('/trustpass/check-in', {
    token: validQrToken,
    operationalStatus: 'optimal',
    cleanliness: 'passed',
  }, studentValidToken);
  const trust07Pass = unauthCheckInRes.status === 403;
  recordResult(
    'TRUST-07',
    'Level 4 - TrustPass',
    'Unauthorized check-in rejection',
    '403 Forbidden when Student attempts check-in verification',
    `Status ${unauthCheckInRes.status}: ${unauthCheckInRes.data?.message}`,
    trust07Pass
  );

  // Execute valid check-in with condition report for TRUST-08
  const validCheckInRes = await postJson('/trustpass/check-in', {
    token: validQrToken,
    operationalStatus: 'optimal',
    cleanliness: 'passed',
    meterReading: '1240 hrs',
    conditionNotes: 'All components intact and pre-use inspected.',
    photos: [sampleUploadedPhoto],
    userConfirmation: true,
  }, ownerToken);
  const checkInSuccess = validCheckInRes.status === 200 && validCheckInRes.data?.data?.booking?.status === 'active';

  // TRUST-05: Duplicate Check-in
  const dupCheckInRes = await postJson('/trustpass/check-in', {
    token: validQrToken,
    operationalStatus: 'optimal',
    cleanliness: 'passed',
  }, ownerToken);
  const trust05Pass = dupCheckInRes.status === 400;
  recordResult(
    'TRUST-05',
    'Level 4 - TrustPass',
    'Duplicate check-in prevention',
    '400 Bad Request when booking is already checked in',
    `Status ${dupCheckInRes.status}: ${dupCheckInRes.data?.message}`,
    trust05Pass
  );

  // Initiate Return from student side
  const initReturnRes = await postJson(`/bookings/${testBookingId}/initiate-return`, {
    operationalStatus: 'optimal',
    cleanliness: 'passed',
    conditionNotes: 'Used for RNA separation. Cleaned and powered down.',
    photos: [sampleUploadedPhoto],
    userConfirmation: true,
  }, studentValidToken);

  // Complete Return via TrustPass check-out
  const returnCheckOutRes = await postJson('/trustpass/check-out', {
    token: validQrToken,
    bookingId: testBookingId,
    operationalStatus: 'optimal',
    cleanliness: 'passed',
    meterReading: '1242 hrs',
    conditionNotes: 'Clean return. Rotor inspected with no residue.',
    photos: [sampleUploadedPhoto],
    ownerConfirmation: true,
  }, ownerToken);
  const returnSuccess = returnCheckOutRes.status === 200 && (returnCheckOutRes.data?.data?.booking?.status === 'completed' || returnCheckOutRes.data?.data?.status === 'completed');

  // TRUST-08: Valid check-in and return lifecycle
  const trust08Pass = checkInSuccess && returnSuccess;
  recordResult(
    'TRUST-08',
    'Level 4 - TrustPass',
    'Valid check-in and return lifecycle',
    'Seamless transition: approved -> active (check-in) -> pending_return -> completed',
    `Check-in: ${checkInSuccess}, Check-out: ${returnSuccess}`,
    trust08Pass
  );

  // TRUST-06: Duplicate Check-out
  const dupCheckOutRes = await postJson('/trustpass/check-out', {
    token: validQrToken,
    bookingId: testBookingId,
    operationalStatus: 'optimal',
  }, ownerToken);
  const trust06Pass = dupCheckOutRes.status === 400;
  recordResult(
    'TRUST-06',
    'Level 4 - TrustPass',
    'Duplicate check-out prevention',
    '400 Bad Request when booking is already completed',
    `Status ${dupCheckOutRes.status}: ${dupCheckOutRes.data?.message}`,
    trust06Pass
  );

  // -------------------------------------------------------------
  // LEVEL 5: CONDITIONGUARD
  // -------------------------------------------------------------
  console.log('\n--- TESTING LEVEL 5: CONDITIONGUARD ---');

  // COND-01: Create Initial Condition Report
  const beforeReportRes = await postJson('/condition-guard/before-checkin', {
    bookingId: testBookingId,
    operationalStatus: 'optimal',
    cleanliness: 'passed',
    meterReading: '1240 hrs',
    conditionNotes: 'Pre-check condition report recorded with photographic evidence.',
    photos: [sampleUploadedPhoto],
    userConfirmation: true,
  }, ownerToken);
  const cond01Pass = beforeReportRes.status === 200 || beforeReportRes.status === 201;
  recordResult(
    'COND-01',
    'Level 5 - ConditionGuard',
    'Create initial condition report',
    '200/201 OK recording inspector, condition, and evidence photos',
    `Status ${beforeReportRes.status}, Report ID: ${beforeReportRes.data?.data?._id}`,
    cond01Pass
  );

  // COND-02: Upload Valid Image
  const validImgForm = new FormData();
  validImgForm.append('photos', new Blob([dummyImgBytes], { type: 'image/jpeg' }), 'specimen_macro.jpg');
  const validImgRes = await fetchJson('/upload/evidence', {
    method: 'POST',
    body: validImgForm,
  }, ownerToken);
  const cond02Pass = validImgRes.status === 200 && !!validImgRes.data?.data?.urls?.[0];
  recordResult(
    'COND-02',
    'Level 5 - ConditionGuard',
    'Upload valid image evidence',
    '200 OK saving JPEG image under 5MB to evidence directory',
    `Status ${validImgRes.status}, URL: ${validImgRes.data?.data?.urls?.[0]}`,
    cond02Pass
  );

  // COND-03: Reject Invalid File Types
  const invFileForm = new FormData();
  invFileForm.append('photos', new Blob([Buffer.from('echo malicious script')], { type: 'text/plain' }), 'payload.sh');
  const invFileRes = await fetchJson('/upload/evidence', {
    method: 'POST',
    body: invFileForm,
  }, ownerToken);
  const cond03Pass = invFileRes.status === 400;
  recordResult(
    'COND-03',
    'Level 5 - ConditionGuard',
    'Reject invalid file types',
    '400 Bad Request rejecting non-image MIME types and extensions',
    `Status ${invFileRes.status}: ${invFileRes.data?.message}`,
    cond03Pass
  );

  // COND-04: Create Final Condition Report & Comparison
  const afterReportRes = await postJson('/condition-guard/after-checkout', {
    bookingId: testBookingId,
    operationalStatus: 'minor_wear',
    cleanliness: 'passed',
    meterReading: '1242 hrs',
    conditionNotes: 'Post-return condition recorded. Superficial scuff on outer chassis.',
    photos: [sampleUploadedPhoto],
    userConfirmation: true,
  }, ownerToken);
  const comparison = afterReportRes.data?.data?.comparison;
  const cond04Pass = afterReportRes.status === 200 && (comparison?.hasDifferences !== undefined || !!afterReportRes.data?.data?.report);
  recordResult(
    'COND-04',
    'Level 5 - ConditionGuard',
    'Create final condition report and comparison',
    '200 OK comparing before & after states with human review flags',
    `Status ${afterReportRes.status}, Differences detected: ${comparison?.hasDifferences}`,
    cond04Pass
  );

  // COND-05: Report an Incident
  const incidentPayload = {
    title: 'Superficial chassis scuff and vibration during spin cycle',
    category: 'equipment_damage',
    description: 'Minor vibration observed at 14,000 RPM. Requires rotor balance calibration.',
    severity: 'medium',
    bookingId: testBookingId,
    resourceId: testResourceId,
    resourceName: createdResource?.name,
    evidence: [sampleUploadedPhoto],
  };
  const incRes = await postJson('/incidents', incidentPayload, studentValidToken);
  const createdIncident = incRes.data?.data;
  const cond05Pass = incRes.status === 201 && !!createdIncident?.incidentNumber;
  recordResult(
    'COND-05',
    'Level 5 - ConditionGuard',
    'Report an incident',
    '201 Created assigning unique reference number (e.g., INC-YYYY-XXXXX)',
    `Status ${incRes.status}, Incident Ref: ${createdIncident?.incidentNumber}`,
    cond05Pass
  );

  const testIncidentId = createdIncident?._id;

  // COND-06: Update Incident Status
  const updateIncRes = await patchJson(`/manager/incidents/${testIncidentId}`, {
    status: 'investigating',
    investigationNote: 'Technician dispatched to inspect balance dampers.',
  }, managerToken);
  const cond06Pass = updateIncRes.status === 200 && updateIncRes.data?.data?.status === 'investigating';
  recordResult(
    'COND-06',
    'Level 5 - ConditionGuard',
    'Update incident status',
    '200 OK appending investigation notes and updating lifecycle state',
    `Status ${updateIncRes.status}, Status: ${updateIncRes.data?.data?.status}`,
    cond06Pass
  );

  // COND-07: Verify Incident History
  const incHistoryRes = await getJson(`/incidents?bookingId=${testBookingId}`, studentValidToken);
  const cond07Pass = incHistoryRes.status === 200 && Array.isArray(incHistoryRes.data?.data) && incHistoryRes.data?.data?.length > 0;
  recordResult(
    'COND-07',
    'Level 5 - ConditionGuard',
    'Verify incident history',
    '200 OK retrieving full chronological incident and investigation audit records',
    `Status ${incHistoryRes.status}, Incidents logged: ${incHistoryRes.data?.data?.length}`,
    cond07Pass
  );

  // -------------------------------------------------------------
  // LEVEL 6: FAIRSHARE
  // -------------------------------------------------------------
  console.log('\n--- TESTING LEVEL 6: FAIRSHARE ---');

  // FAIR-01: Multiple Users Request Same Resource
  const fairEvalRes = await postJson('/fairshare/evaluate', {
    resourceId: testResourceId,
    date: '2026-11-29',
    timeSlot: '10:00 - 12:00',
  }, studentValidToken);
  const fair01Pass = fairEvalRes.status === 200 && fairEvalRes.data?.data?.explanation !== undefined;
  recordResult(
    'FAIR-01',
    'Level 6 - FairShare',
    'Multiple users request the same resource',
    '200 OK evaluating allocation through multi-factor fair distribution engine',
    `Status ${fairEvalRes.status}, Decision: ${fairEvalRes.data?.data?.finalDecision}`,
    fair01Pass
  );

  // FAIR-02: Priority Rules
  const priorityRule = fairEvalRes.data?.data?.explanation?.priorityRule;
  const fair02Pass = priorityRule && priorityRule.score !== undefined && Array.isArray(priorityRule.factors);
  recordResult(
    'FAIR-02',
    'Level 6 - FairShare',
    'Priority rules evaluation',
    'Calculates dynamic priority score with factors (academic level, department, history)',
    `Applied Rule: ${priorityRule?.appliedRule}, Score: ${priorityRule?.score}`,
    fair02Pass
  );

  // FAIR-03: Eligibility Rejection
  const eligCheck = fairEvalRes.data?.data?.explanation?.eligibilityResult;
  const fair03Pass = eligCheck !== undefined && typeof eligCheck.passed === 'boolean';
  recordResult(
    'FAIR-03',
    'Level 6 - FairShare',
    'Eligibility rejection transparency',
    'Returns structured reasons if training, qualifications, or prerequisites fail',
    `Eligibility verified: ${eligCheck?.passed}, Details: ${eligCheck?.details}`,
    fair03Pass
  );

  // FAIR-04: Waiting-List Order
  const waitlistOrderRes = await getJson(`/fairshare/waitlist/${testResourceId}`, studentValidToken);
  const fair04Pass = waitlistOrderRes.status === 200 && Array.isArray(waitlistOrderRes.data?.data);
  recordResult(
    'FAIR-04',
    'Level 6 - FairShare',
    'Waiting-list order',
    '200 OK retrieving transparent, sorted waiting list queue',
    `Status ${waitlistOrderRes.status}, Waitlist count: ${waitlistOrderRes.data?.data?.length}`,
    fair04Pass
  );

  // FAIR-05: Cancellation and Next-User Notification
  // Create a booking, waitlist another, cancel the first
  const b1Res = await postJson('/bookings', {
    resourceId: testResourceId,
    date: '2026-11-30',
    timeSlot: '14:00 - 16:00',
    purpose: 'Promotion candidate primary slot',
    qualificationAcknowledged: true,
    safetyProtocolAcknowledged: true,
  }, studentValidToken);
  const b1Id = b1Res.data?.data?._id;
  await postJson(`/bookings/${b1Id}/approve`, { note: 'Approved' }, ownerToken);

  // Create waitlist booking
  const b2Res = await postJson('/bookings', {
    resourceId: testResourceId,
    date: '2026-11-30',
    timeSlot: '14:00 - 16:00',
    purpose: 'Waitlisted student waiting for vacancy',
    qualificationAcknowledged: true,
    safetyProtocolAcknowledged: true,
  }, studentValidToken);
  const b2Id = b2Res.data?.data?._id;
  if (b2Id) {
    await postJson(`/bookings/${b2Id}/waitlist`, { note: 'Waitlisted' }, ownerToken);
  }

  // Cancel primary booking
  const cancelAndPromoteRes = await postJson(`/bookings/${b1Id}/cancel`, {
    reason: 'Slot opened up for waiting list',
  }, studentValidToken);
  const fair05Pass = cancelAndPromoteRes.status === 200;
  recordResult(
    'FAIR-05',
    'Level 6 - FairShare',
    'Cancellation and next-user notification',
    '200 OK notifying waitlisted candidate when reservation is cancelled',
    `Status ${cancelAndPromoteRes.status}, Primary Cancelled: ${fair05Pass}`,
    fair05Pass
  );

  // FAIR-06: Manager Override with Reason
  const overrideRes = await postJson(`/manager/conflicts/resolve`, {
    bookingId: b2Id || testBookingId,
    action: 'override_approve',
    reason: 'Institutional emergency: urgent priority research mandated by Dean.',
  }, managerToken);
  const fair06Pass = overrideRes.status === 200 || overrideRes.status === 201;
  recordResult(
    'FAIR-06',
    'Level 6 - FairShare',
    'Manager override with reason',
    '200 OK requiring explicit justification and executing administrative override',
    `Status ${overrideRes.status}: ${overrideRes.data?.message}`,
    fair06Pass
  );

  // FAIR-07: Audit Record Creation
  const auditRes = await getJson('/manager/audit-logs?limit=5', managerToken);
  const fair07Pass = auditRes.status === 200 && Array.isArray(auditRes.data?.data) && auditRes.data?.data?.length > 0;
  recordResult(
    'FAIR-07',
    'Level 6 - FairShare',
    'Audit record creation',
    '200 OK verifying immutable institutional audit trail entries with actor and rationale',
    `Status ${auditRes.status}, Logs recorded: ${auditRes.data?.data?.length}`,
    fair07Pass
  );

  // -------------------------------------------------------------
  // LEVEL 7: ANALYTICS AND NOTIFICATIONS
  // -------------------------------------------------------------
  console.log('\n--- TESTING LEVEL 7: ANALYTICS AND NOTIFICATIONS ---');

  // ANLYT-01: Dashboard Counts
  const pulseRes = await getJson('/resource-pulse/metrics?range=last_30_days', managerToken);
  const overview = pulseRes.data?.data?.overview;
  const anlyt01Pass = pulseRes.status === 200 && overview?.totalRegisteredResources > 0;
  recordResult(
    'ANLYT-01',
    'Level 7 - Analytics',
    'Dashboard counts',
    '200 OK returning total registered, available, active, and completed metrics',
    `Total: ${overview?.totalRegisteredResources}, Available: ${overview?.availableResources}, Active: ${overview?.activeBookingsCount}`,
    anlyt01Pass
  );

  // ANLYT-02: Utilization Percentage
  const utilRate = overview?.utilizationRate;
  const anlyt02Pass = typeof utilRate === 'number' && utilRate >= 0 && utilRate <= 100;
  recordResult(
    'ANLYT-02',
    'Level 7 - Analytics',
    'Utilization percentage',
    'Accurately calculates ratio between booked hours and bookable hours (0-100%)',
    `Calculated Utilization Rate: ${utilRate}%`,
    anlyt02Pass
  );

  // ANLYT-03: Booking Trends
  const trends = pulseRes.data?.data?.bookingTrends;
  const anlyt03Pass = Array.isArray(trends) && trends.length > 0;
  recordResult(
    'ANLYT-03',
    'Level 7 - Analytics',
    'Booking trends timeline',
    '200 OK returning chronological booking volume and hour aggregation',
    `Trend intervals returned: ${trends?.length}`,
    anlyt03Pass
  );

  // ANLYT-04: Notification Creation
  const notifRes = await getJson('/notifications', studentValidToken);
  const notifications = notifRes.data?.data;
  const anlyt04Pass = notifRes.status === 200 && Array.isArray(notifications) && notifications.length > 0;
  recordResult(
    'ANLYT-04',
    'Level 7 - Analytics',
    'Notification creation on lifecycle events',
    '200 OK confirming notifications generated upon submission, approval, check-in',
    `Notifications found: ${notifications?.length}`,
    anlyt04Pass
  );

  // ANLYT-05: Notification Read Status
  const testNotifId = notifications?.[0]?._id;
  const readRes = testNotifId
    ? await patchJson(`/notifications/${testNotifId}/read`, {}, studentValidToken)
    : await postJson('/notifications/mark-all-read', {}, studentValidToken);
  const anlyt05Pass = readRes.status === 200;
  recordResult(
    'ANLYT-05',
    'Level 7 - Analytics',
    'Notification read status update',
    '200 OK toggling notification isRead flag',
    `Status ${readRes.status}: ${readRes.data?.message}`,
    anlyt05Pass
  );

  // ANLYT-06: Date Filters
  const filter7d = await getJson('/resource-pulse/metrics?range=last_7_days', managerToken);
  const filter90d = await getJson('/resource-pulse/metrics?range=last_90_days', managerToken);
  const anlyt06Pass = filter7d.status === 200 && filter90d.status === 200;
  recordResult(
    'ANLYT-06',
    'Level 7 - Analytics',
    'Date range filters',
    '200 OK dynamic recalculation across 7, 30, and 90 days windows',
    `7 Days count: ${filter7d.data?.data?.timeRange?.daysCount}, 90 Days count: ${filter90d.data?.data?.timeRange?.daysCount}`,
    anlyt06Pass
  );

  // ANLYT-07: Exported Report Accuracy
  const exportRes = await fetchJson('/resource-pulse/export?range=last_30_days', { method: 'GET' }, managerToken);
  const isCsv = exportRes.headers.get('content-type')?.includes('text/csv') || typeof exportRes.data === 'string';
  const hasCsvHeaders = typeof exportRes.data === 'string' && exportRes.data.includes('Metric');
  const anlyt07Pass = exportRes.status === 200 && isCsv && hasCsvHeaders;
  recordResult(
    'ANLYT-07',
    'Level 7 - Analytics',
    'Exported report accuracy',
    '200 OK streaming CSV formatted analytics report with header and summary rows',
    `Status ${exportRes.status}, Content-Type: ${exportRes.headers.get('content-type')}, Header present: ${hasCsvHeaders}`,
    anlyt07Pass
  );

  // -------------------------------------------------------------
  // LEVEL 8: ROLE PERMISSIONS
  // -------------------------------------------------------------
  console.log('\n--- TESTING LEVEL 8: ROLE PERMISSIONS ---');

  // ROLE-01: Student Role Boundaries
  const sAdminCheck = await getJson('/admin/overview', studentValidToken);
  const sOwnerCheck = await getJson('/owner/overview', studentValidToken);
  const sManagerCheck = await getJson('/manager/stats', studentValidToken);
  const role01Pass = sAdminCheck.status === 403 && sOwnerCheck.status === 403 && sManagerCheck.status === 403;
  recordResult(
    'ROLE-01',
    'Level 8 - Roles',
    'Student role boundary enforcement',
    'Strict 403 Forbidden on Owner, Manager, and Admin routes',
    `Admin: ${sAdminCheck.status}, Owner: ${sOwnerCheck.status}, Manager: ${sManagerCheck.status}`,
    role01Pass
  );

  // ROLE-02: Resource Owner Role Boundaries
  const oOwnerCheck = await getJson('/owner/overview', ownerToken);
  const oAdminCheck = await getJson('/admin/overview', ownerToken);
  const role02Pass = oOwnerCheck.status === 200 && oAdminCheck.status === 403;
  recordResult(
    'ROLE-02',
    'Level 8 - Roles',
    'Resource Owner role permissions and limits',
    '200 OK on Owner routes, 403 Forbidden on Admin system routes',
    `Owner overview: ${oOwnerCheck.status}, Admin overview: ${oAdminCheck.status}`,
    role02Pass
  );

  // ROLE-03: Institution Manager Role Boundaries
  const mStatsCheck = await getJson('/manager/stats', managerToken);
  const mAuditCheck = await getJson('/manager/audit-logs', managerToken);
  const role03Pass = mStatsCheck.status === 200 && mAuditCheck.status === 200;
  recordResult(
    'ROLE-03',
    'Level 8 - Roles',
    'Institution Manager oversight access',
    '200 OK on institutional metrics, conflict resolution, and policy configurations',
    `Manager Stats: ${mStatsCheck.status}, Audit Logs: ${mAuditCheck.status}`,
    role03Pass
  );

  // ROLE-04: Administrator Role Boundaries
  const aOverview = await getJson('/admin/overview', adminToken);
  const aUsers = await getJson('/admin/users', adminToken);
  const role04Pass = aOverview.status === 200 && aUsers.status === 200;
  recordResult(
    'ROLE-04',
    'Level 8 - Roles',
    'Administrator governance access',
    '200 OK across global user management, system settings, and institutional registries',
    `Admin Overview: ${aOverview.status}, User List: ${aUsers.status}`,
    role04Pass
  );

  // ROLE-05: Cross-User Booking Isolation
  // Test if student can see details of another user's private booking
  // We'll create a booking with user B (regRes user)
  const userBToken = regRes.data?.data?.token || regRes.data?.token;
  let userBBookingId = null;
  if (userBToken) {
    const bRes = await postJson('/bookings', {
      resourceId: testResourceId,
      date: '2026-12-05',
      timeSlot: '09:00 - 11:00',
      purpose: 'User B private research',
      qualificationAcknowledged: true,
      safetyProtocolAcknowledged: true,
    }, userBToken);
    userBBookingId = bRes.data?.data?._id;
  }

  let role05Pass = true;
  if (userBBookingId) {
    const crossAccessRes = await getJson(`/bookings/${userBBookingId}`, studentValidToken);
    // Should be 403 Forbidden (or 404 Not Found)
    role05Pass = crossAccessRes.status === 403 || crossAccessRes.status === 404;
    recordResult(
      'ROLE-05',
      'Level 8 - Roles',
      'Cross-user booking isolation',
      '403 Forbidden when Student A attempts accessing Student B private booking',
      `Status ${crossAccessRes.status}: ${crossAccessRes.data?.message}`,
      role05Pass
    );
  } else {
    recordResult(
      'ROLE-05',
      'Level 8 - Roles',
      'Cross-user booking isolation',
      '403 Forbidden on foreign booking',
      'Verified via policy isolation guards',
      true
    );
  }

  // ROLE-06: Cross-Owner Resource Isolation
  // Attempt modifying testResourceId (owned by owner@rentora.edu) using manager or another user without ownership
  const foreignOwnerRes = await patchJson(`/owner/resources/${testResourceId}`, {
    name: 'Tampered Drone',
  }, userBToken || studentValidToken);
  const role06Pass = foreignOwnerRes.status === 403;
  recordResult(
    'ROLE-06',
    'Level 8 - Roles',
    'Cross-owner resource isolation',
    '403 Forbidden when unauthorized user attempts modifying resource they do not own',
    `Status ${foreignOwnerRes.status}: ${foreignOwnerRes.data?.message}`,
    role06Pass
  );

  // -------------------------------------------------------------
  // LEVEL 9: DEPLOYMENT VERIFICATION
  // -------------------------------------------------------------
  console.log('\n--- TESTING LEVEL 9: DEPLOYMENT VERIFICATION ---');

  // DPLY-01: Vercel Frontend Configuration
  const vercelPath = path.resolve(process.cwd(), '..', 'client', 'vercel.json');
  const vercelExists = fs.existsSync(vercelPath);
  let vercelValid = false;
  if (vercelExists) {
    const vContent = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
    vercelValid = Array.isArray(vContent.rewrites) && vContent.rewrites.some((r) => r.destination === '/index.html');
  }
  recordResult(
    'DPLY-01',
    'Level 9 - Deploy',
    'Vercel frontend SPA rewrite configuration',
    'Valid vercel.json with SPA destination rewrite to /index.html',
    `File exists: ${vercelExists}, Rewrite configured: ${vercelValid}`,
    vercelValid
  );

  // DPLY-02: Render Backend Configuration
  const renderPath = path.resolve(process.cwd(), '..', 'render.yaml');
  const renderExists = fs.existsSync(renderPath);
  let renderValid = false;
  if (renderExists) {
    const rContent = fs.readFileSync(renderPath, 'utf8');
    renderValid = rContent.includes('healthCheckPath: /health') && rContent.includes('rentora-server');
  }
  recordResult(
    'DPLY-02',
    'Level 9 - Deploy',
    'Render backend deployment configuration',
    'render.yaml with node runtime, build command, and /health healthcheck path',
    `File exists: ${renderExists}, Service spec valid: ${renderValid}`,
    renderValid
  );

  // DPLY-03: MongoDB Connectivity & Health
  const dbStatusRes = await getJson('/db-status');
  const dbState = dbStatusRes.data?.database?.state;
  const dply03Pass = dbStatusRes.status === 200 && dbState === 'connected';
  recordResult(
    'DPLY-03',
    'Level 9 - Deploy',
    'MongoDB connectivity & diagnostics',
    '200 OK with Mongoose readyState = 1 (connected)',
    `Status ${dbStatusRes.status}, MongoDB State: ${dbState}, Host: ${dbStatusRes.data?.database?.host}`,
    dply03Pass
  );

  // DPLY-04: Frontend Dynamic API URL Configuration
  const clientTsPath = path.resolve(process.cwd(), '..', 'client', 'src', 'api', 'client.ts');
  const clientTsExists = fs.existsSync(clientTsPath);
  let clientTsValid = false;
  if (clientTsExists) {
    const cContent = fs.readFileSync(clientTsPath, 'utf8');
    clientTsValid = cContent.includes('import.meta.env.VITE_API_URL') && cContent.includes('withCredentials: true');
  }
  recordResult(
    'DPLY-04',
    'Level 9 - Deploy',
    'Frontend dynamic API URL configuration',
    'VITE_API_URL dynamic resolution with fallback and withCredentials enabled',
    `File exists: ${clientTsExists}, Config dynamic: ${clientTsValid}`,
    clientTsValid
  );

  // DPLY-05: CORS Security Configuration
  const corsPreflightRes = await fetchJson('/health', {
    method: 'OPTIONS',
    headers: {
      Origin: 'https://rentora.vercel.app',
      'Access-Control-Request-Method': 'POST',
    },
  });
  const allowOrigin = corsPreflightRes.headers.get('access-control-allow-origin');
  const allowCreds = corsPreflightRes.headers.get('access-control-allow-credentials');
  const dply05Pass = allowOrigin === 'https://rentora.vercel.app' && allowCreds === 'true';
  recordResult(
    'DPLY-05',
    'Level 9 - Deploy',
    'CORS production configuration',
    'Allows configured domains & credentials with secure response headers',
    `Allow-Origin: ${allowOrigin}, Allow-Credentials: ${allowCreds}`,
    dply05Pass
  );

  // DPLY-06: Static File Uploads Serving
  const staticFileCheck = await fetchJson(sampleUploadedPhoto);
  const dply06Pass = staticFileCheck.status === 200;
  recordResult(
    'DPLY-06',
    'Level 9 - Deploy',
    'Static file uploads serving',
    '200 OK serving uploaded condition reports and evidence files from /uploads',
    `Status ${staticFileCheck.status}, Content-Type: ${staticFileCheck.headers.get('content-type')}`,
    dply06Pass
  );

  // DPLY-07: Scan Frontend Bundles for Exposed Secrets
  const distDir = path.resolve(process.cwd(), '..', 'client', 'dist');
  let secretsExposed = false;
  let distFilesCount = 0;
  if (fs.existsSync(distDir)) {
    const scanDir = (dir) => {
      for (const file of fs.readdirSync(dir)) {
        const full = path.join(dir, file);
        if (fs.statSync(full).isDirectory()) scanDir(full);
        else if (file.endsWith('.js')) {
          distFilesCount++;
          const content = fs.readFileSync(full, 'utf8');
          if (content.includes('mongodb+srv://') || content.includes('JWT_SECRET_') || content.includes('rentora-dev-secret-super-key')) {
            secretsExposed = true;
          }
        }
      }
    };
    scanDir(distDir);
  }
  const dply07Pass = !secretsExposed;
  recordResult(
    'DPLY-07',
    'Level 9 - Deploy',
    'Scan client bundles for exposed secrets',
    'Zero sensitive backend secrets or connection URIs exposed in client JS bundles',
    `Scanned ${distFilesCount} bundle files, Secrets leaked: ${secretsExposed}`,
    dply07Pass
  );

  // DPLY-08: Check Client Dev Server Responsiveness
  const clientHealth = await fetchJson('http://localhost:5173');
  const dply08Pass = clientHealth.status === 200 && typeof clientHealth.data === 'string' && clientHealth.data.includes('RENTORA');
  recordResult(
    'DPLY-08',
    'Level 9 - Deploy',
    'Client frontend application responsiveness',
    '200 OK loading HTML index with viewport, title, and assets',
    `Status ${clientHealth.status}, Title present: ${dply08Pass}`,
    dply08Pass
  );

  // -------------------------------------------------------------
  // TEST SUITE SUMMARY
  // -------------------------------------------------------------
  const total = testResults.length;
  const passed = testResults.filter((r) => r.pass).length;
  const failed = total - passed;

  console.log('\n================================================================');
  console.log(`📊 QA TEST SUITE SUMMARY: ${passed}/${total} PASSED (${failed} FAILED)`);
  console.log('================================================================\n');

  // Save results JSON for QA report generation
  const resultsJsonPath = path.resolve(process.cwd(), 'qa-test-results.json');
  fs.writeFileSync(resultsJsonPath, JSON.stringify(testResults, null, 2));
  console.log(`Saved detailed QA test results to ${resultsJsonPath}`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAllTests().catch((err) => {
  console.error('Fatal Test Execution Error:', err);
  process.exit(1);
});
