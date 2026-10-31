import { Router, Response } from 'express';
import { AuthenticatedRequest, requireRole } from '../auth.js';
import { PythonBridge } from '../pythonBridge.js';
import { ScheduleVersion, storage } from '../storage.js';
import { DATASET_PATH } from '../config.js';

const router = Router();

router.get('/timetable', async (req: AuthenticatedRequest, res: Response) => {
  const versionId = req.query.version as string;
  const statusFilter = req.query.status as string;

  let schedule: ScheduleVersion | null = null;
  if (versionId) {
    schedule = await storage.getScheduleById(versionId);
  } else if (statusFilter === 'proposed') {
    const all = await storage.getAllSchedules();
    schedule = Object.values(all).find((s) => s.status === 'proposed') || null;
  } else {
    schedule = await storage.getApprovedSchedule();
  }

  if (!schedule) {
    res.status(404).json({
      success: false,
      error: { code: 'TIMETABLE_NOT_FOUND', message: 'No matching schedule version found' },
    });
    return;
  }

  const dataset = await storage.getDataset();
  const sessionsMeta = new Map((dataset.sessions || []).map((s: any) => [s.id, s]));
  const facultyMeta = new Map((dataset.faculty || []).map((f: any) => [f.id, f]));
  const roomsMeta = new Map((dataset.rooms || []).map((r: any) => [r.id, r]));

  // Apply filters
  const groupFilter = req.query.group as string;
  const facultyFilter = req.query.faculty as string;
  const roomFilter = req.query.room as string;
  const dayFilter = req.query.day as string;

  let filteredSessions = schedule.sessions.map((item) => {
    const meta: any = sessionsMeta.get(item.session_id) || {};
    const fac: any = facultyMeta.get(meta.faculty_id) || {};
    const rm: any = roomsMeta.get(item.room_id) || {};

    return {
      session_id: item.session_id,
      day: item.day,
      start_period: item.start_period,
      duration: meta.duration || 1,
      end_period: item.start_period + (meta.duration || 1) - 1,
      room_id: item.room_id,
      room_name: rm.name || item.room_id,
      room_type: rm.type,
      course_id: meta.course_id,
      kind: meta.kind,
      groups: meta.groups || [],
      faculty_id: meta.faculty_id,
      faculty_name: fac.name || meta.faculty_id,
      size: meta.size,
      basket_slot: meta.basket_slot || null,
      needs_accessible: meta.needs_accessible || false,
    };
  });

  // Also include approved venue booking events when requested
  if (req.query.include_bookings === 'true') {
    const allBookings = await storage.getAllBookings();
    const approvedBookings = Object.values(allBookings).filter(
      (b) => b.status === 'approved' && b.allocated_room && b.allocated_day && b.allocated_start_period
    );
    for (const b of approvedBookings) {
      const rm: any = roomsMeta.get(b.allocated_room!) || {};
      const dur = (b.allocated_end_period || b.allocated_start_period!) - b.allocated_start_period! + 1;
      filteredSessions.push({
        session_id: `booking-${b.id}`,
        day: b.allocated_day!,
        start_period: b.allocated_start_period!,
        duration: dur,
        end_period: b.allocated_end_period || b.allocated_start_period!,
        room_id: b.allocated_room!,
        room_name: rm.name || b.allocated_room!,
        room_type: rm.type || 'seminar_hall',
        course_id: b.title,
        kind: b.effective_category || 'booking',
        groups: b.mandatory_for_groups || [],
        faculty_id: b.requester,
        faculty_name: b.requester,
        size: b.attendance,
        basket_slot: null,
        needs_accessible: false,
      });
    }
  }

  if (groupFilter) {
    filteredSessions = filteredSessions.filter((s) => s.groups.includes(groupFilter));
  }
  if (facultyFilter) {
    filteredSessions = filteredSessions.filter((s) => s.faculty_id === facultyFilter);
  }
  if (roomFilter) {
    filteredSessions = filteredSessions.filter((s) => s.room_id === roomFilter);
  }
  if (dayFilter) {
    filteredSessions = filteredSessions.filter((s) => s.day === dayFilter);
  }

  res.json({
    success: true,
    version_id: schedule.id,
    name: schedule.name,
    status: schedule.status,
    created_at: schedule.created_at,
    approved_at: schedule.approved_at,
    approved_by: schedule.approved_by,
    total_sessions_count: schedule.sessions.length,
    filtered_sessions_count: filteredSessions.length,
    soft_penalties: schedule.validator_report?.soft_penalties || {},
    soft_total: schedule.validator_report?.soft_total ?? null,
    data: filteredSessions,
  });
});

