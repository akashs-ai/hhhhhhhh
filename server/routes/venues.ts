import { Router, Response } from 'express';
import { AuthenticatedRequest, requireAuth, requireRole } from '../auth.js';
import { MaintenanceBlock, storage, WaitlistEntry } from '../storage.js';

const router = Router();

const PERIOD_TIMINGS: Record<number, string> = {
  1: '08:30 - 09:20',
  2: '09:30 - 10:20',
  3: '10:30 - 11:20',
  4: '11:30 - 12:20',
  5: '12:30 - 13:20',
  6: '13:30 - 14:20',
  7: '14:30 - 15:20',
  8: '15:30 - 16:20',
  9: '16:30 - 17:20',
};

// GET /api/venues - List all venues with live occupancy & status
router.get('/venues', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const dataset = await storage.getDataset();
  const rooms = dataset.rooms || [];
  const approvedSchedule = await storage.getApprovedSchedule();
  const allBookings = await storage.getAllBookings();
  const maintenanceBlocks = await storage.getMaintenanceBlocks();

  const day = ((req.query.day as string) || 'MON').toUpperCase();
  const period = req.query.period ? Number(req.query.period) : null;
  const startPeriod = req.query.start_period ? Number(req.query.start_period) : (period || 1);
  const endPeriod = req.query.end_period ? Number(req.query.end_period) : (period || 9);

  const classification = req.query.classification as string;
  const typeFilter = req.query.type as string;
  const minCap = req.query.min_capacity ? Number(req.query.min_capacity) : null;
  const maxCap = req.query.max_capacity ? Number(req.query.max_capacity) : null;
  const statusFilter = req.query.status as string;

  const bookingsList = Object.values(allBookings);

  const enrichedRooms = rooms.map((r: any) => {
    // 1. Check maintenance
    const block = maintenanceBlocks.find(
      (b) => b.room_id === r.id && b.day === day && b.periods.some((p) => p >= startPeriod && p <= endPeriod)
    );

    // 2. Check approved bookings
    const booking = bookingsList.find(
      (b) =>
        b.status === 'approved' &&
        b.allocated_room === r.id &&
        b.allocated_day === day &&
        b.allocated_start_period &&
        b.allocated_end_period &&
        startPeriod <= b.allocated_end_period &&
        endPeriod >= b.allocated_start_period
    );

    // 3. Check timetable sessions
    const session = approvedSchedule?.sessions?.find(
      (s) => s.room_id === r.id && s.day === day && s.start_period >= startPeriod && s.start_period <= endPeriod
    );

    let currentStatus: 'available' | 'occupied' | 'maintenance' = 'available';
    let statusLabel = 'Available Now';

    if (block) {
      currentStatus = 'maintenance';
      statusLabel = `Under Maintenance: ${block.reason}`;
    } else if (booking) {
      currentStatus = 'occupied';
      statusLabel = `Occupied: ${booking.title}`;
    } else if (session) {
      currentStatus = 'occupied';
      statusLabel = `Occupied: Course ${session.session_id}`;
    }

    return {
      ...r,
      current_status: currentStatus,
      status: currentStatus,
      status_label: statusLabel,
      maintenance_block: block || null,
      active_booking: booking ? { id: booking.id, title: booking.title, requester: booking.requester } : null,
    };
  });

  let filtered = enrichedRooms;

  // Classification mapping
  if (classification) {
    const cLower = classification.toLowerCase();
    if (cLower.includes('seminar')) {
      filtered = filtered.filter((r: any) => r.type === 'seminar_hall');
    } else if (cLower.includes('compute') || cLower.includes('lab')) {
      filtered = filtered.filter((r: any) => r.type.startsWith('lab') || r.type === 'computer_lab');
    } else if (cLower.includes('lecture') || cLower.includes('theatre')) {
      filtered = filtered.filter((r: any) => r.type === 'lecture_hall' || r.type === 'auditorium');
    } else if (cLower.includes('classroom')) {
      filtered = filtered.filter((r: any) => r.type === 'classroom');
    } else if (cLower.includes('auditorium')) {
      filtered = filtered.filter((r: any) => r.type === 'auditorium');
    }
  }

  if (typeFilter) {
    filtered = filtered.filter((r: any) => r.type === typeFilter);
  }

  if (minCap !== null) {
    filtered = filtered.filter((r: any) => r.capacity >= minCap);
  }
  if (maxCap !== null) {
    filtered = filtered.filter((r: any) => r.capacity <= maxCap);
  }

  if (statusFilter) {
    filtered = filtered.filter((r: any) => r.current_status === statusFilter);
  }

  const totalVenues = rooms.length;
  const maintenanceCount = enrichedRooms.filter((r: any) => r.current_status === 'maintenance').length;
  const occupiedCount = enrichedRooms.filter((r: any) => r.current_status === 'occupied').length;
  const availableCount = totalVenues - maintenanceCount - occupiedCount;
  const occupancyRate = totalVenues > 0 ? Number(((occupiedCount / totalVenues) * 100).toFixed(1)) : 0;
  const pendingApprovals = bookingsList.filter((b) => b.status === 'pending').length;

  res.json({
    success: true,
    count: filtered.length,
    stats: {
      total_venues: totalVenues,
      available_venues: availableCount,
      occupied_venues: occupiedCount,
      maintenance_venues: maintenanceCount,
      active_venues: totalVenues - maintenanceCount,
      occupancy_rate: occupancyRate,
      pending_approvals: pendingApprovals,
    },
    data: filtered,
  });
});

