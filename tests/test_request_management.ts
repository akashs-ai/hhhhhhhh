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
): Promise<{ status: number; body: any; headers: http.IncomingHttpHeaders; text: string }> {
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
          resolve({ status: res.statusCode || 500, body: parsed, headers: res.headers, text: data });
        });
      }
    );

    req.on('error', reject);
    if (options?.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('CIT SCHEDULING PLATFORM — REQUEST MANAGEMENT TEST SUITE');
  console.log('======================================================\n');

  const app = createExpressApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const address = server.address() as any;
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });

  const adminAuth = { Authorization: 'Bearer usr-admin' };
  const profRamanujanAuth = { Authorization: 'Bearer usr-faculty-f19' };
  const profTuringAuth = { Authorization: 'Bearer usr-faculty-f01' };

  const testRoom = `Test-Hall-${Date.now()}`;
  const createdBookingIds: string[] = [];

  try {
    // -------------------------------------------------------------
    // TEST SECTION 1: Professor Scoping & Booking Creation
    // -------------------------------------------------------------
    console.log('--- TEST SECTION 1: Professor Scoping & Booking Creation ---');

    // 1.1 Prof Ramanujan creates a booking
    const createRes1 = await request('POST', '/api/bookings', {
      headers: profRamanujanAuth,
      body: {
        title: 'Ramanujan Advanced Combinatorics Tutorial',
        attendance: 35,
        duration_periods: 1,
        requested_category: 'remedial',
        requested_room: testRoom,
        windows: [{ day: 'TUE', start_period: 3, end_period: 3 }],
        raw_text: 'Midterm question paper review and problem solving.',
      },
    });

    assert(createRes1.status === 201 && createRes1.body.success, 'Prof Ramanujan creates booking successfully (201)');
    const ramanujanBookingId = createRes1.body.data.id;
    createdBookingIds.push(ramanujanBookingId);
    assert(ramanujanBookingId.startsWith('BR-'), 'Booking ID generated with BR- prefix', ramanujanBookingId);
    assert(createRes1.body.data.status === 'pending', 'Initial booking status is pending');
    assert(createRes1.body.data.created_by === 'usr-faculty-f19', 'created_by recorded as usr-faculty-f19');

    // 1.2 Prof Turing creates a booking
    const createRes2 = await request('POST', '/api/bookings', {
      headers: profTuringAuth,
      body: {
        title: 'Turing Theory of Computation Seminar',
        attendance: 50,
        duration_periods: 2,
        requested_category: 'guest_lecture',
        requested_room: testRoom,
        windows: [{ day: 'WED', start_period: 4, end_period: 5 }],
        raw_text: 'Guest speaker on automata and complexity.',
      },
    });

    assert(createRes2.status === 201 && createRes2.body.success, 'Prof Turing creates booking successfully (201)');
    const turingBookingId = createRes2.body.data.id;
    createdBookingIds.push(turingBookingId);

    // 1.3 Prof Ramanujan queries /api/bookings -> sees ONLY their booking
    const listResRamanujan = await request('GET', '/api/bookings', {
      headers: profRamanujanAuth,
    });
    assert(listResRamanujan.status === 200 && listResRamanujan.body.success, 'Prof Ramanujan queries bookings list (200)');
    const ramanujanList = listResRamanujan.body.data;
    const hasRamanujanBooking = ramanujanList.some((b: any) => b.id === ramanujanBookingId);
    const hasTuringBooking = ramanujanList.some((b: any) => b.id === turingBookingId);
    assert(hasRamanujanBooking, 'Prof Ramanujan sees their own booking in list');
    assert(!hasTuringBooking, 'Prof Ramanujan DOES NOT see Prof Turing booking (Strict Ownership Scoping)');

    // 1.4 Prof Ramanujan queries /api/bookings/:id for Turing's booking -> HTTP 403 Forbidden
    const getForeignRes = await request('GET', `/api/bookings/${turingBookingId}`, {
      headers: profRamanujanAuth,
    });
    assert(
      getForeignRes.status === 403,
      'Prof Ramanujan direct GET on foreign booking forbidden (HTTP 403)',
      `Status: ${getForeignRes.status}`
    );

    // 1.5 Admin queries /api/bookings -> sees both bookings
    const adminListRes = await request('GET', '/api/bookings', {
      headers: adminAuth,
    });
    assert(adminListRes.status === 200, 'Admin can query all bookings (200)');
    const adminList = adminListRes.body.data;
    assert(
      adminList.some((b: any) => b.id === ramanujanBookingId) && adminList.some((b: any) => b.id === turingBookingId),
      'Admin sees both Prof Ramanujan and Prof Turing bookings in institutional docket'
    );

    // -------------------------------------------------------------
    // TEST SECTION 2: Admin Approval & Notifications
    // -------------------------------------------------------------
    console.log('\n--- TEST SECTION 2: Admin Approval & Notifications ---');

    // 2.1 Admin approves Prof Ramanujan's booking
    const approveRes = await request('POST', `/api/bookings/${ramanujanBookingId}/decision`, {
      headers: adminAuth,
      body: {
        status: 'approved',
        room_id: testRoom,
        day: 'TUE',
        start_period: 3,
        end_period: 3,
        reason: 'Approved for auditorium review with projector access.',
      },
    });

    assert(approveRes.status === 200 && approveRes.body.success, 'Admin approves pending booking (200)');
    assert(approveRes.body.data.status === 'approved', 'Booking status transitioned to approved');
    assert(approveRes.body.data.allocated_room === testRoom, 'Allocated room persisted as test room');
    assert(!!approveRes.body.data.decided_by, 'decided_by recorded');
    assert(!!approveRes.body.data.decided_at, 'decided_at timestamp recorded');

    // 2.2 Verify in-app notification was generated for Prof Ramanujan
    const notifResRamanujan = await request('GET', '/api/notifications', {
      headers: profRamanujanAuth,
    });
    assert(notifResRamanujan.status === 200 && notifResRamanujan.body.success, 'Prof Ramanujan gets notifications (200)');
    const notifications = notifResRamanujan.body.data;
    const approvalNotif = notifications.find((n: any) => n.reference_id === ramanujanBookingId);
    assert(!!approvalNotif, 'In-app notification created for Prof Ramanujan with reference_id');
    assert(approvalNotif.title.toUpperCase().includes('APPROVED'), 'Notification title reflects approval', approvalNotif?.title);
    assert(!approvalNotif.read, 'Notification is initially unread');

    // 2.3 Prof Ramanujan marks notification as read
    const readNotifRes = await request('POST', `/api/notifications/${approvalNotif.id}/read`, {
      headers: profRamanujanAuth,
    });
    assert(readNotifRes.status === 200 && readNotifRes.body.success, 'Prof Ramanujan marks notification as read');

    // Verify it is marked as read via GET
    const notifResRamanujan2 = await request('GET', '/api/notifications', {
      headers: profRamanujanAuth,
    });
    const updatedApprovalNotif = notifResRamanujan2.body.data.find((n: any) => n.id === approvalNotif.id);
    assert(updatedApprovalNotif?.read === true, 'Notification status updated to read=true');

    // -------------------------------------------------------------
    // TEST SECTION 3: Prevention of Re-Decision on Approved Booking
    // -------------------------------------------------------------
    console.log('\n--- TEST SECTION 3: Prevention of Re-Decision on Approved Booking ---');

    // 3.1 Attempting to approve already-approved booking -> HTTP 409 ALREADY_PROCESSED
    const reApproveRes = await request('POST', `/api/bookings/${ramanujanBookingId}/decision`, {
      headers: adminAuth,
      body: {
        status: 'approved',
        reason: 'Attempting to re-approve',
      },
    });
    assert(
      reApproveRes.status === 409,
      'Admin cannot re-approve an already approved booking (HTTP 409 ALREADY_PROCESSED)',
      `Status: ${reApproveRes.status}`
    );
    assert(
      reApproveRes.body.error?.code === 'ALREADY_PROCESSED',
      'Error code is ALREADY_PROCESSED'
    );

    // 3.2 Attempting to reject already-approved booking -> HTTP 409 ALREADY_PROCESSED
    const reRejectRes = await request('POST', `/api/bookings/${ramanujanBookingId}/decision`, {
      headers: adminAuth,
      body: {
        status: 'rejected',
        reason: 'Attempting to reject approved booking',
      },
    });
    assert(
      reRejectRes.status === 409,
      'Admin cannot reject an already approved booking (HTTP 409 ALREADY_PROCESSED)'
    );

    // 3.3 Attempting to withdraw already-approved booking -> HTTP 409
    const withdrawApprovedRes = await request('POST', `/api/bookings/${ramanujanBookingId}/withdraw`, {
      headers: profRamanujanAuth,
    });
    assert(
      withdrawApprovedRes.status === 409,
      'Professor cannot withdraw an already approved booking (HTTP 409 ALREADY_PROCESSED)'
    );

    // -------------------------------------------------------------
    // TEST SECTION 4: Professor Withdrawal of Pending Booking
    // -------------------------------------------------------------
    console.log('\n--- TEST SECTION 4: Professor Withdrawal of Pending Booking ---');

    // 4.1 Prof Ramanujan tries to withdraw Prof Turing's booking -> HTTP 403 Forbidden
    const foreignWithdrawRes = await request('POST', `/api/bookings/${turingBookingId}/withdraw`, {
      headers: profRamanujanAuth,
    });
    assert(
      foreignWithdrawRes.status === 403,
      'Prof Ramanujan cannot withdraw Prof Turing booking (HTTP 403 Forbidden)'
    );

    // 4.2 Prof Turing withdraws their own pending booking
    const validWithdrawRes = await request('POST', `/api/bookings/${turingBookingId}/withdraw`, {
      headers: profTuringAuth,
    });
    assert(
      validWithdrawRes.status === 200 && validWithdrawRes.body.success,
      'Prof Turing successfully withdraws pending booking (200)'
    );
    assert(validWithdrawRes.body.data.status === 'withdrawn', 'Booking status transitioned to withdrawn');

    // 4.3 Attempting to decide on a withdrawn booking -> HTTP 409 ALREADY_PROCESSED
    const decideWithdrawnRes = await request('POST', `/api/bookings/${turingBookingId}/decision`, {
      headers: adminAuth,
      body: {
        status: 'approved',
        reason: 'Cannot approve withdrawn request',
      },
    });
    assert(
      decideWithdrawnRes.status === 409,
      'Admin cannot approve or reject a withdrawn booking (HTTP 409 ALREADY_PROCESSED)'
    );

    // 4.4 Attempting to re-withdraw a withdrawn booking -> HTTP 409 ALREADY_PROCESSED
    const reWithdrawRes = await request('POST', `/api/bookings/${turingBookingId}/withdraw`, {
      headers: profTuringAuth,
    });
    assert(
      reWithdrawRes.status === 409,
      'Professor cannot re-withdraw an already withdrawn booking (HTTP 409 ALREADY_PROCESSED)'
    );

    // -------------------------------------------------------------
    // TEST SECTION 5: Rejection Workflow & Notifications
    // -------------------------------------------------------------
    console.log('\n--- TEST SECTION 5: Rejection Workflow & Notifications ---');

    // 5.1 Prof Ramanujan creates another booking
    const createRes3 = await request('POST', '/api/bookings', {
      headers: profRamanujanAuth,
      body: {
        title: 'Ramanujan Weekend Workshop',
        attendance: 100,
        duration_periods: 4,
        requested_category: 'special_event',
        windows: [{ day: 'SAT', start_period: 1, end_period: 4 }],
        raw_text: 'Full day mathematics workshop.',
      },
    });
    const ramanujanWorkshopId = createRes3.body.data.id;
    createdBookingIds.push(ramanujanWorkshopId);

    // 5.2 Admin rejects the booking with explicit reason
    const rejectRes = await request('POST', `/api/bookings/${ramanujanWorkshopId}/decision`, {
      headers: adminAuth,
      body: {
        status: 'rejected',
        reason: 'Power grid maintenance scheduled on Saturday morning in campus block.',
      },
    });
    assert(rejectRes.status === 200 && rejectRes.body.success, 'Admin rejects booking (200)');
    assert(rejectRes.body.data.status === 'rejected', 'Status transitioned to rejected');
    assert(rejectRes.body.data.decision_reason.includes('Power grid maintenance'), 'Rejection reason persisted');

    // 5.3 Prof Ramanujan gets rejection in-app notification
    const notifRes2 = await request('GET', '/api/notifications', {
      headers: profRamanujanAuth,
    });
    const rejectionNotif = notifRes2.body.data.find((n: any) => n.reference_id === ramanujanWorkshopId);
    assert(!!rejectionNotif, 'Rejection notification delivered to requester in-app');
    assert(rejectionNotif.title.toUpperCase().includes('REJECTED'), 'Notification title indicates Rejection');
    assert(rejectionNotif.message.includes('Power grid maintenance'), 'Notification message contains rejection reason');

    // 5.4 Prof Ramanujan marks all as read
    const markAllRes = await request('POST', '/api/notifications/read-all', {
      headers: profRamanujanAuth,
    });
    assert(markAllRes.status === 200 && markAllRes.body.success, 'Mark all notifications as read (200)');

    const notifRes3 = await request('GET', '/api/notifications', {
      headers: profRamanujanAuth,
    });
    const unreadCount = notifRes3.body.data.filter((n: any) => !n.read).length;
    assert(unreadCount === 0, 'All notifications for Prof Ramanujan are now read (unread count = 0)');
  } finally {
    for (const bId of createdBookingIds) {
      await storage.deleteBooking(bId).catch(() => {});
    }
    if (server) {
      server.close();
    }
  }

  console.log('\n------------------------------------------------------');
  console.log(`REQUEST MANAGEMENT TESTS SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
