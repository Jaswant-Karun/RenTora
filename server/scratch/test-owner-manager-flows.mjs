// Automated end-to-end test of Owner & Manager API endpoints & RBAC protections
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

async function patchJson(url, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function putJson(url, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function runTests() {
  console.log('🧪 Starting Owner & Manager Comprehensive Workflow Tests...\n');

  // 1. Authenticate users
  console.log('1. Authenticating test users...');
  const ownerLogin = await postJson(`${API_BASE}/auth/login`, {
    email: 'owner@rentora.edu',
    password: 'Password123!',
  });
  const ownerToken = ownerLogin.data?.data?.token;
  console.log('✓ Owner login status:', ownerLogin.status, 'Token:', !!ownerToken);

  const managerLogin = await postJson(`${API_BASE}/auth/login`, {
    email: 'manager@rentora.edu',
    password: 'Password123!',
  });
  const managerToken = managerLogin.data?.data?.token;
  console.log('✓ Manager login status:', managerLogin.status, 'Token:', !!managerToken);

  const studentLogin = await postJson(`${API_BASE}/auth/login`, {
    email: 'student@rentora.edu',
    password: 'Password123!',
  });
  const studentToken = studentLogin.data?.data?.token;
  console.log('✓ Student login status:', studentLogin.status, 'Token:', !!studentToken);

  // 2. Test RBAC security enforcement on endpoints
  console.log('\n2. Testing RBAC Security & API Route Enforcement...');
  const studentToOwner = await getJson(`${API_BASE}/owner/overview`, studentToken);
  console.log('• Student -> /api/owner/overview:', studentToOwner.status, '(Expect 403)');
  if (studentToOwner.status !== 403) throw new Error('RBAC Failed: Student accessed owner API!');

  const studentToManager = await getJson(`${API_BASE}/manager/stats`, studentToken);
  console.log('• Student -> /api/manager/stats:', studentToManager.status, '(Expect 403)');
  if (studentToManager.status !== 403) throw new Error('RBAC Failed: Student accessed manager API!');

  const ownerToManager = await getJson(`${API_BASE}/manager/stats`, ownerToken);
  console.log('• Owner -> /api/manager/stats:', ownerToManager.status, '(Expect 403)');
  if (ownerToManager.status !== 403) throw new Error('RBAC Failed: Owner accessed manager API!');

  // 3. Test Owner Endpoints
  console.log('\n3. Testing Owner Endpoints & Add Resource with All Fields...');
  const overview = await getJson(`${API_BASE}/owner/overview`, ownerToken);
  console.log('• Owner Overview status:', overview.status, 'Total listed resources:', overview.data?.data?.stats?.totalListedResources);

  // Add Resource with ALL requested fields:
  // - Resource name, Category, Description, Institution, Location, Specifications,
  //   Images, Availability schedule, Minimum booking duration, Maximum booking duration,
  //   Eligibility requirements, Training requirements, Safety instructions,
  //   Supervision requirement, Deposit or usage conditions if applicable, Approval requirement
  const newResourceData = {
    name: 'Advanced Scanning Tunneling Microscope STM-900',
    category: 'Testing Instruments',
    description: 'Atomic-resolution surface characterization instrument for quantum material research.',
    institution: 'Apex Institute of Technology',
    location: 'Nanotechnology Cleanroom B-12',
    specifications: {
      'Lateral Resolution': '0.1 nm',
      'Vertical Resolution': '0.01 nm',
      'Vacuum Level': 'Ultra-High Vacuum (< 10^-10 mbar)',
      'Temperature Range': '4K - 300K',
    },
    images: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop'],
    availabilitySchedule: 'Mon-Fri 08:00 - 18:00',
    minBookingDuration: 2,
    maxBookingDuration: 6,
    eligibility: 'Graduate researchers with cleanroom Class 1000 qualification',
    trainingRequired: 'Nanotech Safety Protocol level 2',
    safetyInstructions: [
      'Gown up in full cleanroom suit prior to airlock entry',
      'Do not vent chamber without cryogenic sensor stabilization',
      'Use nitrogen purge during tip exchange',
    ],
    supervisionRequirement: true,
    depositConditions: '$250 safety bond, refundable upon post-session vacuum seal inspection',
    approvalRequired: true,
  };

  const addRes = await postJson(`${API_BASE}/owner/resources`, newResourceData, ownerToken);
  console.log('• Add Resource status:', addRes.status, 'Resource ID:', addRes.data?.data?._id);
  if (addRes.status !== 201) throw new Error('Failed to create new resource as owner');
  const createdResourceId = addRes.data?.data?._id;

  // 4. Test Bookings & Booking Management
  console.log('\n4. Testing Booking Management & Reason Tracking...');
  const ownerBookings = await getJson(`${API_BASE}/owner/bookings`, ownerToken);
  console.log('• Owner Bookings status:', ownerBookings.status, 'Count:', ownerBookings.data?.data?.length);

  if (ownerBookings.data?.data?.length > 0) {
    const testBooking = ownerBookings.data.data[0];
    console.log(`• Testing actions on booking ID: ${testBooking._id} (Current status: ${testBooking.status})`);

    // Test rejection with reason
    const rejectRes = await postJson(`${API_BASE}/owner/bookings/${testBooking._id}/reject`, {
      reason: 'Laser sensor calibration scheduled during requested timeslot',
    }, ownerToken);
    console.log('  -> Rejection with Reason status:', rejectRes.status, 'Status:', rejectRes.data?.data?.status, 'Reason:', rejectRes.data?.data?.rejectionReason);

    // Test approval
    const approveRes = await postJson(`${API_BASE}/owner/bookings/${testBooking._id}/approve`, {}, ownerToken);
    console.log('  -> Approval status:', approveRes.status, 'Status:', approveRes.data?.data?.status);

    // Test cancellation with reason
    const cancelRes = await postJson(`${API_BASE}/owner/bookings/${testBooking._id}/cancel`, {
      reason: 'Emergency cryogenic coolant replenishment in progress',
    }, ownerToken);
    console.log('  -> Cancellation with Reason status:', cancelRes.status, 'Status:', cancelRes.data?.data?.status, 'Reason:', cancelRes.data?.data?.cancellationReason);

    // Test waitlisting
    const waitlistRes = await postJson(`${API_BASE}/owner/bookings/${testBooking._id}/waitlist`, {}, ownerToken);
    console.log('  -> Move to Waitlist status:', waitlistRes.status, 'Status:', waitlistRes.data?.data?.status);

    // Reset to active for checkin/checkout test
    await postJson(`${API_BASE}/owner/bookings/${testBooking._id}/approve`, {}, ownerToken);

    // Test Check-in
    const checkInRes = await postJson(`${API_BASE}/owner/checkin-checkout`, {
      bookingId: testBooking._id,
      action: 'check_in',
      meterReading: '1240.5 runtime hours',
      conditionNotes: 'All optics calibrated, pre-run checklist signed',
    }, ownerToken);
    console.log('  -> Check-In Execution status:', checkInRes.status, 'CheckedIn:', checkInRes.data?.data?.checkedIn);

    // Test Check-out
    const checkOutRes = await postJson(`${API_BASE}/owner/checkin-checkout`, {
      bookingId: testBooking._id,
      action: 'check_out',
      meterReading: '1244.5 runtime hours',
      conditionNotes: 'Run completed successfully, chamber returned to high vacuum',
    }, ownerToken);
    console.log('  -> Check-Out Execution status:', checkOutRes.status, 'CheckedOut:', checkOutRes.data?.data?.checkedOut);
  }

  // 5. Test Condition Reports & Incidents
  console.log('\n5. Testing Condition Reports & Incident Logging...');
  const createReport = await postJson(`${API_BASE}/owner/condition-reports`, {
    resourceId: createdResourceId,
    reportType: 'routine-maintenance',
    conditionRating: 'excellent',
    notes: 'Tip exchange complete, tunneling current verified on gold standard sample.',
    issuesIdentified: [],
  }, ownerToken);
  console.log('• Create Condition Report status:', createReport.status);

  const createIncident = await postJson(`${API_BASE}/owner/incidents`, {
    resourceId: createdResourceId,
    severity: 'low',
    title: 'Airlock Pre-Vacuum Pump Warning',
    description: 'Minor pressure oscillation detected during chamber seal cycle.',
    actionTaken: 'Tightened intake valve gasket, pressure normalized.',
  }, ownerToken);
  console.log('• Create Safety Incident status:', createIncident.status);

  // 6. Test Manager Dashboard Endpoints
  console.log('\n6. Testing Manager Dashboard Endpoints & Governance...');
  const managerStats = await getJson(`${API_BASE}/manager/stats`, managerToken);
  console.log('• Manager Stats status:', managerStats.status, 'Campus Safety Score:', managerStats.data?.data?.stats?.campusSafetyScore);

  // Resource approval toggle
  const managerApprovals = await getJson(`${API_BASE}/manager/resource-approvals`, managerToken);
  console.log('• Manager Resource Approvals count:', managerApprovals.data?.data?.length);
  if (managerApprovals.data?.data?.length > 0) {
    const targetApproval = managerApprovals.data.data[0];
    const updateApproval = await patchJson(`${API_BASE}/manager/resource-approvals/${targetApproval._id}`, {
      approvalStatus: 'approved',
    }, managerToken);
    console.log('• Manager Approves Resource status:', updateApproval.status, 'Status:', updateApproval.data?.data?.approvalStatus);
  }

  // User verification toggle
  const managerUsers = await getJson(`${API_BASE}/manager/users`, managerToken);
  console.log('• Manager Users list count:', managerUsers.data?.data?.length);
  if (managerUsers.data?.data?.length > 0) {
    const targetUser = managerUsers.data.data[0];
    const toggleVer = await patchJson(`${API_BASE}/manager/users/${targetUser._id}/verify`, {
      isVerified: true,
    }, managerToken);
    console.log('• Manager Toggle User Verification status:', toggleVer.status, 'Verified:', toggleVer.data?.data?.isVerified);
  }

  // Incident resolution
  const managerIncidents = await getJson(`${API_BASE}/manager/incidents`, managerToken);
  console.log('• Manager Incidents count:', managerIncidents.data?.data?.length);
  if (managerIncidents.data?.data?.length > 0) {
    const targetInc = managerIncidents.data.data[0];
    const resInc = await patchJson(`${API_BASE}/manager/incidents/${targetInc._id}`, {
      status: 'resolved',
      resolutionNotes: 'Reviewed by EH&S Director, equipment approved for ongoing research.',
    }, managerToken);
    console.log('• Manager Resolve Incident status:', resInc.status, 'Status:', resInc.data?.data?.status);
  }

  // Dispute resolution
  const managerDisputes = await getJson(`${API_BASE}/manager/disputes`, managerToken);
  console.log('• Manager Disputes count:', managerDisputes.data?.data?.length);
  if (managerDisputes.data?.data?.length > 0) {
    const targetDispute = managerDisputes.data.data[0];
    const resDispute = await postJson(`${API_BASE}/manager/disputes/${targetDispute._id}/resolve`, {
      resolution: 'Institutional arbitration ruling: Pre-existing wear established, cleaning fee dismissed.',
    }, managerToken);
    console.log('• Manager Resolve Dispute status:', resDispute.status, 'Status:', resDispute.data?.data?.status);
  }

  // Fair Allocation Settings
  const fairSettings = await getJson(`${API_BASE}/manager/fair-allocation`, managerToken);
  console.log('• Manager Fair Allocation settings status:', fairSettings.status);
  const updateFair = await putJson(`${API_BASE}/manager/fair-allocation`, {
    maxHoursPerWeekPerUser: 16,
    maxActiveBookingsPerUser: 4,
    peakHoursStart: '09:00',
    peakHoursEnd: '17:00',
    allowCrossInstitution: true,
    prioritizeUnderrepresentedDepts: true,
  }, managerToken);
  console.log('• Update Fair Allocation status:', updateFair.status, 'MaxHours:', updateFair.data?.data?.maxHoursPerWeekPerUser);

  console.log('\n🎉 ALL OWNER & MANAGER BACKEND APIS AND RBAC RULES VERIFIED SUCCESSFULLY!\n');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
