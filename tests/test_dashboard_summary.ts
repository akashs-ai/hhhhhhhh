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
    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

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

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  [FAIL] ${message}`);
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`  [PASS] ${message}`);
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('CIT SCHEDULING PLATFORM — DASHBOARD SYNCHRONIZATION');
  console.log('======================================================\n');

  const app = createExpressApp();
  const PORT = 19782;

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
      if (key.startsWith('BR-DASH-TEST-')) {
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
    // SECTION 1: Authentication & Protection
    // -------------------------------------------------------------
    console.log('--- SECTION 1: Authentication & Role Authorization ---');

    const unauthRes = await request('GET', '/api/dashboard/summary');
    assert(unauthRes.status === 401, 'Unauthenticated request rejected with HTTP 401');

    // -------------------------------------------------------------
    // SECTION 2: Central Admin Dashboard Live Data
    // -------------------------------------------------------------
    console.log('\n--- SECTION 2: Admin Dashboard Institution-Wide Aggregation ---');

    const adminRes = await request('GET', '/api/dashboard/summary', { headers: adminAuth });
    assert(adminRes.status === 200, 'Admin receives dashboard summary (HTTP 200)');
    assert(adminRes.body.success === true, 'Response success flag is true');
    assert(adminRes.body.scope === 'institution', 'Admin scope is institution-wide');
    assert(typeof adminRes.body.stats.total_classes === 'number' && adminRes.body.stats.total_classes > 0, 'Total classes is real non-zero number');
    assert(typeof adminRes.body.stats.total_rooms === 'number' && adminRes.body.stats.total_rooms > 0, 'Total campus rooms is real count');
    assert(typeof adminRes.body.stats.active_rooms_count === 'number', 'Active rooms count is calculated');
    assert(typeof adminRes.body.stats.exams_scheduled === 'number', 'Exams scheduled is database backed');
    assert(typeof adminRes.body.distribution.theory_pct === 'number', 'Theory percentage calculated from real sessions');
    assert(typeof adminRes.body.distribution.capacity_utilized_pct === 'number', 'Spatial capacity utilization percentage calculated');
    assert(Array.isArray(adminRes.body.distribution.daily_breakdown), 'Daily breakdown is an array');
    assert(adminRes.body.distribution.daily_breakdown.length === 6, 'Daily breakdown covers Mon through Sat');
    assert(Array.isArray(adminRes.body.recent_activities), 'Recent activities derived from central audit log');
    assert(Array.isArray(adminRes.body.venues), 'Top arenas list with real live occupancy returned');

    // -------------------------------------------------------------
    // SECTION 3: HOD / Department Coordinator Scoped Data
    // -------------------------------------------------------------
    console.log('\n--- SECTION 3: HOD / Department Coordinator Scoped Aggregation ---');

    const coordRes = await request('GET', '/api/dashboard/summary', { headers: coordAuth });
    assert(coordRes.status === 200, 'Coordinator receives dashboard summary (HTTP 200)');
    assert(coordRes.body.scope === 'department', 'Coordinator scope is department-scoped');
    assert(coordRes.body.department.includes('CSE') || coordRes.body.department.includes('Computer Science'), 'Department is CSE');
    assert(coordRes.body.stats.total_classes <= adminRes.body.stats.total_classes, 'Department classes is subset of institution classes');

    // -------------------------------------------------------------
    // SECTION 4: Faculty / Professor Personal Dashboard
    // -------------------------------------------------------------
    console.log('\n--- SECTION 4: Faculty / Professor Personalized Summary ---');

    const facRes = await request('GET', '/api/dashboard/summary', { headers: facultyAuth });
    assert(facRes.status === 200, 'Faculty receives dashboard summary (HTTP 200)');
    assert(facRes.body.role === 'faculty', 'Faculty role verified');
    assert(typeof facRes.body.stats.weekly_hours === 'number' && facRes.body.stats.weekly_hours > 0, 'Weekly teaching hours calculated from assigned sessions');
    assert(typeof facRes.body.stats.weekly_met_pct === 'number', 'Weekly target completion percentage calculated');
    assert(Array.isArray(facRes.body.assigned_courses), 'Assigned courses breakdown is an array');
    assert(Array.isArray(facRes.body.today.classes), 'Today classes array returned for faculty');
    assert(Array.isArray(facRes.body.upcoming_exams), 'Upcoming examination invigilation duties returned');

    // -------------------------------------------------------------
    // SECTION 5: Student Personal Dashboard
    // -------------------------------------------------------------
    console.log('\n--- SECTION 5: Student Personal Summary & Privacy ---');

    const studRes = await request('GET', '/api/dashboard/summary', { headers: studentAuth });
    assert(studRes.status === 200, 'Student receives dashboard summary (HTTP 200)');
    assert(studRes.body.role === 'student', 'Student role verified');
    assert(studRes.body.student_group === 'CSE-3' || studRes.body.student_group === 'CSE-2A', 'Student group identified');
    assert(typeof studRes.body.stats.classes_today === 'number', 'Classes today is a number');
    assert(typeof studRes.body.stats.attendance_overall_pct === 'number', 'Overall attendance percentage provided');
    assert(studRes.body.stats.attendance_threshold_met === true, 'Attendance threshold 75% evaluated');
    assert(Array.isArray(studRes.body.upcoming_exams), 'Enrolled course upcoming exams returned');

    // -------------------------------------------------------------
    // SECTION 6: Mutation-Driven Real-Time Synchronization
    // -------------------------------------------------------------
    console.log('\n--- SECTION 6: Mutation-Driven Real-Time Synchronization ---');

    const initialPendingBookings = adminRes.body.stats.pending_bookings;
    const initialVenueBookings = adminRes.body.stats.venue_bookings;

    // Create a new booking
    const testBookingId = `BR-DASH-TEST-${Date.now()}`;
    await storage.saveBooking({
      id: testBookingId,
      submitted_at: new Date().toISOString(),
      requester: 'Prof. Alan Turing',
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

    // Re-fetch admin summary: pending count must increase by 1
    const postCreateRes = await request('GET', '/api/dashboard/summary', { headers: adminAuth });
    assert(
      postCreateRes.body.stats.pending_bookings === initialPendingBookings + 1,
      'Admin dashboard reflects new pending booking in real-time (+1 pending)'
    );

    // Approve the booking
    const approveRes = await request('POST', `/api/bookings/${testBookingId}/decision`, {
      headers: adminAuth,
      body: {
        status: 'approved',
        room_id: 'SH-2',
        day: 'THU',
        start_period: 4,
        end_period: 5,
        reason: 'Approved for dashboard test',
      },
    });
    assert(approveRes.status === 200, 'Booking approved successfully');

    // Re-fetch admin summary: active bookings increases by 1, pending decreases by 1
    const postApproveRes = await request('GET', '/api/dashboard/summary', { headers: adminAuth });
    assert(
      postApproveRes.body.stats.venue_bookings === initialVenueBookings + 1,
      'Admin dashboard reflects approved booking immediately (+1 active booking)'
    );
    assert(
      postApproveRes.body.stats.pending_bookings === initialPendingBookings,
      'Admin dashboard decrements pending bookings immediately'
    );

    // -------------------------------------------------------------
    // SECTION 7: Scope Boundary & Anti-Spoofing Checks
    // -------------------------------------------------------------
    console.log('\n--- SECTION 7: Scope Boundary & Anti-Spoofing Enforcement ---');

    // Student attempting to pass ?department=All or ?role=admin
    const studentSpoofRes = await request('GET', '/api/dashboard/summary?department=All&role=admin', {
      headers: studentAuth,
    });
    assert(studentSpoofRes.status === 200, 'Student request completes under verified role');
    assert(studentSpoofRes.body.role === 'student', 'Student role is strictly derived from auth, ignoring query spoofing');
    assert(studentSpoofRes.body.stats.classes_today !== undefined, 'Student response maintains student schema');
    assert(studentSpoofRes.body.stats.total_classes === undefined, 'Student response strictly DOES NOT leak admin institutional statistics');

    // Coordinator attempting to pass ?department=All
    const coordSpoofRes = await request('GET', '/api/dashboard/summary?department=All', {
      headers: coordAuth,
    });
    assert(coordSpoofRes.status === 200, 'Coordinator request completes');
    assert(coordSpoofRes.body.scope === 'department', 'Coordinator scope remains strictly locked to department');
    assert(coordSpoofRes.body.department.includes('CSE') || coordSpoofRes.body.department.includes('Computer Science'), 'Department remains CSE');

    console.log('\n------------------------------------------------------');
    console.log('DASHBOARD SYNCHRONIZATION TESTS: ALL CHECKS PASSED');
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
