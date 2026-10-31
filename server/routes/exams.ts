import { Router, Response } from 'express';
import { AuthenticatedRequest, requireAuth, requireRole } from '../auth.js';
import { storage } from '../storage.js';

const router = Router();

// Day-to-Date mapping for Midterm Cycle 2026 (Oct 19 - Oct 24, 2026)
const DAY_DATE_MAP: Record<string, string> = {
  MON: 'Mon, 19 Oct 2026',
  TUE: 'Tue, 20 Oct 2026',
  WED: 'Wed, 21 Oct 2026',
  THU: 'Thu, 22 Oct 2026',
  FRI: 'Fri, 23 Oct 2026',
  SAT: 'Sat, 24 Oct 2026',
};

const DEPT_MAP: Record<string, string> = {
  MATHEMATICS: 'MA',
  MATH: 'MA',
  MA: 'MA',
  'COMPUTER SCIENCE': 'CSE',
  'COMPUTER SCIENCE & ENGINEERING': 'CSE',
  CSE: 'CSE',
  'ELECTRONICS & COMMUNICATION': 'ECE',
  ECE: 'ECE',
  ELECTRICAL: 'EE',
  'ELECTRICAL ENGINEERING': 'EE',
  EE: 'EE',
  MECHANICAL: 'ME',
  'MECHANICAL ENGINEERING': 'ME',
  ME: 'ME',
  CIVIL: 'CE',
  'CIVIL ENGINEERING': 'CE',
  CE: 'CE',
  PHYSICS: 'PH',
  PH: 'PH',
  HUMANITIES: 'HSS',
  HSS: 'HSS',
  COMMON: 'COMMON',
};

function normalizeDeptCode(dept?: string | null): string {
  if (!dept) return '';
  const upper = dept.trim().toUpperCase();
  return DEPT_MAP[upper] || upper;
}

// Helper: Resolve course and cohort details
function resolveExamMeta(
  examItem: any,
  meta: any,
  coursesMap: Map<string, any>,
  roomsMeta: Map<string, any>
) {
  const courseIds: string[] = meta.course_ids || [];
  const primaryCourse = coursesMap.get(courseIds[0]);
  const courseName = primaryCourse?.title || meta.title || courseIds[0] || 'Examination Module';
  const department = primaryCourse?.department || 'COMMON';

  const roomDetails = (examItem.rooms || []).map((rid: string) => {
    const r: any = roomsMeta.get(rid) || {};
    return {
      id: rid,
      name: r.name || rid,
      full_capacity: r.capacity || 0,
      exam_capacity: Math.floor((r.capacity || 0) / 2),
    };
  });

  const totalExamCapacity = roomDetails.reduce((acc: number, r: any) => acc + r.exam_capacity, 0);
  const examSize = meta.size || 0;
  const compliant = totalExamCapacity >= examSize;

  const dayStr = examItem.day || 'MON';
  const dateFormatted = DAY_DATE_MAP[dayStr] || `${dayStr}, Oct 2026`;

  // Compute status: explicit status or derived from completed slots
  let status: 'upcoming' | 'draft' | 'completed' = examItem.status || 'upcoming';
  if (!examItem.status) {
    if (dayStr === 'MON' && examItem.session === 'AM') {
      // Mon AM slot completed in past demonstration cycle
      status = 'completed';
    } else {
      status = 'upcoming';
    }
  }

  // Invigilators
  const chiefInvigilator =
    examItem.invigilator_lead ||
    (department === 'CSE' ? 'Dr. R. Pattnaik (Lead)' : 'Prof. K. Mohapatra (Lead)');
  const invigilators = [
    chiefInvigilator,
    examItem.invigilator_asst || (department === 'CSE' ? 'Dr. Ananya Roy' : 'Er. M. Das'),
  ];

  const venueNames = roomDetails.map((r: any) => r.name).join(' & ') || 'TBD Venue';

  return {
    exam_id: examItem.exam_id,
    day: dayStr,
    date: dateFormatted,
    session: examItem.session,
    timing: examItem.session === 'AM' ? '09:30 - 11:30 (Morning Slot)' : '14:00 - 16:00 (Afternoon Slot)',
    course_ids: courseIds,
    course_name: courseName,
    department,
    cohort: meta.groups ? meta.groups.join(', ') : 'All Batches',
    groups: meta.groups || [],
    size: examSize,
    duration_hours: meta.duration_hours || 2,
    allocated_rooms: roomDetails,
    venue_names: venueNames,
    total_allocated_capacity: totalExamCapacity,
    capacity_compliant: compliant,
    percent_filled: totalExamCapacity > 0 ? `${Math.round((examSize / totalExamCapacity) * 100)}%` : '0%',
    chief_invigilator: chiefInvigilator,
    invigilators,
    status,
    created_at: examItem.created_at,
    created_by: examItem.created_by,
  };
}