router.get('/timetable/versions', async (req: AuthenticatedRequest, res: Response) => {
  const all = await storage.getAllSchedules();
  const versionsList = Object.values(all).map((s) => ({
    id: s.id,
    name: s.name,
    status: s.status,
    created_at: s.created_at,
    created_by: s.created_by,
    approved_at: s.approved_at,
    approved_by: s.approved_by,
    session_count: s.sessions.length,
    hard_violations: s.validator_report?.hard_violation_count ?? 0,
    soft_total: s.validator_report?.soft_total ?? null,
  }));

  res.json({ success: true, count: versionsList.length, data: versionsList });
});

router.get('/timetable/session/:id', async (req: AuthenticatedRequest, res: Response) => {
  const sid = req.params.id;
  const schedule = await storage.getApprovedSchedule();
  if (!schedule) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'No approved schedule available' } });
    return;
  }

  const sessionSlot = schedule.sessions.find((s) => s.session_id === sid);
  if (!sessionSlot) {
    res.status(404).json({ success: false, error: { code: 'SESSION_NOT_FOUND', message: `Session ${sid} not found in timetable` } });
    return;
  }

  const dataset = await storage.getDataset();
  const meta = (dataset.sessions || []).find((s: any) => s.id === sid);
  const room = (dataset.rooms || []).find((r: any) => r.id === sessionSlot.room_id);
  const faculty = (dataset.faculty || []).find((f: any) => f.id === meta?.faculty_id);

  res.json({
    success: true,
    data: {
      ...sessionSlot,
      metadata: meta,
      room_details: room,
      faculty_details: faculty,
    },
  });
});

router.post('/timetable/generate', requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { seed = 42, autoApprove = false, name } = req.body;

    // Run deterministic Python solver
    const solveResult = await PythonBridge.runSolver(DATASET_PATH, {
      teamName: 'CIT Arch Team',
      seed: Number(seed),
    });

    const report = solveResult.baselineReport;
    const hasHardViolations = report.hard_violation_count > 0;

    const versionId = `v_${Date.now()}`;
    const newVersion: ScheduleVersion = {
      id: versionId,
      name: name || `Generated Timetable (${new Date().toLocaleDateString()})`,
      status: hasHardViolations ? 'rejected' : autoApprove ? 'approved' : 'proposed',
      created_at: new Date().toISOString(),
      created_by: req.user!.id,
      approved_at: autoApprove && !hasHardViolations ? new Date().toISOString() : undefined,
      approved_by: autoApprove && !hasHardViolations ? req.user!.id : undefined,
      dataset_id: solveResult.baselineSchedule.dataset_id,
      team: solveResult.baselineSchedule.team,
      sessions: solveResult.baselineSchedule.sessions,
      fest_week: solveResult.baselineSchedule.fest_week,
      exams: solveResult.baselineSchedule.exams,
      validator_report: report,
    };

    if (hasHardViolations) {
      await storage.logAudit({
        user_id: req.user!.id,
        user_name: req.user!.name,
        role: req.user!.role,
        action: 'TIMETABLE_GENERATE_FAILED',
        resource_type: 'timetable',
        details: { violations: report.hard_violations },
        status: 'failure',
      });

      res.status(422).json({
        success: false,
        error: {
          code: 'SCHEDULE_VALIDATION_FAILED',
          message: `Generated schedule contains ${report.hard_violation_count} hard violations. Cannot be approved.`,
          violations: report.hard_violations,
        },
      });
      return;
    }

    // Save version
    await storage.saveSchedule(newVersion);

    if (autoApprove) {
      await storage.promoteSchedule(newVersion.id, req.user!.id);
    }

    await storage.logAudit({
      user_id: req.user!.id,
      user_name: req.user!.name,
      role: req.user!.role,
      action: autoApprove ? 'TIMETABLE_GENERATE_AND_APPROVE' : 'TIMETABLE_GENERATE_PROPOSED',
      resource_type: 'timetable',
      resource_id: versionId,
      details: {
        session_count: newVersion.sessions.length,
        execution_time_ms: solveResult.executionTimeMs,
        soft_total: report.soft_total,
      },
      status: 'success',
    });

    res.status(201).json({
      success: true,
      message: autoApprove
        ? 'Schedule generated, verified by official validator with 0 violations, and approved'
        : 'Schedule generated and verified by official validator. Pending approval.',
      version_id: versionId,
      status: newVersion.status,
      session_count: newVersion.sessions.length,
      execution_time_ms: solveResult.executionTimeMs,
      validation: {
        hard_violations: report.hard_violation_count,
        soft_total: report.soft_total,
        soft_penalties: report.soft_penalties,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'GENERATION_ERROR', message: err.message },
    });
  }
});

