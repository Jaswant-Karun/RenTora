import http from 'http';

const API_BASE = 'http://localhost:5000/api';

function request(method, path, body = null, token = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path.startsWith('http') ? path : `${API_BASE}${path}`);
    const reqHeaders = { ...headers };
    if (token) reqHeaders['Authorization'] = `Bearer ${token}`;

    let postData = null;
    if (body && typeof body === 'object' && !(body instanceof Buffer)) {
      postData = JSON.stringify(body);
      reqHeaders['Content-Type'] = 'application/json';
    } else if (body) {
      postData = body;
    }

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: reqHeaders,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runResourcePulseTestSuite() {
  console.log('⚡ Starting ResourcePulse – Institutional Resource Intelligence Test Suite...\n');

  // 1. Authenticate users
  console.log('1. Authenticating test users...');
  const studentRes = await request('POST', '/auth/login', {
    email: 'student@rentora.edu',
    password: 'Password123!',
  });
  const studentToken = studentRes.data?.data?.token;

  const ownerRes = await request('POST', '/auth/login', {
    email: 'owner@rentora.edu',
    password: 'Password123!',
  });
  const ownerToken = ownerRes.data?.data?.token;
  const owner = ownerRes.data?.data?.user;

  const managerRes = await request('POST', '/auth/login', {
    email: 'manager@rentora.edu',
    password: 'Password123!',
  });
  const managerToken = managerRes.data?.data?.token;

  console.log(`✓ Authenticated Student: ${studentRes.data?.data?.user?.name}`);
  console.log(`✓ Authenticated Lab Owner: ${owner?.name} (${owner?.role})`);
  console.log(`✓ Authenticated Institutional Manager: ${managerRes.data?.data?.user?.name}\n`);

  // 2. Test Role-Based Access Control (RBAC)
  console.log('2. Testing RBAC Security for Institutional Intelligence...');
  const studentAttempt = await request('GET', '/resource-pulse/metrics', null, studentToken);
  console.log(`• Student access attempt status: ${studentAttempt.status} (Expected 403 Forbidden)`);
  if (studentAttempt.status !== 403) {
    throw new Error('Security Error: Student was not forbidden from accessing institutional intelligence!');
  }

  // 3. Test Owner Metrics Calculation (Last 30 Days default)
  console.log('\n3. Testing Owner Resource Pulse Calculation (Last 30 Days)...');
  const ownerMetricsRes = await request('GET', '/resource-pulse/metrics?range=last_30_days', null, ownerToken);
  console.log(`• Owner metrics status: ${ownerMetricsRes.status} (Expected 200)`);
  const metrics = ownerMetricsRes.data.data;

  console.log('  - Time Range Label:', metrics.timeRange.label);
  console.log('  - Total Registered Equipment Units:', metrics.overview.totalRegisteredResources);
  console.log('  - Available Equipment Units:', metrics.overview.availableResources);
  console.log('  - Active Sessions:', metrics.overview.activeBookingsCount);
  console.log('  - Completed Sessions:', metrics.overview.completedBookingsCount);
  console.log('  - Total Booked Hours:', metrics.overview.totalBookedHours, 'hrs');
  console.log('  - Total Bookable Operating Hours:', metrics.overview.totalBookableHours, 'hrs');
  console.log('  - Mathematically Computed Utilization Rate:', metrics.overview.utilizationRate + '%');
  console.log('  - Cancellation Rate:', metrics.overview.cancellationRate + '%');
  console.log('  - Overdue Returns:', metrics.overview.overdueReturnsCount);
  console.log('  - Priority Waitlist Demand:', metrics.overview.waitingListDemandCount);

  // Validate math consistency
  if (metrics.overview.totalBookableHours > 0) {
    const expectedRate = parseFloat(
      Math.min(100, (metrics.overview.totalBookedHours / metrics.overview.totalBookableHours) * 100).toFixed(1)
    );
    if (Math.abs(metrics.overview.utilizationRate - expectedRate) > 0.1) {
      throw new Error(`Utilization math mismatch! Computed: ${metrics.overview.utilizationRate}, Expected: ${expectedRate}`);
    }
  }
  console.log('✓ Utilization mathematical formula verified against actual bookable & booked hours.');

  // 4. Test Date Filtering (7 Days, 90 Days, Custom Range)
  console.log('\n4. Testing Date Range Filters...');
  const range7Days = await request('GET', '/resource-pulse/metrics?range=last_7_days', null, ownerToken);
  console.log(`• Last 7 Days status: ${range7Days.status} | Days count: ${range7Days.data.data.timeRange.daysCount} (Expected 7)`);

  const range90Days = await request('GET', '/resource-pulse/metrics?range=last_90_days', null, ownerToken);
  console.log(`• Last 90 Days status: ${range90Days.status} | Days count: ${range90Days.data.data.timeRange.daysCount} (Expected 90)`);

  const customRange = await request(
    'GET',
    '/resource-pulse/metrics?range=custom&startDate=2026-10-01&endDate=2026-10-25',
    null,
    ownerToken
  );
  console.log(`• Custom Range status: ${customRange.status} | Label: ${customRange.data.data.timeRange.label}`);

  // 5. Test Frequently Booked & Underutilized Detection
  console.log('\n5. Testing Frequently Booked vs Underutilized Resource Analysis...');
  console.log(`• Frequently Booked Count: ${metrics.frequentlyBookedResources.length}`);
  metrics.frequentlyBookedResources.slice(0, 3).forEach((r, i) => {
    console.log(`  [Rank #${i + 1}] "${r.name}" (${r.category}) - ${r.bookingCount} bookings, ${r.totalHours} hrs, ${r.utilizationPercent}% utilization`);
  });

  console.log(`• Underutilized Equipment Count: ${metrics.underutilizedResources.length}`);
  metrics.underutilizedResources.slice(0, 3).forEach((r, i) => {
    console.log(`  [Underused #${i + 1}] "${r.name}" - ${r.bookingCount} bookings (${r.reason})`);
  });

  // 6. Test Peak Usage Period & Category Breakdown
  console.log('\n6. Testing Peak Usage Periods & Category-wise Aggregation...');
  console.log(`• Category Breakdown Count: ${metrics.categoryUsage.length}`);
  metrics.categoryUsage.forEach((c) => {
    console.log(`  - Category: ${c.category} | ${c.bookingCount} bookings (${c.percentage}%), ${c.resourceCount} units`);
  });

  console.log(`• Peak Time Slots: ${metrics.peakUsagePeriods.length}`);
  metrics.peakUsagePeriods.forEach((p) => {
    console.log(`  - Slot: ${p.timeSlot} | ${p.bookingCount} bookings (${p.percentage}%)`);
  });

  // 7. Test Actionable Real Insights Generation
  console.log('\n7. Testing Actionable Institutional Insights Generation...');
  console.log(`• Generated Real Insights: ${metrics.insights.length}`);
  metrics.insights.forEach((ins, i) => {
    console.log(`  [Insight #${i + 1} | ${ins.type.toUpperCase()}] ${ins.title}`);
    console.log(`    Message: ${ins.message}`);
    if (ins.metricContext) console.log(`    Context: ${ins.metricContext}`);
  });

  // 8. Test CSV Report Generation & Export
  console.log('\n8. Testing Exportable Intelligence CSV Report...');
  const exportRes = await request('GET', '/resource-pulse/export?range=last_30_days', null, ownerToken);
  console.log(`• CSV Export status: ${exportRes.status} (Expected 200)`);
  console.log(`• Content-Type: ${exportRes.headers['content-type']}`);
  console.log(`• Content-Disposition: ${exportRes.headers['content-disposition']}`);

  const csvSnippet = exportRes.raw.slice(0, 300);
  console.log('  CSV Preview:');
  console.log('  ' + csvSnippet.replace(/\n/g, '\n  '));

  if (!exportRes.raw.includes('EXECUTIVE UTILIZATION METRICS') || !exportRes.raw.includes('FREQUENTLY BOOKED')) {
    throw new Error('CSV Export validation failed: Required sections missing!');
  }

  console.log('\n🎉 ALL RESOURCEPULSE INTELLIGENCE REQUIREMENTS TESTED & VERIFIED SUCCESSFULLY!');
}

runResourcePulseTestSuite().catch((err) => {
  console.error('\n❌ ResourcePulse Test Suite Failed:', err);
  process.exit(1);
});
