import { Router, Response } from 'express';
import { AuthenticatedRequest, assertNotSelfApproval, requireAuth, requireRole } from '../auth.js';
import { BookingRecord, storage } from '../storage.js';

const router = Router();

const ROLE_CATEGORY_CAP: Record<string, string> = {
  admin: 'institute_event',
  faculty: 'guest_lecture',
  department_coordinator: 'department_event',
  club: 'club_event',
};

const PRIORITY_ORDER = [
  'exam',
  'regular_session',
  'institute_event',
  'guest_lecture',
  'department_event',
  'club_event',
];

function calculateEffectiveCategory(role: string, requestedCategory: string): string {
  const cap = ROLE_CATEGORY_CAP[role] || 'club_event';
  const a = PRIORITY_ORDER.includes(requestedCategory)
    ? PRIORITY_ORDER.indexOf(requestedCategory)
    : PRIORITY_ORDER.length - 1;
  const capIdx = PRIORITY_ORDER.indexOf(cap);
  return PRIORITY_ORDER[Math.max(a, capIdx)];
}

router.get('/bookings', async (req: AuthenticatedRequest, res: Response) => {
  const allBookings = await storage.getAllBookings();
  let list = Object.values(allBookings);

  const statusFilter = req.query.status as string;
  const roleFilter = req.query.role as string;
  const roomFilter = req.query.room as string;

  if (statusFilter) {
    list = list.filter((b) => b.status === statusFilter);
  }
  if (roleFilter) {
    list = list.filter((b) => b.role === roleFilter);
  }
  if (roomFilter) {
    list = list.filter((b) => b.allocated_room === roomFilter);
  }

  // Sort by priority order, then submitted_at
  list.sort((a, b) => {
    const pA = PRIORITY_ORDER.indexOf(a.effective_category);
    const pB = PRIORITY_ORDER.indexOf(b.effective_category);
    if (pA !== pB) return pA - pB;
    return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
  });

  res.json({
    success: true,
    count: list.length,
    stats: {
      total: list.length,
      approved: list.filter((b) => b.status === 'approved').length,
      alternative_offered: list.filter((b) => b.status === 'alternative_offered').length,
      rejected: list.filter((b) => b.status === 'rejected').length,
      pending: list.filter((b) => b.status === 'pending').length,
    },
    data: list,
  });
});