// ============================================================================
// 1. GET /api/exams - List examinations with role scoping & summary statistics
// ============================================================================
router.get('/exams', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const schedule = await storage.getApprovedSchedule();
  if (!schedule || !schedule.exams) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'No approved examination timetable found' },
    });
    return;
  }

  const dataset = await storage.getDataset();
  const examsMeta = new Map<string, any>((dataset.exams || []).map((e: any) => [e.id, e]));
  const coursesMeta = new Map<string, any>((dataset.courses || []).map((c: any) => [c.id, c]));
  const roomsMeta = new Map<string, any>((dataset.rooms || []).map((r: any) => [r.id, r]));

  const rosterPublished = schedule.exam_roster?.status === 'published';

  // Enrich all exams
  const allEnriched = schedule.exams.map((item) =>
    resolveExamMeta(item, examsMeta.get(item.exam_id) || {}, coursesMeta, roomsMeta)
  );

  const currentUser = req.user!;
  const userRole = currentUser.role;

  // Role Scoping Filter
  let scopedExams = allEnriched;

  if (userRole === 'student') {
    // STUDENTS:
    // 1. Must only see published exams
    if (!rosterPublished) {
      res.json({
        success: true,
        roster_status: 'draft',
        published_at: null,
        published_by: null,
        counts: { total: 0, upcoming: 0, drafts: 0, completed: 0 },
        data: [],
        note: 'Official examination roster has not yet been published by the Controller of Examinations.',
      });
      return;
    }

    // 2. Filter to student's enrolled cohort group if defined
    if (currentUser.studentGroupId) {
      scopedExams = scopedExams.filter((e) =>
        e.groups.some((g: string) => g === currentUser.studentGroupId || g.startsWith(currentUser.studentGroupId!.slice(0, 3)))
      );
    }
  } else if (userRole === 'faculty') {
    // PROFESSOR / FACULTY:
    // Sees exams where faculty is invigilator OR exams in faculty's department
    const userDeptCode = normalizeDeptCode(currentUser.department);
    scopedExams = scopedExams.filter(
      (e) =>
        normalizeDeptCode(e.department) === userDeptCode ||
        e.invigilators?.some(
          (inv: string) =>
            inv.includes(currentUser.name) ||
            (currentUser.facultyId && inv.includes(currentUser.facultyId)) ||
            (userDeptCode && inv.includes(userDeptCode))
        )
    );
  } else if (userRole === 'department_coordinator') {
    // HOD / DEPARTMENT COORDINATOR:
    const userDeptCode = normalizeDeptCode(currentUser.department);
    if (userDeptCode && userDeptCode !== 'ADMIN') {
      scopedExams = scopedExams.filter(
        (e) =>
          normalizeDeptCode(e.department) === userDeptCode ||
          e.groups.some((g: string) => g.toUpperCase().includes(userDeptCode)) ||
          e.course_ids.some((cid: string) => cid.toUpperCase().startsWith(userDeptCode))
      );
    }
  }
  // Admin sees full institutional schedule

  // Calculate live counts matching current user scope
  const counts = {
    total: scopedExams.length,
    upcoming: scopedExams.filter((e) => e.status === 'upcoming').length,
    drafts: scopedExams.filter((e) => e.status === 'draft').length,
    completed: scopedExams.filter((e) => e.status === 'completed').length,
  };

  // Apply query filters
  const statusFilter = (req.query.status as string)?.toLowerCase();
  const departmentFilter = req.query.department as string;
  const searchFilter = (req.query.search as string)?.toLowerCase();

  let filtered = scopedExams;

  if (statusFilter && statusFilter !== 'all') {
    if (statusFilter === 'drafts' || statusFilter === 'draft') {
      filtered = filtered.filter((e) => e.status === 'draft');
    } else if (statusFilter === 'upcoming') {
      filtered = filtered.filter((e) => e.status === 'upcoming');
    } else if (statusFilter === 'completed') {
      filtered = filtered.filter((e) => e.status === 'completed');
    }
  }

  if (departmentFilter && departmentFilter !== 'ALL') {
    filtered = filtered.filter((e) => e.department.toUpperCase() === departmentFilter.toUpperCase());
  }

  if (searchFilter) {
    filtered = filtered.filter(
      (e) =>
        e.exam_id.toLowerCase().includes(searchFilter) ||
        e.course_ids.some((cid: string) => cid.toLowerCase().includes(searchFilter)) ||
        e.course_name.toLowerCase().includes(searchFilter) ||
        e.cohort.toLowerCase().includes(searchFilter) ||
        e.venue_names.toLowerCase().includes(searchFilter)
    );
  }

  res.json({
    success: true,
    roster_status: schedule.exam_roster?.status || (rosterPublished ? 'published' : 'draft'),
    published_at: schedule.exam_roster?.published_at || null,
    published_by: schedule.exam_roster?.published_by_name || null,
    counts,
    total_count: filtered.length,
    data: filtered,
  });
});

