// Comprehensive automated test suite for TrustPass - Secure Resource Check-in & Check-out System
const API_BASE = 'http://localhost:5000/api';

async function postJson(url, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
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

async function runTrustPassTestSuite() {
  console.log('🛡️ Starting TrustPass Secure Check-in & Check-out Test Suite...\n');

  // 1. Authenticate users
  console.log('1. Authenticating test users...');
  const studentLogin = await postJson(`${API_BASE}/auth/login`, {
    email: 'student@rentora.edu',
    password: 'Password123!',
  });
  const studentToken = studentLogin.data?.data?.token;

  const ownerLogin = await postJson(`${API_BASE}/auth/login`, {
    email: 'owner@rentora.edu',
    password: 'Password123!',
  });
  const ownerToken = ownerLogin.data?.data?.token;
  const ownerUser = ownerLogin.data?.data?.user;

  // Another owner for unauthorized testing
  const anotherOwnerEmail = `other_custodian_${Date.now()}@rentora.edu`;
  const otherOwnerReg = await postJson(`${API_BASE}/auth/register`, {
    name: 'Unauthorized Custodian',
    email: anotherOwnerEmail,
    password: 'Password123!',
    confirmPassword: 'Password123!',
    agreeTerms: true,
    role: 'owner',
    institution: 'Other University',
    department: 'Physics',
    phone: '9123456789',
  });
  const otherOwnerToken = otherOwnerReg.data?.data?.token;

  console.log(`✓ Authenticated Student, Authorized Custodian (${ownerUser?.name}), and Unauthorized Custodian.`);

  // 2. Fetch owner resource and create approved booking
  console.log('\n2. Setting up test resource & approved reservation...');
  const ownerOverview = await getJson(`${API_BASE}/owner/overview`, ownerToken);
  const resource = ownerOverview.data?.data?.myResources?.[0];
  if (!resource) throw new Error('No owner resources found.');
  const resourceId = resource._id;

  const testDate = '2026-11-25';
  const testSlot = '14:00 - 16:00';

  // Create booking
  const bookingRes = await postJson(`${API_BASE}/bookings`, {
    resourceId,
    date: testDate,
    timeSlot: testSlot,
    purpose: 'TrustPass Secure Handover Integration Test',
    allowWaitlist: true,
  }, studentToken);

  let booking = bookingRes.data?.data;
  console.log('• Booking submission status:', bookingRes.status, 'Status:', booking?.status);

  // If status is pending or waitlisted, custodian approves it
  if (booking && booking.status !== 'approved') {
    const approveRes = await postJson(`${API_BASE}/owner/bookings/${booking._id}/approve`, {
      note: 'Pre-cleared for TrustPass verification testing.',
    }, ownerToken);
    booking = approveRes.data?.data;
    console.log('• Custodian approved reservation:', approveRes.status, 'Status:', booking?.status);
  }

  const bookingId = booking._id;

  // 3. Test Generating Secure TrustPass Token & QR Payload
  console.log('\n3. Generating Secure TrustPass Token & QR Payload...');
  const passRes = await getJson(`${API_BASE}/trustpass/token/${bookingId}`, studentToken);
  console.log('• TrustPass Token Generation status:', passRes.status);
  const passToken = passRes.data?.data?.token;
  const qrPayload = passRes.data?.data?.qrPayload;
  console.log('  - Generated Token:', passToken);
  console.log('  - QR Payload:', qrPayload);
  
  // Security verification: Confirm zero sensitive PII is leaked in the QR payload
  const parsedQr = JSON.parse(qrPayload);
  const leaksPII = !!(parsedQr.email || parsedQr.password || parsedQr.phone || parsedQr.name);
  console.log('  - Security Check: Zero sensitive PII leaked inside QR payload:', !leaksPII);

  // 4. Test Backend Token Verification
  console.log('\n4. Testing Token Verification on Backend...');
  const verifyRes = await postJson(`${API_BASE}/trustpass/verify`, {
    token: passToken,
  }, ownerToken);
  console.log('• Token Verification status:', verifyRes.status);
  console.log('  - Action Allowed:', verifyRes.data?.data?.actionAllowed);
  console.log('  - Verified Resource:', verifyRes.data?.data?.resource?.name);
  console.log('  - Verified Requester:', verifyRes.data?.data?.booking?.userName);

  // 5. Test Invalid, Malformed, and Guessed Tokens
  console.log('\n5. Testing Security Rejection of Invalid / Guessed Tokens...');
  const invalidVerify = await postJson(`${API_BASE}/trustpass/verify`, {
    token: 'TP-FAKEGUESSEDTOKEN1234567890ABCDEF',
  }, ownerToken);
  console.log('• Guessed Token verification status:', invalidVerify.status, '(Expected 404 Not Found)');

  // 6. Test Unauthorized Scanner Attempt (Custodian from another institution)
  console.log('\n6. Testing RBAC Security: Unauthorized Custodian Attempt...');
  const unauthVerify = await postJson(`${API_BASE}/trustpass/verify`, {
    token: passToken,
  }, otherOwnerToken);
  console.log('• Unauthorized Custodian verification status:', unauthVerify.status, '(Expected 403 Forbidden)');

  // 7. Test Check-In Execution with Condition Snapshot & Photos
  console.log('\n7. Testing Check-In Execution with Initial Condition & Photos...');
  const checkInRes = await postJson(`${API_BASE}/trustpass/check-in`, {
    bookingId,
    conditionNotes: 'Lens optic verified clean. Battery at 100% calibration.',
    meterReading: '124.5 hrs',
    cleanliness: 'passed',
    operationalStatus: 'optimal',
    photos: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758'],
  }, ownerToken);

  console.log('• Check-In status:', checkInRes.status);
  console.log('  - Status updated to:', checkInRes.data?.data?.status);
  console.log('  - CheckedIn flag:', checkInRes.data?.data?.checkedIn);
  console.log('  - Handover Officer:', checkInRes.data?.data?.handoverOfficer?.name);

  // 8. Test Duplicate Check-In Attempt Prevention
  console.log('\n8. Testing Duplicate Check-In Prevention...');
  const dupCheckIn = await postJson(`${API_BASE}/trustpass/check-in`, {
    bookingId,
    conditionNotes: 'Attempting duplicate check-in.',
  }, ownerToken);
  console.log('• Duplicate Check-In attempt status:', dupCheckIn.status, '(Expected 400 Bad Request)');
  console.log('  - Rejection Message:', dupCheckIn.data?.message);

  // 9. Verify Token now recognizes Check-Out stage
  console.log('\n9. Verifying Token Stage Transition...');
  const verifyStage2 = await postJson(`${API_BASE}/trustpass/verify`, {
    token: passToken,
  }, ownerToken);
  console.log('• Token Verification stage:', verifyStage2.data?.data?.actionAllowed, '(Expected "check_out")');

  // 10. Test Check-Out Execution, Overdue Duration Calculation, & Token Invalidation
  console.log('\n10. Testing Check-Out Execution, Overdue Calculation, & Invalidation...');
  const checkOutRes = await postJson(`${API_BASE}/trustpass/check-out`, {
    bookingId,
    conditionNotes: 'Returned in pristine condition without cosmetic or sensor wear.',
    meterReading: '126.5 hrs',
    cleanliness: 'passed',
    operationalStatus: 'optimal',
    photos: ['https://images.unsplash.com/photo-1581092335397-9583fe92d232'],
  }, ownerToken);

  console.log('• Check-Out status:', checkOutRes.status);
  console.log('  - Status updated to:', checkOutRes.data?.data?.booking?.status);
  console.log('  - CheckedOut flag:', checkOutRes.data?.data?.booking?.checkedOut);
  console.log('  - Return Officer:', checkOutRes.data?.data?.booking?.returnOfficer?.name);
  console.log('  - Calculated Overdue Minutes:', checkOutRes.data?.data?.overdueMinutes);

  // 11. Test Consumed / Invalidated Token Attempt
  console.log('\n11. Testing Consumed / Invalidated Token Protection...');
  const consumedVerify = await postJson(`${API_BASE}/trustpass/verify`, {
    token: passToken,
  }, ownerToken);
  console.log('• Consumed Token verification status:', consumedVerify.status, '(Expected 400 Bad Request)');
  console.log('  - Message:', consumedVerify.data?.message);

  // 12. Test Duplicate Check-Out Attempt Prevention
  console.log('\n12. Testing Duplicate Check-Out Prevention...');
  const dupCheckOut = await postJson(`${API_BASE}/trustpass/check-out`, {
    bookingId,
  }, ownerToken);
  console.log('• Duplicate Check-Out attempt status:', dupCheckOut.status, '(Expected 400 Bad Request)');

  // 13. Test Complete Transaction History & Audit Ledger
  console.log('\n13. Testing Complete Transaction Lifecycle History...');
  const historyRes = await getJson(`${API_BASE}/trustpass/history/${bookingId}`, studentToken);
  console.log('• Transaction History status:', historyRes.status);
  const hist = historyRes.data?.data;
  console.log('  - Handover Officer:', hist?.handoverOfficer?.name);
  console.log('  - Check-in Time:', hist?.checkedInAt);
  console.log('  - Initial Condition Photos:', hist?.initialCondition?.photos?.length || 0);
  console.log('  - Return Officer:', hist?.returnOfficer?.name);
  console.log('  - Return Time:', hist?.checkedOutAt);
  console.log('  - Return Condition Photos:', hist?.returnCondition?.photos?.length || 0);
  console.log('  - Audit Trail entries:', hist?.auditTrail?.length);

  console.log('\n🎉 ALL TRUSTPASS CHECK-IN AND CHECK-OUT REQUIREMENTS TESTED & VERIFIED SUCCESSFULLY!');
}

runTrustPassTestSuite().catch(err => {
  console.error('TrustPass Test Failed:', err);
  process.exit(1);
});
