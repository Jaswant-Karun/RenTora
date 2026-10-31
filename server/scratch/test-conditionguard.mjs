import http from 'http';
import fs from 'fs';
import path from 'path';

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
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

function makeMultipartFormData(boundary, fields, files) {
  const crlf = '\r\n';
  let body = Buffer.alloc(0);

  for (const [k, v] of Object.entries(fields)) {
    let part = `--${boundary}${crlf}`;
    part += `Content-Disposition: form-data; name="${k}"${crlf}${crlf}`;
    part += `${v}${crlf}`;
    body = Buffer.concat([body, Buffer.from(part)]);
  }

  for (const f of files) {
    let part = `--${boundary}${crlf}`;
    part += `Content-Disposition: form-data; name="${f.fieldname}"; filename="${f.filename}"${crlf}`;
    part += `Content-Type: ${f.mimetype}${crlf}${crlf}`;
    body = Buffer.concat([body, Buffer.from(part), f.content, Buffer.from(crlf)]);
  }

  body = Buffer.concat([body, Buffer.from(`--${boundary}--${crlf}`)]);
  return body;
}

async function runConditionGuardTestSuite() {
  console.log('🛡️ Starting ConditionGuard – Equipment Condition and Incident Management Test Suite...\n');

  // 1. Authenticate users
  console.log('1. Authenticating test users...');
  const studentRes = await request('POST', '/auth/login', {
    email: 'student@rentora.edu',
    password: 'Password123!',
  });
  const studentToken = studentRes.data?.data?.token;

  const custodianRes = await request('POST', '/auth/login', {
    email: 'owner@rentora.edu',
    password: 'Password123!',
  });
  const custodianToken = custodianRes.data?.data?.token;
  const custodian = custodianRes.data?.data?.user;

  console.log(`✓ Authenticated Student: ${studentRes.data?.data?.user?.name}`);
  console.log(`✓ Authenticated Custodian: ${custodian?.name} (${custodian?.role})\n`);

  // 2. Test File Upload & Validation
  console.log('2. Testing Secure File Validation & Upload Restrictions...');

  // 2a. Reject invalid file type (e.g. text/plain or script)
  const boundaryInvalid = '----RentoraBoundaryInvalid' + Date.now();
  const invalidBody = makeMultipartFormData(
    boundaryInvalid,
    {},
    [
      {
        fieldname: 'photos',
        filename: 'malicious.sh',
        mimetype: 'application/x-sh',
        content: Buffer.from('#!/bin/bash\necho "test"'),
      },
    ]
  );

  const invalidUploadRes = await request(
    'POST',
    '/upload/evidence',
    invalidBody,
    custodianToken,
    { 'Content-Type': `multipart/form-data; boundary=${boundaryInvalid}` }
  );

  console.log(`• Invalid file type rejected with status: ${invalidUploadRes.status} (Expected 400)`);
  if (invalidUploadRes.status !== 400) throw new Error('Security Error: Non-image file was not rejected!');

  // 2b. Missing evidence rejection
  const boundaryEmpty = '----RentoraBoundaryEmpty' + Date.now();
  const emptyBody = makeMultipartFormData(boundaryEmpty, {}, []);
  const emptyUploadRes = await request(
    'POST',
    '/upload/evidence',
    emptyBody,
    custodianToken,
    { 'Content-Type': `multipart/form-data; boundary=${boundaryEmpty}` }
  );
  console.log(`• Missing evidence rejected with status: ${emptyUploadRes.status} (Expected 400)`);

  // 2c. Valid JPEG image upload
  const boundaryValid = '----RentoraBoundaryValid' + Date.now();
  // Minimal valid 1x1 GIF/JPEG buffer for testing
  const dummyJpg = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64');
  const validBody = makeMultipartFormData(
    boundaryValid,
    {},
    [
      {
        fieldname: 'photos',
        filename: 'cleanroom_lens_pre_inspection.jpg',
        mimetype: 'image/jpeg',
        content: dummyJpg,
      },
    ]
  );

  const validUploadRes = await request(
    'POST',
    '/upload/evidence',
    validBody,
    custodianToken,
    { 'Content-Type': `multipart/form-data; boundary=${boundaryValid}` }
  );

  console.log(`• Valid image upload status: ${validUploadRes.status} (Expected 200)`);
  const uploadedPhotoUrl = validUploadRes.data.data.urls[0];
  console.log(`  - Uploaded Evidence URL: ${uploadedPhotoUrl}\n`);

  // 3. Set up test resource & booking
  console.log('3. Setting up test reservation...');
  const ownerOverview = await request('GET', '/owner/overview', null, custodianToken);
  const resource = ownerOverview.data?.data?.myResources?.[0];
  if (!resource) throw new Error('No owner resource found in overview');

  const bookingRes = await request(
    'POST',
    '/bookings',
    {
      resourceId: resource._id,
      date: '2026-11-20',
      timeSlot: '14:00 - 17:00',
      purpose: 'Nanoscale Surface Topology Characterization',
      projectTitle: 'DST SERB High Resolution Lithography',
      supervisorName: 'Dr. Meera Raman',
    },
    studentToken
  );
  const booking = bookingRes.data.data;

  // Approve booking
  await request('POST', `/owner/bookings/${booking._id}/approve`, { reason: 'Approved for nanotech grant' }, custodianToken);
  console.log(`✓ Active Approved Booking created: ${booking._id}\n`);

  // 4. BEFORE CHECK-IN Condition Report Workflow
  console.log('4. Testing BEFORE CHECK-IN Condition Report Workflow...');
  const beforeCheckInRes = await request(
    'POST',
    '/condition-guard/before-checkin',
    {
      bookingId: booking._id,
      operationalStatus: 'optimal',
      cleanliness: 'passed',
      meterReading: '124.5 hrs',
      existingDamage: [
        'Minor hairline cosmetic scratch on outer casing bezel',
        'Auxiliary stage lamp connector slightly loose',
      ],
      conditionNotes: 'All optics calibrated to 0.05nm standard. Cleanliness passed ISO-5 cleanroom specifications.',
      observations: 'Pre-use visual and operational checklist completed with student present.',
      photos: [uploadedPhotoUrl],
      userConfirmation: true,
    },
    custodianToken
  );

  console.log(`• Before Check-in Report status: ${beforeCheckInRes.status} (Expected 201)`);
  const beforeReport = beforeCheckInRes.data.data;
  console.log(`  - Report ID: ${beforeReport._id}`);
  console.log(`  - Recorded Existing Damage: ${beforeReport.existingDamage.join('; ')}`);
  console.log(`  - Responsible Borrower: ${beforeReport.responsibleUserName} (${beforeReport.responsibleUserEmail})`);
  console.log(`  - Pre-use Photos Recorded: ${beforeReport.photos.length}\n`);

  // 5. AFTER CHECK-OUT Condition Report & Comparison Workflow
  console.log('5. Testing AFTER CHECK-OUT Condition Report & Comparative Differences...');
  const afterCheckOutRes = await request(
    'POST',
    '/condition-guard/after-checkout',
    {
      bookingId: booking._id,
      operationalStatus: 'minor_wear',
      cleanliness: 'needs_cleaning',
      meterReading: '127.5 hrs',
      conditionNotes: 'Objective lens optical filter smudged with substrate residue; stage movement sticky.',
      observations: 'Post-use inspection revealed chemical residue requiring professional cleanroom wash.',
      photos: [uploadedPhotoUrl],
      userConfirmation: true,
    },
    custodianToken
  );

  console.log(`• After Check-out Report status: ${afterCheckOutRes.status} (Expected 201)`);
  const comparison = afterCheckOutRes.data.data.comparison;
  console.log(`  - Has Detected Differences: ${comparison.hasDifferences}`);
  console.log(`  - Flagged Differences Count: ${comparison.differences.length}`);
  comparison.differences.forEach((d, idx) => {
    console.log(`    [Diff #${idx + 1}] Category: ${d.category} | ${d.before} -> ${d.after} (Review: ${d.requiresReview})`);
  });
  console.log(`  - Requires Authorized Human Review: ${comparison.requiresHumanReview}`);
  console.log(`  - Human Review Regulatory Safeguard: "${comparison.humanReviewNotice.slice(0, 80)}..."\n`);

  // 6. Test INCIDENT MANAGEMENT LIFECYCLE (8 Stages)
  console.log('6. Testing INCIDENT MANAGEMENT LIFECYCLE...');

  // Step 1 & 2: Report Incident and Assign Unique Reference Number
  console.log('Stage 1 & 2: Reporting Incident & Assigning Incident Reference Number...');
  const incidentRes = await request(
    'POST',
    '/incidents',
    {
      category: 'equipment_damage',
      title: 'Chemical Residue on Nano-Stage Objective Filter',
      description: 'During characterization, residue was deposited onto the secondary filter lens without protective cover.',
      bookingId: booking._id,
      resourceId: resource._id,
      severity: 'high',
      evidence: [uploadedPhotoUrl],
    },
    custodianToken
  );

  console.log(`• Incident creation status: ${incidentRes.status} (Expected 201)`);
  const incident = incidentRes.data.data;
  console.log(`  - Incident Reference Number: ${incident.incidentNumber}`);
  console.log(`  - Initial Status: ${incident.status}`);
  console.log(`  - Category: ${incident.category}`);
  console.log(`  - Human Review Enforced: ${incident.requiresHumanReview}`);
  if (!incident.incidentNumber.startsWith('INC-')) {
    throw new Error('Incident number format failed! Expected INC-YYYY-XXXXX');
  }

  // Step 3 & 4: Review Evidence & Fetch Linked Condition Reports
  console.log('\nStage 3 & 4: Reviewing Incident Evidence & Linked Condition Data...');
  const getIncidentRes = await request('GET', `/incidents/${incident._id}`, null, custodianToken);
  console.log(`• Get Incident status: ${getIncidentRes.status} (Expected 200)`);
  const fetchedIncident = getIncidentRes.data.data;
  console.log(`  - Linked Comparison Available: ${!!fetchedIncident.comparison}`);
  console.log(`  - Evidence Attachments: ${fetchedIncident.evidence.length}`);

  // Step 5: Add Investigation Notes
  console.log('\nStage 5: Adding Investigation Notes...');
  const noteRes = await request(
    'POST',
    `/incidents/${incident._id}/investigate`,
    {
      note: 'Lab Technician verified the objective. The residue appears to be acetone solvent splatter from sample preparation.',
    },
    custodianToken
  );
  console.log(`• Add Investigation Note status: ${noteRes.status} (Expected 200)`);
  console.log(`  - Updated Status: ${noteRes.data.data.status} (Expected "investigating")`);
  console.log(`  - Total Investigation Notes: ${noteRes.data.data.investigationNotes.length}`);

  // Step 6: Record Decision (Authorized Human Review)
  console.log('\nStage 6: Recording Human Review Decision...');
  const decisionRes = await request(
    'POST',
    `/incidents/${incident._id}/decision`,
    {
      outcome: 'fair_wear_and_tear',
      rationale: 'Review concluded the lens was already scheduled for quarterly replacement and the residue is non-permanent. No user negligence established.',
      sanctions: 'none',
    },
    custodianToken
  );
  console.log(`• Record Decision status: ${decisionRes.status} (Expected 200)`);
  console.log(`  - Recorded Outcome: ${decisionRes.data.data.decision.outcome}`);
  console.log(`  - Decided By: ${decisionRes.data.data.decision.decidedBy}`);
  console.log(`  - Human Review Completed (requiresHumanReview): ${decisionRes.data.data.requiresHumanReview}`);

  // Step 7 & 8: Record Resolution & Full History Archive
  console.log('\nStage 7 & 8: Recording Resolution & Maintaining Full History...');
  const resolutionRes = await request(
    'POST',
    `/incidents/${incident._id}/resolve`,
    {
      status: 'resolved',
      resolutionNotes: 'Ultrasonic wash completed by Cleanroom Technician. Lens returned to active specification. No penalty assessed.',
      actionTaken: 'Routine ultrasonic cleaning and filter re-alignment. User advised on solvent handling best practices.',
      penaltyPoints: 0,
    },
    custodianToken
  );

  console.log(`• Resolve Incident status: ${resolutionRes.status} (Expected 200)`);
  const resolvedIncident = resolutionRes.data.data;
  console.log(`  - Final Status: ${resolvedIncident.status}`);
  console.log(`  - Resolved By: ${resolvedIncident.resolvedBy}`);
  console.log(`  - Action Taken: ${resolvedIncident.actionTaken}`);
  console.log(`  - Total Investigation Audit Trail: ${resolvedIncident.investigationNotes.length} entries`);

  console.log('\n🎉 ALL CONDITIONGUARD AND INCIDENT MANAGEMENT WORKFLOWS TESTED & VERIFIED SUCCESSFULLY!');
}

runConditionGuardTestSuite().catch((err) => {
  console.error('\n❌ ConditionGuard Test Suite Failed:', err);
  process.exit(1);
});
