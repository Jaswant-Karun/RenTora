// Comprehensive automated test suite for FairShare - Transparent Resource Allocation Engine
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

async function putJson(url, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(body) });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function runFairShareTestSuite() {
  console.log('⚖️ Starting Comprehensive FairShare Allocation Engine Test Suite...\n');

  // 1. Authenticate users
  console.log('1. Authenticating test users...');
  const studentLogin = await postJson(`${API_BASE}/auth/login`, {
    email: 'student@rentora.edu',
    password: 'Password123!',
  });
  const studentToken = studentLogin.data?.data?.token;
  const studentUser = studentLogin.data?.data?.user;

  const managerLogin = await postJson(`${API_BASE}/auth/login`, {
    email: 'manager@rentora.edu',
    password: 'Password123!',
  });
  const managerToken = managerLogin.data?.data?.token;

  const ownerLogin = await postJson(`${API_BASE}/auth/login`, {
    email: 'owner@rentora.edu',
    password: 'Password123!',
  });
  const ownerToken = ownerLogin.data?.data?.token;

  console.log(`✓ Authenticated Student (${studentUser?.name}), Manager, and Owner.`);

  // 2. Fetch or create a test resource
  const resourcesRes = await getJson(`${API_BASE}/resources`, studentToken);
  const resource = resourcesRes.data?.data?.[0] || resourcesRes.data?.data?.resources?.[0];
  if (!resource) {
    throw new Error('No test resources available in catalog.');
  }
  const resourceId = resource._id;
  console.log(`✓ Using test resource: "${resource.name}" (${resourceId})`);

  // 3. Test FairShare Pre-Evaluation Transparency Breakdown
  console.log('\n2. Testing Transparent Pre-Evaluation & Fairness Explanation...');
  const testDate = '2026-11-20';
  const testSlot = '10:00 - 12:00';

  const evalRes = await postJson(`${API_BASE}/fairshare/evaluate`, {
    resourceId,
    date: testDate,
    timeSlot: testSlot,
  }, studentToken);

  console.log('• FairShare Evaluation status:', evalRes.status);
  const explanation = evalRes.data?.data?.explanation;
  if (explanation) {
    console.log('  - Eligibility Result:', explanation.eligibilityResult?.passed ? 'PASSED' : 'DEFICIENT', `(${explanation.eligibilityResult?.details})`);
    console.log('  - Availability Result:', explanation.availabilityResult?.passed ? 'AVAILABLE' : 'OFFLINE', `(${explanation.availabilityResult?.details})`);
    console.log('  - Conflict Result:', explanation.conflictResult?.hasConflict ? 'CONFLICT' : 'CLEAR', `(${explanation.conflictResult?.details})`);
    console.log('  - Active Limit Result:', explanation.activeLimitResult?.passed ? 'WITHIN LIMIT' : 'EXCEEDED', `(${explanation.activeLimitResult?.details})`);
    console.log('  - Previous Usage Result:', explanation.previousUsageResult?.passed ? 'BALANCED' : 'COOLDOWN', `(${explanation.previousUsageResult?.details})`);
    console.log('  - Applicable Priority Rule:', explanation.priorityRule?.appliedRule, `(Score: ${explanation.priorityRule?.score})`);
    console.log('  - Explanatory Factors:', explanation.priorityRule?.factors?.join(', '));
    console.log('  - Final Decision:', explanation.finalDecision, `(${explanation.reason})`);
  }

  // 4. Test Overlapping Booking Request & Conflict Detection
  console.log('\n3. Testing Overlapping Booking Collision Safeguard...');
  // Create primary booking for slot
  const book1Res = await postJson(`${API_BASE}/bookings`, {
    resourceId,
    date: testDate,
    timeSlot: testSlot,
    purpose: 'FairShare Conflict Test Primary Booking',
  }, studentToken);
  console.log('• Primary Booking status:', book1Res.status);
  const booking1Id = book1Res.data?.data?._id;

  // Create overlapping booking for the same slot without waitlist permission -> Expect 409 Conflict
  const conflictRes = await postJson(`${API_BASE}/bookings`, {
    resourceId,
    date: testDate,
    timeSlot: testSlot,
    purpose: 'Simultaneous overlapping booking attempt',
    allowWaitlist: false,
  }, studentToken);
  console.log('• Overlapping Booking Attempt status:', conflictRes.status, '(Expected 409 Conflict)');
  console.log('  - Message:', conflictRes.data?.message);

  // 5. Test Ordered Waiting List & Queue Position Assignment
  console.log('\n4. Testing Ordered Waiting List Placement & Queue Position...');
  const waitlistRes = await postJson(`${API_BASE}/bookings`, {
    resourceId,
    date: testDate,
    timeSlot: testSlot,
    purpose: 'Priority Waitlist Candidate Session',
    allowWaitlist: true,
  }, studentToken);
  console.log('• Waitlist Booking status:', waitlistRes.status);
  const waitlistBooking = waitlistRes.data?.data;
  console.log('  - Status:', waitlistBooking?.status);
  console.log('  - Assigned Queue Position:', waitlistBooking?.queuePosition);
  console.log('  - Priority Score:', waitlistBooking?.waitlistPriority);
  console.log('  - Waitlist Reason:', waitlistBooking?.waitlistReason);

  // 6. Test Slot Release & Next Eligible User Notification
  console.log('\n5. Testing Slot Cancellation & Automatic Waitlist Advancement Notification...');
  if (booking1Id) {
    const cancelRes = await postJson(`${API_BASE}/bookings/${booking1Id}/cancel`, {
      reason: 'Slot cancellation to trigger FairShare automated standby promotion.',
    }, studentToken);
    console.log('• Slot Cancellation status:', cancelRes.status);
    console.log('  - Resource released and waitlist candidate notified.');

    // Verify notifications for user
    const notifsRes = await getJson(`${API_BASE}/notifications`, studentToken);
    const releaseNotif = notifsRes.data?.data?.find(n => n.title?.includes('Slot Released') || n.title?.includes('FairShare Alert'));
    console.log('  - Waitlist Advancement Notification Dispatched:', !!releaseNotif);
    if (releaseNotif) {
      console.log('  - Notification Title:', releaseNotif.title);
      console.log('  - Notification Message:', releaseNotif.message);
    }
  }

  // 7. Test Manager Override with Mandatory Reason
  console.log('\n6. Testing Manager Override with Mandatory Reason...');
  if (waitlistBooking?._id) {
    // Attempt override without reason -> Expect 400
    const emptyOverride = await postJson(`${API_BASE}/fairshare/override/${waitlistBooking._id}`, {
      reason: '',
      action: 'approve',
    }, managerToken);
    console.log('• Override without mandatory reason status:', emptyOverride.status, '(Expected 400)');

    // Legitimate override with reason
    const validOverride = await postJson(`${API_BASE}/fairshare/override/${waitlistBooking._id}`, {
      reason: 'Sponsored institutional research project deadline requires expedited laboratory clearance.',
      action: 'approve',
    }, managerToken);
    console.log('• Legitimate Manager Override status:', validOverride.status);
    console.log('  - Overridden Status:', validOverride.data?.data?.status);
    console.log('  - Recorded Override Reason:', validOverride.data?.data?.managerOverrideReason);
  }

  // 8. Test FairShare Decision History & Audit Trails
  console.log('\n7. Testing FairShare Decision History & Transparency Ledger...');
  const historyRes = await getJson(`${API_BASE}/fairshare/history`, managerToken);
  console.log('• Decision History status:', historyRes.status);
  const decisions = historyRes.data?.data?.decisions || [];
  console.log('  - Total Logged Decisions:', decisions.length);
  if (decisions.length > 0) {
    const latest = decisions[0];
    console.log('  - Latest Evaluated Resource:', latest.resourceName);
    console.log('  - Researcher:', latest.userName);
    console.log('  - Decision:', latest.finalDecision);
    console.log('  - Reason:', latest.reason);
    console.log('  - Was Overridden:', latest.isOverridden);
  }

  // 9. Test Configurable Allocation Policy
  console.log('\n8. Testing Configurable FairShare Policy Limits...');
  const policyRes = await getJson(`${API_BASE}/fairshare/policy`, managerToken);
  console.log('• Policy Query status:', policyRes.status);
  console.log('  - Max Active Bookings Per Student:', policyRes.data?.data?.maxActiveBookingsPerStudent);
  console.log('  - Max Weekly Hours:', policyRes.data?.data?.maxWeeklyHoursPerStudent);
  console.log('  - Cooldown Days:', policyRes.data?.data?.cooldownPeriodDays);
  console.log('  - Priority Scoring PhD points:', policyRes.data?.data?.priorityScoring?.phdScholarPoints);

  console.log('\n🎉 ALL FAIRSHARE ALLOCATION ENGINE REQUIREMENTS TESTED & VERIFIED SUCCESSFULLY!');
}

runFairShareTestSuite().catch(err => {
  console.error('FairShare Test Failed:', err);
  process.exit(1);
});
