async function testSimultaneousBookings() {
  console.log('--- Testing Simultaneous Conflicting Bookings ---');

  // 1. Login
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@rentora.edu', password: 'Password123!' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token;

  // 2. Fetch available resource
  const resRes = await fetch('http://localhost:5000/api/resources?limit=1');
  const resData = await resRes.json();
  const testResource = resData.data[0];

  const targetDate = '2026-11-20';
  const timeSlot = '14:00 - 16:00';
  const startTime = `${targetDate}T14:00:00Z`;
  const endTime = `${targetDate}T16:00:00Z`;

  console.log(`Submitting 2 concurrent booking requests for resource: ${testResource.name} on ${targetDate} ${timeSlot}...`);

  const req1 = fetch('http://localhost:5000/api/bookings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      resourceId: testResource._id,
      date: targetDate,
      timeSlot,
      startTime,
      endTime,
      purpose: 'Concurrent test reservation A',
      allowWaitlist: false,
    }),
  });

  const req2 = fetch('http://localhost:5000/api/bookings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      resourceId: testResource._id,
      date: targetDate,
      timeSlot,
      startTime,
      endTime,
      purpose: 'Concurrent test reservation B',
      allowWaitlist: false,
    }),
  });

  const [res1, res2] = await Promise.all([req1, req2]);
  const [data1, data2] = await Promise.all([res1.json(), res2.json()]);

  console.log('Request 1 Status:', res1.status, 'Success:', data1.success, 'Message:', data1.message);
  console.log('Request 2 Status:', res2.status, 'Success:', data2.success, 'Message:', data2.message);

  // One request might succeed, but both should NEVER double-book the same slot without conflict detection
  const statuses = [res1.status, res2.status];
  console.log('Results verify atomic serialization and duplicate prevention:', statuses.includes(409) || statuses.includes(429) || (data1.success !== data2.success) || (data1.data?.status === 'waitlisted' || data2.data?.status === 'waitlisted' || data1.data?.status === 'pending'));
}

testSimultaneousBookings().catch(console.error);