// POST /api/venues - Register New Venue (Admin / Coordinator only)
router.post('/venues', requireRole('admin', 'department_coordinator'), async (req: AuthenticatedRequest, res: Response) => {
  const { id, name, type, building, capacity, features = [], accessible = true, allowed_uses = ['lecture', 'event'] } = req.body;

  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: 'Venue ID is required' } });
    return;
  }
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    res.status(400).json({ success: false, error: { code: 'INVALID_NAME', message: 'Venue name is required' } });
    return;
  }
  if (!building || typeof building !== 'string') {
    res.status(400).json({ success: false, error: { code: 'INVALID_BUILDING', message: 'Venue building location is required' } });
    return;
  }
  const cap = Number(capacity);
  if (!cap || cap <= 0 || isNaN(cap)) {
    res.status(400).json({ success: false, error: { code: 'INVALID_CAPACITY', message: 'Capacity must be a positive number' } });
    return;
  }

  const validTypes = [
    'auditorium',
    'lecture_hall',
    'classroom',
    'seminar_hall',
    'computer_lab',
    'lab_cs',
    'lab_elec',
    'lab_phy',
    'lab_civil',
    'workshop',
    'outdoor',
  ];
  const normalizedType = type ? type.toLowerCase() : 'seminar_hall';
  if (!validTypes.includes(normalizedType)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_TYPE', message: `Invalid venue classification. Allowed: ${validTypes.join(', ')}` },
    });
    return;
  }

  const dataset = await storage.getDataset();
  if (!Array.isArray(dataset.rooms)) {
    dataset.rooms = [];
  }

  const cleanId = id.trim().toUpperCase();
  if (dataset.rooms.some((r: any) => r.id === cleanId)) {
    res.status(409).json({
      success: false,
      error: { code: 'VENUE_CODE_CONFLICT', message: `Venue with code '${cleanId}' already exists.` },
    });
    return;
  }

  const newVenue = {
    id: cleanId,
    name: name.trim(),
    building: building.trim(),
    type: normalizedType,
    capacity: cap,
    features: Array.isArray(features) ? features : [],
    accessible: Boolean(accessible),
    allowed_uses: Array.isArray(allowed_uses) ? allowed_uses : ['lecture', 'event'],
  };

  dataset.rooms.push(newVenue);
  await storage.saveDataset(dataset);

  await storage.logAudit({
    user_id: req.user!.id,
    user_name: req.user!.name,
    role: req.user!.role,
    action: 'REGISTER_NEW_VENUE',
    resource_type: 'venue',
    resource_id: cleanId,
    details: { name: newVenue.name, capacity: cap, building: newVenue.building },
    status: 'success',
  });

  res.status(201).json({
    success: true,
    message: `Venue '${newVenue.name}' (${cleanId}) registered successfully.`,
    data: newVenue,
  });
});