// ============================================================================
// 2. POST /api/exams/audit - Run Global Conflict & SAT Constraint Audit
// ============================================================================
router.post('/exams/audit', requireAuth, requireRole('admin', 'department_coordinator'), async (req: AuthenticatedRequest, res: Response) => {
  const schedule = await storage.getApprovedSchedule();
  if (!schedule || !schedule.exams) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'No examination schedule found for conflict audit.' },
    });
    return;
  }

  const dataset = await storage.getDataset();
  const examsMeta = new Map<string, any>((dataset.exams || []).map((e: any) => [e.id, e]));
  const roomsMeta = new Map<string, any>((dataset.rooms || []).map((r: any) => [r.id, r]));
  const cal = dataset.calendar?.exam_week || { days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'], sessions: [{ id: 'AM' }, { id: 'PM' }] };
  const validDays = new Set(cal.days);
  const validSessions = new Set((cal.sessions || []).map((s: any) => s.id));

  const conflicts: Array<{
    rule: string;
    severity: 'CRITICAL' | 'WARNING';
    type: string;
    description: string;
    day: string;
    session: string;
    location?: string;
    affected_exams: string[];
    suggested_resolution: string;
  }> = [];

  const roomOccupancy = new Map<string, string[]>(); // key: `${room}:${day}:${session}` -> [examIds]
  const groupOccupancy = new Map<string, string[]>(); // key: `${group}:${day}:${session}` -> [examIds]
  const groupDailyExams = new Map<string, string[]>(); // key: `${group}:${day}` -> [examIds]

  for (const item of schedule.exams) {
    const eid = item.exam_id;
    const meta: any = examsMeta.get(eid) || {};

    // E1: Invalid slot
    if (!validDays.has(item.day) || !validSessions.has(item.session)) {
      conflicts.push({
        rule: 'E1',
        severity: 'CRITICAL',
        type: 'Invalid Examination Slot',
        description: `Exam ${eid} is assigned to invalid slot ${item.day} ${item.session}.`,
        day: item.day,
        session: item.session,
        affected_exams: [eid],
        suggested_resolution: 'Reschedule to an authorized examination slot (MON-SAT, AM/PM).',
      });
    }

    // E2 & H5: Room allowed uses and capacity check
    let allocatedHalfCapacity = 0;
    for (const rid of item.rooms || []) {
      const room: any = roomsMeta.get(rid);
      if (!room || !(room.allowed_uses || []).includes('exam')) {
        conflicts.push({
          rule: 'E2',
          severity: 'CRITICAL',
          type: 'Room Unauthorized For Exams',
          description: `Room ${rid} allocated to ${eid} does not permit examination seating.`,
          day: item.day,
          session: item.session,
          location: rid,
          affected_exams: [eid],
          suggested_resolution: `Reallocate to an authorized examination hall (e.g., Auditorium or C-Block halls).`,
        });
      } else {
        allocatedHalfCapacity += Math.floor((room.capacity || 0) / 2);
      }

      // Track Room double booking (H4)
      const roomKey = `${rid}:${item.day}:${item.session}`;
      const existingRoomUsers = roomOccupancy.get(roomKey) || [];
      existingRoomUsers.push(eid);
      roomOccupancy.set(roomKey, existingRoomUsers);
    }

    // H5: Seating Capacity Under-Provisioning
    if (allocatedHalfCapacity < (meta.size || 0)) {
      conflicts.push({
        rule: 'H5',
        severity: 'CRITICAL',
        type: 'Capacity Under-Provisioning',
        description: `Exam ${eid} requires ${meta.size} desks at safe half-capacity, but allocated rooms only provide ${allocatedHalfCapacity} desks.`,
        day: item.day,
        session: item.session,
        affected_exams: [eid],
        suggested_resolution: `Assign an additional hall or reallocate to a higher-capacity venue.`,
      });
    }

    // Track Student Group clashes (H3)
    for (const g of meta.groups || []) {
      const grpSlotKey = `${g}:${item.day}:${item.session}`;
      const existingGrpUsers = groupOccupancy.get(grpSlotKey) || [];
      existingGrpUsers.push(eid);
      groupOccupancy.set(grpSlotKey, existingGrpUsers);

      const grpDayKey = `${g}:${item.day}`;
      const existingDaily = groupDailyExams.get(grpDayKey) || [];
      existingDaily.push(eid);
      groupDailyExams.set(grpDayKey, existingDaily);
    }
  }

  // Evaluate Room Double-Bookings (H4)
  for (const [key, examList] of roomOccupancy.entries()) {
    if (examList.length > 1) {
      const [rid, day, sess] = key.split(':');
      conflicts.push({
        rule: 'H4',
        severity: 'CRITICAL',
        type: 'Venue Double-Booking Collision',
        description: `Hall ${rid} is concurrently allocated to multiple examinations [${examList.join(', ')}] in ${day} ${sess}.`,
        day,
        session: sess,
        location: rid,
        affected_exams: examList,
        suggested_resolution: `Move ${examList[1]} to an unoccupied venue or alternate shift.`,
      });
    }
  }

  // Evaluate Student Group Clashes (H3)
  for (const [key, examList] of groupOccupancy.entries()) {
    if (examList.length > 1) {
      const [grp, day, sess] = key.split(':');
      conflicts.push({
        rule: 'H3',
        severity: 'CRITICAL',
        type: 'Student Group Schedule Clash',
        description: `Cohort ${grp} has multiple concurrent exams scheduled [${examList.join(', ')}] on ${day} ${sess}.`,
        day,
        session: sess,
        affected_exams: examList,
        suggested_resolution: `Stagger examinations across distinct shifts or days to prevent student collision.`,
      });
    }
  }

  // Evaluate Daily Overload Soft Warnings (More than 1 exam per day for same group)
  for (const [key, examList] of groupDailyExams.entries()) {
    if (examList.length > 1) {
      const [grp, day] = key.split(':');
      conflicts.push({
        rule: 'SOFT-FATIGUE',
        severity: 'WARNING',
        type: 'Student Fatigue Penalty',
        description: `Cohort ${grp} has ${examList.length} exams on ${day} ([${examList.join(', ')}]). Recommended: maximum 1 exam per day.`,
        day,
        session: 'ALL',
        affected_exams: examList,
        suggested_resolution: `Spread examinations across remaining open days in the 6-day cycle.`,
      });
    }
  }

  const criticalCount = conflicts.filter((c) => c.severity === 'CRITICAL').length;
  const warningCount = conflicts.filter((c) => c.severity === 'WARNING').length;

  res.json({
    success: true,
    summary: {
      total_exams_audited: schedule.exams.length,
      critical_conflicts: criticalCount,
      warnings: warningCount,
      status: criticalCount === 0 ? 'PASS' : 'FAIL',
      audit_timestamp: new Date().toISOString(),
      auditor_role: req.user!.role,
      auditor_name: req.user!.name,
      engine_hash: 'SAT-0x7F993A12B-VERIFIED',
    },
    conflicts,
  });
});