router.get('/bookings/:id', async (req: AuthenticatedRequest, res: Response) => {
  const booking = await storage.getBookingById(req.params.id);
  if (!booking) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Booking request ${req.params.id} not found` } });
    return;
  }
  res.json({ success: true, data: booking });
});

router.post('/bookings/parse-ai', async (req: AuthenticatedRequest, res: Response) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: 'Field "text" is required for AI parsing' } });
    return;
  }

  let result: any = null;

  if (process.env.GEMINI_API_KEY) {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({});
      const prompt = `You are a campus venue booking assistant for Chilika Institute of Technology.
Given the following venue booking request in English or Hinglish:
"${text}"

Extract structured JSON with this exact format:
{
  "title": string (descriptive event title),
  "attendance": number (estimated attendee count, default 50 if unspecified),
  "duration_periods": number (duration in periods, 1 period = 50 min. Default 2 if unspecified),
  "windows": [
    {
      "day": "MON" | "TUE" | "WED" | "THU" | "FRI",
      "from_period": number (1 to 12),
      "to_period": number (1 to 12)
    }
  ],
  "room_types": string[] (subset of ["seminar_hall", "lecture_hall", "classroom", "auditorium", "computer_lab"]),
  "needs": string[] (equipment or features like "projector", "mic", "sound_system", "stage", "ac", "whiteboard"),
  "requested_room": string or null (e.g., "AUD", "LH-1", "SH-1", "CR-101", etc. if explicitly mentioned),
  "summary": string (brief friendly explanation of parsed parameters)
}
Return ONLY valid JSON without markdown wrapping.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const responseText = response.text || '';
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      result = JSON.parse(cleaned);
    } catch (err: any) {
      console.warn('Gemini booking parse fallback triggered:', err?.message || err);
    }
  }

  if (!result || !result.title || !result.windows) {
    const lower = text.toLowerCase();
    let day = 'THU';
    if (lower.includes('mon') || lower.includes('somwar')) day = 'MON';
    else if (lower.includes('tue') || lower.includes('mangal')) day = 'TUE';
    else if (lower.includes('wed') || lower.includes('budh')) day = 'WED';
    else if (lower.includes('thu') || lower.includes('guru') || lower.includes('brihaspati')) day = 'THU';
    else if (lower.includes('fri') || lower.includes('shukra')) day = 'FRI';

    const attMatch = text.match(/(\d+)\s*(people|attendees|students|log|persons|seats|capacity|pax)/i);
    const attendance = attMatch ? parseInt(attMatch[1], 10) : 60;

    const durMatch = text.match(/(\d+)\s*(period|hour|ghante|hr)/i);
    const duration = durMatch ? parseInt(durMatch[1], 10) : 2;

    const pMatch = text.match(/period[s]?\s*(\d+)\s*(?:to|-)\s*(\d+)/i) || text.match(/p(\d+)\s*(?:to|-)\s*p(\d+)/i);
    let fromPeriod = 10;
    let toPeriod = 12;
    if (pMatch) {
      fromPeriod = parseInt(pMatch[1], 10);
      toPeriod = parseInt(pMatch[2], 10);
    } else if (lower.includes('evening') || lower.includes('shaam')) {
      fromPeriod = 10;
      toPeriod = Math.min(12, fromPeriod + duration);
    } else if (lower.includes('morning') || lower.includes('subah')) {
      fromPeriod = 2;
      toPeriod = fromPeriod + duration;
    }

    const roomTypes: string[] = [];
    if (lower.includes('auditorium') || lower.includes('audi')) roomTypes.push('auditorium');
    if (lower.includes('seminar') || lower.includes('sh')) roomTypes.push('seminar_hall');
    if (lower.includes('lab')) roomTypes.push('computer_lab');
    if (lower.includes('lecture') || lower.includes('lh')) roomTypes.push('lecture_hall');
    if (roomTypes.length === 0) roomTypes.push('seminar_hall', 'classroom');

    const needs: string[] = [];
    if (lower.includes('mic')) needs.push('mic');
    if (lower.includes('projector')) needs.push('projector');
    if (lower.includes('stage')) needs.push('stage');
    if (lower.includes('sound') || lower.includes('speaker') || lower.includes('audio')) needs.push('sound_system');

    let requestedRoom: string | null = null;
    const rMatch = text.match(/\b(AUD|LH-[1-4]|SH-[1-2]|CR-10[1-4]|CS-LAB-[1-2])\b/i);
    if (rMatch) requestedRoom = rMatch[1].toUpperCase();

    let title = 'Venue Booking Request';
    if (lower.includes('practice') || lower.includes('rehearsal')) title = 'Club Rehearsal / Practice';
    else if (lower.includes('workshop')) title = 'Technical Workshop';
    else if (lower.includes('guest lecture')) title = 'Guest Lecture';
    else if (lower.includes('hackathon')) title = 'Hackathon / Coding Sprint';
    else if (text.length > 5) title = text.slice(0, 40) + '...';

    result = {
      title,
      attendance,
      duration_periods: duration,
      windows: [{ day, from_period: fromPeriod, to_period: toPeriod }],
      room_types: roomTypes,
      needs,
      requested_room: requestedRoom,
      summary: `Parsed request for ${attendance} attendees on ${day} (Periods ${fromPeriod}-${toPeriod}) with ${needs.join(', ') || 'standard setup'}.`,
    };
  }

  res.json({
    success: true,
    data: result,
  });
});

