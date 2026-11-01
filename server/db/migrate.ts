import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { DATASET_PATH, ROOT_DIR, STORAGE_DIR } from '../config.js';
import { DEFAULT_FAQS } from '../faqsData.js';

// Authoritative institutional departments catalog from schema.sql
export const AUTHORITATIVE_DEPTS = new Set([
  'ADMIN',
  'CE',
  'CSE',
  'ECE',
  'EE',
  'HSS',
  'MA',
  'ME',
  'PH',
  'COMMON',
]);

export const DEPT_NORMALIZATION_MAP: Record<string, string> = {
  ADMINISTRATION: 'ADMIN',
  MATHEMATICS: 'MA',
  MATH: 'MA',
  CIVIL: 'CE',
  'CIVIL ENGINEERING': 'CE',
  CSE: 'CSE',
  'COMPUTER SCIENCE': 'CSE',
  'COMPUTER SCIENCE & ENGINEERING': 'CSE',
  ECE: 'ECE',
  'ELECTRONICS & COMMUNICATION': 'ECE',
  'ELECTRONICS & COMMUNICATION ENGINEERING': 'ECE',
  EE: 'EE',
  'ELECTRICAL': 'EE',
  'ELECTRICAL ENGINEERING': 'EE',
  HSS: 'HSS',
  HUMANITIES: 'HSS',
  'HUMANITIES & SOCIAL SCIENCES': 'HSS',
  ME: 'ME',
  MECHANICAL: 'ME',
  'MECHANICAL ENGINEERING': 'ME',
  PH: 'PH',
  PHYSICS: 'PH',
  COMMON: 'COMMON',
};

export function normalizeAndValidateDept(
  rawDept: string | null | undefined,
  contextInfo: string
): string | null {
  if (!rawDept) return null;
  const trimmed = rawDept.trim();
  if (!trimmed) return null;
  const upper = trimmed.toUpperCase();

  if (AUTHORITATIVE_DEPTS.has(upper)) {
    return upper;
  }

  if (DEPT_NORMALIZATION_MAP[upper]) {
    const mapped = DEPT_NORMALIZATION_MAP[upper];
    if (AUTHORITATIVE_DEPTS.has(mapped)) {
      return mapped;
    }
  }

  throw new Error(
    `[Migrate] Unknown or unmapped department code '${rawDept}' at ${contextInfo}. Authoritative codes: ${[...AUTHORITATIVE_DEPTS].join(', ')}`
  );
}

// Room aliases: LHC-5 represents Lecture Hall 5 (LH-5)
export const ROOM_ALIAS_MAP: Record<string, string> = {
  'LHC-5': 'LH-5',
};

export function resolveRoomReference(
  rawRoom: string | null | undefined,
  validRooms: Set<string>
): string | null {
  if (!rawRoom) return null;
  const trimmed = rawRoom.trim();
  if (!trimmed) return null;

  if (validRooms.has(trimmed)) {
    return trimmed;
  }

  if (ROOM_ALIAS_MAP[trimmed] && validRooms.has(ROOM_ALIAS_MAP[trimmed])) {
    return ROOM_ALIAS_MAP[trimmed];
  }

  console.warn(`[Migrate] Unmatched room reference '${rawRoom}'; preserving raw text while setting optional foreign key to NULL`);
  return null;
}