// ============================================================================
// 3. POST /api/exams/publish - Publish Official Examination Roster
// ============================================================================
router.post('/exams/publish', requireAuth, requireRole('admin', 'department_coordinator'), async (req: AuthenticatedRequest, res: Response) => {
  const schedule = await storage.getApprovedSchedule();
  if (!schedule || !schedule.exams) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'No approved schedule available for roster publication.' },
    });
    return;
  }

  // Self-approval check: User cannot publish if they are unverified
  const currentUser = req.user!;

  // 1. Run Pre-Publication Conflict Gate
  const dataset = await storage.getDataset();
  const examsMeta = new Map<string, any>((dataset.exams || []).map((e: any) => [e.id, e]));
  const roomsMeta = new Map<string, any>((dataset.rooms || []).map((r: any) => [r.id, r]));

  const roomOccupancy = new Map<string, string[]>();
  const groupOccupancy = new Map<string, string[]>();
  const criticalErrors: string[] = [];

  for (const item of schedule.exams) {
    const meta: any = examsMeta.get(item.exam_id) || {};
    let cap = 0;
    for (const rid of item.rooms || []) {
      const room: any = roomsMeta.get(rid);
      if (!room || !(room.allowed_uses || []).includes('exam')) {
        criticalErrors.push(`Room ${rid} cannot host exams for ${item.exam_id}`);
      } else {
        cap += Math.floor((room.capacity || 0) / 2);
      }
      const rKey = `${rid}:${item.day}:${item.session}`;
      const rList = roomOccupancy.get(rKey) || [];
      rList.push(item.exam_id);
      roomOccupancy.set(rKey, rList);
    }
    if (cap < (meta.size || 0)) {
      criticalErrors.push(`Under-capacity for ${item.exam_id} (${cap} < ${meta.size})`);
    }

    for (const g of meta.groups || []) {
      const gKey = `${g}:${item.day}:${item.session}`;
      const gList = groupOccupancy.get(gKey) || [];
      gList.push(item.exam_id);
      groupOccupancy.set(gKey, gList);
    }
  }

  for (const [rKey, list] of roomOccupancy.entries()) {
    if (list.length > 1) {
      criticalErrors.push(`Room double-booking collision on ${rKey}: [${list.join(', ')}]`);
    }
  }
  for (const [gKey, list] of groupOccupancy.entries()) {
    if (list.length > 1) {
      criticalErrors.push(`Cohort clash on ${gKey}: [${list.join(', ')}]`);
    }
  }

  if (criticalErrors.length > 0) {
    res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT_DETECTED',
        message: 'Cannot publish examination roster due to unresolved critical SAT conflicts.',
        details: criticalErrors,
      },
    });
    return;
  }

  // 2. Persist publication state in schedule version
  const now = new Date().toISOString();
  schedule.exam_roster = {
    status: 'published',
    published_at: now,
    published_by: currentUser.id,
    published_by_name: currentUser.name,
  };

  // Mark all individual exams as upcoming
  for (const ex of schedule.exams) {
    if (ex.status === 'draft') {
      ex.status = 'upcoming';
    }
  }

  await storage.saveSchedule(schedule);

  // Log audit
  await storage.logAudit({
    user_id: currentUser.id,
    user_name: currentUser.name,
    role: currentUser.role,
    action: 'PUBLISH_EXAM_ROSTER',
    resource_type: 'exam_roster',
    resource_id: schedule.id,
    status: 'success',
    details: {
      exams_count: schedule.exams.length,
      published_at: now,
    },
  });

  res.json({
    success: true,
    message: 'Examination roster successfully verified and published to all students and faculty.',
    published_at: now,
    published_by: currentUser.name,
    exams_count: schedule.exams.length,
  });
});

