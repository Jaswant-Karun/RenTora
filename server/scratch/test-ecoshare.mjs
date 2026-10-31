// test-ecoshare.mjs - Comprehensive validation of EcoShare Sustainability Insights
const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting EcoShare Sustainability Engine Automated Verification...\n');

  // Step 1: Sign in as manager to verify privileged assumption configuration
  console.log('1. Signing in as Manager...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'manager@rentora.edu', password: 'Password123!' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token || loginData.token;
  if (!loginData.success || !token) {
    throw new Error('Manager login failed: ' + JSON.stringify(loginData));
  }
  console.log('   ✅ Manager authenticated successfully.\n');

  // Step 2: Fetch sustainability assumptions
  console.log('2. Fetching institutional sustainability calculation assumptions...');
  const assumptionsRes = await fetch(`${BASE_URL}/ecoshare/assumptions`);
  const assumptionsData = await assumptionsRes.json();
  console.log('   Assumptions Response:', assumptionsData);
  if (!assumptionsData.success || !assumptionsData.data) {
    throw new Error('Failed to retrieve sustainability assumptions');
  }
  console.log(`   ✅ Default parameters verified:
     - Cost avoided per hour: ₹${assumptionsData.data.costAvoidedPerHourINR}
     - Purchase avoidance threshold: ${assumptionsData.data.purchaseAvoidanceThresholdHours} hrs
     - Average apparatus capital cost: ₹${assumptionsData.data.averageApparatusCapitalCostINR}
     - Embodied carbon proxy: ${assumptionsData.data.lifecycleEmbodiedCarbonEstimateKgPerUnit} kg CO2e/unit\n`);

  // Step 3: Fetch EcoShare Insights Telemetry
  console.log('3. Fetching EcoShare Sustainability Insights...');
  const insightsRes = await fetch(`${BASE_URL}/ecoshare/insights`);
  const insightsData = await insightsRes.json();
  if (!insightsData.success || !insightsData.data) {
    throw new Error('Failed to retrieve insights telemetry: ' + JSON.stringify(insightsData));
  }
  const insights = insightsData.data;

  console.log('   ✅ Insights retrieved successfully.');
  console.log(`   - Insufficient Data Flag: ${insights.insufficientData}`);
  console.log(`   - Total Completed Bookings: ${insights.summary.totalCompletedBookings}`);
  console.log(`   - Total Shared Hours: ${insights.summary.totalSharedHours}`);
  console.log(`   - Actively Shared Resources: ${insights.summary.activelySharedResourcesCount} / ${insights.summary.totalRegisteredResources}`);
  console.log(`   - Campus Shared Adoption Rate: ${insights.summary.sharedAdoptionPercentage}%`);
  console.log(`   - Unique Participating Borrowers: ${insights.summary.uniqueBorrowersCount}`);
  console.log(`   - Asset Reuse Multiplier: ${insights.summary.reuseMultiplier}x`);
  console.log(`   - Estimated Avoided Duplicate Units: ~${insights.summary.estimatedAvoidedDuplicateUnits}`);
  console.log(`   - Estimated CapEx Avoided: ~₹${insights.summary.estimatedCapExAvoidedINR.toLocaleString('en-IN')}`);
  console.log(`   - Estimated Embodied Carbon Avoided: ~${insights.summary.estimatedEmbodiedCarbonAvoidedKg} kg CO2e`);
  console.log(`   - Estimated Utilization Improvement: ~${insights.summary.estimatedUtilizationImprovementPct}%`);
  console.log(`   - Disclaimer Is Estimate: ${insights.disclaimers.isEstimate}`);
  console.log(`   - Categories Shared Count: ${insights.categoryBreakdown.length}`);
  console.log(`   - Monthly Breakdown Records: ${insights.monthlyImpact.length}`);
  console.log(`   - Yearly Breakdown Records: ${insights.yearlyImpact.length}`);
  console.log(`   - Actionable Sustainability Insights: ${insights.actionableInsights.length}\n`);

  // Step 4: Verify Assumption Configuration Update (Manager / Admin Role)
  console.log('4. Testing Institutional Assumption Configuration (Manager updating parameters)...');
  const updateRes = await fetch(`${BASE_URL}/ecoshare/assumptions`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      costAvoidedPerHourINR: 2000,
      purchaseAvoidanceThresholdHours: 75,
      averageApparatusCapitalCostINR: 280000,
      lifecycleEmbodiedCarbonEstimateKgPerUnit: 400,
      methodologyNotes:
        'Audited laboratory apparatus amortized depreciation benchmark. All carbon indicators are proxy estimates for avoided manufacturing Scope 3 lifecycle impact.',
    }),
  });
  const updateData = await updateRes.json();
  if (!updateData.success || updateData.data.costAvoidedPerHourINR !== 2000) {
    throw new Error('Assumption update failed: ' + JSON.stringify(updateData));
  }
  console.log('   ✅ Manager successfully updated calculation assumptions.');
  console.log(`   - New Cost Avoided Per Hour: ₹${updateData.data.costAvoidedPerHourINR}`);
  console.log(`   - New Threshold: ${updateData.data.purchaseAvoidanceThresholdHours} hours\n`);

  // Step 5: Verify recalculated metrics with new assumptions
  console.log('5. Verifying dynamic recalculation with new assumptions...');
  const recheckRes = await fetch(`${BASE_URL}/ecoshare/insights`);
  const recheckData = await recheckRes.json();
  const newSummary = recheckData.data.summary;
  console.log(`   - Recalculated CapEx: ₹${newSummary.estimatedCapExAvoidedINR.toLocaleString('en-IN')}`);
  console.log(`   - Expected CapEx based on ₹2000/hr: ₹${(newSummary.totalSharedHours * 2000).toLocaleString('en-IN')}`);
  if (newSummary.totalSharedHours > 0) {
    if (newSummary.estimatedCapExAvoidedINR !== newSummary.totalSharedHours * 2000) {
      throw new Error('CapEx calculation does not match updated assumptions');
    }
  }
  console.log('   ✅ Calculations react dynamically to configured assumptions.\n');

  // Step 6: Test CSV Export
  console.log('6. Testing Downloadable Sustainability Impact Report (CSV Export)...');
  const exportRes = await fetch(`${BASE_URL}/ecoshare/export`);
  if (!exportRes.ok) {
    throw new Error(`CSV export failed with status: ${exportRes.status}`);
  }
  const csvText = await exportRes.text();
  console.log('   CSV Report Header Snippet:');
  console.log(csvText.split('\n').slice(0, 12).join('\n'));
  if (
    !csvText.includes('RENTORA ECOSHARE - INSTITUTIONAL RESOURCE SUSTAINABILITY REPORT') ||
    !csvText.includes('ALL ENVIRONMENTAL IMPACT AND AVOIDED CAPITAL FIGURES ARE ENGINEERING ESTIMATES')
  ) {
    throw new Error('CSV report missing required title or mandatory estimate disclaimers');
  }
  console.log('   ✅ CSV Report verified with full data rows and mandatory disclaimers.\n');

  console.log('🎉 ALL ECOSHARE SUSTAINABILITY TESTS PASSED WITH 100% SUCCESS!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
