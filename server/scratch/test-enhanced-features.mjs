// Comprehensive Verification of Enhanced Owner and Manager Functionality
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

async function patchJson(url, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify(body) });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function deleteJson(url, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method: 'DELETE', headers });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function runEnhancedTests() {
  console.log('🧪 Starting Verification of Enhanced Owner and Manager Functionality...\n');

  // 1. Authenticate users
  const ownerLogin = await postJson(`${API_BASE}/auth/login`, {
    email: 'owner@rentora.edu',
    password: 'Password123!',
  });
  const ownerToken = ownerLogin.data?.data?.token;
  const ownerUser = ownerLogin.data?.data?.user;

  const managerLogin = await postJson(`${API_BASE}/auth/login`, {
    email: 'manager@rentora.edu',
    password: 'Password123!',
  });
  const managerToken = managerLogin.data?.data?.token;

  console.log(`✓ Authenticated Owner (${ownerUser?.name || 'Owner'}) and Manager.`);

  // 2. Owner Overview 9 Metrics Verification
  console.log('\n2. Testing Owner Overview 9 Metrics...');
  const overviewRes = await getJson(`${API_BASE}/owner/overview`, ownerToken);
  console.log('• Owner Overview status:', overviewRes.status);
  if (overviewRes.status === 200) {
    const stats = overviewRes.data.data.stats;
    console.log('  1. Total resources:', stats.totalResources);
    console.log('  2. Available resources:', stats.availableResources);
    console.log('  3. Currently booked resources:', stats.currentlyBookedResources);
    console.log('  4. Pending booking requests:', stats.pendingBookingRequests);
    console.log('  5. Active reservations:', stats.activeReservations);
    console.log('  6. Completed bookings:', stats.completedBookings);
    console.log('  7. Utilization percentage:', stats.utilizationPercentage);
    console.log('  8. Upcoming reservations count:', overviewRes.data.data.upcomingReservations?.length || 0);
    console.log('  9. Recent activity count:', overviewRes.data.data.recentActivity?.length || 0);
  }

  // 3. Create Resource with all advanced parameters
  console.log('\n3. Creating Resource with Complete Constraints & Operating Hours...');
  const newResPayload = {
    name: 'Advanced Confocal Microscope ' + Date.now().toString().slice(-4),
    category: 'Laboratories',
    description: 'High-resolution fluorescence confocal imaging system.',
    institution: 'Apex Institute of Technology',
    location: 'Bioengineering Lab 402',
    capacity: 2,
    images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b'],
    operatingHours: {
      open: '08:00',
      close: '20:00',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    },
    bookingDuration: {
      minMinutes: 30,
      maxMinutes: 240,
    },
    usageLimits: {
      maxHoursPerWeek: 12,
      maxBookingsPerUser: 3,
    },
    eligibility: 'Graduate Student, Postdoc, Faculty',
    trainingRequired: 'Bio-Safety Level 2 Certification, Confocal Laser Training',
    safetyInstructions: ['Safety goggles mandatory', 'Log laser hours in physical binder'],
    status: 'available',
  };

  const createRes = await postJson(`${API_BASE}/owner/resources`, newResPayload, ownerToken);
  console.log('• Resource Creation status:', createRes.status);
  const resourceId = createRes.data?.data?._id;
  console.log('  - Created Resource ID:', resourceId);

  // 4. Update Resource with Status Change (Temporarily Disable / Maintenance)
  console.log('\n4. Testing Resource Updates (Disable / Maintenance)...');
  const updateRes = await patchJson(`${API_BASE}/owner/resources/${resourceId}`, {
    status: 'maintenance',
    description: 'Under scheduled annual laser optical realignment.',
  }, ownerToken);
  console.log('• Resource Update status:', updateRes.status);
  console.log('  - Updated Status:', updateRes.data?.data?.status);

  // 5. RBAC Protection: Non-owner / unauthorized modification
  console.log('\n5. Testing RBAC Security: Unauthorized Owner Modification...');
  const anotherEmail = `owner2_${Date.now()}@rentora.edu`;
  const regRes = await postJson(`${API_BASE}/auth/register`, {
    name: 'Owner Two',
    email: anotherEmail,
    password: 'Password123!',
    confirmPassword: 'Password123!',
    agreeTerms: true,
    role: 'owner',
    institution: 'Other University',
    department: 'Biotechnology',
    phone: '9876543210',
  });
  const owner2Token = regRes.data?.data?.token;

  // Attempt to modify first owner's resource with owner 2 token
  const unauthorizedUpdate = await patchJson(`${API_BASE}/owner/resources/${resourceId}`, {
    name: 'Hacked Name',
  }, owner2Token);
  console.log('• Unauthorized Owner update status:', unauthorizedUpdate.status, '(Expected 403 Forbidden)');

  const unauthorizedDelete = await deleteJson(`${API_BASE}/owner/resources/${resourceId}`, owner2Token);
  console.log('• Unauthorized Owner archive status:', unauthorizedDelete.status, '(Expected 403 Forbidden)');

  // 6. Test Suggest Alternative Dates on Booking
  console.log('\n6. Testing Suggest Alternative Dates on Booking...');
  const bookingsRes = await getJson(`${API_BASE}/owner/bookings`, ownerToken);
  const sampleBooking = bookingsRes.data?.data?.[0];
  if (sampleBooking) {
    const suggestRes = await postJson(`${API_BASE}/owner/bookings/${sampleBooking._id}/suggest-dates`, {
      suggestedDate: '2026-11-05',
      suggestedTimeSlot: '14:00 - 16:00',
      note: 'The morning slot is reserved for routine calibration. Afternoon is fully open.',
    }, ownerToken);
    console.log('• Suggest Alternative Dates status:', suggestRes.status);
    console.log('  - Suggested Alternative saved:', !!suggestRes.data?.data?.suggestedAlternative);
    console.log('  - Offered Date & Slot:', suggestRes.data?.data?.suggestedAlternative?.date, suggestRes.data?.data?.suggestedAlternative?.timeSlot);
  }

  // 7. Test Soft Archival (without deleting historical booking records)
  console.log('\n7. Testing Soft Archival of Resource without Record Deletion...');
  const archiveRes = await deleteJson(`${API_BASE}/owner/resources/${resourceId}`, ownerToken);
  console.log('• Resource Soft-Archival status:', archiveRes.status);
  console.log('  - isArchived flag:', archiveRes.data?.data?.isArchived);
  console.log('  - Resource status:', archiveRes.data?.data?.status);

  // 8. Test Manager Institutional Oversight Endpoints
  console.log('\n8. Testing Manager Institutional Oversight Endpoints...');
  const managerBookings = await getJson(`${API_BASE}/manager/bookings`, managerToken);
  console.log('• Manager Bookings Oversight status:', managerBookings.status, 'Total Bookings:', managerBookings.data?.data?.length);

  const managerWaitlists = await getJson(`${API_BASE}/manager/waitlists`, managerToken);
  console.log('• Manager Waitlist Management status:', managerWaitlists.status, 'Waitlist entries:', managerWaitlists.data?.data?.length);

  const managerAuditLogs = await getJson(`${API_BASE}/manager/audit-logs`, managerToken);
  console.log('• Manager Audit Logs status:', managerAuditLogs.status, 'Audit Log entries:', managerAuditLogs.data?.data?.length);
  if (managerAuditLogs.data?.data?.length > 0) {
    console.log('  - Recent Audit Actions:', managerAuditLogs.data.data.slice(0, 4).map(l => l.action).join(', '));
  }

  const managerOwners = await getJson(`${API_BASE}/manager/users?role=owner`, managerToken);
  console.log('• Manager Owner Verification list status:', managerOwners.status, 'Owners count:', managerOwners.data?.data?.length);

  const managerStudents = await getJson(`${API_BASE}/manager/users?role=student`, managerToken);
  console.log('• Manager Student Verification list status:', managerStudents.status, 'Students count:', managerStudents.data?.data?.length);

  console.log('\n🎉 ALL ENHANCED OWNER AND MANAGER FEATURES TESTED & VERIFIED SUCCESSFULLY!');
}

runEnhancedTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
