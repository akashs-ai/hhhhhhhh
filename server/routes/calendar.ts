import { Router, Response } from 'express';
import { AuthenticatedRequest, requireAuth } from '../auth.js';
import { CalendarService } from '../calendarService.js';
import { storage } from '../storage.js';

const router = Router();

router.get('/calendar/preview', async (req: AuthenticatedRequest, res: Response) => {
  const schedule = await storage.getApprovedSchedule();
  if (!schedule) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'No approved schedule available for calendar generation.' } });
    return;
  }

  const groupFilter = req.query.group as string | undefined;
  const facultyFilter = req.query.faculty as string | undefined;

  let effectiveGroup: string | undefined = groupFilter;
  let effectiveFaculty: string | undefined = facultyFilter;

  // Enforce role-scoped least privilege
  if (req.user?.role === 'student') {
    if (groupFilter && groupFilter !== req.user.studentGroupId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Students are restricted to viewing their assigned group '${req.user.studentGroupId}' calendar.`,
        },
      });
      return;
    }
    effectiveGroup = req.user.studentGroupId;
    effectiveFaculty = undefined;
  } else if (req.user?.role === 'faculty') {
    if (facultyFilter && facultyFilter !== req.user.facultyId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Faculty members are restricted to viewing their assigned schedule '${req.user.facultyId}'.`,
        },
      });
      return;
    }
    effectiveFaculty = req.user.facultyId;
  }

  try {
    const events = await CalendarService.generateCalendarEvents(schedule, {
      studentGroupId: effectiveGroup,
      facultyId: effectiveFaculty,
    });

    res.json({
      success: true,
      schedule_version: schedule.id,
      schedule_status: schedule.status,
      filter: { group: effectiveGroup || null, faculty: effectiveFaculty || null },
      events_count: events.length,
      data: events,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { code: 'CALENDAR_ERROR', message: err.message } });
  }
});

router.get('/calendar/changes', async (req: AuthenticatedRequest, res: Response) => {
  const baseVersionId = (req.query.base as string) || 'v1';
  const targetVersionId = req.query.target as string;

  const baseline = await storage.getScheduleById(baseVersionId);
  if (!baseline) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Baseline schedule version '${baseVersionId}' not found.` } });
    return;
  }

  let target = targetVersionId ? await storage.getScheduleById(targetVersionId) : await storage.getApprovedSchedule();
  if (!target) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Target schedule version not found.' } });
    return;
  }

  const changeReport = CalendarService.compareSchedules(baseline, target);
  res.json({ success: true, data: changeReport });
});

router.get('/calendar/status', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const requestedUserId = req.query.userId as string;
  let targetUserId = req.user!.id;

  // Non-admins cannot inspect other users' private calendar connection
  if (requestedUserId && requestedUserId !== req.user!.id) {
    if (req.user!.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied: Users cannot inspect other accounts\' private calendar metadata.',
        },
      });
      return;
    }
    targetUserId = requestedUserId;
  }

  const syncData = await storage.getCalendarSyncData();
  const connection = syncData.connections[targetUserId] || {
    connected: false,
    calendar_id: null,
    sync_status: 'not_connected',
    last_synced_version: null,
    last_synced_at: null,
    events_synced: 0,
    email: null,
    note: 'Google Calendar not connected. Click Connect Google Calendar to link account.',
  };

  res.json({
    success: true,
    user_id: targetUserId,
    user_role: req.user!.role,
    connection,
  });
});

// POST /api/calendar/connect - Link authenticated Google account
router.post('/calendar/connect', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { googleEmail, calendarId = 'primary', googleAccessToken } = req.body;

  let verifiedEmail = googleEmail || null;
  if (googleAccessToken) {
    const { GoogleCalendarSyncService } = await import('../googleCalendarSync.js');
    const tokenInfo = await GoogleCalendarSyncService.validateToken(googleAccessToken);
    if (!tokenInfo.valid) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_GOOGLE_TOKEN',
          message: tokenInfo.error || 'The provided Google OAuth access token could not be verified.',
        },
      });
      return;
    }
    if (tokenInfo.email) {
      verifiedEmail = tokenInfo.email;
    } else {
      try {
        const calRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary', {
          headers: { Authorization: `Bearer ${googleAccessToken}` },
        });
        if (calRes.ok) {
          const calData = await calRes.json();
          verifiedEmail = calData.id || verifiedEmail;
        }
      } catch (_) {}
    }
  }

  const syncData = await storage.getCalendarSyncData();
  const now = new Date().toISOString();
  const finalEmail = verifiedEmail || (req.body.googleEmail ? req.body.googleEmail : null);

  syncData.connections[req.user!.id] = {
    connected: true,
    email: finalEmail,
    calendar_id: calendarId,
    sync_status: 'idle',
    last_synced_version: syncData.connections[req.user!.id]?.last_synced_version || null,
    last_synced_at: syncData.connections[req.user!.id]?.last_synced_at || null,
    events_synced: syncData.connections[req.user!.id]?.events_synced || 0,
    connected_at: now,
    note: finalEmail ? `Google Calendar linked for ${finalEmail}` : 'Google Calendar linked.',
  };

  await storage.saveCalendarSyncData(syncData);

  await storage.logAudit({
    user_id: req.user!.id,
    user_name: req.user!.name,
    role: req.user!.role,
    action: 'CALENDAR_CONNECTED',
    resource_type: 'calendar',
    resource_id: calendarId,
    details: { email: verifiedEmail },
    status: 'success',
  });

  res.json({
    success: true,
    message: 'Google Calendar linked successfully.',
    connection: syncData.connections[req.user!.id],
  });
});

// POST /api/calendar/disconnect - Unlink Google account
router.post('/calendar/disconnect', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const syncData = await storage.getCalendarSyncData();

  syncData.connections[req.user!.id] = {
    connected: false,
    email: null,
    calendar_id: null,
    sync_status: 'disconnected',
    last_synced_version: null,
    last_synced_at: null,
    events_synced: 0,
    disconnected_at: new Date().toISOString(),
    note: 'Account disconnected by user.',
  };

  await storage.saveCalendarSyncData(syncData);

  await storage.logAudit({
    user_id: req.user!.id,
    user_name: req.user!.name,
    role: req.user!.role,
    action: 'CALENDAR_DISCONNECTED',
    resource_type: 'calendar',
    status: 'success',
  });

  res.json({
    success: true,
    message: 'Google Calendar disconnected successfully.',
  });
});

// GET /api/calendar/ics - Download standard RFC 5545 iCalendar (.ics) file
router.get('/calendar/ics', async (req: AuthenticatedRequest, res: Response) => {
  const schedule = await storage.getApprovedSchedule();
  if (!schedule) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'No approved schedule available for calendar generation.' } });
    return;
  }

  let effectiveGroup = req.query.group as string | undefined;
  let effectiveFaculty = req.query.faculty as string | undefined;

  if (req.user?.role === 'student') {
    effectiveGroup = req.user.studentGroupId;
    effectiveFaculty = undefined;
  } else if (req.user?.role === 'faculty') {
    effectiveFaculty = req.user.facultyId;
  }

  try {
    const events = await CalendarService.generateCalendarEvents(schedule, {
      studentGroupId: effectiveGroup,
      facultyId: effectiveFaculty,
    });

    const title = effectiveGroup
      ? `CIT Schedule - ${effectiveGroup}`
      : effectiveFaculty
      ? `CIT Faculty Schedule - ${effectiveFaculty}`
      : 'CIT Master Timetable';

    const icsContent = CalendarService.toICalendar(events, title);

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="cit_schedule_${schedule.id}.ics"`);
    res.send(icsContent);
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'CALENDAR_ICS_ERROR', message: err.message } });
  }
});

