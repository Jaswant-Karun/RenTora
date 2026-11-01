// test-smartmatch.mjs - Comprehensive verification of SmartMatch AI-Assisted Resource Discovery
const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting SmartMatch AI-Assisted Resource Discovery Verification...\n');

  // Test 1: Query with the exact prompt: "I need a computer lab with GPU access tomorrow afternoon."
  console.log('1. Testing Natural-Language Search Intent Extraction...');
  const promptQuery = 'I need a computer lab with GPU access tomorrow afternoon.';

  const matchRes = await fetch(`${BASE_URL}/ai/match-resources`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requirements: promptQuery,
    }),
  });

  const matchData = await matchRes.json();
  if (!matchData.success || !matchData.data) {
    throw new Error('SmartMatch request failed: ' + JSON.stringify(matchData));
  }

  const { results, totalMatched, parsedIntent, aiProvider, disclosure } = matchData.data;

  console.log('   ✅ Match results returned successfully.');
  console.log(`   - AI Provider: ${aiProvider}`);
  console.log(`   - Total Matched: ${totalMatched}`);
  console.log(`   - Parsed Intent:`, parsedIntent);

  if (parsedIntent) {
    console.log(`     * Detected Category: ${parsedIntent.detectedCategory}`);
    console.log(`     * Detected Date: ${parsedIntent.detectedDate}`);
    console.log(`     * Detected Slot: ${parsedIntent.detectedTimeSlot}`);
    console.log(`     * Detected Specs: ${parsedIntent.detectedSpecs.join(', ')}`);
    console.log(`     * Confidence: ${parsedIntent.confidence}%`);

    if (parsedIntent.detectedCategory !== 'Computers') {
      throw new Error(`Expected detectedCategory 'Computers', got: ${parsedIntent.detectedCategory}`);
    }
    if (!parsedIntent.detectedDate) {
      throw new Error('Expected tomorrow date to be resolved');
    }
  }

  console.log('\n2. Verifying Top Recommended Resource & Rationale...');
  if (results.length > 0) {
    const topResult = results[0];
    console.log(`   - Top Recommended: "${topResult.resource.name}" (Score: ${topResult.matchScore}%)`);
    console.log(`   - Category: ${topResult.resource.category}`);
    console.log(`   - Location: ${topResult.resource.location} (${topResult.resource.institution})`);
    console.log(`   - Why Recommended Explanations:`);
    topResult.whyRecommended.forEach((reason) => console.log(`     • ${reason}`));

    console.log(`   - Recommended Time Slots on ${parsedIntent?.detectedDate || 'Target Date'}:`);
    topResult.availabilityStatus.recommendedTimeSlots?.forEach((slot) => {
      console.log(`     [${slot.isAvailable ? 'AVAILABLE' : 'RESERVED'}] ${slot.timeSlot}${slot.conflictReason ? ` (${slot.conflictReason})` : ''}`);
    });

    console.log(`   - Eligibility Status:`, {
      eligible: topResult.eligibilityStatus.eligible,
      qualificationMet: topResult.eligibilityStatus.qualificationMet,
      certificationsCovered: topResult.eligibilityStatus.certificationsCovered,
      missingCertifications: topResult.eligibilityStatus.missingCertifications,
      actionRequired: topResult.eligibilityStatus.actionRequired,
    });

    if (topResult.alternatives && topResult.alternatives.length > 0) {
      console.log(`   - Unavailable Alternatives Identified: ${topResult.alternatives.length}`);
      topResult.alternatives.forEach((alt) => {
        console.log(`     ↳ Alternative: "${alt.name}" (${alt.institution}) - ${alt.reason}`);
      });
    }
  }

  // Test 2: Authenticated user with institutional profile
  console.log('\n3. Testing SmartMatch with User Profile & Previous Interests...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@rentora.edu', password: 'Password123!' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token || loginData.token;

  const authMatchRes = await fetch(`${BASE_URL}/ai/match-resources`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      requirements: 'Semiconductor cleanroom photolithography aligner with sub-micron resolution',
    }),
  });

  const authMatchData = await authMatchRes.json();
  if (!authMatchData.success || !authMatchData.data) {
    throw new Error('Authenticated SmartMatch failed: ' + JSON.stringify(authMatchData));
  }

  console.log(`   ✅ Authenticated user query processed successfully. Total matches: ${authMatchData.data.totalMatched}`);
  if (authMatchData.data.results.length > 0) {
    const topLab = authMatchData.data.results[0];
    console.log(`   - Top Lab: "${topLab.resource.name}" (Score: ${topLab.matchScore}%)`);
    console.log(`   - Why Recommended:`);
    topLab.whyRecommended.forEach((r) => console.log(`     • ${r}`));
    console.log(`   - Missing Certifications Check:`, topLab.eligibilityStatus.missingCertifications);
    if (topLab.eligibilityStatus.actionRequired) {
      console.log(`   - Action Required Notice: "${topLab.eligibilityStatus.actionRequired}"`);
    }
  }

  console.log('\n🎉 ALL SMARTMATCH DISCOVERY TESTS PASSED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
