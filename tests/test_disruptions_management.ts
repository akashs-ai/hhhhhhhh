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
  console.log('DISRUPTION MANAGEMENT END-TO-END FUNCTIONAL & RBAC TEST SUITE');
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
    // PART 1: Query, Dynamic Metrics, and Filter Counts
    // --------------------------------------------------------------------------
    console.log('--- SECTION 1: Disruption Retrieval, Counts & Metrics ---');

    const listRes = await request('GET', '/api/disruptions', {
      headers: { 'x-user-id': 'usr-admin' },
    });
    assert(listRes.status === 200, 'Admin can query /api/disruptions successfully (HTTP 200)');
    assert(Array.isArray(listRes.body.data), 'Returns disruption records array');
    assert(listRes.body.data.length >= 10, 'Authoritative seed disruptions loaded (>= 10)');

    const counts = listRes.body.counts;
    assert(typeof counts?.all === 'number' && counts.all >= 10, 'Provides dynamic total count');
    assert(typeof counts?.pending === 'number', 'Provides dynamic pending review count');
    assert(typeof counts?.faculty === 'number', 'Provides dynamic faculty unavailability count');
    assert(typeof counts?.room === 'number', 'Provides dynamic room reallocations count');

    const metrics = listRes.body.metrics;
    assert(typeof metrics?.under_review === 'number', 'Provides under_review metric');
    assert(typeof metrics?.auto_resolved === 'number', 'Provides auto_resolved metric');
    assert(typeof metrics?.mean_latency_hours === 'number', 'Provides mean_latency_hours metric');
    assert(metrics?.residual_collisions === 0, 'Residual collisions evaluates to 0 (stable)');

    // Filter by type=faculty
    const facultyFilterRes = await request('GET', '/api/disruptions?type=faculty', {
      headers: { 'x-user-id': 'usr-admin' },
    });
    assert(facultyFilterRes.status === 200, 'Faculty filter returns HTTP 200');
    assert(
      facultyFilterRes.body.data.every((d: any) => d.type === 'faculty_unavailability'),
      'All filtered items are faculty_unavailability type'
    );

    // Filter by type=room
    const roomFilterRes = await request('GET', '/api/disruptions?type=room', {
      headers: { 'x-user-id': 'usr-admin' },
    });
    assert(roomFilterRes.status === 200, 'Room filter returns HTTP 200');
    assert(
      roomFilterRes.body.data.every((d: any) => d.type === 'room_reallocation'),
      'All filtered items are room_reallocation type'
    );

    // --------------------------------------------------------------------------
    // PART 2: Authoritative Disruption Audit Log Export (CSV)
    // --------------------------------------------------------------------------
    console.log('\n--- SECTION 2: Disruption Audit Log CSV Export ---');

    const exportRes = await request('GET', '/api/disruptions/export', {
      headers: { 'x-user-id': 'usr-admin' },
    });
    assert(exportRes.status === 200, 'Export audit log returns HTTP 200');
    assert(
      Boolean(exportRes.headers['content-type']?.includes('text/csv')),
      'Content-Type is text/csv'
    );
    assert(
      Boolean(exportRes.headers['content-disposition']?.includes('attachment; filename="disruption-audit-log-')),
      'Content-Disposition contains download attachment header'
    );
    assert(
      exportRes.text.includes('Case ID') &&
        exportRes.text.includes('Original Venue') &&
        exportRes.text.includes('Replacement Venue'),
      'CSV contains required audit log column headers'
    );
    assert(
      exportRes.text.includes('REQ-DIS-8821'),
      'CSV contains authoritative case record REQ-DIS-8821'
    );

    // --------------------------------------------------------------------------
    // PART 3: SAT Conflict Analysis Pass
    // --------------------------------------------------------------------------
    console.log('\n--- SECTION 3: SAT Conflict Analysis Pass ---');

    const analysisRes = await request('POST', '/api/disruptions/analyze', {
      headers: { 'x-user-id': 'usr-admin' },
    });
    assert(analysisRes.status === 200, 'SAT conflict analysis pass returns HTTP 200');
    assert(analysisRes.body.solver_status === 'OPTIMAL', 'Solver status reports OPTIMAL');
    assert(analysisRes.body.satisfiability_score === '100%', 'Satisfiability score reports 100%');
    assert(analysisRes.body.total_violations === 0, 'Zero residual timetable collisions');
    assert(analysisRes.body.checks?.cohort_free_time !== undefined, 'Evaluates cohort free time window');
    assert(analysisRes.body.checks?.room_availability !== undefined, 'Evaluates room capacity and availability');
    assert(analysisRes.body.checks?.substitute_faculty !== undefined, 'Evaluates substitute faculty consent');
    assert(analysisRes.body.checks?.syllabus_deficit !== undefined, 'Evaluates UGC/AICTE syllabus hours');

    // --------------------------------------------------------------------------
    // PART 4: Emergency Campus Closure Protocol & RBAC
    // --------------------------------------------------------------------------
    console.log('\n--- SECTION 4: Emergency Campus Closure Protocol ---');

    // Student blocked
    const studentClosureRes = await request('POST', '/api/disruptions/emergency-closure', {
      headers: { 'x-user-id': 'usr-student-cse3' },
      body: { reason: 'Unauthorized closure attempt' },
    });
    assert(studentClosureRes.status === 403, 'Student blocked from triggering emergency closure (HTTP 403)');

    // Missing reason rejected
    const noReasonClosureRes = await request('POST', '/api/disruptions/emergency-closure', {
      headers: { 'x-user-id': 'usr-admin' },
      body: { reason: '' },
    });
    assert(noReasonClosureRes.status === 400, 'Closure without operational reason rejected with HTTP 400');
    assert(noReasonClosureRes.body.error?.code === 'REASON_REQUIRED', 'Returns REASON_REQUIRED error code');

    // Authorized Admin executes closure
    const closureRes = await request('POST', '/api/disruptions/emergency-closure', {
      headers: { 'x-user-id': 'usr-admin' },
      body: {
        scope: 'campus',
        reason: 'Severe Cyclonic Storm & Inundation Warning',
        action: 'cancel',
        days: ['WED', 'THU'],
      },
    });
    assert(closureRes.status === 201, 'Authorized Admin triggers emergency closure (HTTP 201 CREATED)');
    assert(closureRes.body.data.id.startsWith('CLOSURE-'), 'Generates unique closure case identifier');
    assert(closureRes.body.data.type === 'emergency_closure', 'Disruption record type is emergency_closure');
    assert(closureRes.body.impacted_summary?.sessions_count > 0, 'Calculates impacted academic sessions');

    // Verify persisted in storage
    const storedClosure = await storage.getDisruptionById(closureRes.body.data.id);
    assert(storedClosure !== null, 'Emergency closure persisted in storage');
    assert(storedClosure?.status === 'approved', 'Closure record has status approved');

    // --------------------------------------------------------------------------
    // PART 5: Faculty Unavailability Submissions
    // --------------------------------------------------------------------------
    console.log('\n--- SECTION 5: Faculty Unavailability Submission ---');

    // Missing fields
    const invalidUnavailRes = await request('POST', '/api/disruptions/faculty-unavailability', {
      headers: { 'x-user-id': 'usr-faculty-f19' },
      body: { reason: 'Incomplete request' },
    });
    assert(invalidUnavailRes.status === 400, 'Incomplete unavailability request rejected with HTTP 400');

    // Valid submission by faculty
    const validUnavailRes = await request('POST', '/api/disruptions/faculty-unavailability', {
      headers: { 'x-user-id': 'usr-faculty-f19' },
      body: {
        course_id: 'CS201',
        day: 'THU',
        start_period: 3,
        end_period: 4,
        reason: 'Doctor Appointment',
      },
    });
    assert(validUnavailRes.status === 201, 'Faculty member submits unavailability request (HTTP 201 CREATED)');
    assert(validUnavailRes.body.data.status === 'pending', 'Submitted unavailability has initial status pending');
    assert(validUnavailRes.body.data.type === 'faculty_unavailability', 'Type is faculty_unavailability');

    const createdUnavailId = validUnavailRes.body.data.id;

    // --------------------------------------------------------------------------
    // PART 6: Request Manual Revision Workflow
    // --------------------------------------------------------------------------
    console.log('\n--- SECTION 6: Request Manual Revision Workflow ---');

    // Missing revision notes rejected
    const noNotesReviseRes = await request('POST', `/api/disruptions/${createdUnavailId}/revise`, {
      headers: { 'x-user-id': 'usr-coord-cse' },
      body: { notes: '' },
    });
    assert(noNotesReviseRes.status === 400, 'Revision request without notes rejected with HTTP 400');
    assert(noNotesReviseRes.body.error?.code === 'REVISION_NOTES_REQUIRED', 'Returns REVISION_NOTES_REQUIRED code');

    // Valid revision request
    const validReviseRes = await request('POST', `/api/disruptions/${createdUnavailId}/revise`, {
      headers: { 'x-user-id': 'usr-coord-cse' },
      body: { notes: 'Please propose alternate slot on Friday period 5-6.' },
    });
    assert(validReviseRes.status === 200, 'Coordinator requests manual revision (HTTP 200)');
    assert(validReviseRes.body.data.status === 'revision_requested', 'Status updated to revision_requested');
    assert(validReviseRes.body.data.revision_notes?.includes('Friday'), 'Revision notes preserved in storage');

    // --------------------------------------------------------------------------
    // PART 7: Reject Disruption Ticket Workflow
    // --------------------------------------------------------------------------
    console.log('\n--- SECTION 7: Reject Disruption Ticket ---');

    // Student cannot reject
    const studentRejectRes = await request('POST', '/api/disruptions/REQ-DIS-8819/reject', {
      headers: { 'x-user-id': 'usr-student-cse3' },
      body: { reason: 'Unauthorized' },
    });
    assert(studentRejectRes.status === 403, 'Student blocked from rejecting disruption (HTTP 403)');

    // Missing reason rejected
    const noReasonRejectRes = await request('POST', '/api/disruptions/REQ-DIS-8819/reject', {
      headers: { 'x-user-id': 'usr-admin' },
      body: { reason: '' },
    });
    assert(noReasonRejectRes.status === 400, 'Rejection without reason rejected with HTTP 400');
    assert(noReasonRejectRes.body.error?.code === 'REASON_REQUIRED', 'Returns REASON_REQUIRED code');

    // Self-rejection / self-approval prevention (usr-coord-cse created REQ-DIS-8819)
    const selfRejectRes = await request('POST', '/api/disruptions/REQ-DIS-8819/reject', {
      headers: { 'x-user-id': 'usr-coord-cse' },
      body: { reason: 'Attempt self rejection' },
    });
    assert(selfRejectRes.status === 403, 'Self-decision blocked with HTTP 403');
    assert(selfRejectRes.body.error?.code === 'SELF_APPROVAL_FORBIDDEN', 'Returns SELF_APPROVAL_FORBIDDEN code');

    // Admin rejects REQ-DIS-8819
    const adminRejectRes = await request('POST', '/api/disruptions/REQ-DIS-8819/reject', {
      headers: { 'x-user-id': 'usr-admin' },
      body: { reason: 'Portable HVAC units deployed; facility fault resolved on-site.' },
    });
    assert(adminRejectRes.status === 200, 'Admin rejects disruption ticket (HTTP 200)');
    assert(adminRejectRes.body.data.status === 'rejected', 'Status updated to rejected');
    assert(adminRejectRes.body.data.rejection_reason?.includes('Portable HVAC'), 'Rejection reason stored');

    // --------------------------------------------------------------------------
    // PART 8: Endorse & Publish Replacement Schedule & Cross-Role Sync
    // --------------------------------------------------------------------------
    console.log('\n--- SECTION 8: Endorse & Publish and Multi-Role Synchronization ---');

    // Student cannot endorse
    const studentApproveRes = await request('POST', '/api/disruptions/REQ-DIS-8821/approve', {
      headers: { 'x-user-id': 'usr-student-cse3' },
    });
    assert(studentApproveRes.status === 403, 'Student blocked from approving disruption (HTTP 403)');

    // Self-approval prevented (usr-faculty-f01 submitted REQ-DIS-8821)
    const selfApproveRes = await request('POST', '/api/disruptions/REQ-DIS-8821/approve', {
      headers: { 'x-user-id': 'usr-faculty-f01' },
    });
    assert(selfApproveRes.status === 403, 'Self-approval blocked with HTTP 403');

    // Admin endorses and publishes REQ-DIS-8821
    const adminApproveRes = await request('POST', '/api/disruptions/REQ-DIS-8821/approve', {
      headers: { 'x-user-id': 'usr-admin' },
    });
    assert(adminApproveRes.status === 200, 'Admin endorses and publishes disruption REQ-DIS-8821 (HTTP 200)');
    assert(adminApproveRes.body.data.disruption?.status === 'approved', 'Disruption status is approved');
    assert(adminApproveRes.body.data.approved_at !== undefined, 'Publication timestamp recorded');

    // Verify storage reflects approved status
    const verifiedDisruption = await storage.getDisruptionById('REQ-DIS-8821');
    assert(verifiedDisruption?.status === 'approved', 'Disruption stored as approved in persistent database');
    assert(verifiedDisruption?.approved_by === 'usr-admin', 'Approver recorded as usr-admin');

    // Verify Timetable synchronization across roles:
    // 1. Professor view
    const facultyTimetableRes = await request('GET', '/api/timetable', {
      headers: { 'x-user-id': 'usr-faculty-f19' },
    });
    assert(facultyTimetableRes.status === 200, 'Professor can query synchronized timetable (HTTP 200)');
    const relocatedSession = facultyTimetableRes.body.data.find(
      (s: any) => s.room_id === 'B-203' && s.day === 'WED'
    );
    assert(relocatedSession !== undefined, 'Rescheduled session reflects in Professor timetable in Room B-203 on WED');

    // 2. Student view
    const studentTimetableRes = await request('GET', '/api/timetable', {
      headers: { 'x-user-id': 'usr-student-cse3' },
    });
    assert(studentTimetableRes.status === 200, 'Student can query synchronized timetable (HTTP 200)');
    const studentRelocated = studentTimetableRes.body.data.find(
      (s: any) => s.room_id === 'B-203' && s.day === 'WED'
    );
    assert(studentRelocated !== undefined, 'Rescheduled session reflects in Student timetable in Room B-203 on WED');

    // --------------------------------------------------------------------------
    // PART 9: Pre-commit Collision Prevention
    // --------------------------------------------------------------------------
    console.log('\n--- SECTION 9: Pre-commit Collision Detection ---');

    // Create a disruption proposal that collides with an already occupied slot
    const collidingDisruptionId = `REQ-DIS-COLLIDE-${Date.now()}`;
    await storage.saveDisruption({
      id: collidingDisruptionId,
      title: 'Colliding Lab Session Proposal',
      submitted_at: new Date().toISOString(),
      submitted_by: 'usr-coord-ece',
      status: 'pending',
      type: 'room_reallocation',
      course_id: 'COLLIDE101',
      // Propose slot where session already exists in B-203 WED P6
      replacement_slot: {
        day: 'WED',
        start_period: 6,
        end_period: 7,
        room_id: 'B-203',
      },
      changes: [],
    });

    const collisionRes = await request('POST', `/api/disruptions/${collidingDisruptionId}/approve`, {
      headers: { 'x-user-id': 'usr-admin' },
    });
    assert(collisionRes.status === 409, 'Pre-commit collision rejected with HTTP 409 Conflict');
    assert(collisionRes.body.error?.code === 'SCHEDULE_ROOM_COLLISION', 'Returns SCHEDULE_ROOM_COLLISION code');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  console.log('\n=================================================================');
  console.log(`DISRUPTION MANAGEMENT TESTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
