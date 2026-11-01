async function testApprovalCollision() {
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@rentora.edu', password: 'Password123!' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token;

  // Fetch the 2 pending bookings we just created
  const myBookingsRes = await fetch('http://localhost:5000/api/bookings?status=pending', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const myBookingsData = await myBookingsRes.json();
  const pending = myBookingsData.data.slice(0, 2);

  if (pending.length < 2) {
    console.log('Not enough pending bookings to test collision.');
    return;
  }

  const [b1, b2] = pending;
  console.log(`Approving Booking 1 (${b1._id})...`);
  const app1 = await fetch(`http://localhost:5000/api/bookings/${b1._id}/approve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data1 = await app1.json();
  console.log('Approval 1 Status:', app1.status, 'Success:', data1.success);

  console.log(`Attempting to approve Booking 2 (${b2._id}) for the same overlapping timeslot...`);
  const app2 = await fetch(`http://localhost:5000/api/bookings/${b2._id}/approve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data2 = await app2.json();
  console.log('Approval 2 Status:', app2.status, 'Success:', data2.success, 'Message:', data2.message);
  console.log('Collision successfully prevented at database level:', app2.status === 409);
}

testApprovalCollision().catch(console.error);