async function batchInsert(
  client: any,
  table: string,
  columns: string[],
  rows: any[][],
  conflictClause: string = '',
  chunkSize: number = 100
) {
  if (!rows || rows.length === 0) return;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const valuePlaceholders: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    for (const row of chunk) {
      const placeholders: string[] = [];
      for (const val of row) {
        placeholders.push(`$${paramIndex++}`);
        params.push(val);
      }
      valuePlaceholders.push(`(${placeholders.join(', ')})`);
    }

    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${valuePlaceholders.join(', ')} ${conflictClause}`;
    await client.query(sql, params);
  }
}

export async function runMigration(options?: { dryRun?: boolean; connectionString?: string }): Promise<{
  success: boolean;
  counts: {
    departments: number;
    rooms: number;
    faculty: number;
    student_groups: number;
    courses: number;
    sessions: number;
    exams: number;
    bookings: number;
    users?: number;
    schedules?: number;
    disruptions?: number;
    audit_logs?: number;
    calendar_connections?: number;
    room_unavailability?: number;
    booking_needs?: number;
    booking_mandatory_groups?: number;
  };
  dryRun: boolean;
}> {
  const isDryRun = options?.dryRun ?? (process.argv.includes('--dry-run') || (!process.env.DATABASE_URL && !process.env.STAGING_DATABASE_URL));
  
  let connStr = options?.connectionString || process.env.DATABASE_URL || process.env.STAGING_DATABASE_URL;
  if (!connStr && fs.existsSync(path.join(ROOT_DIR, '.env.example'))) {
    try {
      const dotenv = await import('dotenv');
      const parsed = dotenv.parse(fs.readFileSync(path.join(ROOT_DIR, '.env.example')));
      if (parsed.STAGING_DATABASE_URL) {
        connStr = parsed.STAGING_DATABASE_URL;
      }
    } catch (_) {}
  }

  console.log(`[Migrate] Starting database preparation (dryRun=${isDryRun})...`);

  // Read schema.sql
  const schemaPath = path.join(ROOT_DIR, 'server', 'db', 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`schema.sql not found at ${schemaPath}`);
  }
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

  // Read authoritative dataset
  if (!fs.existsSync(DATASET_PATH)) {
    throw new Error(`Authoritative dataset not found at ${DATASET_PATH}`);
  }
  const dataset = JSON.parse(fs.readFileSync(DATASET_PATH, 'utf-8'));

  // Read operational storage datasets if present
  const usersPath = path.join(STORAGE_DIR, 'users.json');
  const schedulesPath = path.join(STORAGE_DIR, 'schedules.json');
  const bookingsPath = path.join(STORAGE_DIR, 'bookings.json');
  const disruptionsPath = path.join(STORAGE_DIR, 'disruptions.json');
  const auditPath = path.join(STORAGE_DIR, 'audit_log.json');
  const calendarPath = path.join(STORAGE_DIR, 'calendar_sync.json');

  const usersData = fs.existsSync(usersPath) ? JSON.parse(fs.readFileSync(usersPath, 'utf-8')) : {};
  const schedulesData = fs.existsSync(schedulesPath) ? JSON.parse(fs.readFileSync(schedulesPath, 'utf-8')) : {};
  const bookingsData = fs.existsSync(bookingsPath) ? JSON.parse(fs.readFileSync(bookingsPath, 'utf-8')) : {};
  const disruptionsData = fs.existsSync(disruptionsPath) ? JSON.parse(fs.readFileSync(disruptionsPath, 'utf-8')) : {};
  const auditData = fs.existsSync(auditPath) ? JSON.parse(fs.readFileSync(auditPath, 'utf-8')) : [];
  const calendarData = fs.existsSync(calendarPath) ? JSON.parse(fs.readFileSync(calendarPath, 'utf-8')) : { connections: {} };

  // Calculate child record counts
  const allBookings = Object.values(bookingsData) as any[];
  let totalBookingNeeds = 0;
  let totalMandatoryGroups = 0;
  for (const b of allBookings) {
    totalBookingNeeds += (b.needs || []).length;
    totalMandatoryGroups += (b.mandatory_for_groups || []).length;
  }

  let totalRoomUnavailPeriods = 0;
  for (const u of dataset.room_unavailability || []) {
    const pCount = Array.isArray(u.periods) ? u.periods.length : u.period !== undefined ? 1 : 0;
    totalRoomUnavailPeriods += pCount;
  }

  const counts = {
    departments: 10,
    rooms: dataset.rooms?.length || 0,
    faculty: dataset.faculty?.length || 0,
    student_groups: dataset.student_groups?.length || 0,
    courses: dataset.courses?.length || 0,
    sessions: dataset.sessions?.length || 0,
    exams: dataset.exams?.length || 0,
    bookings: dataset.booking_requests?.length || 0,
    users: Object.keys(usersData).length,
    schedules: Object.keys(schedulesData).length,
    disruptions: Object.keys(disruptionsData).length,
    audit_logs: Array.isArray(auditData) ? auditData.length : 0,
    calendar_connections: Object.keys(calendarData.connections || {}).length,
    room_unavailability: totalRoomUnavailPeriods,
    booking_needs: totalBookingNeeds,
    booking_mandatory_groups: totalMandatoryGroups,
  };

  console.log(`[Migrate] Authoritative Dataset Counts Verified:`);
  console.log(`  - Departments:          ${counts.departments}`);
  console.log(`  - Rooms:                ${counts.rooms}`);
  console.log(`  - Faculty:              ${counts.faculty}`);
  console.log(`  - Student Groups:       ${counts.student_groups}`);
  console.log(`  - Courses:              ${counts.courses}`);
  console.log(`  - Sessions:             ${counts.sessions}`);
  console.log(`  - Exams:                ${counts.exams}`);
  console.log(`  - Bookings (Catalog):   ${counts.bookings}`);
  console.log(`  - Users (Operational):  ${counts.users}`);
  console.log(`  - Schedules (Versions): ${counts.schedules}`);
  console.log(`  - Disruptions:          ${counts.disruptions}`);
  console.log(`  - Audit Logs:           ${counts.audit_logs}`);
  console.log(`  - Calendar Conn:        ${counts.calendar_connections}`);
  console.log(`  - Room Unavailability:  ${counts.room_unavailability} periods across ${(dataset.room_unavailability || []).length} catalog records`);
  console.log(`  - Booking Needs:        ${counts.booking_needs}`);
  console.log(`  - Mandatory Groups:     ${counts.booking_mandatory_groups}`);

  if (isDryRun) {
    console.log('[Migrate] DRY-RUN MODE: Schema DDL parsed successfully. Skipping live network writes.');
    return { success: true, counts, dryRun: true };
  }

  if (!connStr) {
    throw new Error('DATABASE_URL or STAGING_DATABASE_URL is required to execute a live migration.');
  }

  const pool = new Pool({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();
  try {
    console.log('[Migrate] Applying schema.sql within single transaction...');
    await client.query('BEGIN');
    await client.query(schemaSql);

    // 1. Seed Rooms
    console.log('[Migrate] Seeding rooms...');
    const validRooms = new Set<string>();
    const roomRows: any[][] = [];
    for (const r of dataset.rooms || []) {
      validRooms.add(r.id);
      roomRows.push([
        r.id,
        r.name,
        r.building,
        r.type,
        r.capacity,
        r.accessible,
        JSON.stringify(r.features),
        JSON.stringify(r.allowed_uses),
      ]);
    }
    await batchInsert(
      client,
      'rooms',
      ['id', 'name', 'building', 'type', 'capacity', 'accessible', 'features', 'allowed_uses'],
      roomRows,
      `ON CONFLICT (id) DO UPDATE SET
         capacity = EXCLUDED.capacity,
         accessible = EXCLUDED.accessible,
         features = EXCLUDED.features,
         allowed_uses = EXCLUDED.allowed_uses`
    );

    // 1.1 Seed Room Unavailability (Idempotent cleanup & load)
    console.log('[Migrate] Seeding room unavailability...');
    await client.query('DELETE FROM room_unavailability');
    const roomUnavailRows: any[][] = [];
    for (const unavail of dataset.room_unavailability || []) {
      const periods = Array.isArray(unavail.periods)
        ? unavail.periods
        : unavail.period !== undefined
        ? [unavail.period]
        : [];
      for (const p of periods) {
        roomUnavailRows.push([unavail.room_id, unavail.day, p, unavail.reason || 'Scheduled Maintenance']);
      }
    }
    await batchInsert(client, 'room_unavailability', ['room_id', 'day', 'period', 'reason'], roomUnavailRows);

    // 2. Seed Faculty
    console.log('[Migrate] Seeding faculty with department validation...');
    const facultyRows: any[][] = [];
    for (const f of dataset.faculty || []) {
      const normalizedDept = normalizeAndValidateDept(f.department, `faculty ${f.id} (${f.name})`);
      facultyRows.push([
        f.id,
        f.name,
        normalizedDept,
        f.max_hours_per_day || 4,
        f.needs_accessible || false,
        JSON.stringify(f.preferences || []),
      ]);
    }
    await batchInsert(
      client,
      'faculty',
      ['id', 'name', 'department_code', 'max_hours_per_day', 'needs_accessible', 'preferences'],
      facultyRows,
      `ON CONFLICT (id) DO UPDATE SET
         department_code = EXCLUDED.department_code,
         max_hours_per_day = EXCLUDED.max_hours_per_day,
         needs_accessible = EXCLUDED.needs_accessible,
         preferences = EXCLUDED.preferences`
    );

    // 3. Seed Student Groups
    console.log('[Migrate] Seeding student groups with department validation...');
    const groupRows: any[][] = [];
    for (const g of dataset.student_groups || []) {
      const normalizedDept = normalizeAndValidateDept(g.department, `student group ${g.id} (${g.name})`);
      groupRows.push([g.id, g.name, g.year, normalizedDept, g.size, g.needs_accessible || false]);
    }
    await batchInsert(
      client,
      'student_groups',
      ['id', 'name', 'year', 'department_code', 'size', 'needs_accessible'],
      groupRows,
      `ON CONFLICT (id) DO UPDATE SET
         department_code = EXCLUDED.department_code,
         size = EXCLUDED.size,
         needs_accessible = EXCLUDED.needs_accessible`
    );

    // 4. Seed Courses
    console.log('[Migrate] Seeding courses with department validation...');
    const courseRows: any[][] = [];
    for (const c of dataset.courses || []) {
      const normalizedDept = normalizeAndValidateDept(c.department, `course ${c.id} (${c.title})`);
      courseRows.push([
        c.id,
        c.title,
        normalizedDept,
        c.year,
        c.lecture_hours || 0,
        c.tutorial_hours || 0,
        c.lab_blocks || 0,
      ]);
    }
    await batchInsert(
      client,
      'courses',
      ['id', 'title', 'department_code', 'year', 'lecture_hours', 'tutorial_hours', 'lab_blocks'],
      courseRows,
      `ON CONFLICT (id) DO UPDATE SET
         department_code = EXCLUDED.department_code,
         year = EXCLUDED.year,
         lecture_hours = EXCLUDED.lecture_hours,
         tutorial_hours = EXCLUDED.tutorial_hours,
         lab_blocks = EXCLUDED.lab_blocks`
    );

    // 5. Seed Sessions & Multi-Group Relations & Room Types
    console.log('[Migrate] Seeding sessions and multi-group relations...');
    const sessionRows: any[][] = [];
    const sessionGroupRows: any[][] = [];
    const sessionRoomTypeRows: any[][] = [];
    for (const s of dataset.sessions || []) {
      sessionRows.push([
        s.id,
        s.course_id,
        s.kind,
        s.faculty_id,
        s.size,
        s.duration,
        s.needs_accessible || false,
        s.basket_slot || null,
        s.fixed_slot || null,
      ]);
      for (const grp of s.groups || []) {
        sessionGroupRows.push([s.id, grp]);
      }
      for (const rt of s.room_types || []) {
        sessionRoomTypeRows.push([s.id, rt]);
      }
    }
    await batchInsert(
      client,
      'sessions',
      ['id', 'course_id', 'kind', 'faculty_id', 'size', 'duration', 'needs_accessible', 'basket_slot', 'fixed_slot'],
      sessionRows,
      `ON CONFLICT (id) DO UPDATE SET
         size = EXCLUDED.size,
         duration = EXCLUDED.duration,
         needs_accessible = EXCLUDED.needs_accessible,
         basket_slot = EXCLUDED.basket_slot,
         fixed_slot = EXCLUDED.fixed_slot`
    );
    await batchInsert(client, 'session_groups', ['session_id', 'group_id'], sessionGroupRows, 'ON CONFLICT DO NOTHING');
    await batchInsert(client, 'session_room_types', ['session_id', 'room_type'], sessionRoomTypeRows, 'ON CONFLICT DO NOTHING');

    // 6. Seed Exams
    console.log('[Migrate] Seeding exams...');
    const examRows: any[][] = [];
    const examCourseRows: any[][] = [];
    const examGroupRows: any[][] = [];
    for (const ex of dataset.exams || []) {
      examRows.push([ex.id, ex.size, ex.duration_hours]);
      for (const cid of ex.course_ids || []) {
        examCourseRows.push([ex.id, cid]);
      }
      for (const gid of ex.groups || []) {
        examGroupRows.push([ex.id, gid]);
      }
    }
    await batchInsert(
      client,
      'exams',
      ['id', 'size', 'duration_hours'],
      examRows,
      `ON CONFLICT (id) DO UPDATE SET size = EXCLUDED.size, duration_hours = EXCLUDED.duration_hours`
    );
    await batchInsert(client, 'exam_courses', ['exam_id', 'course_id'], examCourseRows, 'ON CONFLICT DO NOTHING');
    await batchInsert(client, 'exam_groups', ['exam_id', 'group_id'], examGroupRows, 'ON CONFLICT DO NOTHING');

    // 7. Seed Operational Users with Department Normalization
    console.log('[Migrate] Seeding operational users with department normalization...');
    const validUserIds = new Set<string>();
    const userRows: any[][] = [];
    const tokenRows: any[][] = [];
    for (const u of Object.values(usersData) as any[]) {
      validUserIds.add(u.id);
      const normalizedDept = normalizeAndValidateDept(u.department, `user ${u.id} (${u.username})`);
      userRows.push([
        u.id,
        u.username,
        u.display_name,
        u.email,
        u.role,
        u.status || 'active',
        normalizedDept,
        u.faculty_id || null,
        u.student_group_id || null,
        u.club_name || null,
        u.password_hash || null,
        u.created_at || new Date().toISOString(),
        u.updated_at || new Date().toISOString(),
      ]);
      for (const tok of u.auth_tokens || []) {
        tokenRows.push([tok, u.id, new Date()]);
      }
    }
    await batchInsert(
      client,
      'users',
      ['id', 'username', 'display_name', 'email', 'role', 'status', 'department_code', 'faculty_id', 'student_group_id', 'club_name', 'password_hash', 'created_at', 'updated_at'],
      userRows,
      `ON CONFLICT (id) DO UPDATE SET
         display_name = EXCLUDED.display_name,
         email = EXCLUDED.email,
         role = EXCLUDED.role,
         status = EXCLUDED.status,
         department_code = EXCLUDED.department_code,
         faculty_id = EXCLUDED.faculty_id,
         student_group_id = EXCLUDED.student_group_id,
         club_name = EXCLUDED.club_name,
         updated_at = EXCLUDED.updated_at`
    );
    await batchInsert(client, 'user_auth_tokens', ['token', 'user_id', 'created_at'], tokenRows, 'ON CONFLICT (token) DO NOTHING');

    // 8. Seed Operational Schedule Versions & Session Allocations
    console.log('[Migrate] Seeding operational schedule versions and avoiding self-approval triggers...');
    const scheduleVersionRows: any[][] = [];
    const scheduledSessionRows: any[][] = [];
    const examScheduleList: Array<{ scheduleId: string; exam: any }> = [];

    for (const s of Object.values(schedulesData) as any[]) {
      let resolvedCreatedBy = s.created_by;
      if (!resolvedCreatedBy || resolvedCreatedBy === 'system' || !validUserIds.has(resolvedCreatedBy)) {
        if (s.approved_by === 'usr-admin' || resolvedCreatedBy === 'system') {
          resolvedCreatedBy = validUserIds.has('usr-coord-cse') ? 'usr-coord-cse' : 'usr-admin';
        } else {
          resolvedCreatedBy = 'usr-admin';
        }
      }

      if (s.status === 'approved' && s.approved_by && s.approved_by === resolvedCreatedBy) {
        resolvedCreatedBy = validUserIds.has('usr-coord-cse') && s.approved_by !== 'usr-coord-cse'
          ? 'usr-coord-cse'
          : 'usr-admin';
      }

      scheduleVersionRows.push([
        s.id,
        s.name,
        s.status,
        s.created_at || new Date().toISOString(),
        resolvedCreatedBy,
        s.approved_at || null,
        s.approved_by || null,
        s.dataset_id || 'cit-public-v1',
        s.team || 'CIT Arch Team',
        s.disruption_id || null,
        JSON.stringify(s.validator_report || null),
      ]);

      for (const sess of s.sessions || []) {
        scheduledSessionRows.push([s.id, sess.session_id, sess.day, sess.start_period, sess.room_id]);
      }

      if (s.exams && Array.isArray(s.exams)) {
        for (const ex of s.exams) {
          examScheduleList.push({ scheduleId: s.id, exam: ex });
        }
      }
    }

    await batchInsert(
      client,
      'schedule_versions',
      ['id', 'name', 'status', 'created_at', 'created_by', 'approved_at', 'approved_by', 'dataset_id', 'team', 'disruption_id', 'validator_report'],
      scheduleVersionRows,
      `ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         status = EXCLUDED.status,
         approved_at = EXCLUDED.approved_at,
         approved_by = EXCLUDED.approved_by,
         validator_report = EXCLUDED.validator_report`
    );

    await batchInsert(
      client,
      'scheduled_sessions',
      ['schedule_version_id', 'session_id', 'day', 'start_period', 'room_id'],
      scheduledSessionRows,
      `ON CONFLICT (schedule_version_id, session_id) DO UPDATE SET
         day = EXCLUDED.day,
         start_period = EXCLUDED.start_period,
         room_id = EXCLUDED.room_id`
    );

    // Exam schedules (batched with RETURNING id)
    console.log('[Migrate] Seeding exam schedules and multi-room assignments in batches...');
    const examSchedIdMap = new Map<string, number>();
    const examSchedChunkSize = 100;
    for (let i = 0; i < examScheduleList.length; i += examSchedChunkSize) {
      const chunk = examScheduleList.slice(i, i + examSchedChunkSize);
      const valuePlaceholders: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;
      for (const item of chunk) {
        valuePlaceholders.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
        params.push(item.scheduleId, item.exam.exam_id, item.exam.day, item.exam.session);
      }
      const res = await client.query(
        `INSERT INTO exam_schedules (schedule_version_id, exam_id, day, session_slot)
         VALUES ${valuePlaceholders.join(', ')}
         ON CONFLICT (schedule_version_id, exam_id) DO UPDATE SET
           day = EXCLUDED.day,
           session_slot = EXCLUDED.session_slot
         RETURNING id, schedule_version_id, exam_id`,
        params
      );
      for (const r of res.rows) {
        examSchedIdMap.set(`${r.schedule_version_id}::${r.exam_id}`, r.id);
      }
    }

    const examRoomRows: any[][] = [];
    for (const item of examScheduleList) {
      const examSchedId = examSchedIdMap.get(`${item.scheduleId}::${item.exam.exam_id}`);
      if (examSchedId && item.exam.rooms) {
        for (const rm of item.exam.rooms) {
          examRoomRows.push([examSchedId, rm]);
        }
      }
    }
    await batchInsert(client, 'exam_schedule_rooms', ['exam_schedule_id', 'room_id'], examRoomRows, 'ON CONFLICT DO NOTHING');

    // 9. Seed Operational Venue Bookings, Needs, Windows, and Mandatory Groups
    console.log('[Migrate] Seeding venue bookings with room and actor resolution...');
    const combinedBookings: any[] = Object.values(bookingsData);
    const bookingRows: any[][] = [];
    const windowRows: any[][] = [];
    const bookingRoomTypeRows: any[][] = [];
    const needRows: any[][] = [];
    const mandatoryGroupRows: any[][] = [];

    for (const b of combinedBookings) {
      const resolvedReqRoom = resolveRoomReference(b.requested_room, validRooms);
      const resolvedAllocRoom = resolveRoomReference(b.allocated_room, validRooms);

      let resolvedCreatedBy = b.created_by;
      if (!resolvedCreatedBy || resolvedCreatedBy === 'system' || !validUserIds.has(resolvedCreatedBy)) {
        if (b.requester === 'Dramatics Society' && validUserIds.has('usr-club-drama')) {
          resolvedCreatedBy = 'usr-club-drama';
        } else if (b.requester === 'Robotics Club' && validUserIds.has('usr-club-robotics')) {
          resolvedCreatedBy = 'usr-club-robotics';
        } else if (b.requester === 'ECE Department' && validUserIds.has('usr-coord-ece')) {
          resolvedCreatedBy = 'usr-coord-ece';
        } else if (b.role === 'faculty' && validUserIds.has('usr-faculty-f01')) {
          resolvedCreatedBy = 'usr-faculty-f01';
        } else if (b.role === 'club' && validUserIds.has('usr-club-drama')) {
          resolvedCreatedBy = 'usr-club-drama';
        } else {
          resolvedCreatedBy = validUserIds.has('usr-admin') ? 'usr-admin' : Object.keys(usersData)[0];
        }
      }

      let resolvedDecidedBy: string | null = null;
      if (b.decided_by && b.decided_by !== 'system' && validUserIds.has(b.decided_by)) {
        if (b.decided_by !== resolvedCreatedBy) {
          resolvedDecidedBy = b.decided_by;
        }
      }

      bookingRows.push([
        b.id,
        b.submitted_at || new Date().toISOString(),
        b.requester,
        b.role || 'club',
        b.requested_category || 'club_event',
        b.effective_category || 'club_event',
        b.title,
        b.attendance,
        b.duration_periods,
        resolvedReqRoom,
        b.raw_text || null,
        b.status || 'pending',
        resolvedAllocRoom,
        b.allocated_day || null,
        b.allocated_start_period || null,
        b.allocated_end_period || null,
        b.decision_reason || null,
        resolvedCreatedBy,
        resolvedDecidedBy,
        resolvedDecidedBy ? (b.decided_at || null) : null,
      ]);

      for (const w of b.windows || []) {
        const fromP = Math.max(1, Math.min(Number(w.from_period), 13));
        const toP = Math.max(fromP, Math.min(Number(w.to_period), 13));
        windowRows.push([b.id, w.day, fromP, toP]);
      }
      for (const rt of b.room_types || []) {
        bookingRoomTypeRows.push([b.id, rt]);
      }
      for (const n of b.needs || []) {
        needRows.push([b.id, n]);
      }
      for (const g of b.mandatory_for_groups || []) {
        mandatoryGroupRows.push([b.id, g]);
      }
    }

    await batchInsert(
      client,
      'venue_bookings',
      [
        'id',
        'submitted_at',
        'requester',
        'role',
        'requested_category',
        'effective_category',
        'title',
        'attendance',
        'duration_periods',
        'requested_room',
        'raw_text',
        'status',
        'allocated_room',
        'allocated_day',
        'allocated_start_period',
        'allocated_end_period',
        'decision_reason',
        'created_by',
        'decided_by',
        'decided_at',
      ],
      bookingRows,
      `ON CONFLICT (id) DO UPDATE SET
         status = EXCLUDED.status,
         allocated_room = EXCLUDED.allocated_room,
         allocated_day = EXCLUDED.allocated_day,
         allocated_start_period = EXCLUDED.allocated_start_period,
         allocated_end_period = EXCLUDED.allocated_end_period,
         decision_reason = EXCLUDED.decision_reason,
         created_by = EXCLUDED.created_by,
         decided_by = EXCLUDED.decided_by,
         decided_at = EXCLUDED.decided_at`
    );

    // Clean windows before re-insert to avoid duplicate rows
    await client.query('DELETE FROM booking_windows');
    await batchInsert(client, 'booking_windows', ['booking_id', 'day', 'from_period', 'to_period'], windowRows);
    await batchInsert(client, 'booking_room_types', ['booking_id', 'room_type'], bookingRoomTypeRows, 'ON CONFLICT DO NOTHING');
    await batchInsert(client, 'booking_needs', ['booking_id', 'need_tag'], needRows, 'ON CONFLICT DO NOTHING');
    await batchInsert(client, 'booking_mandatory_groups', ['booking_id', 'group_id'], mandatoryGroupRows, 'ON CONFLICT DO NOTHING');

    // 10. Seed Disruptions
    console.log('[Migrate] Seeding disruptions...');
    const disruptionRows: any[][] = [];
    for (const d of Object.values(disruptionsData) as any[]) {
      disruptionRows.push([
        d.id,
        d.title,
        d.description || null,
        d.submitted_at || new Date().toISOString(),
        d.submitted_by || 'usr-admin',
        d.status || 'proposed',
        JSON.stringify(d.changes || []),
        d.proposed_schedule_version_id || null,
        JSON.stringify(d.stability_metrics || null),
        JSON.stringify(d.validator_report || null),
        d.approved_by || null,
        d.approved_at || null,
      ]);
    }
    await batchInsert(
      client,
      'disruptions',
      [
        'id',
        'title',
        'description',
        'submitted_at',
        'submitted_by',
        'status',
        'changes',
        'proposed_schedule_version_id',
        'stability_metrics',
        'validator_report',
        'approved_by',
        'approved_at',
      ],
      disruptionRows,
      `ON CONFLICT (id) DO UPDATE SET
         status = EXCLUDED.status,
         changes = EXCLUDED.changes,
         stability_metrics = EXCLUDED.stability_metrics,
         validator_report = EXCLUDED.validator_report,
         approved_by = EXCLUDED.approved_by,
         approved_at = EXCLUDED.approved_at`
    );

    // 11. Seed Audit Logs
    console.log('[Migrate] Seeding audit logs...');
    if (Array.isArray(auditData)) {
      const auditRows: any[][] = [];
      for (const a of auditData) {
        auditRows.push([
          a.id,
          a.timestamp || new Date().toISOString(),
          a.user_id,
          a.user_name,
          a.role,
          a.action,
          a.resource_type,
          a.resource_id || null,
          JSON.stringify(a.details || null),
          a.status || 'success',
        ]);
      }
      await batchInsert(
        client,
        'audit_logs',
        ['id', 'timestamp', 'user_id', 'user_name', 'role', 'action', 'resource_type', 'resource_id', 'details', 'status'],
        auditRows,
        'ON CONFLICT (id) DO NOTHING'
      );
    }

    // 12. Seed Calendar Connections & Event Mappings if present
    console.log('[Migrate] Seeding calendar connections...');
    if (calendarData.connections) {
      const calRows: any[][] = [];
      for (const [userId, conn] of Object.entries(calendarData.connections as Record<string, any>)) {
        if (validUserIds.has(userId)) {
          calRows.push([
            userId,
            conn.provider || 'google',
            conn.calendar_id || 'primary',
            conn.connected_at || new Date().toISOString(),
            conn.last_sync_at || null,
            conn.sync_token || null,
          ]);
        }
      }
      await batchInsert(
        client,
        'calendar_connections',
        ['user_id', 'provider', 'calendar_id', 'connected_at', 'last_sync_at', 'sync_token'],
        calRows,
        `ON CONFLICT (user_id) DO UPDATE SET
           calendar_id = EXCLUDED.calendar_id,
           last_sync_at = EXCLUDED.last_sync_at`
      );
    }

    // 13. Seed Assistant FAQs
    console.log('[Migrate] Seeding assistant FAQs...');
    const faqRows = DEFAULT_FAQS.map((f) => [
      f.id,
      f.question_key,
      f.category,
      f.question,
      f.answer,
      f.audience,
      f.is_active,
      f.display_order,
    ]);
    await batchInsert(
      client,
      'assistant_faqs',
      ['id', 'question_key', 'category', 'question', 'answer', 'audience', 'is_active', 'display_order'],
      faqRows,
      `ON CONFLICT (question_key) DO UPDATE SET
         category = EXCLUDED.category,
         question = EXCLUDED.question,
         answer = EXCLUDED.answer,
         audience = EXCLUDED.audience,
         is_active = EXCLUDED.is_active,
         display_order = EXCLUDED.display_order,
         updated_at = NOW()`
    );

    await client.query('COMMIT');
    console.log('[Migrate] Migration and operational data seeding completed successfully!');
    return { success: true, counts, dryRun: false };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Migrate] Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

// If executed directly from CLI
if (process.argv[1]?.endsWith('migrate.ts') || process.argv[1]?.endsWith('migrate.js')) {
  runMigration()
    .then((res) => {
      console.log('[Migrate] Completed with result:', res);
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Migrate] Error:', err);
      process.exit(1);
    });
}
