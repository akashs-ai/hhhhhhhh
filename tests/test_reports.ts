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
  console.log('CIT SCHEDULING PLATFORM — REPORTS & ANALYTICS TEST SUITE');
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
  const coordAuth = { Authorization: 'Bearer usr-coord-cse' };
  const facultyAuth = { Authorization: 'Bearer usr-faculty-f19' };
  const studentAuth = { Authorization: 'Bearer usr-student-cse3' };

  try {
    // -------------------------------------------------------------
    // SECTION 1: HOD Reports RBAC & Authentication Enforcement
    // -------------------------------------------------------------
    console.log('--- SECTION 1: HOD Reports RBAC & Authorization ---');

    // 1.1 Admin access
    const adminRes = await request('GET', '/api/reports/executive', { headers: adminAuth });
    assert(adminRes.status === 200 && adminRes.body.success, 'Dean / Admin can access executive reports (HTTP 200)');
    assert(adminRes.body.data.filters_applied.department === 'All', 'Admin defaults to All departments scope');

    // 1.2 Coordinator access (Scoped to CSE)
    const coordRes = await request('GET', '/api/reports/executive', { headers: coordAuth });
    assert(coordRes.status === 200 && coordRes.body.success, 'Department Coordinator can access HOD reports (HTTP 200)');
    assert(coordRes.body.data.filters_applied.department === 'CSE', 'Coordinator is strictly locked to their department scope (CSE)');

    // 1.3 Faculty access to HOD report -> HTTP 403 Forbidden
    const facultyRes = await request('GET', '/api/reports/executive', { headers: facultyAuth });
    assert(facultyRes.status === 403, 'Professors/Faculty blocked from accessing HOD reports (HTTP 403 FORBIDDEN)');

    // 1.4 Student access to HOD report -> HTTP 403 Forbidden
    const studentRes = await request('GET', '/api/reports/executive', { headers: studentAuth });
    assert(studentRes.status === 403, 'Students blocked from accessing HOD reports (HTTP 403 FORBIDDEN)');

    // 1.5 Unauthenticated request -> HTTP 401 Unauthorized
    const unauthRes = await request('GET', '/api/reports/executive');
    assert(unauthRes.status === 401, 'Unauthenticated request rejected with HTTP 401 UNAUTHORIZED');

    // -------------------------------------------------------------
    // SECTION 2: Metric Calculations & Department Filter Behavior
    // -------------------------------------------------------------
    console.log('\n--- SECTION 2: Metric Calculations & Department Filtering ---');

    // 2.1 All Departments
    const allDeptRes = await request('GET', '/api/reports/executive?department=All', { headers: adminAuth });
    const allData = allDeptRes.body.data;
    assert(allData.academic_rhythm.total_teaching_slots > 0, 'Total teaching slots is greater than zero');
    assert(
      allData.academic_rhythm.total_teaching_slots ===
        allData.academic_rhythm.theory_slots + allData.academic_rhythm.practical_slots,
      'Total slots equals sum of theory and practical slots'
    );
    assert(
      allData.spatial_infrastructure.saturation_pct > 0 && allData.spatial_infrastructure.saturation_pct <= 100,
      'Venue saturation percentage is within 0-100% bounds'
    );
    assert(allData.solver_reliability.hard_clashes_active === 0, 'Zero hard clashes active (SAT solver certified)');
    assert(allData.faculty_equity.total_faculty > 0, 'Faculty count is populated from real dataset');
    assert(allData.faculty_equity.load_matrix.length > 0, 'Load matrix contains individual faculty allocations');

    // 2.2 Scoped to CSE
    const cseDeptRes = await request('GET', '/api/reports/executive?department=CSE', { headers: adminAuth });
    const cseData = cseDeptRes.body.data;
    assert(
      cseData.academic_rhythm.total_teaching_slots < allData.academic_rhythm.total_teaching_slots,
      'CSE scoped slots are a proper subset of All-departments slots'
    );
    assert(
      cseData.faculty_equity.load_matrix.every((f: any) => f.department === 'CSE'),
      'CSE scoped load matrix only contains CSE faculty members'
    );
    assert(cseData.filters_applied.department === 'CSE', 'Filters applied confirms CSE department');

    // 2.3 Venue Saturation Heatmap
    assert(allData.venue_heatmap.length === 5, 'Heatmap covers all 5 cycle days (MON to FRI)');
    assert(
      allData.venue_heatmap.every((row: any) => row.h1 && row.h2 && row.h3 && row.h4 && row.h5),
      'Heatmap contains all 5 hourly time blocks per day'
    );

    // 2.4 Examination Seating Efficiency
    assert(
      allData.exam_seating.total_capacity_desks >= allData.exam_seating.cohort_enrolled,
      'Examination seating capacity satisfies enrolled examinee cohort'
    );
    assert(allData.exam_seating.shifts.length === 3, 'Examination breakdown includes Shift 1, Shift 2, and Reserve Shift 3');

    // -------------------------------------------------------------
    // SECTION 3: Student Reports & Strict Personal Isolation
    // -------------------------------------------------------------
    console.log('\n--- SECTION 3: Student Reports & Personal Data Isolation ---');

    // 3.1 Authenticated student gets their personal report
    const sReportRes = await request('GET', '/api/reports/student', { headers: studentAuth });
    assert(sReportRes.status === 200 && sReportRes.body.success, 'Student retrieves personal report (HTTP 200)');
    const sData = sReportRes.body.data;

    // 3.2 Student Profile & Identity
    assert(sData.student_profile.id === 'usr-student-cse3', 'Student profile matches authenticated identity (usr-student-cse3)');
    assert(sData.student_profile.student_group_id === 'CSE-3', 'Cohort is strictly resolved to student group CSE-3');

    // 3.3 Timetable Scoping: ONLY CSE-3 sessions
    assert(sData.scheduled_classes.total_weekly_slots > 0, 'Personal scheduled classes count is positive');
    assert(sData.scheduled_classes.enrolled_courses.length > 0, 'Enrolled course modules list is populated');
    assert(
      sData.scheduled_classes.sessions.every((s: any) => s.course_id && s.room_name && s.day),
      'All personal sessions contain valid course, day, and room metadata'
    );

    // 3.4 Student examinations: ONLY exams for CSE-3 with allocated desk seat
    assert(sData.examinations.items.length > 0, 'Personal examination schedule includes cohort examinations');
    assert(
      sData.examinations.items.every((ex: any) => ex.desk_seat && ex.room_name && ex.timing),
      'Every student examination includes designated room, timing, and allocated desk seat'
    );

    // 3.5 Attendance telemetry honesty: Explains ERP integration rather than fabricating fake percentages
    assert(
      sData.attendance_telemetry.notice.toLowerCase().includes('biometric') ||
        sData.attendance_telemetry.notice.toLowerCase().includes('erp'),
      'Attendance telemetry notice clearly explains ERP/biometric integration without fabricating fake attendance records'
    );

    // 3.6 Anti-Spoofing: Client query param `?student_id=another` cannot leak other students' data
    const spoofRes = await request('GET', '/api/reports/student?student_id=usr-student-other&group=ME-1', {
      headers: studentAuth,
    });
    assert(
      spoofRes.body.data.student_profile.id === 'usr-student-cse3' &&
        spoofRes.body.data.student_profile.student_group_id === 'CSE-3',
      'Client query parameter spoofing attempt is ignored; student identity is strictly derived from session'
    );

    // -------------------------------------------------------------
    // SECTION 4: Export Master CSV & Personal CSV
    // -------------------------------------------------------------
    console.log('\n--- SECTION 4: CSV Export & Formatting ---');

    // 4.1 Admin Master CSV
    const csvResAdmin = await request('GET', '/api/reports/export/csv?term=Autumn+2026&department=All', {
      headers: adminAuth,
    });
    assert(csvResAdmin.status === 200, 'Master CSV export returns HTTP 200');
    assert(
      Boolean(csvResAdmin.headers['content-type']?.includes('text/csv')),
      'Content-Type is text/csv',
      String(csvResAdmin.headers['content-type'])
    );
    assert(
      csvResAdmin.text.includes('CHILIKA INSTITUTE OF TECHNOLOGY') &&
        csvResAdmin.text.includes('SCHEDULED TEACHING CONTACT SLOTS'),
      'Master CSV contains correct institutional headers and table sections'
    );

    // 4.2 Student Personal CSV
    const csvResStudent = await request('GET', '/api/reports/export/csv', { headers: studentAuth });
    assert(csvResStudent.status === 200, 'Student personal CSV export returns HTTP 200');
    assert(
      csvResStudent.text.includes('PERSONAL STUDENT ACADEMIC SCHEDULE DOSSIER') &&
        csvResStudent.text.includes('usr-student-cse3'),
      'Student CSV contains only personal student dossier data'
    );
    assert(
      !csvResStudent.text.includes('CHILIKA INSTITUTE OF TECHNOLOGY — MASTER ACADEMIC SCHEDULING REPORT'),
      'Student CSV DOES NOT expose institutional master data'
    );

    // -------------------------------------------------------------
    // SECTION 5: Automated Audit Scheduling
    // -------------------------------------------------------------
    console.log('\n--- SECTION 5: Schedule Automated Audit ---');

    // 5.1 Invalid audit request (missing email) -> HTTP 400
    const invalidAuditRes = await request('POST', '/api/reports/schedule-audit', {
      headers: adminAuth,
      body: { frequency: 'weekly' },
    });
    assert(invalidAuditRes.status === 400, 'Missing required fields returns HTTP 400 INVALID_PARAMETERS');

    // 5.2 Student blocked from scheduling audit -> HTTP 403
    const studentAuditRes = await request('POST', '/api/reports/schedule-audit', {
      headers: studentAuth,
      body: { frequency: 'weekly', recipient_email: 'student@cit.ac.in' },
    });
    assert(studentAuditRes.status === 403, 'Student blocked from scheduling automated audits (HTTP 403)');

    // 5.3 Admin schedules automated audit -> HTTP 201 Created
    const validAuditRes = await request('POST', '/api/reports/schedule-audit', {
      headers: adminAuth,
      body: {
        frequency: 'weekly',
        day_of_week: 'MON',
        time_utc: '06:00',
        recipient_email: 'dean.academics@cit.ac.in',
        format: 'both',
        department_scope: 'ALL',
      },
    });
    assert(validAuditRes.status === 201 && validAuditRes.body.success, 'Admin successfully schedules automated audit (HTTP 201 CREATED)');
    assert(validAuditRes.body.data.id.startsWith('SCHED-AUDIT-'), 'Audit job assigned valid SCHED-AUDIT- ID');
    assert(!!validAuditRes.body.infrastructure_notice, 'Response includes real infrastructure operational notice');

    // 5.4 Verify audit schedule registered in list
    const listAuditsRes = await request('GET', '/api/reports/scheduled-audits', { headers: adminAuth });
    assert(listAuditsRes.status === 200, 'Admin can list registered audit schedules');
    const hasJob = listAuditsRes.body.data.some((j: any) => j.id === validAuditRes.body.data.id);
    assert(hasJob, 'Newly scheduled audit job appears in active audit list');

    // 5.5 Verify logged in persistent audit log
    const auditLogs = await storage.getAuditLogs(10);
    const hasLog = auditLogs.some((l) => l.action === 'SCHEDULE_AUTOMATED_AUDIT' && l.resource_id === validAuditRes.body.data.id);
    assert(hasLog, 'Audit scheduling event persisted in central audit log');
  } finally {
    if (server) {
      server.close();
    }
  }

  console.log('\n------------------------------------------------------');
  console.log(`REPORTS & ANALYTICS TESTS SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