// POST /api/calendar/sync - Synchronize schedule with Google Calendar
router.post('/calendar/sync', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const schedule = await storage.getApprovedSchedule();
  if (!schedule) {
    res.status(400).json({
      success: false,
      error: { code: 'NO_APPROVED_SCHEDULE', message: 'Safety constraint: Only approved schedule versions can be synchronized with Google Calendar.' },
    });
    return;
  }

  let effectiveGroup = req.user!.studentGroupId;
  let effectiveFaculty = req.user!.facultyId;

  if (req.user!.role === 'admin' || req.user!.role === 'department_coordinator') {
    effectiveGroup = (req.body.group as string) || effectiveGroup;
    effectiveFaculty = (req.body.faculty as string) || effectiveFaculty;
  }

  // Check Google token: from body, or X-Google-Token / X-Google-Access-Token header
  const googleAccessToken =
    (req.body.googleAccessToken as string) ||
    (req.headers['x-google-token'] as string) ||
    (req.headers['x-google-access-token'] as string);

  try {
    const events = await CalendarService.generateCalendarEvents(schedule, {
      studentGroupId: effectiveGroup,
      facultyId: effectiveFaculty,
    });

    const syncData = await storage.getCalendarSyncData();
    const existingMappings = syncData.event_mappings || {};
    const now = new Date().toISOString();

    let pushStats = {
      totalEvents: events.length,
      created: googleAccessToken ? 0 : events.length,
      updated: 0,
      deleted: 0,
      skipped: 0,
      errors: [] as any[],
    };

    let pulledStats = {
      total: 0,
      managed: 0,
      personal: 0,
      conflicts: 0,
    };

    let personalEvents: any[] = [];
    let conflicts: any[] = [];
    let verifiedTokenEmail: string | null = null;

    if (googleAccessToken) {
      // Execute live Google Calendar REST API bidirectional sync
      const { GoogleCalendarSyncService } = await import('../googleCalendarSync.js');

      // Verify token
      const tokenInfo = await GoogleCalendarSyncService.validateToken(googleAccessToken);
      if (!tokenInfo.valid) {
        res.status(401).json({
          success: false,
          error: {
            code: 'GOOGLE_AUTH_EXPIRED',
            message: tokenInfo.error || 'Your Google account session has expired. Please re-authenticate.',
          },
        });
        return;
      }
      verifiedTokenEmail = tokenInfo.email || null;

      const bidiResult = await GoogleCalendarSyncService.syncBidirectional({
        accessToken: googleAccessToken,
        calendarId: syncData.connections[req.user!.id]?.calendar_id || 'primary',
        events,
        existingMappings,
      });

      pushStats = {
        totalEvents: bidiResult.pushed.totalEvents,
        created: bidiResult.pushed.created,
        updated: bidiResult.pushed.updated,
        deleted: bidiResult.pushed.deleted,
        skipped: bidiResult.pushed.skipped,
        errors: bidiResult.pushed.errors,
      };

      pulledStats = bidiResult.pulled;
      personalEvents = bidiResult.personalEvents;
      conflicts = bidiResult.conflicts;

      // Update mappings and personal events in storage
      syncData.event_mappings = bidiResult.eventMappings;
      if (!(syncData as any).personal_events) (syncData as any).personal_events = {};
      (syncData as any).personal_events[req.user!.id] = personalEvents;
      if (!(syncData as any).conflicts) (syncData as any).conflicts = {};
      (syncData as any).conflicts[req.user!.id] = conflicts;
    }

    const totalSynced = pushStats.created + pushStats.updated;
    const hasPushErrors = pushStats.errors.length > 0;

    // Guard against reporting false success when all events fail
    if (googleAccessToken && hasPushErrors && totalSynced === 0 && pulledStats.total === 0) {
      res.status(502).json({
        success: false,
        error: {
          code: 'GOOGLE_CALENDAR_SYNC_FAILED',
          message: `Failed to synchronize events with Google Calendar: ${pushStats.errors[0]?.error || 'Unknown error'}`,
        },
        details: {
          created: 0,
          updated: 0,
          errors: pushStats.errors,
        },
      });
      return;
    }

    // Update connection record
    syncData.connections[req.user!.id] = {
      connected: true,
      email: syncData.connections[req.user!.id]?.email || verifiedTokenEmail,
      calendar_id: syncData.connections[req.user!.id]?.calendar_id || 'primary',
      sync_status: hasPushErrors ? 'partial' : 'synced',
      last_synced_version: schedule.id,
      last_synced_at: now,
      events_synced: totalSynced,
      last_result: {
        created: pushStats.created,
        updated: pushStats.updated,
        deleted: pushStats.deleted,
        errors: pushStats.errors,
        pulled: pulledStats,
      },
      note: `Synchronized ${totalSynced} events (${pushStats.created} new, ${pushStats.updated} updated) and pulled ${pulledStats.personal} personal items.`,
    };

    await storage.saveCalendarSyncData(syncData);

    await storage.logAudit({
      user_id: req.user!.id,
      user_name: req.user!.name,
      role: req.user!.role,
      action: 'CALENDAR_SYNC',
      resource_type: 'calendar',
      resource_id: schedule.id,
      details: {
        events_synced: totalSynced,
        live_google_api: Boolean(googleAccessToken),
        user: req.user!.email,
        conflicts_count: conflicts.length,
      },
      status: hasPushErrors ? 'failure' : 'success',
    });

    res.json({
      success: true,
      message: `Synchronized ${totalSynced} timetable events with Google Calendar.`,
      events_synced: totalSynced,
      details: {
        created: pushStats.created,
        updated: pushStats.updated,
        deleted: pushStats.deleted,
        errors: pushStats.errors,
        pulled: pulledStats,
      },
      personal_events: personalEvents,
      conflicts,
      last_synced_at: now,
      schedule_version: schedule.id,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'CALENDAR_SYNC_ERROR', message: err.message } });
  }
});

