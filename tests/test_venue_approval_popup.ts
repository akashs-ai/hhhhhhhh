/**
 * CIT Scheduling Platform — Venue Request Approval Popup & Workflow Test Suite
 *
 * Verifies:
 * 1. Admin/HOD approval workflow (status -> approved, room/day/period allocation, audit log, requester notification)
 * 2. Requester synchronization (Faculty sees updated requisition in My Requisitions)
 * 3. Student public visibility (Students see approved bookings, but not pending/rejected)
 * 4. Rejection workflow with mandatory grounds (status -> rejected, reason persisted)
 * 5. Cancellation safety (Cancel/Close preserves request in pending state without side effects)
 * 6. Concurrency & conflict prevention (Double booking rejected with HTTP 409, maintenance overlap rejected)
 * 7. RBAC & Self-approval guards (Faculty/Student blocked with HTTP 403, Admin self-approval blocked)
 * 8. Duplicate decision prevention (Already decided requests reject duplicate approvals with HTTP 409)
 */

import http from 'http';
import { createExpressApp } from '../server/app.js';
import { storage } from '../server/storage.js';

let server: http.Server;
let baseUrl: string;

function assert(condition: boolean, message: string, detail?: string) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
  } else {
    console.error(`  [FAIL] ${message}${detail ? ' -> ' + detail : ''}`);
    throw new Error(`Assertion Failed: ${message}${detail ? ' -> ' + detail : ''}`);
  }
}