// POST /api/venues/maintenance - Block Venue for Maintenance
router.post('/venues/maintenance', requireRole('admin', 'department_coordinator'), async (req: AuthenticatedRequest, res: Response) => {
  const { room_id, day, start_period, end_period, date, start_time, end_time, reason } = req.body;

  if (!room_id) {
    res.status(400).json({ success: false, error: { code: 'MISSING_ROOM', message: 'Room/Venue ID is required' } });
    return;
  }
  if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
    res.status(400).json({ success: false, error: { code: 'MISSING_REASON', message: 'Maintenance reason is required' } });
    return;
  }

  const dataset = await storage.getDataset();
  const room = (dataset.rooms || []).find((r: any) => r.id === room_id);
  if (!room) {
    res.status(404).json({ success: false, error: { code: 'VENUE_NOT_FOUND', message: `Venue '${room_id}' not found` } });
    return;
  }

  const targetDay = (day || 'MON').toUpperCase();
  const sp = Number(start_period) || 1;
  const ep = Number(end_period) || sp;

  if (sp < 1 || ep > 13 || ep < sp) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_PERIODS', message: 'End period must be greater than or equal to start period (between 1 and 13)' },
    });
    return;
  }

  const periods: number[] = [];
  for (let p = sp; p <= ep; p++) periods.push(p);

  // Check existing reservations overlapping window - do not silently delete
  const allBookings = await storage.getAllBookings();
  const overlappingBookings = Object.values(allBookings).filter(
    (b) =>
      b.allocated_room === room_id &&
      b.allocated_day === targetDay &&
      b.allocated_start_period &&
      b.allocated_end_period &&
      sp <= b.allocated_end_period &&
      ep >= b.allocated_start_period
  );

  const blockId = `MB-${Date.now().toString().slice(-4)}`;
  const block: MaintenanceBlock = {
    id: blockId,
    room_id,
    day: targetDay,
    periods,
    date: date || undefined,
    start_time: start_time || PERIOD_TIMINGS[sp]?.split(' - ')[0],
    end_time: end_time || PERIOD_TIMINGS[ep]?.split(' - ')[1],
    reason: reason.trim(),
    created_by: req.user!.id,
    created_at: new Date().toISOString(),
  };

  await storage.saveMaintenanceBlock(block);

  await storage.logAudit({
    user_id: req.user!.id,
    user_name: req.user!.name,
    role: req.user!.role,
    action: 'BLOCK_VENUE_MAINTENANCE',
    resource_type: 'venue_maintenance',
    resource_id: blockId,
    details: { room_id, day: targetDay, periods, reason: block.reason, overlapping_count: overlappingBookings.length },
    status: 'success',
  });

  res.status(201).json({
    success: true,
    message: `Venue '${room_id}' has been blocked for maintenance on ${targetDay} (periods ${sp}-${ep}).`,
    data: block,
    affected_reservations: overlappingBookings.map((b) => ({
      id: b.id,
      title: b.title,
      requester: b.requester,
      status: b.status,
    })),
  });
});