// GET /api/calendar/events - Fetch combined calendar events (approved timetable + personal overlay)
router.get('/calendar/events', async (req: AuthenticatedRequest, res: Response) => {
  const schedule = await storage.getApprovedSchedule();
  if (!schedule) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'No approved schedule available.' } });
    return;
  }

  const groupFilter = req.query.group as string | undefined;
  const facultyFilter = req.query.faculty as string | undefined;

  let effectiveGroup = groupFilter;
  let effectiveFaculty = facultyFilter;

  if (req.user?.role === 'student') {
    effectiveGroup = req.user.studentGroupId;
  } else if (req.user?.role === 'faculty') {
    effectiveFaculty = req.user.facultyId;
  }

  try {
    const events = await CalendarService.generateCalendarEvents(schedule, {
      studentGroupId: effectiveGroup,
      facultyId: effectiveFaculty,
    });

    const syncData = await storage.getCalendarSyncData() as any;
    const personalEvents = req.user ? (syncData.personal_events?.[req.user.id] || []) : [];
    const conflicts = req.user ? (syncData.conflicts?.[req.user.id] || []) : [];

    res.json({
      success: true,
      count: events.length,
      schedule_version: schedule.id,
      events,
      personal_events: personalEvents,
      conflicts,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { code: 'EVENTS_ERROR', message: err.message } });
  }
});

export default router;


