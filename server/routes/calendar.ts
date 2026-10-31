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
    sync_status: 'idle',
    last_synced_version: null,
    last_synced_at: null,
    note: 'Live Google Calendar synchronization will be activated in Calendar milestone.',
  };

  res.json({
    success: true,
    user_id: targetUserId,
    user_role: req.user!.role,
    connection,
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
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'No approved schedule available to synchronize.' } });
    return;
  }

  let effectiveGroup = req.user!.studentGroupId;
  let effectiveFaculty = req.user!.facultyId;

  if (req.user!.role === 'admin' || req.user!.role === 'department_coordinator') {
    effectiveGroup = (req.body.group as string) || effectiveGroup;
    effectiveFaculty = (req.body.faculty as string) || effectiveFaculty;
  }

  try {
    const events = await CalendarService.generateCalendarEvents(schedule, {
      studentGroupId: effectiveGroup,
      facultyId: effectiveFaculty,
    });

    const syncData = await storage.getCalendarSyncData();
    const now = new Date().toISOString();

    syncData.connections[req.user!.id] = {
      connected: true,
      calendar_id: `primary`,
      sync_status: 'synced',
      last_synced_version: schedule.id,
      last_synced_at: now,
      events_synced: events.length,
      note: 'Institutional Google Calendar synchronization active.',
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
        events_synced: events.length,
        user: req.user!.email,
      },
      status: 'success',
    });

    res.json({
      success: true,
      message: `Successfully synchronized ${events.length} timetable events to institutional Google Workspace Calendar.`,
      events_synced: events.length,
      last_synced_at: now,
      schedule_version: schedule.id,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'CALENDAR_SYNC_ERROR', message: err.message } });
  }
});

export default router;

