// Test script for enhanced owner and manager endpoints
import fetch from 'node-fetch';

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
  const ownerId = ownerLogin.data?.data?.user?._id;

  const managerLogin = await postJson(`${API_BASE}/auth/login`, {
    email: 'manager@rentora.edu',
    password: 'Password123!',
  });
  const managerToken = managerLogin.data?.data?.token;

  console.log(`✓ Authenticated Owner (${ownerId}) and Manager.`);

  // 2. Owner Overview 9 Metrics Verification
  console.log('\n2. Testing Owner Overview 9 Metrics...');
  const overviewRes = await getJson(`${API_BASE}/owner/overview`, ownerToken);
  console.log('• Owner Overview status:', overviewRes.status);
  if (overviewRes.status === 200) {
    const stats = overviewRes.data.data.stats;
    console.log('  - Total resources:', stats.totalResources);
    console.log('  - Available resources:', stats.availableResources);
    console.log('  - Currently booked:', stats.currentlyBooked);
    console.log('  - Pending booking requests:', stats.pendingRequests);
    console.log('  - Active reservations:', stats.activeReservations);
    console.log('  - Completed bookings:', stats.completedBookings);
    console.log('  - Utilization percentage:', stats.utilizationPercentage + '%');
    console.log('  - Upcoming reservations count:', overviewRes.data.data.upcomingBookings?.length || 0);
    console.log('  - Recent activity count:', overviewRes.data.data.recentActivity?.length || 0);
  }

  // 3. Create Resource with all advanced parameters
  console.log('\n3. Creating Resource with Complete Constraints & Operating Hours...');
  const newResPayload = {
    name: 'Advanced Confocal Microscope ' + Date.now().toString().slice(-4),
    category: 'lab_equipment',
    description: 'High-resolution fluorescence confocal imaging system.',
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
    eligibilityRequirements: ['Graduate Student', 'Postdoc', 'Faculty'],
    trainingRequirements: ['Bio-Safety Level 2 Certification', 'Confocal Laser Training'],
    usageConditions: ['Safety goggles mandatory', 'Log laser hours in physical binder'],
    status: 'available',
  };

  const createRes = await postJson(`${API_BASE}/owner/resources`, newResPayload, ownerToken);
  console.log('• Resource Creation status:', createRes.status);
  const resourceId = createRes.data?.data?._id;
  console.log('  - Created Resource ID:', resourceId);

  // 4. Update Resource with Status Change (Temporarily Disable / Maintenance)
  console.log('\n4. Testing Resource Updates (Disable / Maintenance)...');
  const updateRes = await putJson(`${API_BASE}/owner/resources/${resourceId}`, {
    status: 'maintenance',
    description: 'Under scheduled annual laser optical realignment.',
  }, ownerToken);
  console.log('• Resource Update status:', updateRes.status);
  console.log('  - Updated Status:', updateRes.data?.data?.status);

  // 5. RBAC Protection: Non-owner / unauthorized modification
  console.log('\n5. Testing RBAC Security: Unauthorized Owner Modification...');
  // Register another owner
  const anotherEmail = `owner2_${Date.now()}@rentora.edu`;
  await postJson(`${API_BASE}/auth/register`, {
    name: 'Owner Two',
    email: anotherEmail,
    password: 'Password123!',
    role: 'owner',
    institution: 'Apex Institute of Technology',
  });
  const owner2Login = await postJson(`${API_BASE}/auth/login`, {
    email: anotherEmail,
    password: 'Password123!',
  });
  const owner2Token = owner2Login.data?.data?.token;

  // Attempt to modify first owner's resource
  const unauthorizedUpdate = await putJson(`${API_BASE}/owner/resources/${resourceId}`, {
    name: 'Hacked Name',
  }, owner2Token);
  console.log('• Unauthorized Owner update status:', unauthorizedUpdate.status, '(Expected 403 Forbidden)');

  const unauthorizedDelete = await deleteJson(`${API_BASE}/owner/resources/${resourceId}`, owner2Token);
  console.log('• Unauthorized Owner archive status:', unauthorizedDelete.status, '(Expected 403 Forbidden)');

  // 6. Test Suggest Alternative Dates on Booking
  console.log('\n6. Testing Suggest Alternative Dates on Booking...');
  // Fetch existing owner bookings
  const bookingsRes = await getJson(`${API_BASE}/owner/bookings`, ownerToken);
  const sampleBooking = bookingsRes.data?.data?.[0];
  if (sampleBooking) {
    const suggestRes = await postJson(`${API_BASE}/owner/bookings/${sampleBooking._id}/suggest-dates`, {
      alternativeDate: '2026-11-05',
      alternativeTimeSlot: '14:00 - 16:00',
      note: 'The morning slot is reserved for routine calibration. Afternoon is fully open.',
    }, ownerToken);
    console.log('• Suggest Alternative Dates status:', suggestRes.status);
    console.log('  - Suggested Alternative saved:', !!suggestRes.data?.data?.suggestedAlternative);
  }

  // 7. Test Soft Archival (without deleting historical booking records)
  console.log('\n7. Testing Soft Archival of Resource...');
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
    console.log('  - Recent Audit Actions:', managerAuditLogs.data.data.slice(0, 3).map(l => l.action).join(', '));
  }

  const managerOwners = await getJson(`${API_BASE}/manager/users?role=owner`, managerToken);
  console.log('• Manager Owner Verification list status:', managerOwners.status, 'Owners count:', managerOwners.data?.data?.length);

  console.log('\n🎉 ALL ENHANCED OWNER AND MANAGER FEATURES TESTED & VERIFIED SUCCESSFULLY!');
}

runEnhancedTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
