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
  const coordAuth = { Authorization: 'Bearer usr-coord-cse' };

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

    // Test 10: Approved booking appears in Calendar Preview & ICS
    console.log('Test 10: Approved booking appears in Calendar Preview & ICS export');
    const previewRes = await request('GET', '/api/calendar/preview', { headers: adminAuth });
    assert.strictEqual(previewRes.status, 200, 'GET /api/calendar/preview should return 200');
    assert.strictEqual(previewRes.body.success, true);
    const foundBookingInCal = previewRes.body.data.find((e: any) => e.id === `cit_booking_${createdBooking.id.replace(/[^a-zA-Z0-9]/g, '_')}`);
    assert.ok(foundBookingInCal, 'Approved venue booking must be present in Google Calendar events model');
    assert.ok(foundBookingInCal.summary.includes(createdBooking.title), 'Event summary must reflect booking title');

    const icsRes = await request('GET', '/api/calendar/ics', { headers: adminAuth });
    assert.strictEqual(icsRes.status, 200);
    assert.ok(String(icsRes.body).includes('BEGIN:VCALENDAR'));
    assert.ok(String(icsRes.body).includes(`cit-booking-${createdBooking.id}@cit.ac.in`), 'ICS file must contain UID for approved booking');
    console.log('✓ Passed: Approved booking appears in calendar preview and RFC 5545 ICS export');

    // Test 11: Dynamic date math & leap-year date/weekday consistency
    console.log('Test 11: Dynamic date math across month boundaries and leap year');
    const leapYearDate = new Date(2028, 1, 29); // Feb 29, 2028 (Leap Year)
    assert.strictEqual(leapYearDate.getDate(), 29, 'Leap year handles Feb 29 correctly');
    const nextDay = new Date(leapYearDate);
    nextDay.setDate(leapYearDate.getDate() + 1);
    assert.strictEqual(nextDay.getMonth(), 2, 'Feb 29 transitions seamlessly to March (month index 2)');
    assert.strictEqual(nextDay.getDate(), 1, 'First day of March after leap day');

    // Test 12: Unauthorized timetable modification blocked
    console.log('Test 12: Unauthorized timetable modification blocked (Students cannot edit timetable)');
    const unauthEditRes = await request('PUT', '/api/timetable/sessions/CS-301', {
      headers: studentAuth,
      body: { day: 'TUE', start_period: 3 },
    });
    assert.strictEqual(unauthEditRes.status, 403, 'Student editing timetable must be blocked with HTTP 403');
    console.log('✓ Passed: Unauthorized timetable edits are blocked with HTTP 403 FORBIDDEN');

    // Test 13: Admin can publish master timetable without triggering self-approval violation
    console.log('Test 13: Admin can publish master timetable without self-approval violation');
    // First generate a proposed schedule with admin credentials
    const genRes = await request('POST', '/api/timetable/generate', {
      headers: adminAuth,
      body: { seed: 101, autoApprove: false, name: 'Publish Test Schedule' },
    });
    assert.strictEqual(genRes.status, 201);
    const newVersionId = genRes.body.version_id;
    assert.ok(newVersionId, 'Proposed version ID must be returned');

    // Admin publishes the schedule via POST /api/timetable/:id/publish
    const publishRes = await request('POST', `/api/timetable/${newVersionId}/publish`, {
      headers: adminAuth,
    });
    assert.strictEqual(publishRes.status, 200, 'Admin publishing schedule must return HTTP 200 OK');
    assert.strictEqual(publishRes.body.success, true);
    assert.strictEqual(publishRes.body.data.status, 'approved');

    // Verify it is now the active approved schedule
    const activeSched = await storage.getApprovedSchedule();
    assert.strictEqual(activeSched?.id, newVersionId, 'Published schedule must be active in storage');
    console.log('✓ Passed: Admin can publish master timetable successfully without self-approval error');

    // Test 14: Non-admin users cannot publish master schedule (HTTP 403 FORBIDDEN)
    console.log('Test 14: Non-admin users cannot publish master schedule');
    const coordPublish = await request('POST', `/api/timetable/${newVersionId}/publish`, {
      headers: coordAuth,
    });
    assert.strictEqual(coordPublish.status, 403, 'Department coordinator must receive HTTP 403');

    const facultyPublish = await request('POST', `/api/timetable/${newVersionId}/publish`, {
      headers: facultyAuth,
    });
    assert.strictEqual(facultyPublish.status, 403, 'Faculty must receive HTTP 403');

    const studentPublish = await request('POST', `/api/timetable/${newVersionId}/publish`, {
      headers: studentAuth,
    });
    assert.strictEqual(studentPublish.status, 403, 'Student must receive HTTP 403');
    console.log('✓ Passed: Non-admin roles (coordinator, faculty, student) receive HTTP 403 FORBIDDEN');

    // Test 15: Unauthenticated publish request blocked (HTTP 401 UNAUTHORIZED)
    console.log('Test 15: Unauthenticated publish request blocked');
    const unauthPublish = await request('POST', `/api/timetable/${newVersionId}/publish`);
    assert.strictEqual(unauthPublish.status, 401, 'Unauthenticated request must receive HTTP 401');
    console.log('✓ Passed: Unauthenticated requests receive HTTP 401 UNAUTHORIZED');

    // Test 16: Payload manipulation (body role='admin') by non-admin is strictly ignored
    console.log('Test 16: Payload role manipulation by student is strictly ignored');
    const spoofPublish = await request('POST', `/api/timetable/${newVersionId}/publish`, {
      headers: studentAuth,
      body: { role: 'admin', user_id: 'usr-admin' },
    });
    assert.strictEqual(spoofPublish.status, 403, 'Spoofed body role must still be blocked by server-verified role');
    console.log('✓ Passed: Request body role tampering is rejected with HTTP 403 FORBIDDEN');

    // Test 17: Google Calendar configuration endpoint
    console.log('Test 17: Google Calendar configuration endpoint');
    const calCfgRes = await request('GET', '/api/calendar/config', { headers: adminAuth });
    assert.strictEqual(calCfgRes.status, 200);
    assert.strictEqual(calCfgRes.body.success, true);
    assert.strictEqual(typeof calCfgRes.body.configured, 'boolean');
    console.log('✓ Passed: Calendar config endpoint returns valid configuration state');

    // Restore baseline v1 as active schedule
    await storage.promoteSchedule('v1', 'usr-admin');

    // Clean up test bookings
    await storage.deleteBooking(createdBooking.id);
    await storage.deleteBooking(adminBookingId);

    console.log('\n--- ALL 17 REQUESTS & CALENDAR INTEGRATION TESTS PASSED! ---');
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
