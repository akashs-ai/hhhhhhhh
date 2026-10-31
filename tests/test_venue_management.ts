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
  console.log('=================================================================');
  console.log('VENUE MANAGEMENT & BOOKING END-TO-END VERIFICATION SUITE');
  console.log('=================================================================\n');

  const app = createExpressApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address() as any;
      baseUrl = `http://127.0.0.1:${addr.port}`;
      console.log(`Test server bound to ${baseUrl}\n`);
      resolve();
    });
  });

  const adminAuth = { 'x-user-id': 'usr-admin' };
  const coordAuth = { 'x-user-id': 'usr-coord-cse' };
  const facultyAuth = { 'x-user-id': 'usr-faculty-f19' };
  const otherFacultyAuth = { 'x-user-id': 'usr-faculty-f01' };
  const studentAuth = { 'x-user-id': 'usr-student-cse3' };

  try {
    // Clean up any previous test artifacts in dataset and storage
    const ds = await storage.getDataset();
    ds.rooms = (ds.rooms || []).filter((r: any) => r.id !== 'SEM-TEST-V1');
    ds.room_unavailability = (ds.room_unavailability || []).filter((u: any) => u.room_id !== 'AUD' || u.reason !== 'Acoustics testing');
    await storage.saveDataset(ds);

    const allB = await storage.getAllBookings();
    for (const [id, b] of Object.entries(allB)) {
      if (
        b.title === 'Distributed Systems Guest Colloquium' ||
        b.title === 'Overlapping Embedded Systems Lab' ||
        b.title === 'Deanery Annual Address' ||
        b.title === 'Conflicting Auditorium Presentation' ||
        b.title === 'Unauthorized Student Booking'
      ) {
        delete allB[id];
      }
    }
    await storage.saveAllBookings(allB);

    const wl = await storage.getWaitlist();
    for (const entry of wl) {
      if (entry.student_id === 'usr-student-cse3' || entry.venue_id === 'AUD') {
        await storage.deleteWaitlistEntry(entry.id);
      }
    }

    // --------------------------------------------------------------------------
    // PART 1: HOD Venue Management Actions
    // --------------------------------------------------------------------------
    console.log('--- SECTION 1: HOD Venue Management Actions ---');

    // Test 1: Register New Venue
    const regRes = await request('POST', '/api/venues', {
      headers: adminAuth,
      body: {
        id: 'SEM-TEST-V1',
        name: 'Dr. Kalam Smart Seminar Hall',
        type: 'seminar_hall',
        building: 'Advanced Tech Wing',
        capacity: 150,
        features: ['projector', 'sound_system', 'ac'],
        accessible: true,
      },
    });
    assert(regRes.status === 201, 'HOD/Admin can register new venue (HTTP 201 CREATED)');
    assert(regRes.body.data.id === 'SEM-TEST-V1', 'Venue ID matches registered code');
    assert(regRes.body.data.capacity === 150, 'Venue capacity stored correctly');

    // Test 1b: Duplicate Venue ID rejected
    const dupRes = await request('POST', '/api/venues', {
      headers: adminAuth,
      body: {
        id: 'SEM-TEST-V1',
        name: 'Duplicate Hall',
        type: 'seminar_hall',
        building: 'Block A',
        capacity: 100,
      },
    });
    assert(dupRes.status === 409, 'Duplicate venue code rejected with HTTP 409 Conflict');
    assert(dupRes.body.error.code === 'VENUE_CODE_CONFLICT', 'Returns VENUE_CODE_CONFLICT code');

    // Test 1c: Newly registered venue is queryable
    const listRes = await request('GET', '/api/venues', { headers: facultyAuth });
    assert(listRes.status === 200, 'Venues query returns HTTP 200');
    const foundVenue = listRes.body.data.find((v: any) => v.id === 'SEM-TEST-V1');
    assert(!!foundVenue, 'Registered venue visible in venue directory across all roles');

    // Test 2: Block Venue for Maintenance
    const blockRes = await request('POST', '/api/venues/maintenance', {
      headers: coordAuth,
      body: {
        room_id: 'AUD',
        day: 'WED',
        start_period: 2,
        end_period: 4,
        reason: 'Acoustics testing',
      },
    });
    assert(blockRes.status === 201, 'HOD/Coordinator can block venue for maintenance (HTTP 201 CREATED)');
    assert(blockRes.body.data.room_id === 'AUD', 'Blocked venue is AUD');
    assert(blockRes.body.data.periods.includes(3), 'Block covers target periods');
    const blockId = blockRes.body.data.id;

    // Test 3: Venue availability reflects maintenance
    const availCheck = await request('GET', '/api/venues?day=WED&period=3', { headers: facultyAuth });
    const audVenue = availCheck.body.data.find((v: any) => v.id === 'AUD');
    assert(audVenue?.current_status === 'maintenance', 'Venue status evaluates to maintenance during blocked period');
    assert(audVenue?.maintenance_block?.reason === 'Acoustics testing', 'Maintenance block reason preserved');

    // Test 4: Export Occupancy Report
    const reportRes = await request('GET', '/api/venues/occupancy-report?format=csv', { headers: adminAuth });
    assert(reportRes.status === 200, 'Admin can export occupancy report (HTTP 200)');
    assert(Boolean(reportRes.headers['content-type']?.includes('text/csv')), 'Content-Type is text/csv');
    assert(reportRes.text.includes('Venue ID,Venue Name'), 'CSV contains correct header row');
    assert(reportRes.text.includes('AUD'), 'CSV includes venue telemetry records');

    // --------------------------------------------------------------------------
    // PART 2: Professor Venue Requisition Workflow
    // --------------------------------------------------------------------------
    console.log('\n--- SECTION 2: Professor Requisitions & Filtering ---');

    // Test 5: Filter venues by day, period, classification, capacity
    const filterRes = await request('GET', '/api/venues?day=MON&period=6&classification=seminar&min_capacity=50', {
      headers: facultyAuth,
    });
    assert(filterRes.status === 200, 'Professor can filter venues (HTTP 200)');
    assert(filterRes.body.data.every((v: any) => v.capacity >= 50), 'All filtered venues satisfy capacity >= 50');
    assert(filterRes.body.data.every((v: any) => v.type === 'seminar_hall'), 'All filtered venues are seminar halls');

    // Test 6: Professor submits reservation request
    const bookRes = await request('POST', '/api/bookings', {
      headers: facultyAuth,
      body: {
        title: 'Distributed Systems Guest Colloquium',
        attendance: 80,
        duration_periods: 2,
        windows: [{ day: 'FRI', from_period: 6, to_period: 7 }],
        requested_room: 'LH-1',
        needs: ['projector', 'mic'],
      },
    });
    assert(bookRes.status === 201, 'Professor can submit reservation request (HTTP 201 CREATED)');
    assert(bookRes.body.data.status === 'pending', 'Submitted reservation has initial status pending');
    assert(bookRes.body.data.created_by === 'usr-faculty-f19', 'Request associated with authenticated faculty user');
    const facultyBookingId = bookRes.body.data.id;

    // Test 7: Professor views My Requisitions
    const myReqRes = await request('GET', '/api/bookings?mine=true', { headers: facultyAuth });
    assert(myReqRes.status === 200, 'Professor can query My Requisitions (HTTP 200)');
    const myFound = myReqRes.body.data.find((b: any) => b.id === facultyBookingId);
    assert(!!myFound, 'Submitted requisition visible in My Requisitions');

    // Test 7b: Other professors cannot view private requisitions in mine=true
    const otherReqRes = await request('GET', '/api/bookings?mine=true', { headers: otherFacultyAuth });
    const otherFound = otherReqRes.body.data.find((b: any) => b.id === facultyBookingId);
    assert(!otherFound, "Other faculty member's My Requisitions query excludes foreign private request");

    // Test 8: Conflict check - Requesting room under maintenance rejected
    const maintConflictRes = await request('POST', '/api/bookings', {
      headers: facultyAuth,
      body: {
        title: 'Conflicting Auditorium Presentation',
        attendance: 100,
        duration_periods: 2,
        windows: [{ day: 'WED', from_period: 2, to_period: 3 }],
        requested_room: 'AUD',
      },
    });
    assert(maintConflictRes.status === 409, 'Reservation request on maintenance-blocked slot rejected with HTTP 409');
    assert(maintConflictRes.body.error.code === 'MAINTENANCE_BLOCK_CONFLICT', 'Returns MAINTENANCE_BLOCK_CONFLICT code');

    // --------------------------------------------------------------------------
    // PART 3: Shared Approval Lifecycle & Double Booking Prevention
    // --------------------------------------------------------------------------
    console.log('\n--- SECTION 3: Shared Approval Lifecycle & Concurrency ---');

    // Test 9a: Faculty member cannot arbitrate/decide bookings
    const facultyDecideRes = await request('POST', `/api/bookings/${facultyBookingId}/decision`, {
      headers: facultyAuth,
      body: {
        status: 'approved',
        room_id: 'LH-1',
        day: 'FRI',
        start_period: 6,
        end_period: 7,
      },
    });
    assert(facultyDecideRes.status === 403, 'Faculty member blocked from deciding bookings (HTTP 403)');

    // Test 9b: Self-approval prevention (Admin creates a booking and tries to self-approve)
    const adminCreatedReq = await request('POST', '/api/bookings', {
      headers: adminAuth,
      body: {
        title: 'Deanery Annual Address',
        attendance: 100,
        duration_periods: 2,
        windows: [{ day: 'MON', from_period: 2, to_period: 3 }],
        requested_room: 'AUD',
      },
    });
    const adminBookingId = adminCreatedReq.body.data.id;

    const selfApproveRes = await request('POST', `/api/bookings/${adminBookingId}/decision`, {
      headers: adminAuth,
      body: {
        status: 'approved',
        room_id: 'AUD',
        day: 'MON',
        start_period: 2,
        end_period: 3,
      },
    });
    assert(selfApproveRes.status === 403, 'Self-approval is forbidden (HTTP 403)');
    assert(selfApproveRes.body.error.code === 'SELF_APPROVAL_FORBIDDEN', 'Returns SELF_APPROVAL_FORBIDDEN code');

    // Test 10: Authorized HOD approves request
    const approveRes = await request('POST', `/api/bookings/${facultyBookingId}/decision`, {
      headers: coordAuth,
      body: {
        status: 'approved',
        room_id: 'LH-1',
        day: 'FRI',
        start_period: 6,
        end_period: 7,
        reason: 'Approved by Timetable Chair',
      },
    });
    assert(approveRes.status === 200, 'Authorized HOD approves booking (HTTP 200)');
    assert(approveRes.body.data.status === 'approved', 'Booking status updated to approved');
    assert(approveRes.body.data.allocated_room === 'LH-1', 'Venue allocated to LH-1');

    // Test 11: Double booking collision prevention
    // Another booking tries to book the same room and slot
    const secondBookingRes = await request('POST', '/api/bookings', {
      headers: otherFacultyAuth,
      body: {
        title: 'Overlapping Embedded Systems Lab',
        attendance: 50,
        duration_periods: 2,
        windows: [{ day: 'FRI', from_period: 6, to_period: 7 }],
        requested_room: 'LH-1',
      },
    });
    const secondBookingId = secondBookingRes.body.data.id;

    // HOD tries to approve second booking on colliding slot
    const clashApproveRes = await request('POST', `/api/bookings/${secondBookingId}/decision`, {
      headers: adminAuth,
      body: {
        status: 'approved',
        room_id: 'LH-1',
        day: 'FRI',
        start_period: 6,
        end_period: 7,
      },
    });
    assert(clashApproveRes.status === 409, 'Double-booking collision rejected with HTTP 409 Conflict');
    assert(clashApproveRes.body.error.code === 'DOUBLE_BOOKING_CONFLICT', 'Returns DOUBLE_BOOKING_CONFLICT code');

    // Test 12: Maintenance block prevents conflicting approval
    const maintApproveRes = await request('POST', `/api/bookings/${secondBookingId}/decision`, {
      headers: adminAuth,
      body: {
        status: 'approved',
        room_id: 'AUD',
        day: 'WED',
        start_period: 2,
        end_period: 4,
      },
    });
    assert(maintApproveRes.status === 409, 'Approving booking in maintenance window rejected with HTTP 409');
    assert(maintApproveRes.body.error.code === 'MAINTENANCE_BLOCK_CONFLICT', 'Returns MAINTENANCE_BLOCK_CONFLICT code');

    // --------------------------------------------------------------------------
    // PART 4: Student RBAC Boundaries & Capabilities
    // --------------------------------------------------------------------------
    console.log('\n--- SECTION 4: Student RBAC & Public Views ---');

    // Test 13: Student cannot approve bookings or escalate privileges
    const studentDecideRes = await request('POST', `/api/bookings/${facultyBookingId}/decision`, {
      headers: studentAuth,
      body: { status: 'approved', room_id: 'LH-1', day: 'FRI', start_period: 6, end_period: 7 },
    });
    assert(studentDecideRes.status === 403, 'Students are prohibited from approving bookings (HTTP 403 FORBIDDEN)');
    assert(studentDecideRes.body.error.code === 'FORBIDDEN', 'Returns FORBIDDEN code');

    // Test 14: Student cannot invoke administrative APIs
    const studentRegRes = await request('POST', '/api/venues', {
      headers: studentAuth,
      body: { id: 'STUDENT-ROOM', name: 'Illegal Room', type: 'classroom', building: 'X', capacity: 10 },
    });
    assert(studentRegRes.status === 403, 'Student blocked from registering venues (HTTP 403)');

    const studentMaintRes = await request('POST', '/api/venues/maintenance', {
      headers: studentAuth,
      body: { room_id: 'AUD', day: 'MON', start_period: 1, end_period: 2, reason: 'test' },
    });
    assert(studentMaintRes.status === 403, 'Student blocked from creating maintenance blocks (HTTP 403)');

    const studentReportRes = await request('GET', '/api/venues/occupancy-report', { headers: studentAuth });
    assert(studentReportRes.status === 403, 'Student blocked from exporting occupancy reports (HTTP 403)');

    // Test 15: Student sees only confirmed public bookings
    const studentBookingsList = await request('GET', '/api/bookings', { headers: studentAuth });
    assert(studentBookingsList.status === 200, 'Student can view bookings list (HTTP 200)');
    assert(
      studentBookingsList.body.data.every((b: any) => b.status === 'approved'),
      'Student only receives confirmed/approved bookings (private pending requisitions hidden)'
    );

    // Test 16: Availability Matrix functionality
    const matrixRes = await request('GET', '/api/venues/availability?room_id=AUD&day=WED', { headers: studentAuth });
    assert(matrixRes.status === 200, 'Student can query Availability Matrix (HTTP 200)');
    assert(matrixRes.body.data.slots.length === 9, 'Matrix provides all 9 standard academic periods');
    const p3Slot = matrixRes.body.data.slots.find((s: any) => s.period === 3);
    assert(p3Slot?.status === 'maintenance', 'Period 3 correctly marked as maintenance in matrix');

    // Test 17: Join Waitlist
    const waitlistRes = await request('POST', '/api/venues/waitlist', {
      headers: studentAuth,
      body: {
        venue_id: 'AUD',
        day: 'WED',
        period: 3,
        purpose: 'Coding Club Technical Discussion',
      },
    });
    assert(waitlistRes.status === 201, 'Student can join waitlist for occupied/maintenance slot (HTTP 201 CREATED)');
    assert(waitlistRes.body.data.student_id === 'usr-student-cse3', 'Waitlist entry records student ID');

    // Test 17b: Duplicate waitlist prevented
    const dupWaitlistRes = await request('POST', '/api/venues/waitlist', {
      headers: studentAuth,
      body: {
        venue_id: 'AUD',
        day: 'WED',
        period: 3,
      },
    });
    assert(dupWaitlistRes.status === 409, 'Duplicate waitlist entry rejected with HTTP 409 Conflict');
    assert(dupWaitlistRes.body.error.code === 'WAITLIST_DUPLICATE_ENTRY', 'Returns WAITLIST_DUPLICATE_ENTRY code');

    // Test 18: Unblock Maintenance
    const unblockRes = await request('DELETE', `/api/venues/maintenance/${blockId}`, { headers: adminAuth });
    assert(unblockRes.status === 200, 'Admin can unblock venue maintenance (HTTP 200)');

    const postUnblockAvail = await request('GET', '/api/venues?day=WED&period=3', { headers: facultyAuth });
    const audPost = postUnblockAvail.body.data.find((v: any) => v.id === 'AUD');
    assert(audPost?.current_status === 'available', 'Venue returns to available status after unblocking maintenance');

    // Test 19: Withdraw pending booking
    const withdrawRes = await request('DELETE', `/api/bookings/${secondBookingId}`, { headers: otherFacultyAuth });
    assert(withdrawRes.status === 200, 'Faculty can withdraw their own pending booking (HTTP 200)');

    // Clean up registered test room & test bookings
    const dsClean = await storage.getDataset();
    dsClean.rooms = (dsClean.rooms || []).filter((r: any) => r.id !== 'SEM-TEST-V1');
    await storage.saveDataset(dsClean);

    const finalAllB = await storage.getAllBookings();
    delete finalAllB[facultyBookingId];
    delete finalAllB[secondBookingId];
    delete finalAllB[adminBookingId];
    await storage.saveAllBookings(finalAllB);

    const finalWl = await storage.getWaitlist();
    for (const entry of finalWl) {
      if (entry.student_id === 'usr-student-cse3' || entry.venue_id === 'AUD') {
        await storage.deleteWaitlistEntry(entry.id);
      }
    }
  } finally {
    server.close();
  }

  console.log('\n=================================================================');
  console.log(`VENUE MANAGEMENT TESTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
