async function testOwnerAndConflict() {
  // Login as Owner
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@rentora.edu', password: 'Password123!' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token;

  const resRes = await fetch('http://localhost:5000/api/resources?limit=1');
  const resData = await resRes.json();
  const testResource = resData.data[0];

  const targetDate = '2026-11-28';
  const timeSlot = '10:00 - 12:00';
  const startTime = `${targetDate}T10:00:00Z`;
  const endTime = `${targetDate}T12:00:00Z`;

  console.log(`Submitting 2 simultaneous requests as owner (who does not have student limits):`);

  const req1 = fetch('http://localhost:5000/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      resourceId: testResource._id,
      date: targetDate,
      timeSlot,
      startTime,
      endTime,
      purpose: 'Owner reservation session A',
      allowWaitlist: false,
    }),
  });

  const req2 = fetch('http://localhost:5000/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      resourceId: testResource._id,
      date: targetDate,
      timeSlot,
      startTime,
      endTime,
      purpose: 'Owner reservation session B',
      allowWaitlist: false,
    }),
  });

  const [res1, res2] = await Promise.all([req1, req2]);
  const [data1, data2] = await Promise.all([res1.json(), res2.json()]);

  console.log('Response 1 Status:', res1.status, 'Message:', data1.message);
  console.log('Response 2 Status:', res2.status, 'Message:', data2.message);
  console.log('Concurrency test outcome: One request succeeded and the other was safely intercepted with 409 Conflict:', (res1.status === 201 && res2.status === 409) || (res1.status === 409 && res2.status === 201));
}

testOwnerAndConflict().catch(console.error);
