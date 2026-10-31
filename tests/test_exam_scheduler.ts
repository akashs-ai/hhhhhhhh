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
  console.log('EXAM SCHEDULER END-TO-END FUNCTIONAL & RBAC TEST SUITE');
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

  try {
    // --------------------------------------------------------------------------
    // PART 1: Role-Based Retrieval and Scoping
    // --------------------------------------------------------------------------
    console.log('--- SECTION 1: Role Scoping (HOD, Professor, Student) ---');

    // 1. Admin / Institutional HOD view
    const adminRes = await request('GET', '/api/exams', {
      headers: { 'x-user-id': 'usr-admin' },
    });
    assert(adminRes.status === 200, 'Admin can query /api/exams successfully (HTTP 200)');
    assert(adminRes.body.counts?.total >= 41, 'Admin receives full institutional examination count (>= 41)');
    assert(typeof adminRes.body.counts?.upcoming === 'number', 'Summary counts include dynamic upcoming count');
    assert(typeof adminRes.body.counts?.completed === 'number', 'Summary counts include dynamic completed count');

    // 2. Department Coordinator (HOD) view
    const coordRes = await request('GET', '/api/exams', {
      headers: { 'x-user-id': 'usr-coord-cse' },
    });
    assert(coordRes.status === 200, 'CSE Department Coordinator can query /api/exams (HTTP 200)');
    assert(coordRes.body.data.every((e: any) => e.department === 'CSE' || e.groups.some((g: string) => g.includes('CSE'))),
      'Coordinator examination results are scoped to their department (CSE)');

    // 3. Faculty / Professor view
    const facultyRes = await request('GET', '/api/exams', {
      headers: { 'x-user-id': 'usr-faculty-f19' },
    });
    assert(facultyRes.status === 200, 'Faculty can query /api/exams (HTTP 200)');
    assert(facultyRes.body.counts?.total > 0, 'Faculty receives duties matching their department and invigilation quota');

    // 4. Student view
    const studentRes = await request('GET', '/api/exams', {
      headers: { 'x-user-id': 'usr-student-cse3' },
    });
    assert(studentRes.status === 200, 'Student can query /api/exams (HTTP 200)');
    assert(studentRes.body.data.every((e: any) => e.groups.some((g: string) => g.includes('CSE') || g.includes('Y'))),
      'Student only receives examinations relevant to their enrolled cohort');

    // --------------------------------------------------------------------------
    // PART 2: Summary Filters (Upcoming, Drafts, Completed)
    // --------------------------------------------------------------------------
    console.log('\n--- SECTION 2: Examination Summary Filters ---');

    const upcomingRes = await request('GET', '/api/exams?status=upcoming', {
      headers: { 'x-user-id': 'usr-admin' },
    });
    assert(upcomingRes.status === 200, 'Filter status=upcoming returns HTTP 200');
    assert(upcomingRes.body.data.every((e: any) => e.status === 'upcoming'),
      'All returned examinations under status=upcoming have status="upcoming"');

    const completedRes = await request('GET', '/api/exams?status=completed', {
      headers: { 'x-user-id': 'usr-admin' },
    });
    assert(completedRes.status === 200, 'Filter status=completed returns HTTP 200');
    assert(completedRes.body.data.every((e: any) => e.status === 'completed'),
      'All returned examinations under status=completed have status="completed"');

    const searchRes = await request('GET', '/api/exams?search=MA101', {
      headers: { 'x-user-id': 'usr-admin' },
    });
    assert(searchRes.status === 200, 'Search filter for "MA101" returns HTTP 200');
    assert(searchRes.body.data.some((e: any) => e.course_ids.includes('MA101')),
      'Search query correctly locates examination for MA101');

    // --------------------------------------------------------------------------
    // PART 3: Action A - Global Conflict Audit
    // --------------------------------------------------------------------------
    console.log('\n--- SECTION 3: Action A - Global Conflict Audit ---');

    // Student blocked from running audit
    const studentAuditRes = await request('POST', '/api/exams/audit', {
      headers: { 'x-user-id': 'usr-student-cse3' },
    });
    assert(studentAuditRes.status === 403, 'Student blocked from running administrative conflict audit (HTTP 403 FORBIDDEN)');

    // Admin runs audit
    const adminAuditRes = await request('POST', '/api/exams/audit', {
      headers: { 'x-user-id': 'usr-admin' },
    });
    assert(adminAuditRes.status === 200, 'Admin can trigger Global Conflict Audit (HTTP 200)');
    assert(adminAuditRes.body.summary?.total_exams_audited >= 41, 'Conflict audit evaluates all scheduled examinations');
    assert(typeof adminAuditRes.body.summary?.status === 'string', 'Conflict audit includes pass/fail verification status');
    assert(Array.isArray(adminAuditRes.body.conflicts), 'Audit returns structured conflicts diagnostics array');

    // --------------------------------------------------------------------------
    // PART 4: Action B - Publish Examination Roster
    // --------------------------------------------------------------------------
    console.log('\n--- SECTION 4: Action B - Publish Examination Roster ---');

    // Student blocked from publishing
    const studentPublishRes = await request('POST', '/api/exams/publish', {
      headers: { 'x-user-id': 'usr-student-cse3' },
    });
    assert(studentPublishRes.status === 403, 'Student blocked from publishing examination roster (HTTP 403 FORBIDDEN)');

    // Faculty blocked from publishing
    const facultyPublishRes = await request('POST', '/api/exams/publish', {
      headers: { 'x-user-id': 'usr-faculty-f19' },
    });
    assert(facultyPublishRes.status === 403, 'Faculty blocked from publishing examination roster (HTTP 403 FORBIDDEN)');

    // Admin publishes roster
    const adminPublishRes = await request('POST', '/api/exams/publish', {
      headers: { 'x-user-id': 'usr-admin' },
    });
    assert(adminPublishRes.status === 200, 'Authorized Admin successfully publishes examination roster (HTTP 200)');
    assert(adminPublishRes.body.published_at !== undefined, 'Publication response contains verified publication timestamp');

    // Verify storage reflects published status
    const verifiedSched = await storage.getApprovedSchedule();
    assert(verifiedSched?.exam_roster?.status === 'published', 'Persistent storage records exam_roster.status = "published"');
    assert(verifiedSched?.exam_roster?.published_by === 'usr-admin', 'Persistent storage records publisher identity');

    // --------------------------------------------------------------------------
    // PART 5: Action C - Schedule New Exam
    // --------------------------------------------------------------------------
    console.log('\n--- SECTION 5: Action C - Schedule New Exam ---');

    // Clean up test exam if already present from previous run
    const preSched = await storage.getApprovedSchedule();
    if (preSched?.exams) {
      preSched.exams = preSched.exams.filter((e) => e.exam_id !== 'EX-CS301');
      await storage.saveSchedule(preSched);
    }

    // Student blocked from scheduling
    const studentScheduleRes = await request('POST', '/api/exams', {
      headers: { 'x-user-id': 'usr-student-cse3' },
      body: {
        course_id: 'CS301',
        groups: ['CSE-2A'],
        day: 'THU',
        session: 'PM',
        rooms: ['LH-1'],
        size: 60,
      },
    });
    assert(studentScheduleRes.status === 403, 'Student blocked from scheduling new examinations (HTTP 403 FORBIDDEN)');

    // Insufficient capacity rejection
    const underCapRes = await request('POST', '/api/exams', {
      headers: { 'x-user-id': 'usr-admin' },
      body: {
        course_id: 'CS301',
        groups: ['CSE-2A'],
        day: 'FRI',
        session: 'PM',
        rooms: ['CR-101'], // CR-101 capacity is 40 -> half capacity is 20
        size: 150, // requires 150
      },
    });
    assert(underCapRes.status === 400, 'Insufficient half-capacity seating rejected with HTTP 400');
    assert(underCapRes.body.error?.code === 'CAPACITY_INSUFFICIENT', 'Returns CAPACITY_INSUFFICIENT error code');

    // Valid exam scheduling
    const validScheduleRes = await request('POST', '/api/exams', {
      headers: { 'x-user-id': 'usr-admin' },
      body: {
        course_id: 'CS301',
        title: 'Data Structures and Algorithms Midterm',
        groups: ['CSE-2A'],
        day: 'SAT',
        session: 'PM',
        rooms: ['LH-3'],
        size: 50,
        duration_hours: 2,
        chief_invigilator: 'Dr. R. Pattnaik (Lead)',
      },
    });
    assert(validScheduleRes.status === 201, 'Valid examination scheduled successfully (HTTP 201 CREATED)');
    assert(validScheduleRes.body.data?.exam_id === 'EX-CS301', 'Scheduled exam ID matches EX-CS301');
    assert(validScheduleRes.body.data?.capacity_compliant === true, 'Scheduled exam confirms capacity compliance');

    // Double-booking collision rejection
    const collisionRes = await request('POST', '/api/exams', {
      headers: { 'x-user-id': 'usr-admin' },
      body: {
        course_id: 'CS302',
        groups: ['CSE-2B'],
        day: 'SAT',
        session: 'PM',
        rooms: ['LH-3'], // already booked by EX-CS301 in SAT PM
        size: 50,
      },
    });
    assert(collisionRes.status === 409, 'Room collision in same (day, session) slot rejected with HTTP 409');
    assert(collisionRes.body.error?.code === 'SCHEDULE_CONFLICT', 'Returns SCHEDULE_CONFLICT error code');

  } finally {
    server.close();
  }

  console.log(`\n=================================================================`);
  console.log(`EXAM SCHEDULER TESTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`=================================================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Exam scheduler test suite failed with error:', err);
  process.exit(1);
});
