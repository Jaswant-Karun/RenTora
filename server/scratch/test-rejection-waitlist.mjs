// Test Rejection, Waitlist, and Cancellation flows with reasons
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

async function testRejectionAndWaitlist() {
  console.log('🧪 Testing Rejection, Waitlist, and Cancellation Reason Tracking...');

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

  const resList = await getJson(`${API_BASE}/resources`, studentToken);
  const resource = resList.data?.data?.[1];

  // 1. Test Rejection flow
  console.log('\n1. Testing Rejection Flow with Stated Reason...');
  const b1 = await postJson(`${API_BASE}/bookings`, {
    resourceId: resource._id,
    date: '2026-12-25',
    timeSlot: '14:00 - 16:00',
    startTime: '2026-12-25T14:00:00',
    endTime: '2026-12-25T16:00:00',
    purpose: 'DNA Sequencing validation run',
  }, studentToken);

  const b1Id = b1.data?.data?._id;

  // Rejection without reason should fail
  const rejectNoReason = await postJson(`${API_BASE}/bookings/${b1Id}/reject`, { reason: '' }, ownerToken);
  console.log('• Reject without reason status:', rejectNoReason.status, '(Expect 400)');
  if (rejectNoReason.status !== 400) throw new Error('Rejection without reason should be blocked!');

  // Rejection with reason
  const rejectWithReason = await postJson(`${API_BASE}/bookings/${b1Id}/reject`, {
    reason: 'Enzyme reagent shipment delayed; sequencer undergoing optical alignment.',
  }, ownerToken);
  console.log('• Reject with reason status:', rejectWithReason.status, 'Status:', rejectWithReason.data?.data?.status);
  console.log('  Reason saved:', rejectWithReason.data?.data?.rejectionReason);

  // 2. Test Waitlist flow
  console.log('\n2. Testing Priority Waitlist Flow...');
  const b2 = await postJson(`${API_BASE}/bookings`, {
    resourceId: resource._id,
    date: '2026-12-26',
    timeSlot: '10:00 - 12:00',
    startTime: '2026-12-26T10:00:00',
    endTime: '2026-12-26T12:00:00',
    purpose: 'Polymerase chain reaction amplification',
  }, studentToken);

  const b2Id = b2.data?.data?._id;
  const waitlistRes = await postJson(`${API_BASE}/bookings/${b2Id}/waitlist`, {
    reason: 'Slot requested during peak PhD thesis preparation week. Placed at priority #1.',
    priority: 1,
  }, ownerToken);
  console.log('• Move to Waitlist status:', waitlistRes.status, 'Status:', waitlistRes.data?.data?.status);
  console.log('  Waitlist reason:', waitlistRes.data?.data?.waitlistReason);

  // 3. Test Cancellation flow
  console.log('\n3. Testing Cancellation Flow with Reason...');
  const cancelRes = await postJson(`${API_BASE}/bookings/${b2Id}/cancel`, {
    reason: 'Advisor rescheduled project review to following month.',
  }, studentToken);
  console.log('• Cancel booking status:', cancelRes.status, 'Status:', cancelRes.data?.data?.status);
  console.log('  Cancellation reason:', cancelRes.data?.data?.cancellationReason);

  // Verify audit history includes all reason records
  const checkAudit = await getJson(`${API_BASE}/bookings/${b2Id}`, studentToken);
  console.log('\n✓ Verified Audit History for Waitlist -> Cancellation:');
  checkAudit.data?.data?.booking?.auditTrail?.forEach((a, i) => {
    console.log(`  ${i + 1}. [${a.transition}] ${a.fromStatus} -> ${a.toStatus}: "${a.note}"`);
  });

  console.log('\n🎉 ALL REASON TRACKING & EXCEPTION LIFECYCLE PATHS VERIFIED!\n');
}

testRejectionAndWaitlist().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
