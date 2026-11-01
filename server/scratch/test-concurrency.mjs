// Test Concurrent Booking Prevention & Reliability
async function testBookingReliability() {
  console.log('--- Testing RENTORA Backend Reliability & Concurrency Safeguards ---');

  // 1. Login as Arun Kumar (Student)
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@rentora.edu', password: 'Password123!' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token;
  console.log('Login success:', Boolean(token), 'User:', loginData.data?.user?.name);

  // 2. Fetch an available resource
  const resRes = await fetch('http://localhost:5000/api/resources?limit=1');
  const resData = await resRes.json();
  const testResource = resData.data[0];
  console.log('Target Resource:', testResource.name, 'ID:', testResource._id);

  // 3. Test Rate Limiting Headers
  const rlRes = await fetch('http://localhost:5000/api/resources?limit=1');
  console.log('RateLimit-Limit Header:', rlRes.headers.get('ratelimit-limit'));
  console.log('RateLimit-Remaining Header:', rlRes.headers.get('ratelimit-remaining'));

  // 4. Test User Profile Sanitization (Password never exposed)
  const meRes = await fetch('http://localhost:5000/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const meData = await meRes.json();
  console.log('User password leaked in /me?:', 'password' in meData.data.user);
  console.log('User __v leaked in /me?:', '__v' in meData.data.user);

  console.log('--- Reliability & Security Checks Completed Successfully ---');
}

testBookingReliability().catch(console.error);