// DELETE /api/venues/maintenance/:id - Remove Maintenance Block
router.delete('/venues/maintenance/:id', requireRole('admin', 'department_coordinator'), async (req: AuthenticatedRequest, res: Response) => {
  const deleted = await storage.deleteMaintenanceBlock(req.params.id);
  if (!deleted) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Maintenance block ${req.params.id} not found` } });
    return;
  }

  await storage.logAudit({
    user_id: req.user!.id,
    user_name: req.user!.name,
    role: req.user!.role,
    action: 'UNBLOCK_VENUE_MAINTENANCE',
    resource_type: 'venue_maintenance',
    resource_id: req.params.id,
    status: 'success',
  });

  res.json({ success: true, message: `Maintenance block ${req.params.id} removed successfully.` });
});

// GET /api/venues/availability - Availability Matrix for a venue across slots
router.get('/venues/availability', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const roomId = (req.query.room_id || req.query.venue_id) as string;
  if (!roomId) {
    res.status(400).json({ success: false, error: { code: 'MISSING_ROOM', message: 'Room ID is required' } });
    return;
  }

  const day = ((req.query.day as string) || 'MON').toUpperCase();
  const date = (req.query.date as string) || undefined;

  const dataset = await storage.getDataset();
  const room = (dataset.rooms || []).find((r: any) => r.id === roomId);
  if (!room) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Venue '${roomId}' not found` } });
    return;
  }

  const approvedSchedule = await storage.getApprovedSchedule();
  const allBookings = await storage.getAllBookings();
  const maintenanceBlocks = await storage.getMaintenanceBlocks();

  const slots = [];
  for (let p = 1; p <= 9; p++) {
    const timing = PERIOD_TIMINGS[p] || `Period ${p}`;

    // Check maintenance
    const block = maintenanceBlocks.find((b) => b.room_id === roomId && b.day === day && b.periods.includes(p));

    // Check bookings
    const booking = Object.values(allBookings).find(
      (b) =>
        b.status === 'approved' &&
        b.allocated_room === roomId &&
        b.allocated_day === day &&
        b.allocated_start_period &&
        b.allocated_end_period &&
        p >= b.allocated_start_period &&
        p <= b.allocated_end_period
    );

    // Check timetable
    const session = approvedSchedule?.sessions?.find((s) => s.room_id === roomId && s.day === day && s.start_period === p);

    let status: 'available' | 'occupied' | 'maintenance' = 'available';
    let label = 'Available';
    let details: string | undefined = undefined;

    if (block) {
      status = 'maintenance';
      label = `Maintenance: ${block.reason}`;
      details = block.reason;
    } else if (booking) {
      status = 'occupied';
      if (req.user!.role === 'student') {
        label = 'Reserved: Campus Event';
        details = 'Confirmed event reservation';
      } else {
        label = `Reserved: ${booking.title}`;
        details = `Booked by ${booking.requester} (${booking.effective_category})`;
      }
    } else if (session) {
      status = 'occupied';
      const sAny = session as any;
      label = `Class: ${sAny.course_id || session.session_id}`;
      details = sAny.groups?.join(', ') || 'Class session';
    }

    slots.push({
      period: p,
      time: timing,
      status,
      label,
      details,
    });
  }

  res.json({
    success: true,
    data: {
      room_id: roomId,
      room_name: room.name,
      capacity: room.capacity,
      day,
      date,
      slots,
    },
  });
});

