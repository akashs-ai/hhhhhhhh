import http from 'http';
import { createExpressApp } from '../server/app.js';
import { storage } from '../server/storage.js';
import { CalendarService } from '../server/calendarService.js';
import { GoogleCalendarSyncService } from '../server/googleCalendarSync.js';
import { CALENDAR_SCOPES } from '../src/services/googleAuth.js';

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

async function httpRequest(
  baseUrl: string,
  method: string,
  path: string,
  options?: {
    body?: any;
    token?: string;
    headers?: Record<string, string>;
  }
): Promise<{ status: number; body: any; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };
    if (options?.token) {
      reqHeaders['Authorization'] = `Bearer ${options.token}`;
    }

    const req = http.request(
      url,
      {
        method,
        headers: reqHeaders,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let parsed: any = raw;
          try {
            parsed = JSON.parse(raw);
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

async function runViewAndSyncTests() {
  console.log('=================================================================');
  console.log('GOOGLE CALENDAR TIMETABLE, BIDIRECTIONAL SYNC & CRUD TEST SUITE');
  console.log('=================================================================\n');

  let server: http.Server;
  let baseUrl = '';

  const app = createExpressApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address() as any;
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });

  const adminToken = 'admin-token-secret-01';
  const coordToken = 'coord-cse-token-01';
  const studentToken = 'student-cse3-token-01';

  try {
    // --------------------------------------------------------------------------
    // TEST SECTION 1: Google Identity Scopes & Token Email Resolution
    // --------------------------------------------------------------------------
    console.log('--- SECTION 1: Google OAuth Scopes & Email Identity Resolution ---');

    assert(
      CALENDAR_SCOPES.includes('email') &&
      CALENDAR_SCOPES.includes('https://www.googleapis.com/auth/calendar.events') &&
      CALENDAR_SCOPES.includes('https://www.googleapis.com/auth/calendar.readonly'),
      'Frontend CALENDAR_SCOPES includes email, calendar.events, and calendar.readonly'
    );

    // Mock Google APIs
    const mockGoogleUserEmail = 'matcreature0@gmail.com';

    const mockGoogleFetch: typeof fetch = async (input, init) => {
      const urlStr = String(input);
      const method = (init?.method || 'GET').toUpperCase();

      // Tokeninfo endpoint
      if (urlStr.includes('/oauth2/v3/tokeninfo')) {
        return new Response(
          JSON.stringify({
            email: mockGoogleUserEmail,
            scope: CALENDAR_SCOPES.join(' '),
            expires_in: 3599,
          }),
          { status: 200 }
        );
      }

      // Events list (simulate personal events + managed events)
      if (urlStr.includes('/calendars/primary/events') && method === 'GET') {
        return new Response(
          JSON.stringify({
            items: [
              {
                id: 'google_personal_event_1',
                summary: 'Doctor Appointment',
                start: { dateTime: '2026-10-20T10:00:00+05:30' },
                end: { dateTime: '2026-10-20T11:00:00+05:30' },
                location: 'City Health Clinic',
                status: 'confirmed',
              },
            ],
          }),
          { status: 200 }
        );
      }

      // Primary calendar endpoint
      if (urlStr.includes('/calendars/primary') && method === 'GET') {
        return new Response(
          JSON.stringify({
            id: mockGoogleUserEmail,
            summary: mockGoogleUserEmail,
            timeZone: 'Asia/Kolkata',
          }),
          { status: 200 }
        );
      }

      // Event insert (POST)
      if (urlStr.includes('/calendars/primary/events') && method === 'POST') {
        const body = JSON.parse(String(init?.body || '{}'));
        // In Google Calendar API v3, presence of iCalUID on events.insert causes 400
        if (body.iCalUID) {
          return new Response(
            JSON.stringify({ error: { code: 400, message: 'Invalid value for: iCalUID is read-only on events.insert' } }),
            { status: 400 }
          );
        }
        return new Response(
          JSON.stringify({
            id: `g_evt_${Date.now()}`,
            summary: body.summary,
            status: 'confirmed',
            extendedProperties: body.extendedProperties,
          }),
          { status: 200 }
        );
      }

      // Event patch (PATCH)
      if (urlStr.includes('/calendars/primary/events/') && method === 'PATCH') {
        const body = JSON.parse(String(init?.body || '{}'));
        return new Response(
          JSON.stringify({
            id: 'g_evt_patched',
            summary: body.summary,
            status: 'confirmed',
          }),
          { status: 200 }
        );
      }

      // Event delete (DELETE)
      if (urlStr.includes('/calendars/primary/events/') && method === 'DELETE') {
        return new Response(null, { status: 204 });
      }

      return new Response(JSON.stringify({ error: { message: 'Not Found' } }), { status: 404 });
    };

    // Connect with verified Google token
    const connectRes = await httpRequest(baseUrl, 'POST', '/api/calendar/connect', {
      token: coordToken,
      body: {
        googleEmail: mockGoogleUserEmail,
        calendarId: 'primary',
        googleAccessToken: 'mock-valid-matcreature-token',
      },
    });

    assert(connectRes.status === 200, 'POST /api/calendar/connect returns HTTP 200');
    assert(
      connectRes.body.connection?.email === mockGoogleUserEmail,
      'Connection email accurately records the authenticated Google account email (not institutional email)'
    );

    // --------------------------------------------------------------------------
    // TEST SECTION 2: Bidirectional Google Calendar Sync
    // --------------------------------------------------------------------------
    console.log('\n--- SECTION 2: Bidirectional Google Calendar Synchronization ---');

    const approvedSched = await storage.getApprovedSchedule();
    assert(approvedSched !== null, 'Approved baseline schedule exists');

    const sampleSessions = await CalendarService.generateCalendarEvents(approvedSched!, {
      studentGroupId: 'CSE-3',
    });

    // 2a. Run bidirectional sync with mocked Google API
    const bidiSync = await GoogleCalendarSyncService.syncBidirectional({
      accessToken: 'valid-test-token',
      calendarId: 'primary',
      events: sampleSessions.slice(0, 3),
      existingMappings: {},
      fetchFn: mockGoogleFetch,
    });

    assert(bidiSync.success === true, 'Bidirectional sync succeeded');
    assert(bidiSync.pushed.created === 3, 'Pushed 3 approved CIT sessions to Google Calendar');
    assert(bidiSync.pulled.personal === 1, 'Pulled 1 personal Google Calendar event');
    assert(bidiSync.personalEvents[0].summary === 'Doctor Appointment', 'Correctly identified personal Google event');

    // 2b. Pull events endpoint GET /api/calendar/events
    const calEventsRes = await httpRequest(baseUrl, 'GET', '/api/calendar/events?group=CSE-3', {
      token: coordToken,
    });
    assert(calEventsRes.status === 200, 'GET /api/calendar/events returns HTTP 200');
    assert(Array.isArray(calEventsRes.body.events), 'Returns timetable events list');

    // --------------------------------------------------------------------------
    // TEST SECTION 3: Timetable Session CRUD & Conflict Engine
    // --------------------------------------------------------------------------
    console.log('\n--- SECTION 3: Timetable Session CRUD & Server Conflict Engine ---');

    // 3a. Forbidden for student role
    const studentCreate = await httpRequest(baseUrl, 'POST', '/api/timetable/sessions', {
      token: studentToken,
      body: {
        course_id: 'CS-TEST',
        day: 'MON',
        start_period: 1,
        room_id: 'L-301',
        faculty_id: 'F01',
      },
    });
    assert(studentCreate.status === 403, 'Students cannot create timetable sessions (HTTP 403 FORBIDDEN)');

    // 3b. Room conflict detection
    // Find an existing session in approved schedule to collide with
    const existing = approvedSched!.sessions[0];
    const dataset = await storage.getDataset();
    const existingMeta = (dataset.sessions || []).find((s: any) => s.id === existing.session_id) || {};

    const clashCreate = await httpRequest(baseUrl, 'POST', '/api/timetable/sessions', {
      token: adminToken,
      body: {
        course_id: 'CS-CLASH',
        day: existing.day,
        start_period: existing.start_period,
        duration: 1,
        room_id: existing.room_id, // Same room at same time
        faculty_id: 'F99_DIFFERENT',
        groups: ['DIFF-GROUP'],
      },
    });
    assert(
      clashCreate.status === 409 && clashCreate.body.error?.code === 'SCHEDULE_CONFLICT',
      'Room collision caught and rejected with HTTP 409 SCHEDULE_CONFLICT'
    );
    assert(
      clashCreate.body.error?.conflicts?.length > 0,
      'Conflict response includes detailed clash diagnostic description'
    );

    // 3c. Faculty conflict detection
    const facultyClash = await httpRequest(baseUrl, 'POST', '/api/timetable/sessions', {
      token: adminToken,
      body: {
        course_id: 'CS-CLASH-FAC',
        day: existing.day,
        start_period: existing.start_period,
        duration: 1,
        room_id: 'ROOM_VACANT_99',
        faculty_id: existingMeta.faculty_id || 'F01', // Same faculty at same time
        groups: ['DIFF-GROUP'],
      },
    });
    assert(
      facultyClash.status === 409 && facultyClash.body.error?.code === 'SCHEDULE_CONFLICT',
      'Faculty double-booking collision caught and rejected with HTTP 409 SCHEDULE_CONFLICT'
    );

    // 3d. Successful creation of non-conflicting session
    const uniqueSessionId = `CS_AUTO_${Date.now()}`;
    const validCreate = await httpRequest(baseUrl, 'POST', '/api/timetable/sessions', {
      token: adminToken,
      body: {
        session_id: uniqueSessionId,
        course_id: 'CS-777',
        kind: 'theory',
        day: 'SAT',
        start_period: 10, // Saturday late evening period, free of clashes
        duration: 1,
        room_id: 'L-301',
        faculty_id: 'F01',
        groups: ['CSE-3'],
      },
    });
    assert(validCreate.status === 201 && validCreate.body.success === true, 'Valid non-conflicting session created (HTTP 201 CREATED)');

    // 3e. Update session
    const updateRes = await httpRequest(baseUrl, 'PUT', `/api/timetable/sessions/${uniqueSessionId}`, {
      token: adminToken,
      body: {
        day: 'SAT',
        start_period: 9,
        duration: 2,
      },
    });
    assert(updateRes.status === 200 && updateRes.body.success === true, 'Session updated successfully (HTTP 200 OK)');
    assert(updateRes.body.session?.start_period === 9, 'Updated start period reflected in response');

    // 3f. Delete session
    const deleteRes = await httpRequest(baseUrl, 'DELETE', `/api/timetable/sessions/${uniqueSessionId}`, {
      token: adminToken,
    });
    assert(deleteRes.status === 200 && deleteRes.body.success === true, 'Session deleted successfully from timetable');

    // --------------------------------------------------------------------------
    // TEST SECTION 4: Data Preservation & Driver Integrity
    // --------------------------------------------------------------------------
    console.log('\n--- SECTION 4: Data Preservation & Driver Integrity ---');

    assert(process.env.STORAGE_DRIVER !== 'postgres', 'STORAGE_DRIVER remains JSON (not PostgreSQL)');
    const auditLogs = await storage.getAuditLogs();
    const crudAudits = auditLogs.filter((l) => l.action.includes('TIMETABLE_SESSION'));
    assert(crudAudits.length >= 2, 'Audit log recorded session creation and deletion events');

    const reloadedSched = await storage.getApprovedSchedule();
    assert(reloadedSched !== null && reloadedSched.status === 'approved', 'Approved schedule remains intact');
    assert(reloadedSched!.sessions.length >= 180, 'Approved schedule preserves all core timetable sessions');

  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  console.log('\n=================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('=================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runViewAndSyncTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