// Schedule publishing handler: Admin-only governance operation to publish the master timetable
const handlePublishSchedule = async (req: AuthenticatedRequest, res: Response) => {
  const versionId = req.params.id;
  const schedule = await storage.getScheduleById(versionId);

  if (!schedule) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Version ${versionId} not found` } });
    return;
  }

  // Check validator hard violations
  if (schedule.validator_report?.hard_violation_count > 0) {
    res.status(400).json({
      success: false,
      error: {
        code: 'CANNOT_APPROVE_VIOLATIONS',
        message: 'Cannot publish schedule version with hard violations.',
      },
    });
    return;
  }

  // Atomically promote schedule version to approved/published
  const promoted = await storage.promoteSchedule(versionId, req.user!.id);

  await storage.logAudit({
    user_id: req.user!.id,
    user_name: req.user!.name,
    role: req.user!.role,
    action: 'PUBLISH_TIMETABLE_VERSION',
    resource_type: 'timetable',
    resource_id: versionId,
    details: { published_by: req.user!.id, previous_status: schedule.status, new_status: 'approved' },
    status: 'success',
  });

  res.json({
    success: true,
    message: `Schedule version ${versionId} is now published and active as the master timetable`,
    data: {
      id: promoted.id,
      status: promoted.status,
      approved_at: promoted.approved_at,
      published_at: promoted.approved_at,
      approved_by: promoted.approved_by,
      published_by: promoted.approved_by,
    },
  });
};

// POST /api/timetable/:id/publish - Administrative publication of master timetable (Admin only)
router.post('/timetable/:id/publish', requireRole('admin'), handlePublishSchedule);

// POST /api/timetable/:id/approve - Approval/promotion alias for backward compatibility (Admin only)
router.post('/timetable/:id/approve', requireRole('admin'), handlePublishSchedule);

// POST /api/timetable/sessions - Create an academic timetable session
router.post(
  '/timetable/sessions',
  requireRole('admin', 'department_coordinator'),
  async (req: AuthenticatedRequest, res: Response) => {
    const {
      course_id,
      kind = 'theory',
      day,
      start_period,
      duration = 1,
      room_id,
      faculty_id,
      groups = [],
      force = false,
    } = req.body;

    if (!course_id || !day || !start_period || !room_id || !faculty_id) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Missing required session fields: course_id, day, start_period, room_id, faculty_id',
        },
      });
      return;
    }

    const schedule = await storage.getApprovedSchedule();
    if (!schedule) {
      res.status(404).json({
        success: false,
        error: { code: 'NO_APPROVED_SCHEDULE', message: 'No approved schedule available to add sessions to.' },
      });
      return;
    }

    const dataset = await storage.getDataset();
    const sessionsMeta = new Map((dataset.sessions || []).map((s: any) => [s.id, s]));

    const numStart = Number(start_period);
    const numDur = Number(duration) || 1;
    const numEnd = numStart + numDur - 1;

    // Detect conflicts against existing sessions in schedule
    const conflicts: string[] = [];
    for (const item of schedule.sessions) {
      if (item.day !== day) continue;

      const meta: any = sessionsMeta.get(item.session_id) || {};
      const itemStart = item.start_period;
      const itemEnd = itemStart + (meta.duration || 1) - 1;

      const overlaps = Math.max(numStart, itemStart) <= Math.min(numEnd, itemEnd);
      if (!overlaps) continue;

      if (item.room_id === room_id) {
        conflicts.push(`Room collision: Room '${room_id}' is already occupied by session '${item.session_id}' (${meta.course_id || 'Class'}) on ${day} period ${itemStart}-${itemEnd}.`);
      }

      if (meta.faculty_id && meta.faculty_id === faculty_id) {
        conflicts.push(`Faculty collision: Faculty '${faculty_id}' is already teaching session '${item.session_id}' (${meta.course_id || 'Class'}) on ${day} period ${itemStart}-${itemEnd}.`);
      }

      const overlappingGroups = (groups || []).filter((g: string) => (meta.groups || []).includes(g));
      if (overlappingGroups.length > 0) {
        conflicts.push(`Cohort collision: Group(s) ${overlappingGroups.join(', ')} already have class '${item.session_id}' on ${day} period ${itemStart}-${itemEnd}.`);
      }
    }

    if (conflicts.length > 0 && !force) {
      res.status(409).json({
        success: false,
        error: {
          code: 'SCHEDULE_CONFLICT',
          message: `Cannot schedule session due to ${conflicts.length} clash(es).`,
          conflicts,
        },
      });
      return;
    }

    const newSessionId = req.body.session_id || `${course_id}_${day}_P${numStart}_${Date.now().toString(36).slice(-4)}`;

    schedule.sessions.push({
      session_id: newSessionId,
      day,
      start_period: numStart,
      room_id,
    });

    if (!dataset.sessions) dataset.sessions = [];
    dataset.sessions.push({
      id: newSessionId,
      course_id,
      kind,
      duration: numDur,
      faculty_id,
      groups: Array.isArray(groups) ? groups : [groups],
    });

    await storage.saveSchedule(schedule);
    await storage.saveDataset(dataset);

    await storage.logAudit({
      user_id: req.user!.id,
      user_name: req.user!.name,
      role: req.user!.role,
      action: 'CREATE_TIMETABLE_SESSION',
      resource_type: 'timetable',
      resource_id: newSessionId,
      details: { day, start_period: numStart, duration: numDur, room_id, faculty_id, course_id },
      status: 'success',
    });

    res.status(201).json({
      success: true,
      message: `Session '${newSessionId}' created successfully in master timetable.`,
      session: {
        session_id: newSessionId,
        course_id,
        kind,
        day,
        start_period: numStart,
        duration: numDur,
        room_id,
        faculty_id,
        groups,
      },
    });
  }
);

// PUT /api/timetable/sessions/:id - Update an academic timetable session
router.put(
  '/timetable/sessions/:id',
  requireRole('admin', 'department_coordinator'),
  async (req: AuthenticatedRequest, res: Response) => {
    const sid = req.params.id;
    const { day, start_period, duration, room_id, faculty_id, groups, force = false } = req.body;

    const schedule = await storage.getApprovedSchedule();
    if (!schedule) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'No approved schedule available' } });
      return;
    }

    const sessionIndex = schedule.sessions.findIndex((s) => s.session_id === sid);
    if (sessionIndex === -1) {
      res.status(404).json({ success: false, error: { code: 'SESSION_NOT_FOUND', message: `Session '${sid}' not found in timetable` } });
      return;
    }

    const dataset = await storage.getDataset();
    const metaIndex = (dataset.sessions || []).findIndex((s: any) => s.id === sid);
    const existingMeta = metaIndex >= 0 ? dataset.sessions[metaIndex] : {};

    const targetDay = day || schedule.sessions[sessionIndex].day;
    const targetStart = start_period !== undefined ? Number(start_period) : schedule.sessions[sessionIndex].start_period;
    const targetDuration = duration !== undefined ? Number(duration) : (existingMeta.duration || 1);
    const targetRoom = room_id || schedule.sessions[sessionIndex].room_id;
    const targetFaculty = faculty_id || existingMeta.faculty_id;
    const targetGroups = groups || existingMeta.groups || [];

    const numEnd = targetStart + targetDuration - 1;

    // Conflict check against other sessions
    const conflicts: string[] = [];
    const sessionsMeta = new Map((dataset.sessions || []).map((s: any) => [s.id, s]));

    for (const item of schedule.sessions) {
      if (item.session_id === sid) continue;
      if (item.day !== targetDay) continue;

      const meta: any = sessionsMeta.get(item.session_id) || {};
      const itemStart = item.start_period;
      const itemEnd = itemStart + (meta.duration || 1) - 1;

      const overlaps = Math.max(targetStart, itemStart) <= Math.min(numEnd, itemEnd);
      if (!overlaps) continue;

      if (item.room_id === targetRoom) {
        conflicts.push(`Room collision with session '${item.session_id}' in room '${targetRoom}'.`);
      }
      if (meta.faculty_id && meta.faculty_id === targetFaculty) {
        conflicts.push(`Faculty collision with session '${item.session_id}' for faculty '${targetFaculty}'.`);
      }
      const overlappingGroups = (targetGroups || []).filter((g: string) => (meta.groups || []).includes(g));
      if (overlappingGroups.length > 0) {
        conflicts.push(`Cohort collision with session '${item.session_id}' for group(s) ${overlappingGroups.join(', ')}.`);
      }
    }

    if (conflicts.length > 0 && !force) {
      res.status(409).json({
        success: false,
        error: {
          code: 'SCHEDULE_CONFLICT',
          message: `Cannot update session due to ${conflicts.length} clash(es).`,
          conflicts,
        },
      });
      return;
    }

    schedule.sessions[sessionIndex].day = targetDay;
    schedule.sessions[sessionIndex].start_period = targetStart;
    schedule.sessions[sessionIndex].room_id = targetRoom;

    if (metaIndex >= 0) {
      dataset.sessions[metaIndex].duration = targetDuration;
      if (faculty_id) dataset.sessions[metaIndex].faculty_id = targetFaculty;
      if (groups) dataset.sessions[metaIndex].groups = targetGroups;
    }

    await storage.saveSchedule(schedule);
    await storage.saveDataset(dataset);

    // If Google token is present and event is mapped, patch remote Google Calendar event
    const googleAccessToken =
      (req.headers['x-google-token'] as string) ||
      (req.headers['x-google-access-token'] as string);

    if (googleAccessToken) {
      const syncData = await storage.getCalendarSyncData();
      const googleEventId = syncData.event_mappings?.[sid];
      if (googleEventId) {
        try {
          const { GoogleCalendarSyncService } = await import('../googleCalendarSync.js');
          const dayOffsets: Record<string, string> = {
            MON: '2027-02-01',
            TUE: '2027-02-02',
            WED: '2027-02-03',
            THU: '2027-02-04',
            FRI: '2027-02-05',
            SAT: '2027-02-06',
          };
          const periodTimes: Record<number, { start: string; end: string }> = {
            1: { start: '08:00:00', end: '09:00:00' },
            2: { start: '09:00:00', end: '10:00:00' },
            3: { start: '10:00:00', end: '11:00:00' },
            4: { start: '11:00:00', end: '12:00:00' },
            5: { start: '12:00:00', end: '13:00:00' },
            6: { start: '14:00:00', end: '15:00:00' },
            7: { start: '15:00:00', end: '16:00:00' },
            8: { start: '16:00:00', end: '17:00:00' },
            9: { start: '17:00:00', end: '18:00:00' },
            10: { start: '18:00:00', end: '19:00:00' },
            11: { start: '19:00:00', end: '20:00:00' },
            12: { start: '20:00:00', end: '21:00:00' },
          };
          const dateStr = dayOffsets[targetDay] || '2027-02-01';
          const startTimeStr = periodTimes[targetStart]?.start || '09:00:00';
          const endTimeStr = periodTimes[numEnd]?.end || '10:00:00';

          await GoogleCalendarSyncService.patchEvent({
            accessToken: googleAccessToken,
            googleEventId,
            patch: {
              location: targetRoom,
              start: { dateTime: `${dateStr}T${startTimeStr}+05:30`, timeZone: 'Asia/Kolkata' },
              end: { dateTime: `${dateStr}T${endTimeStr}+05:30`, timeZone: 'Asia/Kolkata' },
            },
          });
        } catch (_) {}
      }
    }

    await storage.logAudit({
      user_id: req.user!.id,
      user_name: req.user!.name,
      role: req.user!.role,
      action: 'UPDATE_TIMETABLE_SESSION',
      resource_type: 'timetable',
      resource_id: sid,
      details: { day: targetDay, start_period: targetStart, room_id: targetRoom, faculty_id: targetFaculty },
      status: 'success',
    });

    res.json({
      success: true,
      message: `Session '${sid}' updated successfully.`,
      session: {
        session_id: sid,
        day: targetDay,
        start_period: targetStart,
        duration: targetDuration,
        room_id: targetRoom,
        faculty_id: targetFaculty,
        groups: targetGroups,
      },
    });
  }
);

// DELETE /api/timetable/sessions/:id - Delete an academic timetable session
router.delete(
  '/timetable/sessions/:id',
  requireRole('admin', 'department_coordinator'),
  async (req: AuthenticatedRequest, res: Response) => {
    const sid = req.params.id;
    const schedule = await storage.getApprovedSchedule();
    if (!schedule) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'No approved schedule available' } });
      return;
    }

    const sessionIndex = schedule.sessions.findIndex((s) => s.session_id === sid);
    if (sessionIndex === -1) {
      res.status(404).json({ success: false, error: { code: 'SESSION_NOT_FOUND', message: `Session '${sid}' not found in timetable` } });
      return;
    }

    schedule.sessions.splice(sessionIndex, 1);
    await storage.saveSchedule(schedule);

    // If Google token is present and event is mapped, delete remote Google Calendar event
    const googleAccessToken =
      (req.headers['x-google-token'] as string) ||
      (req.headers['x-google-access-token'] as string);

    if (googleAccessToken) {
      const syncData = await storage.getCalendarSyncData();
      const googleEventId = syncData.event_mappings?.[sid];
      if (googleEventId) {
        try {
          const { GoogleCalendarSyncService } = await import('../googleCalendarSync.js');
          await GoogleCalendarSyncService.deleteEvent({
            accessToken: googleAccessToken,
            googleEventId,
          });
          delete syncData.event_mappings[sid];
          await storage.saveCalendarSyncData(syncData);
        } catch (_) {}
      }
    }

    await storage.logAudit({
      user_id: req.user!.id,
      user_name: req.user!.name,
      role: req.user!.role,
      action: 'DELETE_TIMETABLE_SESSION',
      resource_type: 'timetable',
      resource_id: sid,
      status: 'success',
    });

    res.json({
      success: true,
      message: `Session '${sid}' deleted from timetable.`,
      deleted_session_id: sid,
    });
  }
);

export default router;
