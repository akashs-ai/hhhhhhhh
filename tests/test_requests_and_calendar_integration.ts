import assert from 'assert';
import http from 'http';
import { createExpressApp } from '../server/app.js';
import { storage } from '../server/storage.js';

let server: http.Server;
let baseUrl: string;

async function request(
  method: string,
  path: string,
  options?: {
    body?: any;
    headers?: Record<string, string>;
  }
): Promise<{ status: number; body: any; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const req = http.request(
      url,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed: any = data;
          try {
            parsed = JSON.parse(data);
          } catch (_) {}
          resolve({ status: res.statusCode || 500, body: parsed, headers: res.headers });
        });
      }
    );
    req.on('error', reject);
    if (options?.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING REQUESTS & CALENDAR INTEGRATION TEST SUITE ---');

  const app = createExpressApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address() as any;
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });

  const facultyAuth = { Authorization: 'Bearer usr-faculty-f19' };
  const adminAuth = { Authorization: 'Bearer usr-admin' };
  const studentAuth = { Authorization: 'Bearer usr-student-cse3' };

  try {
    // Test 1: Faculty submits a booking request
    console.log('Test 1: Faculty submits a booking request');
    const createRes = await request('POST', '/api/bookings', {
      headers: facultyAuth,
      body: {
        title: 'Advanced AI Seminar 2026',
        attendance: 80,
        duration_periods: 2,
        requested_category: 'guest_lecture',
        requested_room: 'L-301',
        raw_text: 'Distinguished lecture on generative agents by visiting professor',
        windows: [{ day: 'SAT', start_period: 2, end_period: 3 }],
      },
    });

    assert.strictEqual(createRes.status, 201, 'Should create booking successfully');
    assert.strictEqual(createRes.body.success, true);
    const createdBooking = createRes.body.data;
    assert.ok(createdBooking.id, 'Should have booking ID');
    assert.strictEqual(createdBooking.status, 'pending');
    assert.strictEqual(createdBooking.created_by, 'usr-faculty-f19');
    console.log('✓ Passed: Booking created with ID', createdBooking.id);

    // Test 2: Admin views all bookings
    console.log('Test 2: Admin views all bookings in registry');
    const listRes = await request('GET', '/api/bookings', { headers: adminAuth });
    assert.strictEqual(listRes.status, 200);
    assert.strictEqual(listRes.body.success, true);
    const found = listRes.body.data.find((b: any) => b.id === createdBooking.id);
    assert.ok(found, 'Created booking must appear in bookings list');
    console.log('✓ Passed: Booking visible in master registry queue');

    // Test 3: Self-approval prevention
    console.log('Test 3: Self-approval prevention (Creator cannot approve their own booking)');
    const adminBookingRes = await request('POST', '/api/bookings', {
      headers: adminAuth,
      body: {
        title: 'Deanery Annual Review Meeting',
        attendance: 20,
        duration_periods: 1,
        requested_category: 'institute_event',
        requested_room: 'L-204',
        windows: [{ day: 'FRI', start_period: 4, end_period: 4 }],
      },
    });
    const adminBookingId = adminBookingRes.body.data.id;

    const selfApproveRes = await request('POST', `/api/bookings/${adminBookingId}/decision`, {
      headers: adminAuth,
      body: {
        status: 'approved',
        room_id: 'L-204',
        day: 'FRI',
        start_period: 4,
        end_period: 4,
      },
    });
    assert.strictEqual(selfApproveRes.status, 403, 'Should prevent self-approval with 403');
    assert.strictEqual(selfApproveRes.body.error.code, 'SELF_APPROVAL_FORBIDDEN');
    console.log('✓ Passed: Self-approval prevented');

    // Test 4: Admin approves the faculty booking
    console.log('Test 4: Admin approves faculty booking');
    const approveRes = await request('POST', `/api/bookings/${createdBooking.id}/decision`, {
      headers: adminAuth,
      body: {
        status: 'approved',
        room_id: 'L-301',
        day: 'SAT',
        start_period: 2,
        end_period: 3,
        reason: 'Approved by Deanery. Venue allocated.',
      },
    });
    assert.strictEqual(approveRes.status, 200);
    assert.strictEqual(approveRes.body.success, true);
    assert.strictEqual(approveRes.body.data.status, 'approved');
    assert.strictEqual(approveRes.body.data.allocated_room, 'L-301');
    console.log('✓ Passed: Booking approved with allocated room L-301 on SAT periods 2-3');

    // Test 5: Conflict detection on overlapping booking
    console.log('Test 5: Conflict detection on double booking attempt');
    const clashBookingRes = await request('POST', '/api/bookings', {
      headers: facultyAuth,
      body: {
        title: 'Conflicting Robotics Workshop',
        attendance: 40,
        duration_periods: 2,
        requested_category: 'guest_lecture',
        requested_room: 'L-301',
        windows: [{ day: 'SAT', start_period: 3, end_period: 4 }],
      },
    });
    const clashId = clashBookingRes.body.data.id;

    const clashApproveRes = await request('POST', `/api/bookings/${clashId}/decision`, {
      headers: adminAuth,
      body: {
        status: 'approved',
        room_id: 'L-301',
        day: 'SAT',
        start_period: 3,
        end_period: 4,
      },
    });
    assert.strictEqual(clashApproveRes.status, 409, 'Should return 409 DOUBLE_BOOKING_CONFLICT');
    assert.strictEqual(clashApproveRes.body.error.code, 'DOUBLE_BOOKING_CONFLICT');
    console.log('✓ Passed: Conflict detected and blocked with 409');

    // Test 6: Approved booking appears in Timetable API
    console.log('Test 6: Approved booking appears in Timetable API');
    const ttRes = await request('GET', '/api/timetable?include_bookings=true', { headers: adminAuth });
    assert.strictEqual(ttRes.status, 200);
    const foundInTt = ttRes.body.data.find((s: any) => s.session_id === `booking-${createdBooking.id}`);
    assert.ok(foundInTt, 'Approved booking should be present in timetable session feed');
    assert.strictEqual(foundInTt.day, 'SAT');
    assert.strictEqual(foundInTt.start_period, 2);
    assert.strictEqual(foundInTt.room_id, 'L-301');
    console.log('✓ Passed: Approved booking appears in Timetable as scheduled session');

    // Test 7: Nudge endpoint
    console.log('Test 7: Nudge endpoint');
    const nudgeRes = await request('POST', `/api/bookings/${clashId}/nudge`, { headers: facultyAuth });
    assert.strictEqual(nudgeRes.status, 200);
    assert.strictEqual(nudgeRes.body.success, true);
    console.log('✓ Passed: Nudge notification dispatched');

    // Test 8: Unauthorized withdrawal protection
    console.log('Test 8: Unauthorized withdrawal protection');
    const unauthWithdrawRes = await request('DELETE', `/api/bookings/${clashId}`, { headers: studentAuth });
    assert.strictEqual(unauthWithdrawRes.status, 403);
    assert.strictEqual(unauthWithdrawRes.body.error.code, 'UNAUTHORIZED_WITHDRAWAL');
    console.log('✓ Passed: Unauthorized withdrawal blocked with 403');

    // Test 9: Creator withdraws own booking
    console.log('Test 9: Creator withdraws own booking');
    const withdrawRes = await request('DELETE', `/api/bookings/${clashId}`, { headers: facultyAuth });
    assert.strictEqual(withdrawRes.status, 200);
    assert.strictEqual(withdrawRes.body.success, true);

    const checkDeletedRes = await request('GET', `/api/bookings/${clashId}`, { headers: adminAuth });
    assert.strictEqual(checkDeletedRes.status, 404);
    console.log('✓ Passed: Booking withdrawn successfully and purged');

    // Clean up test bookings
    await storage.deleteBooking(createdBooking.id);
    await storage.deleteBooking(adminBookingId);

    console.log('\n--- ALL 9 REQUESTS & CALENDAR INTEGRATION TESTS PASSED! ---');
  } finally {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  }
}

runTests().catch((err) => {
  console.error('Test failure:', err);
  process.exit(1);
});