router.post('/bookings', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const {
    title,
    attendance,
    duration_periods,
    windows,
    room_types,
    needs = [],
    requested_room = null,
    mandatory_for_groups = [],
    raw_text = '',
    requested_category,
  } = req.body;

  if (!title || !attendance || !duration_periods || !Array.isArray(windows) || windows.length === 0) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_REQUEST', message: 'Missing required booking fields (title, attendance, duration_periods, windows)' },
    });
    return;
  }

  const role = req.user!.role as any;
  const effectiveCategory = calculateEffectiveCategory(role, requested_category || 'club_event');
  const reqId = `BR-${Date.now().toString().slice(-4)}`;

  const newBooking: BookingRecord = {
    id: reqId,
    submitted_at: new Date().toISOString(),
    requester: req.user!.name,
    role: role === 'student' ? 'club' : role,
    requested_category: requested_category || 'club_event',
    effective_category: effectiveCategory,
    title,
    attendance: Number(attendance),
    duration_periods: Number(duration_periods),
    windows,
    room_types: Array.isArray(room_types) ? room_types : ['seminar_hall', 'lecture_hall', 'classroom'],
    needs,
    requested_room,
    mandatory_for_groups,
    raw_text,
    status: 'pending',
    created_by: req.user!.id,
  };

  await storage.saveBooking(newBooking);

  await storage.logAudit({
    user_id: req.user!.id,
    user_name: req.user!.name,
    role: req.user!.role,
    action: 'CREATE_BOOKING_REQUEST',
    resource_type: 'booking',
    resource_id: reqId,
    details: { title, attendance, effectiveCategory },
    status: 'success',
  });

  res.status(201).json({
    success: true,
    message: 'Booking request submitted successfully. Pending allocation.',
    data: newBooking,
  });
});

router.post('/bookings/:id/decision', requireRole('admin', 'department_coordinator'), async (req: AuthenticatedRequest, res: Response) => {
  const booking = await storage.getBookingById(req.params.id);
  if (!booking) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Booking ${req.params.id} not found` } });
    return;
  }

  // Enforce self-approval prevention rule
  try {
    assertNotSelfApproval(req, booking.created_by);
  } catch (err: any) {
    res.status(err.status || 403).json({
      success: false,
      error: { code: err.code || 'SELF_APPROVAL_FORBIDDEN', message: err.message },
    });
    return;
  }

  const { status, reason, room_id, day, start_period, end_period } = req.body;
  if (!['approved', 'rejected', 'alternative_offered'].includes(status)) {
    res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Status must be approved, rejected, or alternative_offered' } });
    return;
  }

  // If approving with specific room and slot, prevent conflicting double booking
  if (status === 'approved' && room_id && day && start_period && end_period) {
    const sp = Number(start_period);
    const ep = Number(end_period);

    // 1. Check against other approved bookings
    const allBookings = await storage.getAllBookings();
    for (const other of Object.values(allBookings)) {
      if (
        other.id !== booking.id &&
        other.status === 'approved' &&
        other.allocated_room === room_id &&
        other.allocated_day === day &&
        other.allocated_start_period &&
        other.allocated_end_period
      ) {
        if (sp <= other.allocated_end_period && ep >= other.allocated_start_period) {
          res.status(409).json({
            success: false,
            error: {
              code: 'DOUBLE_BOOKING_CONFLICT',
              message: `Room '${room_id}' is already booked on ${day} periods ${other.allocated_start_period}-${other.allocated_end_period} by booking ${other.id}.`,
            },
          });
          return;
        }
      }
    }

    // 2. Check against timetable sessions in approved schedule
    const approvedSchedule = await storage.getApprovedSchedule();
    if (approvedSchedule) {
      const clash = approvedSchedule.sessions.find(
        (s) => s.room_id === room_id && s.day === day && s.start_period >= sp && s.start_period <= ep
      );
      if (clash) {
        res.status(409).json({
          success: false,
          error: {
            code: 'TIMETABLE_ROOM_CONFLICT',
            message: `Room '${room_id}' is occupied by session '${clash.session_id}' on ${day} period ${clash.start_period}.`,
          },
        });
        return;
      }
    }
  }

  booking.status = status;
  booking.decision_reason = reason || `Manual decision by ${req.user!.name}`;
  booking.decided_by = req.user!.id;
  booking.decided_at = new Date().toISOString();

  if (room_id) booking.allocated_room = room_id;
  if (day) booking.allocated_day = day;
  if (start_period) booking.allocated_start_period = Number(start_period);
  if (end_period) booking.allocated_end_period = Number(end_period);

  await storage.saveBooking(booking);

  await storage.logAudit({
    user_id: req.user!.id,
    user_name: req.user!.name,
    role: req.user!.role,
    action: `BOOKING_${status.toUpperCase()}`,
    resource_type: 'booking',
    resource_id: booking.id,
    details: { reason, room_id, day },
    status: 'success',
  });

  res.json({
    success: true,
    message: `Booking ${booking.id} marked as ${status}`,
    data: booking,
  });
});

router.post('/bookings/:id/approve', requireRole('admin', 'department_coordinator'), async (req: AuthenticatedRequest, res: Response) => {
  req.body.status = 'approved';
  // Forward to decision handler
  const booking = await storage.getBookingById(req.params.id);
  if (!booking) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Booking ${req.params.id} not found` } });
    return;
  }
  try {
    assertNotSelfApproval(req, booking.created_by);
  } catch (err: any) {
    res.status(err.status || 403).json({
      success: false,
      error: { code: err.code || 'SELF_APPROVAL_FORBIDDEN', message: err.message },
    });
    return;
  }

  booking.status = 'approved';
  booking.decision_reason = req.body.reason || `Approved by ${req.user!.name}`;
  booking.decided_by = req.user!.id;
  booking.decided_at = new Date().toISOString();

  if (req.body.room_id) booking.allocated_room = req.body.room_id;
  if (req.body.day) booking.allocated_day = req.body.day;
  if (req.body.start_period) booking.allocated_start_period = Number(req.body.start_period);
  if (req.body.end_period) booking.allocated_end_period = Number(req.body.end_period);

  await storage.saveBooking(booking);
  await storage.logAudit({
    user_id: req.user!.id,
    user_name: req.user!.name,
    role: req.user!.role,
    action: 'BOOKING_APPROVED',
    resource_type: 'booking',
    resource_id: booking.id,
    status: 'success',
  });

  res.json({ success: true, message: `Booking ${booking.id} approved.`, data: booking });
});

