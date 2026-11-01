import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:5000/api';

const results = [];

function record(name, pass, detail = '') {
  results.push({ name, pass, detail });
  const status = pass ? '✓ PASS' : '✗ FAIL';
  console.log(`[${status}] ${name}${detail ? ` - ${detail}` : ''}`);
}

async function request(endpoint, options = {}, token = null) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  try {
    const res = await fetch(url, { ...options, headers });
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { status: res.status, data, ok: res.ok };
  } catch (err) {
    return { status: 0, error: err.message, ok: false };
  }
}

async function runPhase1SecurityTests() {
  console.log('================================================================');
  console.log('🔒 PHASE 1: DEMO ACCESS & ADMIN ROUTE SECURITY TEST SUITE');
  console.log('================================================================\n');

  // Test 1: Demo Accounts Endpoint Security
  console.log('--- 1. DEMO ACCOUNTS RESTRICTION AUDIT ---');
  const demoRes = await request('/auth/demo-accounts');
  const demoAccounts = demoRes.data?.data || [];
  
  record(
    'SEC-DEMO-01: Demo accounts endpoint responds successfully',
    demoRes.status === 200,
    `Status ${demoRes.status}`
  );

  const containsAdmin = demoAccounts.some(
    (acc) => acc.role === 'admin' || (acc.email && acc.email.toLowerCase().includes('admin'))
  );
  record(
    'SEC-DEMO-02: Administrator credentials are NEVER exposed in demo accounts',
    !containsAdmin,
    containsAdmin ? 'CRITICAL: Admin account found in demo payload!' : 'Verified: 0 admin accounts in demo response'
  );

  const allowedRoles = ['student', 'owner', 'manager'];
  const nonRestrictedRoles = demoAccounts.filter((acc) => !allowedRoles.includes(acc.role));
  record(
    'SEC-DEMO-03: Evaluator demo accounts restricted to designated non-admin roles',
    nonRestrictedRoles.length === 0,
    `Returned roles: ${[...new Set(demoAccounts.map(a => a.role))].join(', ')}`
  );

  // Test 2: Administrator Route Protection
  console.log('\n--- 2. ADMINISTRATOR ROUTE PROTECTION AUDIT ---');
  
  // 2a: Unauthenticated access
  const unauthAdmin = await request('/admin/users');
  record(
    'SEC-ADMIN-01: Unauthenticated request to /api/admin/users rejected with 401',
    unauthAdmin.status === 401,
    `Received status ${unauthAdmin.status}`
  );

  // Login as student
  const studentLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'student@rentora.edu', password: 'Password123!' }),
  });
  const studentToken = studentLogin.data?.data?.token || studentLogin.data?.token;

  // 2b: Student forbidden from admin routes
  if (studentToken) {
    const studentAdminUsers = await request('/admin/users', {}, studentToken);
    record(
      'SEC-ADMIN-02: Student access to /api/admin/users is strictly Forbidden (403)',
      studentAdminUsers.status === 403,
      `Received status ${studentAdminUsers.status}`
    );

    const studentAdminSettings = await request('/admin/settings', {}, studentToken);
    record(
      'SEC-ADMIN-03: Student access to /api/admin/settings is strictly Forbidden (403)',
      studentAdminSettings.status === 403,
      `Received status ${studentAdminSettings.status}`
    );
  } else {
    record('SEC-ADMIN-02: Student login successful for RBAC test', false, 'Could not authenticate student');
  }

  // Login as owner
  const ownerLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'owner@rentora.edu', password: 'Password123!' }),
  });
  const ownerToken = ownerLogin.data?.data?.token || ownerLogin.data?.token;

  // 2c: Owner forbidden from admin routes
  if (ownerToken) {
    const ownerAdminUsers = await request('/admin/users', {}, ownerToken);
    record(
      'SEC-ADMIN-04: Resource Owner access to /api/admin/users is strictly Forbidden (403)',
      ownerAdminUsers.status === 403,
      `Received status ${ownerAdminUsers.status}`
    );
  }

  // Login as manager
  const managerLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'manager@rentora.edu', password: 'Password123!' }),
  });
  const managerToken = managerLogin.data?.data?.token || managerLogin.data?.token;

  // 2d: Manager forbidden from admin routes
  if (managerToken) {
    const managerAdminUsers = await request('/admin/users', {}, managerToken);
    record(
      'SEC-ADMIN-05: Institution Manager access to /api/admin/users is strictly Forbidden (403)',
      managerAdminUsers.status === 403,
      `Received status ${managerAdminUsers.status}`
    );
  }

  // Login as admin
  const adminLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@rentora.edu', password: 'Password123!' }),
  });
  const adminToken = adminLogin.data?.data?.token || adminLogin.data?.token;

  // 2e: Legitimate Admin allowed
  if (adminToken) {
    const adminUsers = await request('/admin/users', {}, adminToken);
    record(
      'SEC-ADMIN-06: Verified Administrator granted authorized access (200 OK)',
      adminUsers.status === 200,
      `Received status ${adminUsers.status}`
    );
  } else {
    record('SEC-ADMIN-06: Admin authentication verification', false, 'Could not authenticate admin');
  }

  // Test 3: Universal Password Elimination Audit
  console.log('\n--- 3. SOURCE & BUILD ASSET SECRETS SCAN ---');
  
  // Recursively search directory for target string
  function searchDirForPattern(dir, pattern, extFilter) {
    let matches = [];
    if (!fs.existsSync(dir)) return matches;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
        matches = matches.concat(searchDirForPattern(fullPath, pattern, extFilter));
      } else if (entry.isFile() && (!extFilter || extFilter.some(ext => entry.name.endsWith(ext)))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes(pattern)) {
          matches.push(fullPath);
        }
      }
    }
    return matches;
  }

  const clientSrcDir = path.resolve('../client/src');
  const srcOccurrences = searchDirForPattern(clientSrcDir, 'Password123', ['.ts', '.tsx', '.js', '.jsx', '.html']);
  record(
    'SEC-SECRET-01: Zero hardcoded universal demo passwords in client source code',
    srcOccurrences.length === 0,
    srcOccurrences.length === 0 ? 'Verified: 0 occurrences of Password123 in client/src' : `Found in: ${srcOccurrences.join(', ')}`
  );

  const clientDistDir = path.resolve('../client/dist');
  const distOccurrences = searchDirForPattern(clientDistDir, 'Password123', ['.js', '.html']);
  record(
    'SEC-SECRET-02: Zero hardcoded universal demo passwords in production bundle artifacts',
    distOccurrences.length === 0,
    distOccurrences.length === 0 ? 'Verified: 0 occurrences in client/dist assets' : `Found in: ${distOccurrences.join(', ')}`
  );

  console.log('\n================================================================');
  const total = results.length;
  const passed = results.filter((r) => r.pass).length;
  const failed = total - passed;
  console.log(`📊 PHASE 1 TEST SUMMARY: ${passed}/${total} PASSED (${failed} FAILED)`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase1SecurityTests();