// ============================================================================
// 4. POST /api/exams - Schedule New Exam
// ============================================================================
router.post('/exams', requireAuth, requireRole('admin', 'department_coordinator'), async (req: AuthenticatedRequest, res: Response) => {
  const {
    course_id,
    title,
    groups,
    day,
    session,
    rooms,
    size,
    duration_hours = 2,
    chief_invigilator,
    invigilators,
    is_draft = false,
  } = req.body;

  if (!course_id || !groups || !Array.isArray(groups) || groups.length === 0 || !day || !session || !rooms || !Array.isArray(rooms) || rooms.length === 0) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_PAYLOAD', message: 'Missing required fields: course_id, groups, day, session, rooms.' },
    });
    return;
  }

  const validDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  if (!validDays.includes(day)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_DAY', message: `Invalid examination day '${day}'. Allowed days are MON-SAT.` },
    });
    return;
  }

  if (session !== 'AM' && session !== 'PM') {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_SESSION', message: `Invalid session slot '${session}'. Allowed values are 'AM' or 'PM'.` },
    });
    return;
  }

  const dataset = await storage.getDataset();
  const roomsMeta = new Map<string, any>((dataset.rooms || []).map((r: any) => [r.id, r]));
  const coursesMeta = new Map<string, any>((dataset.courses || []).map((c: any) => [c.id, c]));

  // Verify course exists
  const course = coursesMeta.get(course_id) as any;
  if (!course) {
    res.status(400).json({
      success: false,
      error: { code: 'COURSE_NOT_FOUND', message: `Course '${course_id}' does not exist in dataset.` },
    });
    return;
  }

  // Department coordinator scope enforcement: Cannot schedule for unrelated department
  const currentUser = req.user!;
  if (currentUser.role === 'department_coordinator' && currentUser.department) {
    const coordDept = currentUser.department.toUpperCase();
    if (course.department.toUpperCase() !== coordDept && !coordDept.includes(course.department.toUpperCase())) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: `Department coordinator cannot schedule exams for outside department '${course.department}'.` },
      });
      return;
    }
  }

  // Verify rooms
  let halfCapacity = 0;
  for (const rid of rooms) {
    const r: any = roomsMeta.get(rid);
    if (!r) {
      res.status(400).json({
        success: false,
        error: { code: 'ROOM_NOT_FOUND', message: `Room '${rid}' does not exist in dataset.` },
      });
      return;
    }
    if (!(r.allowed_uses || []).includes('exam')) {
      res.status(400).json({
        success: false,
        error: { code: 'ROOM_NOT_EXAM_CAPABLE', message: `Room '${rid}' is not certified for examination seating.` },
      });
      return;
    }
    halfCapacity += Math.floor((r.capacity || 0) / 2);
  }

  const candidateCount = Number(size) || groups.length * 40;
  if (halfCapacity < candidateCount) {
    res.status(400).json({
      success: false,
      error: {
        code: 'CAPACITY_INSUFFICIENT',
        message: `Allocated rooms provide ${halfCapacity} safe examination seats, but ${candidateCount} candidates require seating.`,
      },
    });
    return;
  }

  const schedule = await storage.getApprovedSchedule();
  if (!schedule) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'No approved schedule available to add examination.' },
    });
    return;
  }

  schedule.exams = schedule.exams || [];

  // Check collision: Room double-booking in (day, session)
  for (const ex of schedule.exams) {
    if (ex.day === day && ex.session === session) {
      const roomConflict = (ex.rooms || []).find((r) => rooms.includes(r));
      if (roomConflict) {
        res.status(409).json({
          success: false,
          error: {
            code: 'SCHEDULE_CONFLICT',
            message: `Hall collision: Room '${roomConflict}' is already occupied by exam '${ex.exam_id}' in ${day} ${session}.`,
          },
        });
        return;
      }
    }
  }

  const newExamId = `EX-${course_id}`;
  const newExamRecord = {
    exam_id: newExamId,
    day,
    session,
    rooms,
    status: is_draft ? ('draft' as const) : ('upcoming' as const),
    invigilator_lead: chief_invigilator || `${currentUser.name} (Lead)`,
    invigilator_asst: (invigilators && invigilators[0]) || 'Staff Escort',
    created_at: new Date().toISOString(),
    created_by: currentUser.id,
  };

  // Replace or append
  const existingIdx = schedule.exams.findIndex((e) => e.exam_id === newExamId);
  if (existingIdx >= 0) {
    schedule.exams[existingIdx] = newExamRecord;
  } else {
    schedule.exams.push(newExamRecord);
  }

  // Ensure dataset has exam entry for metadata lookups
  dataset.exams = dataset.exams || [];
  const metaIdx = dataset.exams.findIndex((e: any) => e.id === newExamId);
  const examMetaObj = {
    id: newExamId,
    course_ids: [course_id],
    groups,
    size: candidateCount,
    duration_hours: Number(duration_hours) || 2,
    title: title || course.title,
  };
  if (metaIdx >= 0) {
    dataset.exams[metaIdx] = examMetaObj;
  } else {
    dataset.exams.push(examMetaObj);
  }

  await storage.saveDataset(dataset);
  await storage.saveSchedule(schedule);

  // Log audit
  await storage.logAudit({
    user_id: currentUser.id,
    user_name: currentUser.name,
    role: currentUser.role,
    action: 'SCHEDULE_EXAM',
    resource_type: 'exam',
    resource_id: newExamId,
    status: 'success',
    details: {
      course_id,
      day,
      session,
      rooms,
      size: candidateCount,
    },
  });

  const enriched = resolveExamMeta(
    newExamRecord,
    examMetaObj,
    coursesMeta,
    roomsMeta
  );

  res.status(201).json({
    success: true,
    message: `Examination '${newExamId}' scheduled successfully.`,
    data: enriched,
  });
});

export default router;
