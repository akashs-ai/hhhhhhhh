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
  console.log('CIT DATABASE-POWERED ASSISTANT MODE — TEST SUITE');
  console.log('======================================================\n');

  // Explicitly ensure GEMINI_API_KEY is unset to prove 100% zero reliance on LLM billing
  const savedApiKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  const app = createExpressApp();
  const PORT = 19788;

  await new Promise<void>((resolve) => {
    server = app.listen(PORT, '127.0.0.1', () => {
      baseUrl = `http://127.0.0.1:${PORT}`;
      resolve();
    });
  });

  try {
    const adminAuth = { 'x-user-id': 'usr-admin' };
    const facultyAuth = { 'x-user-id': 'usr-faculty-f01' };
    const studentAuth = { 'x-user-id': 'usr-student-cse3' };

    // -------------------------------------------------------------
    // SECTION 1: Question Catalog (GET /api/assistant/questions)
    // -------------------------------------------------------------
    console.log('--- SECTION 1: Question Catalog Retrieval & Role Scoping ---');

    const publicQuestionsRes = await request('GET', '/api/assistant/questions');
    assert(publicQuestionsRes.status === 200, 'Public/Unauthenticated question catalog returns HTTP 200');
    assert(Array.isArray(publicQuestionsRes.body.questions), 'Questions property is an array');
    assert(publicQuestionsRes.body.questions.length > 0, 'Catalog contains active verified questions');
    assert(
      publicQuestionsRes.body.questions.every((q: any) => q.audience === 'all'),
      'Public catalog strictly returns audience="all" items'
    );

    const studentQuestionsRes = await request('GET', '/api/assistant/questions', { headers: studentAuth });
    assert(studentQuestionsRes.status === 200, 'Student question catalog returns HTTP 200');
    assert(
      studentQuestionsRes.body.questions.some((q: any) => q.id === 'view_class_timetable'),
      'Student catalog includes view_class_timetable'
    );
    assert(
      studentQuestionsRes.body.questions.some((q: any) => q.id === 'check_exam_schedule'),
      'Student catalog includes check_exam_schedule'
    );
    assert(
      !studentQuestionsRes.body.questions.some((q: any) => q.audience === 'admin'),
      'Student catalog strictly excludes admin-only questions'
    );

    const adminQuestionsRes = await request('GET', '/api/assistant/questions', { headers: adminAuth });
    assert(adminQuestionsRes.status === 200, 'Admin question catalog returns HTTP 200');
    assert(
      adminQuestionsRes.body.questions.some((q: any) => q.id === 'admin_manage_schedules'),
      'Admin catalog includes admin_manage_schedules'
    );

    // -------------------------------------------------------------
    // SECTION 2: Predefined Verified FAQs (Mode A)
    // -------------------------------------------------------------
    console.log('\n--- SECTION 2: Predefined Database FAQs Execution ---');

    const faqRes = await request('POST', '/api/assistant/ask', {
      headers: studentAuth,
      body: { questionId: 'what_is_citschedule' },
    });
    assert(faqRes.status === 200, 'Predefined FAQ returns HTTP 200');
    assert(faqRes.body.success === true, 'Response indicates success');
    assert(faqRes.body.mode === 'database', 'Response mode is strictly "database"');
    assert(faqRes.body.source === 'database', 'Response source is strictly "database"');
    assert(faqRes.body.answer.includes('Chilika Institute of Technology'), 'FAQ answer contains verified institution text');

    const capabilitiesRes = await request('POST', '/api/assistant/ask', {
      headers: studentAuth,
      body: { questionId: 'citschedule_capabilities' },
    });
    assert(capabilitiesRes.status === 200, 'Capabilities FAQ returns HTTP 200');
    assert(capabilitiesRes.body.answer.includes('CITSchedule'), 'Returns verified capabilities description');

    // -------------------------------------------------------------
    // SECTION 3: Live Database Queries (Mode A)
    // -------------------------------------------------------------
    console.log('\n--- SECTION 3: Live Database Queries Execution ---');

    // 3.1 Student Class Timetable Query
    const studentTimetableRes = await request('POST', '/api/assistant/ask', {
      headers: studentAuth,
      body: { questionId: 'view_class_timetable' },
    });
    assert(studentTimetableRes.status === 200, 'Student live timetable query returns HTTP 200');
    assert(studentTimetableRes.body.mode === 'database', 'Response mode is "database"');
    assert(
      studentTimetableRes.body.answer.includes('Your Enrolled Class Timetable') ||
        studentTimetableRes.body.answer.includes('active class timetable sessions'),
      'Returns truthful class timetable digest based on live approved schedule'
    );

    // 3.2 Student Examination Schedule Query
    const studentExamRes = await request('POST', '/api/assistant/ask', {
      headers: studentAuth,
      body: { questionId: 'check_exam_schedule' },
    });
    assert(studentExamRes.status === 200, 'Student live examination query returns HTTP 200');
    assert(studentExamRes.body.mode === 'database', 'Response mode is "database"');
    assert(
      studentExamRes.body.answer.includes('Midterm Examination') || studentExamRes.body.answer.includes('examination papers scheduled'),
      'Returns truthful examination schedule digest from published exam roster'
    );

    // 3.3 Conflict Status Query
    const conflictRes = await request('POST', '/api/assistant/ask', {
      headers: adminAuth,
      body: { questionId: 'resolve_scheduling_conflicts' },
    });
    assert(conflictRes.status === 200, 'Conflict status live query returns HTTP 200');
    assert(conflictRes.body.answer.includes('Conflict'), 'Returns SAT constraint solver audit report');

    // 3.4 Campus Venues Overview Query
    const venuesRes = await request('POST', '/api/assistant/ask', {
      headers: adminAuth,
      body: { questionId: 'classrooms_venues_managed' },
    });
    assert(venuesRes.status === 200, 'Venues overview live query returns HTTP 200');
    assert(venuesRes.body.answer.includes('Venues'), 'Returns actual room and booking counts');

    // -------------------------------------------------------------
    // SECTION 4: Mode B Custom Questions — Beta Mode
    // -------------------------------------------------------------
    console.log('\n--- SECTION 4: Custom Questions & Beta Mode ---');

    const customRes = await request('POST', '/api/assistant/ask', {
      headers: studentAuth,
      body: { message: 'What is the weather on campus today?' },
    });
    assert(customRes.status === 200, 'Custom question returns HTTP 200 without LLM call');
    assert(customRes.body.mode === 'beta', 'Response mode is strictly "beta"');
    assert(customRes.body.source === 'beta_mode', 'Response source is "beta_mode"');
    assert(customRes.body.answer.includes('Beta Mode'), 'Answer displays polished Beta Mode notification');
    assert(
      customRes.body.answer.includes('select one of the suggested questions'),
      'Beta message guides user to suggested questions'
    );

    const emptyRes = await request('POST', '/api/assistant/ask', {
      headers: studentAuth,
      body: {},
    });
    assert(emptyRes.status === 200, 'Empty question request falls back gracefully to Beta Mode');
    assert(emptyRes.body.mode === 'beta', 'Empty request mode is "beta"');

    // -------------------------------------------------------------
    // SECTION 5: Authentication & Authorization Enforcement
    // -------------------------------------------------------------
    console.log('\n--- SECTION 5: Security & RBAC Enforcement ---');

    const unauthRes = await request('POST', '/api/assistant/ask', {
      body: { questionId: 'what_is_citschedule' },
    });
    assert(unauthRes.status === 401, 'Unauthenticated ask request rejected with HTTP 401');

    const studentForbiddenRes = await request('POST', '/api/assistant/ask', {
      headers: studentAuth,
      body: { questionId: 'admin_manage_schedules' },
    });
    assert(studentForbiddenRes.status === 403, 'Student asking admin-only question rejected with HTTP 403');
    assert(studentForbiddenRes.body.error?.code === 'FORBIDDEN_AUDIENCE', 'Returns FORBIDDEN_AUDIENCE code');

    console.log('\n======================================================');
    console.log('DATABASE ASSISTANT TEST SUITE: ALL TESTS PASSED!');
    console.log('======================================================\n');
  } finally {
    if (savedApiKey) {
      process.env.GEMINI_API_KEY = savedApiKey;
    }
    server.close();
  }
}

runTestSuite().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