router.post('/bookings/:id/reject', requireRole('admin', 'department_coordinator'), async (req: AuthenticatedRequest, res: Response) => {
  const booking = await storage.getBookingById(req.params.id);
  if (!booking) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Booking ${req.params.id} not found` } });
    return;
  }
  try {
    assertNotSelfApproval(req, booking.created_by);
  } catch (err: any) {
    res.status(err.status || 403).json({
      success: false,
      error: { code: err.code || 'SELF_APPROVAL_FORBIDDEN', message: err.message },
    });
    return;
  }

  booking.status = 'rejected';
  booking.decision_reason = req.body.reason || `Rejected by ${req.user!.name}`;
  booking.decided_by = req.user!.id;
  booking.decided_at = new Date().toISOString();

  await storage.saveBooking(booking);
  await storage.logAudit({
    user_id: req.user!.id,
    user_name: req.user!.name,
    role: req.user!.role,
    action: 'BOOKING_REJECTED',
    resource_type: 'booking',
    resource_id: booking.id,
    status: 'success',
  });

  res.json({ success: true, message: `Booking ${booking.id} rejected.`, data: booking });
});

// DELETE /api/bookings/:id - Withdraw or cancel a booking request
router.delete('/bookings/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const booking = await storage.getBookingById(req.params.id);
  if (!booking) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Booking ${req.params.id} not found` } });
    return;
  }

  // Only creator or admin can delete/withdraw
  if (booking.created_by !== req.user!.id && req.user!.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: { code: 'UNAUTHORIZED_WITHDRAWAL', message: 'You can only withdraw booking requests that you created.' },
    });
    return;
  }

  await storage.deleteBooking(booking.id);
  await storage.logAudit({
    user_id: req.user!.id,
    user_name: req.user!.name,
    role: req.user!.role,
    action: 'BOOKING_WITHDRAWN',
    resource_type: 'booking',
    resource_id: booking.id,
    details: { title: booking.title },
    status: 'success',
  });

  res.json({ success: true, message: `Booking ${booking.id} withdrawn successfully.` });
});

// POST /api/bookings/:id/nudge - Send reminder notification for a pending booking
router.post('/bookings/:id/nudge', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const booking = await storage.getBookingById(req.params.id);
  if (!booking) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Booking ${req.params.id} not found` } });
    return;
  }

  await storage.logAudit({
    user_id: req.user!.id,
    user_name: req.user!.name,
    role: req.user!.role,
    action: 'BOOKING_NUDGED',
    resource_type: 'booking',
    resource_id: booking.id,
    details: { title: booking.title, requested_by: req.user!.name },
    status: 'success',
  });

  res.json({
    success: true,
    message: `Reminder nudge dispatched to Timetable Chair for booking ${booking.id}.`,
  });
});

export default router;
