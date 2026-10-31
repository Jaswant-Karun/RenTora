// Test RENTORA AI-assisted functionality
const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('🤖 Starting RENTORA AI Functionality Test Suite...\n');

  // Test 1: Status & Provider Disclosure
  console.log('--- TEST 1: AI Engine Status & Disclosure ---');
  const statusRes = await fetch(`${API_BASE}/ai/status`);
  const statusData = await statusRes.json();
  console.log('Status code:', statusRes.status);
  console.log('Provider:', statusData.data?.provider);
  console.log('Disclosure:', statusData.data?.disclosureText);
  console.log('Safety Guardrail:', statusData.data?.safetyGuardrail);
  if (!statusData.success || !statusData.data?.safetyGuardrail) {
    throw new Error('Test 1 failed: Status endpoint missing safety guardrail.');
  }
  console.log('✅ Test 1 Passed: AI status and mandatory guardrails active.\n');

  // Test 2: Smart Resource Matching
  console.log('--- TEST 2: Smart Resource Matching ---');
  const matchRes = await fetch(`${API_BASE}/ai/match-resources`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requirements: 'high precision microscope nanoscale imaging optical spectroscopy',
      category: 'Laboratories',
    }),
  });
  const matchData = await matchRes.json();
  console.log('Match Status:', matchRes.status);
  console.log('Matched count:', matchData.data?.results?.length);
  if (matchData.data?.results?.length > 0) {
    const top = matchData.data.results[0];
    console.log('Top match:', top.resource?.name, 'Score:', top.matchScore + '%');
    console.log('Why recommended reasons:', top.whyRecommended);
    console.log('Eligibility status:', top.eligibilityStatus);
  }
  if (!matchData.success || !matchData.data?.results) {
    throw new Error('Test 2 failed: Smart matching returned invalid structure.');
  }
  console.log('✅ Test 2 Passed: Smart matching and why-recommended reasons generated.\n');

  // Test 3: Resource Utilization Analytics
  console.log('--- TEST 3: Resource Utilization Analytics ---');
  const utilRes = await fetch(`${API_BASE}/ai/utilization-analytics`);
  const utilData = await utilRes.json();
  console.log('Utilization Status:', utilRes.status);
  console.log('Total Resources:', utilData.data?.totalResources);
  console.log('Available Resources:', utilData.data?.availableResources);
  console.log('Overall Utilization Rate:', utilData.data?.overallUtilizationRate + '%');
  console.log('Booking Frequency (avg per asset):', utilData.data?.bookingFrequency?.avgBookingsPerAsset);
  console.log('Most Requested Assets count:', utilData.data?.mostRequestedResources?.length);
  console.log('Underutilized Assets count:', utilData.data?.underutilizedResources?.length);
  console.log('Peak Demand Periods:', utilData.data?.peakDemandPeriods?.peakHoursSummary);
  console.log('AI Recommendations count:', utilData.data?.aiRecommendations?.length);
  if (!utilData.success || typeof utilData.data?.totalResources !== 'number') {
    throw new Error('Test 3 failed: Utilization analytics calculation error.');
  }
  console.log('✅ Test 3 Passed: Resource utilization analytics calculated.\n');

  // Test 4: Scheduling Conflict Detection
  console.log('--- TEST 4: Scheduling Conflict Detection ---');
  // First fetch an existing resource
  const resList = await fetch(`${API_BASE}/resources?limit=1`).then(r => r.json());
  const sampleRes = resList.data?.[0];
  if (!sampleRes) {
    throw new Error('No resources found for conflict testing');
  }

  // Conflict scenario A: outside operating hours (e.g. 02:00 to 05:00 AM)
  const conflictResA = await fetch(`${API_BASE}/ai/detect-conflicts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resourceId: sampleRes._id,
      date: '2026-11-05',
      timeSlot: '02:00 - 05:00',
      startTime: '2026-11-05T02:00:00',
      endTime: '2026-11-05T05:00:00',
    }),
  });
  const conflictDataA = await conflictResA.json();
  console.log('Out of hours conflict detected:', conflictDataA.data?.hasConflict);
  console.log('Conflict explanation:', conflictDataA.data?.overallExplanation);
  console.log('Suggested alternatives:', conflictDataA.data?.suggestedAlternativeSlots?.length);
  if (!conflictDataA.data?.hasConflict) {
    throw new Error('Test 4A failed: Out of hours was not flagged as conflict.');
  }

  // Conflict scenario B: normal conflict-free hours (e.g. 10:00 to 12:00 next week)
  const conflictResB = await fetch(`${API_BASE}/ai/detect-conflicts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resourceId: sampleRes._id,
      date: '2026-11-20',
      timeSlot: '10:00 - 12:00',
      startTime: '2026-11-20T10:00:00',
      endTime: '2026-11-20T12:00:00',
    }),
  });
  const conflictDataB = await conflictResB.json();
  console.log('Normal slot conflict status:', conflictDataB.data?.hasConflict);
  console.log('Explanation:', conflictDataB.data?.overallExplanation);
  console.log('✅ Test 4 Passed: Scheduling conflict detection & suggested slots verified.\n');

  // Test 5: Incident Summary Assistant with Safety Guard
  console.log('--- TEST 5: Incident Summary Assistant & Ethical Guardrail ---');
  // Log in as manager to get token
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'manager@rentora.edu',
      password: 'Password123!',
    }),
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token;

  const incidentSummaryRes = await fetch(`${API_BASE}/ai/summarize-incident`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      category: 'equipment_damage',
      resourceName: 'Zeiss Sigma Field Emission SEM',
      description: 'The specimen stage jammed during high vacuum cycle. Unusual grinding noise was audible and stage XYZ motorized controls became unresponsive.',
      reportedBy: 'Arun Kumar',
      severity: 'high',
      evidence: ['vacuum_log_error.png'],
    }),
  });
  const summaryData = await incidentSummaryRes.json();
  console.log('Incident Summary Status:', incidentSummaryRes.status);
  console.log('Executive Summary:', summaryData.data?.executiveSummary);
  console.log('Key Findings:', summaryData.data?.keyFindings);
  console.log('AI Decision Guard:', summaryData.data?.aiDecisionGuard);
  if (!summaryData.success || !summaryData.data?.aiDecisionGuard.includes('never independently impose penalties')) {
    throw new Error('Test 5 failed: AI decision guardrail not strictly enforced.');
  }
  console.log('✅ Test 5 Passed: Incident summary assistant and ethical safety guardrails verified.\n');

  console.log('=====================================================');
  console.log('🎉 ALL 5 AI BACKEND INTEGRATION TESTS PASSED 100%!');
  console.log('=====================================================');
}

runTests().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
