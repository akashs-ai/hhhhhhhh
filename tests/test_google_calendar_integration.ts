import http from 'http';
import { createExpressApp } from '../server/app.js';
import { storage } from '../server/storage.js';
import { CalendarService, GoogleCalendarEventModel } from '../server/calendarService.js';
import { GoogleCalendarSyncService } from '../server/googleCalendarSync.js';

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

async function runTestSuite() {
  console.log('=================================================================');
  console.log('GOOGLE CALENDAR INTEGRATION & OAUTH SYNCHRONIZATION TEST SUITE');
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
  const facultyToken = 'faculty-f19-token-01';
  const studentToken = 'student-cse3-token-01';

  try {
    // --------------------------------------------------------------------------
    // TEST SECTION 1: Google OAuth Token Validation & Handling
    // --------------------------------------------------------------------------
    console.log('--- SECTION 1: Google OAuth Token Handling & Validation ---');

    // 1a. Validate with mock valid Google tokeninfo
    const mockValidFetch: typeof fetch = async (input, init) => {
      const urlStr = String(input);
      if (urlStr.includes('/oauth2/v3/tokeninfo')) {
        return new Response(
          JSON.stringify({
            email: 'dean.academics@cit.ac.in',
            scope: 'https://www.googleapis.com/auth/calendar.events',
            expires_in: 3599,
          }),
          { status: 200 }
        );
      }
      return new Response(JSON.stringify({}), { status: 404 });
    };

    const validRes = await GoogleCalendarSyncService.validateToken('mock-valid-google-token', mockValidFetch);
    assert(validRes.valid === true && validRes.email === 'dean.academics@cit.ac.in', 'Valid tokeninfo returns verified Google account email');

    // 1b. Validate with expired/invalid Google token
    const mockExpiredFetch: typeof fetch = async () => {
      return new Response(
        JSON.stringify({ error_description: 'Invalid Value' }),
        { status: 400 }
      );
    };

    const invalidRes = await GoogleCalendarSyncService.validateToken('mock-invalid-token', mockExpiredFetch);
    assert(invalidRes.valid === false && Boolean(invalidRes.error), 'Expired or malformed token is rejected with diagnostic error');

    // 1c. Empty token
    const emptyRes = await GoogleCalendarSyncService.validateToken('');
    assert(emptyRes.valid === false, 'Empty token string is rejected before network invocation');

    // --------------------------------------------------------------------------
    // TEST SECTION 2: Connection & Disconnection Lifecycle
    // --------------------------------------------------------------------------
    console.log('\n--- SECTION 2: Calendar Connection & Disconnection Endpoints ---');

    // 2a. Connect endpoint without authentication
    const unauthConnect = await httpRequest(baseUrl, 'POST', '/api/calendar/connect', {
      body: { googleEmail: 'test@cit.ac.in' },
    });
    assert(unauthConnect.status === 401, 'Unauthenticated connection attempt rejected (HTTP 401 UNAUTHORIZED)');

    // 2b. Connect endpoint with valid session
    const connectRes = await httpRequest(baseUrl, 'POST', '/api/calendar/connect', {
      token: adminToken,
      body: {
        googleEmail: 'dean.academics@cit.ac.in',
        calendarId: 'primary',
      },
    });
    assert(connectRes.status === 200 && connectRes.body.success === true, 'Authenticated connection succeeds (HTTP 200 OK)');
    assert(connectRes.body.connection?.connected === true, 'Connection record marked connected: true');

    // 2c. Status endpoint reflects connected state
    const statusRes = await httpRequest(baseUrl, 'GET', '/api/calendar/status', {
      token: adminToken,
    });
    assert(statusRes.status === 200 && statusRes.body.connection?.connected === true, 'GET /api/calendar/status reflects connected state');
    assert(statusRes.body.connection?.email === 'dean.academics@cit.ac.in', 'GET /api/calendar/status reports verified linked email');

    // 2d. Privacy & RBAC scoping: Student cannot query admin calendar status
    const studentSnoop = await httpRequest(baseUrl, 'GET', '/api/calendar/status?userId=usr-admin', {
      token: studentToken,
    });
    assert(studentSnoop.status === 403, 'Cross-user calendar status inspection blocked for non-admin (HTTP 403 FORBIDDEN)');

    // 2e. Disconnect endpoint
    const disconnectRes = await httpRequest(baseUrl, 'POST', '/api/calendar/disconnect', {
      token: adminToken,
    });
    assert(disconnectRes.status === 200 && disconnectRes.body.success === true, 'POST /api/calendar/disconnect succeeds cleanly');

    const statusAfter = await httpRequest(baseUrl, 'GET', '/api/calendar/status', {
      token: adminToken,
    });
    assert(statusAfter.body.connection?.connected === false, 'Status after disconnect reflects connected: false');

    // Re-connect for subsequent sync tests
    await httpRequest(baseUrl, 'POST', '/api/calendar/connect', {
      token: adminToken,
      body: { googleEmail: 'dean.academics@cit.ac.in', calendarId: 'primary' },
    });

    // --------------------------------------------------------------------------
    // TEST SECTION 3: Safety Gates & Role Scoping
    // --------------------------------------------------------------------------
    console.log('\n--- SECTION 3: Safety Gates & Role Scoping ---');

    const approvedSched = await storage.getApprovedSchedule();
    assert(approvedSched !== null && approvedSched.status === 'approved', 'Active approved schedule exists in storage');

    // 3a. Rejection of unapproved schedules
    let safetyTriggered = false;
    try {
      const fakeUnapproved: any = { id: 'v_fake', status: 'proposed', sessions: [] };
      await CalendarService.generateCalendarEvents(fakeUnapproved);
    } catch (err: any) {
      safetyTriggered = err.message.includes('Safety violation');
    }
    assert(safetyTriggered, 'CalendarService strictly throws safety exception for unapproved schedules');

    // 3b. Role Scoping: Student group scoping
    const studentEvents = await CalendarService.generateCalendarEvents(approvedSched!, {
      studentGroupId: 'Y1-A',
    });
    assert(studentEvents.length > 0, 'Generated calendar events for student group Y1-A');
    assert(studentEvents.every((e) => e.summary.includes('Y1-A')), 'All generated events for Y1-A cohort are scoped strictly to Y1-A');

    // 3c. Role Scoping: Faculty scoping
    const facultyEvents = await CalendarService.generateCalendarEvents(approvedSched!, {
      facultyId: 'F19',
    });
    assert(facultyEvents.length > 0, 'Generated calendar events for faculty F19');
    assert(
      facultyEvents.every((e) => e.extendedProperties?.private?.citFacultyId === 'F19' || e.description.includes('Dr. Shalini Gupta')),
      'All generated events for F19 are scoped strictly to F19 teaching duty'
    );

    // --------------------------------------------------------------------------
    // TEST SECTION 4: Duplicate Prevention & Stable Event Identifiers
    // --------------------------------------------------------------------------
    console.log('\n--- SECTION 4: Duplicate Prevention & Stable RFC 5545 iCalUID ---');

    const sampleEvent = studentEvents[0];
    assert(sampleEvent.iCalUID.includes('@cit.ac.in'), 'Event iCalUID has institutional domain format');
    assert(sampleEvent.id.startsWith('cit_session_'), 'Event id has deterministic prefix cit_session_');

    // Generate twice and ensure identifiers are 100% deterministic
    const studentEventsSecond = await CalendarService.generateCalendarEvents(approvedSched!, {
      studentGroupId: 'Y1-A',
    });
    assert(studentEvents.length === studentEventsSecond.length, 'Event count is 100% identical across repeat generations');
    assert(studentEvents[0].iCalUID === studentEventsSecond[0].iCalUID, 'iCalUID is strictly deterministic across runs');

    // --------------------------------------------------------------------------
    // TEST SECTION 5: Mocked Google Calendar API Sync (Create, Update, Delete)
    // --------------------------------------------------------------------------
    console.log('\n--- SECTION 5: Live Google Calendar REST API Operations (Mocked) ---');

    const createdRemoteEvents: any[] = [];
    const updatedRemoteEvents: any[] = [];
    const deletedRemoteEvents: string[] = [];

    const mockGoogleApiFetch: typeof fetch = async (input, init) => {
      const urlStr = String(input);
      const method = (init?.method || 'GET').toUpperCase();

      // Token verification
      if (urlStr.includes('/oauth2/v3/tokeninfo')) {
        return new Response(
          JSON.stringify({
            email: 'dean.academics@cit.ac.in',
            scope: 'https://www.googleapis.com/auth/calendar.events',
          }),
          { status: 200 }
        );
      }

      // List events
      if (urlStr.includes('/calendars/primary/events') && method === 'GET') {
        return new Response(JSON.stringify({ items: createdRemoteEvents }), { status: 200 });
      }

      // Create event (POST)
      if (urlStr.includes('/calendars/primary/events') && method === 'POST') {
        const body = JSON.parse(String(init?.body || '{}'));
        const newEvent = {
          id: `g_evt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          ...body,
        };
        createdRemoteEvents.push(newEvent);
        return new Response(JSON.stringify(newEvent), { status: 200 });
      }

      // Update event (PATCH)
      if (urlStr.includes('/calendars/primary/events/') && method === 'PATCH') {
        const eventId = urlStr.split('/').pop()!;
        const body = JSON.parse(String(init?.body || '{}'));
        updatedRemoteEvents.push({ eventId, ...body });
        return new Response(JSON.stringify({ id: eventId, ...body }), { status: 200 });
      }

      // Delete event (DELETE)
      if (urlStr.includes('/calendars/primary/events/') && method === 'DELETE') {
        const eventId = urlStr.split('/').pop()!;
        deletedRemoteEvents.push(eventId);
        return new Response(null, { status: 204 });
      }

      return new Response(JSON.stringify({ error: { message: 'Not Found' } }), { status: 404 });
    };

    // 5a. Initial sync: creates events
    const initialSyncResult = await GoogleCalendarSyncService.syncEvents({
      accessToken: 'valid-test-token',
      calendarId: 'primary',
      events: studentEvents.slice(0, 5), // Test with 5 events
      existingMappings: {},
      fetchFn: mockGoogleApiFetch,
    });

    assert(initialSyncResult.created === 5, 'Initial sync created all 5 events in Google Calendar');
    assert(initialSyncResult.updated === 0, 'Initial sync performed 0 updates');
    assert(Object.keys(initialSyncResult.eventMappings).length === 5, 'Recorded 5 event mappings');

    // 5b. Repeat sync with same events: must not duplicate (should update or skip)
    const repeatSyncResult = await GoogleCalendarSyncService.syncEvents({
      accessToken: 'valid-test-token',
      calendarId: 'primary',
      events: studentEvents.slice(0, 5),
      existingMappings: initialSyncResult.eventMappings,
      fetchFn: mockGoogleApiFetch,
    });

    assert(repeatSyncResult.created === 0, 'Duplicate prevention: Repeat sync created 0 new events');
    assert(repeatSyncResult.updated === 5, 'Duplicate prevention: Repeat sync updated existing mapped events');

    // 5c. Delete event
    const firstGoogleId = Object.values(initialSyncResult.eventMappings)[0];
    const deleteSuccess = await GoogleCalendarSyncService.deleteEvent({
      accessToken: 'valid-test-token',
      calendarId: 'primary',
      googleEventId: firstGoogleId,
      fetchFn: mockGoogleApiFetch,
    });
    assert(deleteSuccess === true, 'Event deletion via Google Calendar REST API succeeds');
    assert(deletedRemoteEvents.includes(firstGoogleId), 'Deleted event ID recorded by API handler');

    // --------------------------------------------------------------------------
    // TEST SECTION 6: Error Handling & Resilience
    // --------------------------------------------------------------------------
    console.log('\n--- SECTION 6: Google API Error Handling & Resilience ---');

    // 6a. Simulated 401 Unauthorized from Google
    const mockAuthFailFetch: typeof fetch = async (input) => {
      const urlStr = String(input);
      if (urlStr.includes('/oauth2/v3/tokeninfo')) {
        return new Response(JSON.stringify({ error_description: 'Token expired' }), { status: 401 });
      }
      return new Response(JSON.stringify({ error: { code: 401, message: 'Invalid Credentials' } }), { status: 401 });
    };

    const authFailSync = await httpRequest(baseUrl, 'POST', '/api/calendar/sync', {
      token: adminToken,
      body: { googleAccessToken: 'expired-token' },
    });
    // In our route, invalid token returns 401 with code GOOGLE_AUTH_EXPIRED
    assert(
      authFailSync.status === 401 && authFailSync.body.error?.code === 'GOOGLE_AUTH_EXPIRED',
      'Expired Google token returns HTTP 401 with structured GOOGLE_AUTH_EXPIRED code'
    );

    // 6b. Simulated Google API 500 server error handled cleanly
    const mock500Fetch: typeof fetch = async (input, init) => {
      const urlStr = String(input);
      if (urlStr.includes('/oauth2/v3/tokeninfo')) {
        return new Response(JSON.stringify({ email: 'test@cit.ac.in', scope: 'calendar.events' }), { status: 200 });
      }
      return new Response(JSON.stringify({ error: { message: 'Internal Calendar Server Error' } }), { status: 500 });
    };

    const errorSyncResult = await GoogleCalendarSyncService.syncEvents({
      accessToken: 'valid-token',
      calendarId: 'primary',
      events: studentEvents.slice(0, 2),
      existingMappings: {},
      fetchFn: mock500Fetch,
    });

    assert(errorSyncResult.errors.length === 2, 'API errors captured gracefully without unhandled exception');
    assert(errorSyncResult.errors[0].error.includes('Internal Calendar Server Error'), 'Error diagnostic message recorded');

    // --------------------------------------------------------------------------
    // TEST SECTION 7: OAuth Security, Secret Leak Prevention & Token Contracts
    // --------------------------------------------------------------------------
    console.log('\n--- SECTION 7: OAuth Security, Audit & Token Contracts ---');

    // 7a. Server-side token validation failure on connect
    const badTokenConnect = await httpRequest(baseUrl, 'POST', '/api/calendar/connect', {
      token: adminToken,
      body: {
        googleEmail: 'hacker@malicious.com',
        calendarId: 'primary',
        googleAccessToken: 'definitely-invalid-bogus-token',
      },
    });
    assert(badTokenConnect.status === 401, 'Invalid Google access token on connect returns HTTP 401');
    assert(
      badTokenConnect.body.error?.code === 'INVALID_GOOGLE_TOKEN',
      'Returns INVALID_GOOGLE_TOKEN error code'
    );

    // 7b. Server-side token validation with network failure simulator
    const netFailRes = await GoogleCalendarSyncService.validateToken('mock-token', async () => {
      throw new Error('Connection refused to Google OAuth tokeninfo service');
    });
    assert(netFailRes.valid === false, 'Network failure during token validation safely returns valid: false');
    assert(
      Boolean(netFailRes.error?.includes('Connection refused')),
      'Clear diagnostic error returned on network validation failure'
    );

    // 7c. Deduplication and partial failure during sync
    const mixedFetch: typeof fetch = async (input, init) => {
      const urlStr = String(input);
      const method = (init?.method || 'GET').toUpperCase();
      if (urlStr.includes('/oauth2/v3/tokeninfo')) {
        return new Response(JSON.stringify({ email: 'dean.academics@cit.ac.in', scope: 'calendar.events' }), { status: 200 });
      }
      if (urlStr.includes('/calendars/primary/events') && method === 'GET') {
        return new Response(JSON.stringify({ items: [] }), { status: 200 });
      }
      if (urlStr.includes('/calendars/primary/events') && method === 'POST') {
        const body = JSON.parse(String(init?.body || '{}'));
        // Simulate one event failure and one event success
        if (body.summary?.includes('FAIL')) {
          return new Response(JSON.stringify({ error: { message: 'Quota exceeded for session' } }), { status: 403 });
        }
        return new Response(JSON.stringify({ id: `g_evt_${Date.now()}` }), { status: 200 });
      }
      return new Response(JSON.stringify({}), { status: 404 });
    };

    const mixedEvents: any[] = [
      {
        id: 'cit_session_succ_1',
        summary: 'Successful Lecture Y1-A',
        description: 'Lecture details',
        location: 'LH-1',
        start: { dateTime: '2026-11-02T09:00:00Z', timeZone: 'Asia/Kolkata' },
        end: { dateTime: '2026-11-02T09:50:00Z', timeZone: 'Asia/Kolkata' },
        iCalUID: 'cit-succ-1@cit.ac.in',
      },
      {
        id: 'cit_session_fail_2',
        summary: 'FAIL - Rate Limited Session',
        description: 'Failing event',
        location: 'LH-2',
        start: { dateTime: '2026-11-02T10:00:00Z', timeZone: 'Asia/Kolkata' },
        end: { dateTime: '2026-11-02T10:50:00Z', timeZone: 'Asia/Kolkata' },
        iCalUID: 'cit-fail-2@cit.ac.in',
      },
    ];

    const partialSync = await GoogleCalendarSyncService.syncEvents({
      accessToken: 'valid-test-token',
      calendarId: 'primary',
      events: mixedEvents,
      existingMappings: {},
      fetchFn: mixedFetch,
    });
    assert(partialSync.created === 1, 'Partial sync created the successful event');
    assert(partialSync.errors.length === 1, 'Partial sync recorded the failing event in errors list');
    assert(partialSync.eventMappings['cit_session_succ_1'] !== undefined, 'Successful event mapping was retained');
    assert(partialSync.eventMappings['cit_session_fail_2'] === undefined, 'Failing event mapping was omitted');

    // 7d. Verify storage and audit records NEVER store or log access tokens
    const currentSyncData = await storage.getCalendarSyncData();
    const storedJson = JSON.stringify(currentSyncData);
    assert(!storedJson.includes('access_token') && !storedJson.includes('token-secret'),
      'Security audit: Stored calendar sync state contains 0 tokens or secrets');

    const auditLogs = await storage.getAuditLogs();
    const calendarLogs = auditLogs.filter((l) => l.resource_type === 'calendar');
    assert(calendarLogs.length > 0, 'Calendar audit log records exist');
    const logsJson = JSON.stringify(calendarLogs);
    assert(
      !logsJson.includes('mock-') &&
      !logsJson.includes('secret') &&
      !logsJson.includes('bogus-token'),
      'Security audit: Audit logs never log OAuth access tokens or credentials'
    );
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

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