// GET /api/venues/occupancy-report - Export Occupancy Report (Admin / Coordinator only)
router.get('/venues/occupancy-report', requireRole('admin', 'department_coordinator'), async (req: AuthenticatedRequest, res: Response) => {
  const dataset = await storage.getDataset();
  const rooms = dataset.rooms || [];
  const approvedSchedule = await storage.getApprovedSchedule();
  const allBookings = await storage.getAllBookings();
  const maintenanceBlocks = await storage.getMaintenanceBlocks();

  const dayFilter = req.query.day ? (req.query.day as string).toUpperCase() : null;
  const days = dayFilter ? [dayFilter] : ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const rows: any[] = [];

  for (const room of rooms) {
    for (const d of days) {
      for (let p = 1; p <= 9; p++) {
        const timing = PERIOD_TIMINGS[p] || `Period ${p}`;

        const block = maintenanceBlocks.find((b) => b.room_id === room.id && b.day === d && b.periods.includes(p));

        const booking = Object.values(allBookings).find(
          (b) =>
            b.status === 'approved' &&
            b.allocated_room === room.id &&
            b.allocated_day === d &&
            b.allocated_start_period &&
            b.allocated_end_period &&
            p >= b.allocated_start_period &&
            p <= b.allocated_end_period
        );

        const session = approvedSchedule?.sessions?.find((s) => s.room_id === room.id && s.day === d && s.start_period === p);

        let state = 'Free';
        let eventTitle = 'None';
        let attendees = 0;

        if (block) {
          state = 'Maintenance Blocked';
          eventTitle = block.reason;
        } else if (booking) {
          state = 'Approved Booking';
          eventTitle = booking.title;
          attendees = booking.attendance || 0;
        } else if (session) {
          state = 'Teaching Lecture';
          const sAny = session as any;
          eventTitle = `Course ${sAny.course_id || session.session_id}`;
          attendees = sAny.size || Math.round(room.capacity * 0.75);
        }

        const occupancyPct = room.capacity > 0 ? Number(((attendees / room.capacity) * 100).toFixed(1)) : 0;

        rows.push({
          room_id: room.id,
          room_name: room.name,
          building: room.building,
          classification: room.type,
          capacity: room.capacity,
          day: d,
          period: p,
          slot_time: timing,
          state,
          event_title: eventTitle,
          attendees,
          occupancy_pct: occupancyPct,
        });
      }
    }
  }

  const format = req.query.format as string;
  if (format === 'csv' || req.headers.accept?.includes('text/csv')) {
    const csvHeaders = [
      'Venue ID',
      'Venue Name',
      'Building',
      'Classification',
      'Capacity',
      'Day',
      'Period',
      'Time Slot',
      'Status',
      'Event / Session Title',
      'Estimated Attendees',
      'Occupancy %',
    ];

    const csvLines = [csvHeaders.join(',')];
    for (const r of rows) {
      const escape = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
      csvLines.push(
        [
          escape(r.room_id),
          escape(r.room_name),
          escape(r.building),
          escape(r.classification),
          r.capacity,
          r.day,
          r.period,
          escape(r.slot_time),
          escape(r.state),
          escape(r.event_title),
          r.attendees,
          `${r.occupancy_pct}%`,
        ].join(',')
      );
    }

    const csvContent = csvLines.join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="cit_venue_occupancy_report_${Date.now()}.csv"`);
    res.status(200).send(csvContent);
    return;
  }

  res.json({
    success: true,
    total_records: rows.length,
    generated_at: new Date().toISOString(),
    data: rows,
  });
});

// POST /api/venues/waitlist - Join Venue Waitlist
router.post('/venues/waitlist', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { venue_id, day, period, date, purpose } = req.body;

  if (!venue_id || !day || !period) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_REQUEST', message: 'Venue ID, day, and period are required to join waitlist' },
    });
    return;
  }

  const dataset = await storage.getDataset();
  const room = (dataset.rooms || []).find((r: any) => r.id === venue_id);
  if (!room) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Venue '${venue_id}' not found` } });
    return;
  }

  const pNum = Number(period);
  const targetDay = day.toUpperCase();

  // Check for duplicate waitlist entry for same student + venue + day + period
  const existingWaitlist = await storage.getWaitlist();
  const duplicate = existingWaitlist.find(
    (w) =>
      w.student_id === req.user!.id &&
      w.venue_id === venue_id &&
      w.day === targetDay &&
      w.period === pNum &&
      w.status === 'active'
  );

  if (duplicate) {
    res.status(409).json({
      success: false,
      error: {
        code: 'WAITLIST_DUPLICATE_ENTRY',
        message: 'You have already joined the waitlist for this venue and time slot.',
      },
    });
    return;
  }

  const entryId = `WL-${Date.now().toString().slice(-4)}`;
  const newEntry: WaitlistEntry = {
    id: entryId,
    student_id: req.user!.id,
    student_name: req.user!.name,
    student_email: req.user!.email,
    venue_id,
    day: targetDay,
    period: pNum,
    date: date || undefined,
    purpose: purpose || 'Academic / Extracurricular Reservation Queue',
    status: 'active',
    created_at: new Date().toISOString(),
  };

  await storage.saveWaitlistEntry(newEntry);

  await storage.logAudit({
    user_id: req.user!.id,
    user_name: req.user!.name,
    role: req.user!.role,
    action: 'JOIN_VENUE_WAITLIST',
    resource_type: 'venue_waitlist',
    resource_id: entryId,
    details: { venue_id, day: targetDay, period: pNum },
    status: 'success',
  });

  res.status(201).json({
    success: true,
    message: `You have successfully joined the waitlist for ${room.name} (${venue_id}) on ${targetDay} Period ${pNum}.`,
    data: newEntry,
  });
});

// GET /api/venues/waitlist - List Waitlist Entries
router.get('/venues/waitlist', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const all = await storage.getWaitlist();
  let list = all;

  // Student can only see their own waitlist records
  if (req.user!.role === 'student') {
    list = list.filter((w) => w.student_id === req.user!.id);
  }

  res.json({
    success: true,
    count: list.length,
    data: list,
  });
});

export default router;