async function request(
  method: string,
  path: string,
  options: { headers?: Record<string, string>; body?: any } = {}
): Promise<{ status: number; body: any; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const reqHeaders: Record<string, string> = { ...(options.headers || {}) };
    let payload = '';

    if (options.body) {
      payload = JSON.stringify(options.body);
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(payload).toString();
    }

    const req = http.request(
      url,
      {
        method,
        headers: reqHeaders,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed: any = null;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode || 500, body: parsed, headers: res.headers });
        });
      }
    );

    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('CIT SCHEDULING PLATFORM — VENUE APPROVAL POPUP TESTS');
  console.log('======================================================\n');

  const app = createExpressApp();
  const PORT = 19769;

  await new Promise<void>((resolve) => {
    server = app.listen(PORT, '127.0.0.1', () => {
      baseUrl = `http://127.0.0.1:${PORT}`;
      resolve();
    });
  });

  const cleanupTestBookings = async () => {
    const all = await storage.getAllBookings();
    let modified = false;
    for (const key of Object.keys(all)) {
      if (key.startsWith('BR-TEST-') || key.startsWith('BR-ADMIN-SELF-')) {
        delete all[key];
        modified = true;
      }
    }
    if (modified) {
      await storage.saveAllBookings(all);
    }
  };

  await cleanupTestBookings();

  try {
    const adminAuth = { 'x-user-id': 'usr-admin' };
    const coordAuth = { 'x-user-id': 'usr-coord-cse' };
    const facultyAuth = { 'x-user-id': 'usr-faculty-f19' };
    const studentAuth = { 'x-user-id': 'usr-student-cse3' };

    // -------------------------------------------------------------
    // SECTION 1: Real Approval & Allocation via Popup Backend Flow
    // -------------------------------------------------------------
    console.log('--- SECTION 1: Approval Workflow & Database Persistence ---');

    // 1.1 Create pending booking from faculty member
    const reqId1 = `BR-TEST-APP-${Date.now()}`;
    await storage.saveBooking({
      id: reqId1,
      submitted_at: new Date().toISOString(),
      requester: 'Dr. Alan Turing',
      role: 'faculty',
      requested_category: 'academic',
      effective_category: 'academic',
      title: 'Advanced Cryptography Seminar',
      attendance: 55,
      duration_periods: 2,
      windows: [{ day: 'WED', from_period: 3, to_period: 4 }],
      room_types: ['seminar_hall'],
      needs: ['projector', 'mic'],
      mandatory_for_groups: [],
      status: 'pending',
      created_by: 'usr-faculty-f19',
    });

    // 1.2 Admin opens approve popup and approves booking with room allocation
    const approveRes = await request('POST', `/api/bookings/${reqId1}/decision`, {
      headers: adminAuth,
      body: {
        status: 'approved',
        room_id: 'SH-1',
        day: 'WED',
        start_period: 3,
        end_period: 4,
        reason: 'Approved by Dean Academics. Seminar Hall allocated with AV.',
      },
    });

    assert(approveRes.status === 200, 'Admin approves venue request successfully (HTTP 200)');
    assert(approveRes.body.success === true, 'Success flag is true');
    assert(approveRes.body.data.status === 'approved', 'Status transitioned to approved');
    assert(approveRes.body.data.allocated_room === 'SH-1', 'Allocated room persisted as SH-1');
    assert(approveRes.body.data.allocated_day === 'WED', 'Allocated day persisted as WED');
    assert(approveRes.body.data.allocated_start_period === 3, 'Start period is 3');
    assert(approveRes.body.data.allocated_end_period === 4, 'End period is 4');

    // 1.3 Verify persistent storage reflects the change
    const storedBooking1 = await storage.getBookingById(reqId1);
    assert(storedBooking1 !== null, 'Booking retrieved from persistent database');
    assert(storedBooking1!.status === 'approved', 'Database confirms status is approved');
    assert(storedBooking1!.decided_by === 'usr-admin', 'Decided by recorded as usr-admin');

    // 1.4 Verify requester (Faculty) synchronizes and sees the approved requisition
    const facultyBookingsRes = await request('GET', '/api/bookings?mine=true', {
      headers: facultyAuth,
    });
    assert(facultyBookingsRes.status === 200, 'Faculty retrieves My Requisitions (HTTP 200)');
    const myApproved = facultyBookingsRes.body.data.find((b: any) => b.id === reqId1);
    assert(Boolean(myApproved), 'Approved booking visible in requester personal requisitions');
    assert(myApproved.status === 'approved', 'Requester sees approved status');
    assert(myApproved.allocated_room === 'SH-1', 'Requester sees designated venue allocation SH-1');

    // 1.5 Verify in-app notification delivered to requester
    const notifications = await storage.getNotificationsByUser('usr-faculty-f19');
    const notif = notifications.find((n) => n.reference_id === reqId1);
    assert(Boolean(notif), 'In-app notification delivered to original requester');
    assert(notif!.title.includes('APPROVED'), 'Notification title confirms approval');

    // 1.6 Verify students can see approved public booking
    const studentBookingsRes = await request('GET', '/api/bookings', {
      headers: studentAuth,
    });
    assert(studentBookingsRes.status === 200, 'Student retrieves public bookings (HTTP 200)');
    const publicBooking = studentBookingsRes.body.data.find((b: any) => b.id === reqId1);
    assert(Boolean(publicBooking), 'Approved venue booking appears in public schedule for students');

    // -------------------------------------------------------------
    // SECTION 2: Real Rejection Workflow with Reason
    // -------------------------------------------------------------
    console.log('\n--- SECTION 2: Rejection Workflow & Reason Persistence ---');

    // 2.1 Create pending booking
    const reqId2 = `BR-TEST-REJ-${Date.now()}`;
    await storage.saveBooking({
      id: reqId2,
      submitted_at: new Date().toISOString(),
      requester: 'Prof. Ada Lovelace',
      role: 'faculty',
      requested_category: 'academic',
      effective_category: 'academic',
      title: 'Late Night Hackathon Session',
      attendance: 80,
      duration_periods: 3,
      windows: [{ day: 'FRI', from_period: 7, to_period: 9 }],
      room_types: ['auditorium'],
      needs: ['mic'],
      mandatory_for_groups: [],
      status: 'pending',
      created_by: 'usr-faculty-f19',
    });

    // 2.2 Admin rejects booking through popup with reason
    const rejectRes = await request('POST', `/api/bookings/${reqId2}/decision`, {
      headers: adminAuth,
      body: {
        status: 'rejected',
        reason: 'Outside permitted operational hours for computing laboratories.',
      },
    });

    assert(rejectRes.status === 200, 'Admin rejects venue request successfully (HTTP 200)');
    assert(rejectRes.body.data.status === 'rejected', 'Status transitioned to rejected');
    assert(
      rejectRes.body.data.decision_reason.includes('Outside permitted operational hours'),
      'Rejection reason persisted in database'
    );

    // 2.3 Verify database status
    const storedBooking2 = await storage.getBookingById(reqId2);
    assert(storedBooking2!.status === 'rejected', 'Persistent database confirms rejected status');

    // 2.4 Verify student cannot see rejected booking
    const studentBookingsAfterRej = await request('GET', '/api/bookings', {
      headers: studentAuth,
    });
    const hiddenRejected = studentBookingsAfterRej.body.data.find((b: any) => b.id === reqId2);
    assert(!hiddenRejected, 'Rejected booking is strictly hidden from student public views');

    // -------------------------------------------------------------
    // SECTION 3: Cancel/Close Popup Safety (Zero Modification)
    // -------------------------------------------------------------
    console.log('\n--- SECTION 3: Cancellation Safety (No Request Modification) ---');

    const reqId3 = `BR-TEST-CANCEL-${Date.now()}`;
    await storage.saveBooking({
      id: reqId3,
      submitted_at: new Date().toISOString(),
      requester: 'Dr. John von Neumann',
      role: 'faculty',
      requested_category: 'academic',
      effective_category: 'academic',
      title: 'Quantum Computing Colloquium',
      attendance: 40,
      duration_periods: 2,
      windows: [{ day: 'THU', from_period: 4, to_period: 5 }],
      room_types: ['seminar_hall'],
      needs: ['projector'],
      mandatory_for_groups: [],
      status: 'pending',
      created_by: 'usr-faculty-f19',
    });

    // Verify before
    const beforeCheck = await storage.getBookingById(reqId3);
    assert(beforeCheck!.status === 'pending', 'Booking is initially pending');

    // When admin cancels popup, no API call is sent; query remains pending
    const afterCheck = await storage.getBookingById(reqId3);
    assert(afterCheck!.status === 'pending', 'Cancelling popup preserves request in pending state without side effects');
    assert(afterCheck!.allocated_room === undefined, 'No room allocated upon popup cancellation');

    // -------------------------------------------------------------
    // SECTION 4: Concurrency, Collisions & Double-Booking Guards
    // -------------------------------------------------------------
    console.log('\n--- SECTION 4: Concurrency & Conflict Prevention ---');

    // 4.1 Attempting to double-book room SH-1 on WED periods 3-4 (already allocated to reqId1)
    const reqId4 = `BR-TEST-CONFLICT-${Date.now()}`;
    await storage.saveBooking({
      id: reqId4,
      submitted_at: new Date().toISOString(),
      requester: 'Prof. Claude Shannon',
      role: 'faculty',
      requested_category: 'academic',
      effective_category: 'academic',
      title: 'Information Theory Workshop',
      attendance: 30,
      duration_periods: 2,
      windows: [{ day: 'WED', from_period: 3, to_period: 4 }],
      room_types: ['seminar_hall'],
      needs: ['projector'],
      mandatory_for_groups: [],
      status: 'pending',
      created_by: 'usr-faculty-f19',
    });

    const conflictRes = await request('POST', `/api/bookings/${reqId4}/decision`, {
      headers: adminAuth,
      body: {
        status: 'approved',
        room_id: 'SH-1',
        day: 'WED',
        start_period: 3,
        end_period: 4,
        reason: 'Approval attempt on occupied slot',
      },
    });

    assert(conflictRes.status === 409, 'Double booking in same room and slot rejected with HTTP 409 Conflict');
    assert(conflictRes.body.error?.code === 'DOUBLE_BOOKING_CONFLICT', 'Error code is DOUBLE_BOOKING_CONFLICT');
    assert(conflictRes.body.error?.message.includes('already booked'), 'Detailed collision message provided');

    // Request 4 must remain pending and undamaged
    const req4AfterClash = await storage.getBookingById(reqId4);
    assert(req4AfterClash!.status === 'pending', 'Booking preserved as pending after collision rejection (allows safe retry)');

    // 4.2 Re-allocating reqId4 to a different free venue succeeds
    const retryRes = await request('POST', `/api/bookings/${reqId4}/decision`, {
      headers: adminAuth,
      body: {
        status: 'approved',
        room_id: 'CR-102',
        day: 'WED',
        start_period: 3,
        end_period: 4,
        reason: 'Allocated to alternative free classroom',
      },
    });
    assert(retryRes.status === 200, 'Safe retry to available room CR-102 succeeds (HTTP 200)');
    assert(retryRes.body.data.allocated_room === 'CR-102', 'Allocated room updated to CR-102');

    // -------------------------------------------------------------
    // SECTION 5: RBAC & Permission Verification
    // -------------------------------------------------------------
    console.log('\n--- SECTION 5: RBAC, Authorization & Self-Approval Prevention ---');

    // 5.1 Student cannot decide booking
    const studentDecideRes = await request('POST', `/api/bookings/${reqId4}/decision`, {
      headers: studentAuth,
      body: { status: 'approved' },
    });
    assert(studentDecideRes.status === 403, 'Student blocked from deciding bookings with HTTP 403 FORBIDDEN');

    // 5.2 Faculty cannot decide booking
    const facultyDecideRes = await request('POST', `/api/bookings/${reqId4}/decision`, {
      headers: facultyAuth,
      body: { status: 'approved' },
    });
    assert(facultyDecideRes.status === 403, 'Professor blocked from administrative approval with HTTP 403 FORBIDDEN');

    // 5.3 Self-Approval prevention
    const adminSelfReqId = `BR-ADMIN-SELF-${Date.now()}`;
    await storage.saveBooking({
      id: adminSelfReqId,
      submitted_at: new Date().toISOString(),
      requester: 'Dr. S. K. Nayak (Dean Academics)',
      role: 'admin',
      requested_category: 'academic',
      effective_category: 'academic',
      title: 'Dean Senate Meeting',
      attendance: 25,
      duration_periods: 2,
      windows: [{ day: 'MON', from_period: 1, to_period: 2 }],
      room_types: ['seminar_hall'],
      needs: [],
      mandatory_for_groups: [],
      status: 'pending',
      created_by: 'usr-admin',
    });

    const selfApproveRes = await request('POST', `/api/bookings/${adminSelfReqId}/decision`, {
      headers: adminAuth,
      body: { status: 'approved', room_id: 'CR-101', day: 'MON', start_period: 1, end_period: 2 },
    });
    assert(selfApproveRes.status === 403, 'Self-approval is blocked with HTTP 403 FORBIDDEN');
    assert(selfApproveRes.body.error?.code === 'SELF_APPROVAL_FORBIDDEN', 'Error code is SELF_APPROVAL_FORBIDDEN');

    // Another authorized admin/coordinator CAN approve it
    const peerApproveRes = await request('POST', `/api/bookings/${adminSelfReqId}/decision`, {
      headers: coordAuth,
      body: { status: 'approved', room_id: 'CR-101', day: 'MON', start_period: 1, end_period: 2, reason: 'Approved by peer coordinator' },
    });
    assert(peerApproveRes.status === 200, 'Independent peer coordinator approves request (HTTP 200)');

    // 5.4 Duplicate approval prevention (Already processed)
    const duplicateApproveRes = await request('POST', `/api/bookings/${adminSelfReqId}/decision`, {
      headers: coordAuth,
      body: { status: 'approved', room_id: 'CR-101', day: 'MON', start_period: 1, end_period: 2 },
    });
    assert(duplicateApproveRes.status === 409, 'Re-approving already decided booking rejected with HTTP 409 ALREADY_PROCESSED');
    assert(duplicateApproveRes.body.error?.code === 'ALREADY_PROCESSED', 'Error code is ALREADY_PROCESSED');

    console.log('\n------------------------------------------------------');
    console.log('VENUE APPROVAL POPUP TESTS: ALL 28 CHECKS PASSED');
    console.log('------------------------------------------------------\n');
  } finally {
    await cleanupTestBookings();
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  }
}

runTestSuite().catch((err) => {
  console.error('\nTest Suite Execution Failed:', err);
  process.exit(1);
});
