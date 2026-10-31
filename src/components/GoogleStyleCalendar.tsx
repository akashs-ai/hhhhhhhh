import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Filter,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  User,
  Users,
  BookOpen,
  Edit2,
  Trash2,
  X,
  ExternalLink,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react';
import { UserItem, TimetableSession } from '../types';
import { getGoogleAccessToken } from '../services/googleAuth';

export interface CalendarEventItem {
  id: string; // session_id or google event id
  summary: string;
  courseId?: string;
  kind?: string; // 'theory' | 'lab' | 'tutorial' | 'personal' | 'exam'
  day: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
  dateStr: string; // YYYY-MM-DD
  startPeriod?: number;
  duration?: number;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  startHourFraction: number; // e.g. 8.0, 9.5
  endHourFraction: number; // e.g. 9.0, 11.5
  roomId?: string;
  roomName?: string;
  facultyId?: string;
  facultyName?: string;
  groups?: string[];
  isPersonal?: boolean;
  hasConflict?: boolean;
  conflictDetails?: string;
  rawGoogleEvent?: any;
}

interface GoogleStyleCalendarProps {
  currentUser: UserItem;
  sessions?: TimetableSession[];
  onRefreshNeeded?: () => void;
  className?: string;
}

// Period to 24-hr time converter (Academic standard 8:00 AM - 7:00 PM)
const PERIOD_TIME_MAP: Record<number, { start: string; end: string; startFraction: number; endFraction: number }> = {
  1: { start: '08:00', end: '09:00', startFraction: 8.0, endFraction: 9.0 },
  2: { start: '09:00', end: '10:00', startFraction: 9.0, endFraction: 10.0 },
  3: { start: '10:00', end: '11:00', startFraction: 10.0, endFraction: 11.0 },
  4: { start: '11:00', end: '12:00', startFraction: 11.0, endFraction: 12.0 },
  5: { start: '12:00', end: '13:00', startFraction: 12.0, endFraction: 13.0 },
  6: { start: '14:00', end: '15:00', startFraction: 14.0, endFraction: 15.0 },
  7: { start: '15:00', end: '16:00', startFraction: 15.0, endFraction: 16.0 },
  8: { start: '16:00', end: '17:00', startFraction: 16.0, endFraction: 17.0 },
  9: { start: '17:00', end: '18:00', startFraction: 17.0, endFraction: 18.0 },
  10: { start: '18:00', end: '19:00', startFraction: 18.0, endFraction: 19.0 },
};

const DAY_NAMES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;

export const GoogleStyleCalendar: React.FC<GoogleStyleCalendarProps> = ({
  currentUser,
  sessions: initialSessions = [],
  onRefreshNeeded,
  className = '',
}) => {
  // Primary view selector: Exactly TWO options ('week' is default)
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
  
  // Base reference date (defaults to current date, or semester baseline)
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 9, 19)); // Mon Oct 19, 2026 baseline
  
  // Live schedule & personal events state
  const [liveSessions, setLiveSessions] = useState<any[]>([]);
  const [personalEvents, setPersonalEvents] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);

  // Filters state
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedSem, setSelectedSem] = useState<string>('All');
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [classTypes, setClassTypes] = useState({
    theory: true,
    lab: true,
    tutorial: true,
    personal: true,
  });

  // Modal states
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [createSlotInfo, setCreateSlotInfo] = useState<{ day: string; dateStr: string; startPeriod: number } | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [mutationLoading, setMutationLoading] = useState(false);

  // Form states for Create/Edit
  const [formCourseId, setFormCourseId] = useState('CS-501');
  const [formKind, setFormKind] = useState<'theory' | 'lab' | 'tutorial'>('theory');
  const [formDay, setFormDay] = useState<string>('MON');
  const [formStartPeriod, setFormStartPeriod] = useState<number>(2);
  const [formDuration, setFormDuration] = useState<number>(1);
  const [formRoomId, setFormRoomId] = useState('L-301');
  const [formFacultyId, setFormFacultyId] = useState('F01');
  const [formGroups, setFormGroups] = useState('CSE-3');

  // Rooms and faculty lookup
  const [availableRooms, setAvailableRooms] = useState<Array<{ id: string; name: string }>>([
    { id: 'L-301', name: 'L-301 (Aud. B)' },
    { id: 'L-302', name: 'L-302 Lecture Hall' },
    { id: 'L-204', name: 'L-204 Seminar Room' },
    { id: 'Turing-Lab-02', name: 'Turing Lab 02' },
    { id: 'VLSI-Lab-3', name: 'VLSI Micro Lab 3' },
    { id: 'Networks-Lab-A', name: 'Networks Lab A' },
    { id: 'Bose-Hall', name: 'Bose Hall' },
  ]);

  const [availableFaculty, setAvailableFaculty] = useState<Array<{ id: string; name: string }>>([
    { id: 'F01', name: 'Prof. Alan Turing' },
    { id: 'F19', name: 'Dr. Shalini Gupta' },
    { id: 'F05', name: 'Dr. K. Mahapatra' },
    { id: 'F08', name: 'Prof. N. Patnaik' },
    { id: 'F12', name: 'Prof. A. Ray' },
  ]);

  const canEdit = currentUser.role === 'admin' || currentUser.role === 'department_coordinator';

  // Fetch timetable and calendar events from server
  const fetchCalendarData = async () => {
    setLoading(true);
    setCalendarError(null);
    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${currentUser.token || currentUser.id}`,
      };

      // 1. Fetch live timetable (including approved bookings)
      const ttRes = await fetch('/api/timetable?include_bookings=true', { headers });
      if (ttRes.ok) {
        const ttData = await ttRes.json();
        if (ttData.success && Array.isArray(ttData.data)) {
          setLiveSessions(ttData.data);
        }
      }

      // 2. Fetch Google Calendar events overlay & conflicts
      const calRes = await fetch('/api/calendar/events', { headers });
      if (calRes.ok) {
        const calData = await calRes.json();
        if (calData.success) {
          setPersonalEvents(calData.personal_events || []);
          setConflicts(calData.conflicts || []);
        }
      }
    } catch (err: any) {
      setCalendarError('Unable to load live timetable sessions: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
    const timer = setInterval(() => {
      fetchCalendarData();
    }, 15000);
    const handleFocus = () => {
      fetchCalendarData();
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentUser]);

  // Compute Week Dates based on currentDate (Monday to Sunday)
  const weekDates = useMemo(() => {
    const dates: Array<{
      dayName: (typeof DAY_NAMES)[number];
      date: Date;
      dateStr: string;
      label: string;
      dayNumber: number;
      shortDateStr: string;
      isToday: boolean;
    }> = [];
    const curr = new Date(currentDate);
    const dayOfWeek = (curr.getDay() + 6) % 7; // Monday = 0
    const monday = new Date(curr);
    monday.setDate(curr.getDate() - dayOfWeek);

    const todayStr = new Date().toISOString().split('T')[0];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dayName = DAY_NAMES[i];
      const dateStr = d.toISOString().split('T')[0];
      const isToday = dateStr === todayStr;
      const dayNumber = d.getDate();
      const shortDateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

      dates.push({
        dayName,
        date: d,
        dateStr,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dayNumber,
        shortDateStr,
        isToday,
      });
    }
    return dates;
  }, [currentDate]);

  // Date Range Heading
  const dateRangeHeading = useMemo(() => {
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    const first = weekDates[0].date;
    const last = weekDates[6].date;
    const sameYear = first.getFullYear() === last.getFullYear();
    const firstStr = first.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const lastStr = last.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return `${firstStr} – ${lastStr}`;
  }, [viewMode, currentDate, weekDates]);

  // Navigation handlers
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === 'day') {
      next.setDate(next.getDate() - 1);
    } else {
      next.setDate(next.getDate() - 7);
    }
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === 'day') {
      next.setDate(next.getDate() + 1);
    } else {
      next.setDate(next.getDate() + 7);
    }
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 9, 19)); // Jump to active academic week
  };

  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const parts = e.target.value.split('-');
      const picked = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      setCurrentDate(picked);
    }
  };

  // Convert raw sessions into structured CalendarEventItems
  const allCalendarEvents = useMemo(() => {
    const events: CalendarEventItem[] = [];

    // Map conflicts by session_id
    const conflictMap = new Map<string, string>();
    for (const c of conflicts) {
      if (c.sessionId) conflictMap.set(c.sessionId, c.details || 'External change detected in Google Calendar');
    }

    // 1. Process Academic Timetable Sessions
    const sessionsList = liveSessions.length > 0 ? liveSessions : initialSessions;
    for (const s of sessionsList) {
      const dayIndex = DAY_NAMES.indexOf(s.day as any);
      if (dayIndex === -1) continue;

      const dateObj = weekDates[dayIndex];
      const startP = Number(s.start_period) || 1;
      const dur = Number(s.duration) || 1;
      const endP = startP + dur - 1;

      const timeSlotStart = PERIOD_TIME_MAP[startP] || { start: '08:00', startFraction: 8.0 };
      const timeSlotEnd = PERIOD_TIME_MAP[endP] || { end: '09:00', endFraction: 9.0 };

      // Apply filters: Department, Semester, Section, ClassType, Search
      if (selectedDept !== 'All' && s.department && s.department !== selectedDept) continue;
      if (selectedSection !== 'All') {
        const matchesSection = (s.groups || []).some((g: string) => g.includes(selectedSection));
        if (!matchesSection) continue;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          (s.course_id && s.course_id.toLowerCase().includes(q)) ||
          (s.faculty_name && s.faculty_name.toLowerCase().includes(q)) ||
          (s.room_name && s.room_name.toLowerCase().includes(q)) ||
          (s.groups && s.groups.some((g: string) => g.toLowerCase().includes(q)));
        if (!matches) continue;
      }

      const kindNormalized = (s.kind || 'theory').toLowerCase();
      if (kindNormalized.includes('lab') && !classTypes.lab) continue;
      if (kindNormalized.includes('tutorial') && !classTypes.tutorial) continue;
      if (kindNormalized.includes('theory') && !classTypes.theory) continue;

      events.push({
        id: s.session_id,
        summary: `${s.course_id || 'Class'} (${(s.groups || []).join(', ')})`,
        courseId: s.course_id,
        kind: s.kind || 'theory',
        day: s.day as any,
        dateStr: dateObj?.dateStr || '',
        startPeriod: startP,
        duration: dur,
        startTime: timeSlotStart.start,
        endTime: timeSlotEnd.end,
        startHourFraction: timeSlotStart.startFraction,
        endHourFraction: timeSlotEnd.endFraction,
        roomId: s.room_id,
        roomName: s.room_name || s.room_id,
        facultyId: s.faculty_id,
        facultyName: s.faculty_name || s.faculty_id,
        groups: s.groups || [],
        isPersonal: false,
        hasConflict: conflictMap.has(s.session_id),
        conflictDetails: conflictMap.get(s.session_id),
      });
    }

    // 2. Process Personal Google Calendar Events
    if (classTypes.personal && personalEvents.length > 0) {
      for (const p of personalEvents) {
        if (!p.start?.dateTime) continue;
        const startDt = new Date(p.start.dateTime);
        const endDt = p.end?.dateTime ? new Date(p.end.dateTime) : new Date(startDt.getTime() + 3600000);

        const pDateStr = startDt.toISOString().split('T')[0];
        // Match against week dates
        const matchingWeekDate = weekDates.find((w) => w.dateStr === pDateStr);
        if (!matchingWeekDate) continue;

        const startFrac = startDt.getHours() + startDt.getMinutes() / 60;
        const endFrac = endDt.getHours() + endDt.getMinutes() / 60;

        events.push({
          id: p.id,
          summary: p.summary || 'Google Calendar Event',
          kind: 'personal',
          day: matchingWeekDate.dayName,
          dateStr: pDateStr,
          startTime: `${String(startDt.getHours()).padStart(2, '0')}:${String(startDt.getMinutes()).padStart(2, '0')}`,
          endTime: `${String(endDt.getHours()).padStart(2, '0')}:${String(endDt.getMinutes()).padStart(2, '0')}`,
          startHourFraction: Math.max(8, startFrac),
          endHourFraction: Math.min(19, Math.max(startFrac + 0.5, endFrac)),
          roomName: p.location || 'External',
          facultyName: 'Personal',
          isPersonal: true,
          rawGoogleEvent: p,
        });
      }
    }

    return events;
  }, [liveSessions, initialSessions, personalEvents, conflicts, weekDates, selectedDept, selectedSection, searchQuery, classTypes]);

  // Filter events according to active view (Day vs Week)
  const displayedEvents = useMemo(() => {
    if (viewMode === 'day') {
      const activeDayOfWeek = (currentDate.getDay() + 6) % 7;
      const activeDayName = DAY_NAMES[activeDayOfWeek];
      const activeDateStr = currentDate.toISOString().split('T')[0];
      return allCalendarEvents.filter((e) => e.day === activeDayName || e.dateStr === activeDateStr);
    }
    return allCalendarEvents;
  }, [viewMode, currentDate, allCalendarEvents]);

  // Layout Algorithm: Group overlapping events side-by-side within each day column
  const eventsWithLayout = useMemo(() => {
    const dayGroups: Record<string, CalendarEventItem[]> = {};
    for (const d of DAY_NAMES) dayGroups[d] = [];

    for (const ev of displayedEvents) {
      if (dayGroups[ev.day]) {
        dayGroups[ev.day].push(ev);
      }
    }

    const positionedEvents: Array<CalendarEventItem & { colIndex: number; totalCols: number }> = [];

    for (const day of DAY_NAMES) {
      const dayEvts = dayGroups[day].sort((a, b) => a.startHourFraction - b.startHourFraction);
      const columns: CalendarEventItem[][] = [];

      for (const ev of dayEvts) {
        let placed = false;
        for (let i = 0; i < columns.length; i++) {
          const lastInCol = columns[i][columns[i].length - 1];
          if (lastInCol.endHourFraction <= ev.startHourFraction) {
            columns[i].push(ev);
            placed = true;
            break;
          }
        }
        if (!placed) {
          columns.push([ev]);
        }
      }

      // Assign colIndex and totalCols
      for (let colIdx = 0; colIdx < columns.length; colIdx++) {
        for (const ev of columns[colIdx]) {
          positionedEvents.push({
            ...ev,
            colIndex: colIdx,
            totalCols: Math.max(1, columns.length),
          });
        }
      }
    }

    return positionedEvents;
  }, [displayedEvents]);

  // Event handlers for CRUD
  const handleSlotClick = (dayName: string, dateStr: string, hour: number) => {
    if (!canEdit) return;

    // Find period matching hour
    let p = 1;
    for (const [periodNum, timeObj] of Object.entries(PERIOD_TIME_MAP)) {
      if (Math.floor(timeObj.startFraction) === hour) {
        p = Number(periodNum);
        break;
      }
    }

    setCreateSlotInfo({ day: dayName, dateStr, startPeriod: p });
    setFormDay(dayName);
    setFormStartPeriod(p);
    setFormDuration(1);
    setFormCourseId('CS-501');
    setFormKind('theory');
    setFormRoomId('L-301');
    setFormFacultyId('F01');
    setFormGroups('CSE-3');
    setMutationError(null);
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMutationLoading(true);
    setMutationError(null);

    try {
      const res = await fetch('/api/timetable/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token || currentUser.id}`,
        },
        body: JSON.stringify({
          course_id: formCourseId,
          kind: formKind,
          day: formDay,
          start_period: Number(formStartPeriod),
          duration: Number(formDuration),
          room_id: formRoomId,
          faculty_id: formFacultyId,
          groups: formGroups.split(',').map((g) => g.trim()).filter(Boolean),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to create timetable session');
      }

      setIsCreateModalOpen(false);
      await fetchCalendarData();
      if (onRefreshNeeded) onRefreshNeeded();
    } catch (err: any) {
      setMutationError(err.message);
    } finally {
      setMutationLoading(false);
    }
  };

  const handleEditClick = (event: CalendarEventItem) => {
    setSelectedEvent(event);
    setFormCourseId(event.courseId || '');
    setFormKind((event.kind as any) || 'theory');
    setFormDay(event.day);
    setFormStartPeriod(event.startPeriod || 1);
    setFormDuration(event.duration || 1);
    setFormRoomId(event.roomId || 'L-301');
    setFormFacultyId(event.facultyId || 'F01');
    setFormGroups((event.groups || []).join(', '));
    setMutationError(null);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    setMutationLoading(true);
    setMutationError(null);

    try {
      const res = await fetch(`/api/timetable/sessions/${encodeURIComponent(selectedEvent.id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token || currentUser.id}`,
        },
        body: JSON.stringify({
          day: formDay,
          start_period: Number(formStartPeriod),
          duration: Number(formDuration),
          room_id: formRoomId,
          faculty_id: formFacultyId,
          groups: formGroups.split(',').map((g) => g.trim()).filter(Boolean),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to update timetable session');
      }

      setIsEditModalOpen(false);
      setSelectedEvent(null);
      await fetchCalendarData();
      if (onRefreshNeeded) onRefreshNeeded();
    } catch (err: any) {
      setMutationError(err.message);
    } finally {
      setMutationLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm(`Delete session '${sessionId}' from timetable?`)) return;

    setMutationLoading(true);
    try {
      const googleToken = getGoogleAccessToken();
      const headers: Record<string, string> = {
        Authorization: `Bearer ${currentUser.token || currentUser.id}`,
      };
      if (googleToken) headers['x-google-token'] = googleToken;

      const res = await fetch(`/api/timetable/sessions/${encodeURIComponent(sessionId)}`, {
        method: 'DELETE',
        headers,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to delete session');
      }

      setSelectedEvent(null);
      await fetchCalendarData();
      if (onRefreshNeeded) onRefreshNeeded();
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    } finally {
      setMutationLoading(false);
    }
  };

  // Hours array for Grid: 8:00 AM to 7:00 PM (8 to 19)
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

  // Helper color tags based on kind
  const getEventBadgeClass = (kind?: string, isPersonal?: boolean, hasConflict?: boolean) => {
    if (hasConflict) {
      return 'bg-amber-50/95 border-amber-300 border-l-4 border-l-red-500 text-amber-950 ring-1 ring-red-400';
    }
    if (isPersonal) {
      return 'bg-purple-50/95 border-purple-200 border-l-4 border-l-purple-500 text-purple-950';
    }
    const k = (kind || 'theory').toLowerCase();
    if (k.includes('lab') || k.includes('practical')) {
      return 'bg-emerald-50/95 border-emerald-200 border-l-4 border-l-emerald-500 text-emerald-950';
    }
    if (k.includes('tutorial')) {
      return 'bg-amber-50/95 border-amber-200 border-l-4 border-l-amber-500 text-amber-950';
    }
    if (k.includes('exam')) {
      return 'bg-rose-50/95 border-rose-200 border-l-4 border-l-rose-500 text-rose-950';
    }
    if (k.includes('event') || k.includes('booking') || k.includes('lecture') || k.includes('club')) {
      return 'bg-orange-50/95 border-orange-200 border-l-4 border-l-orange-400 text-orange-950';
    }
    // Default theory
    return 'bg-blue-50/95 border-blue-200 border-l-4 border-l-blue-500 text-blue-950';
  };

  const getEventPillHeaderClass = (kind?: string, isPersonal?: boolean, hasConflict?: boolean) => {
    if (hasConflict) return 'bg-amber-500';
    if (isPersonal) return 'bg-purple-600';
    const k = (kind || 'theory').toLowerCase();
    if (k.includes('lab')) return 'bg-emerald-500';
    if (k.includes('tutorial')) return 'bg-amber-500';
    if (k.includes('exam')) return 'bg-rose-500';
    if (k.includes('event') || k.includes('booking')) return 'bg-orange-500';
    return 'bg-blue-600';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Google Calendar-Style Controls Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: View selector toggle (Day vs Week) & Navigation */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Selector: Exactly TWO options (Day, Week) */}
            <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('day')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'day'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Day
              </button>
              <button
                type="button"
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'week'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Week
              </button>
            </div>

            {/* Today Button */}
            <button
              type="button"
              onClick={handleToday}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs cursor-pointer transition-colors"
            >
              Today
            </button>

            {/* Prev / Next Buttons */}
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous period"
                className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl cursor-pointer shadow-2xs transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next period"
                className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl cursor-pointer shadow-2xs transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Clear Date Range Heading */}
            <div className="text-sm font-extrabold text-slate-900 px-1 tracking-tight flex items-center space-x-2">
              <span>{dateRangeHeading}</span>
            </div>
          </div>

          {/* Right: Date Picker Jump & Quick Add Event */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Date Picker Input */}
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600">
              <CalendarIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <input
                type="date"
                value={currentDate.toISOString().split('T')[0]}
                onChange={handleDatePickerChange}
                className="bg-transparent border-none text-xs font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
              />
            </div>

            {/* Refresh Live Events */}
            <button
              type="button"
              onClick={fetchCalendarData}
              disabled={loading}
              title="Refresh calendar sessions and Google sync"
              className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl shadow-2xs cursor-pointer transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            {/* Create Event Button (for authorized users) */}
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  setCreateSlotInfo({ day: 'MON', dateStr: weekDates[0].dateStr, startPeriod: 1 });
                  setFormDay('MON');
                  setFormStartPeriod(1);
                  setIsCreateModalOpen(true);
                }}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Class</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider flex items-center space-x-1">
              <Filter className="w-3 h-3 text-slate-400" />
              <span>Filters:</span>
            </span>

            {/* Department */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 font-medium"
            >
              <option value="All">All Departments</option>
              <option value="CSE">CSE</option>
              <option value="ECE">ECE</option>
            </select>

            {/* Section */}
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 font-medium"
            >
              <option value="All">All Cohorts / Sections</option>
              <option value="CSE-3">CSE - 3rd Sem</option>
              <option value="Y1-A">Year 1 - A</option>
              <option value="Y1-B">Year 1 - B</option>
            </select>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2 top-2 text-slate-400" />
              <input
                type="text"
                placeholder="Search course, room, faculty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 w-44 sm:w-56"
              />
            </div>
          </div>

          {/* Class Type Checkboxes */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 font-medium">
            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={classTypes.theory}
                onChange={(e) => setClassTypes({ ...classTypes, theory: e.target.checked })}
                className="rounded text-blue-600 focus:ring-0 cursor-pointer"
              />
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>Theory</span>
              </span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={classTypes.lab}
                onChange={(e) => setClassTypes({ ...classTypes, lab: e.target.checked })}
                className="rounded text-sky-600 focus:ring-0 cursor-pointer"
              />
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                <span>Lab</span>
              </span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={classTypes.tutorial}
                onChange={(e) => setClassTypes({ ...classTypes, tutorial: e.target.checked })}
                className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
              />
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                <span>Tutorial</span>
              </span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={classTypes.personal}
                onChange={(e) => setClassTypes({ ...classTypes, personal: e.target.checked })}
                className="rounded text-purple-600 focus:ring-0 cursor-pointer"
              />
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>Google Personal</span>
              </span>
            </label>
          </div>
        </div>
      </div>

      {calendarError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{calendarError}</span>
        </div>
      )}

      {/* Main Google Calendar Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
        {/* All-Day Events Banner Section */}
        <div className="border-b border-slate-200 bg-slate-50/70 p-2.5 px-4 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-200/70 px-2 py-0.5 rounded">
              All Day
            </span>
            <span className="font-semibold text-slate-700">Autumn Academic Term 2026 • Regular Lecture Routine</span>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Click empty slot to schedule • Click class block for details
          </span>
        </div>

        {/* Days Header Row */}
        <div className="grid grid-cols-12 border-b border-slate-200 bg-slate-50/50 sticky top-0 z-10">
          {/* Time Gutter Column header with GMT Timezone */}
          <div className="col-span-1 p-2 sm:p-2.5 flex items-center justify-center border-r border-slate-200">
            <span className="text-[11px] font-semibold text-slate-400">GMT+5:30</span>
          </div>

          {/* Active Days Columns header */}
          {viewMode === 'day' ? (
            (() => {
              const activeDayOfWeek = (currentDate.getDay() + 6) % 7;
              const activeDayObj = weekDates[activeDayOfWeek] || weekDates[0];
              return (
                <div className="col-span-11 p-2.5 text-center flex flex-col items-center justify-center">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {activeDayObj.dayName}
                  </div>
                  {activeDayObj.isToday ? (
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-xs mt-0.5">
                      {activeDayObj.dayNumber}
                    </div>
                  ) : (
                    <div className="text-sm font-bold text-slate-800 mt-1">
                      {activeDayObj.shortDateStr}
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            // Week View: 7 Days (Mon - Sun)
            <div className="col-span-11 grid grid-cols-7 divide-x divide-slate-200">
              {weekDates.map((col) => (
                <div key={col.dayName} className="p-2 sm:p-2.5 text-center flex flex-col items-center justify-center">
                  <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {col.dayName}
                  </div>
                  {col.isToday ? (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-xs mt-1">
                      {col.dayNumber}
                    </div>
                  ) : (
                    <div className="text-xs sm:text-sm font-semibold text-slate-700 mt-1">
                      {col.shortDateStr}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Time Grid Body */}
        <div className="relative overflow-x-auto min-w-[650px] sm:min-w-0">
          <div className="grid grid-cols-12 relative divide-x divide-slate-200">
            {/* Time labels column */}
            <div className="col-span-1 divide-y divide-slate-100 bg-slate-50/20">
              {hours.map((h) => (
                <div key={h} className="h-16 pr-2.5 text-right text-[11px] text-slate-400 font-medium font-mono pt-1">
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Days Schedule Content Area */}
            {viewMode === 'day' ? (
              (() => {
                const activeDayOfWeek = (currentDate.getDay() + 6) % 7;
                const activeDayObj = weekDates[activeDayOfWeek] || weekDates[0];

                return (
                  <div className="col-span-11 relative">
                    {/* Hour row background lines & clickable slot trigger */}
                    <div className="divide-y divide-slate-100">
                      {hours.map((h) => (
                        <div
                          key={h}
                          onClick={() => handleSlotClick(activeDayObj.dayName, activeDayObj.dateStr, h)}
                          className={`h-16 group hover:bg-blue-50/20 transition-colors ${
                            canEdit ? 'cursor-pointer' : ''
                          }`}
                        >
                          {canEdit && (
                            <span className="opacity-0 group-hover:opacity-100 text-[10px] font-semibold text-blue-600 pl-2 pt-1 inline-flex items-center space-x-1">
                              <Plus className="w-2.5 h-2.5" />
                              <span>Add slot {h}:00</span>
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Today indicator line if current date is today */}
                    {activeDayObj.isToday && (
                      <div
                        className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                        style={{
                          top: `${((new Date().getHours() + new Date().getMinutes() / 60 - 8) / 12) * 100}%`,
                        }}
                      >
                        <div className="w-2.5 h-2.5 rounded-full bg-red-600 -ml-1"></div>
                        <div className="h-[2px] bg-red-500 w-full shadow-xs"></div>
                      </div>
                    )}

                    {/* Event Blocks */}
                    {eventsWithLayout
                      .filter((e) => e.day === activeDayObj.dayName)
                      .map((ev) => {
                        const topPercent = ((ev.startHourFraction - 8) / 12) * 100;
                        const heightPercent = ((ev.endHourFraction - ev.startHourFraction) / 12) * 100;
                        const widthPercent = 100 / ev.totalCols;
                        const leftPercent = ev.colIndex * widthPercent;

                        return (
                          <div
                            key={ev.id}
                            onClick={() => setSelectedEvent(ev)}
                            style={{
                              top: `${Math.max(0, topPercent)}%`,
                              height: `${Math.max(5, heightPercent)}%`,
                              left: `${leftPercent}%`,
                              width: `${widthPercent}%`,
                            }}
                            className={`absolute z-10 p-2.5 m-0.5 rounded-lg border text-xs shadow-2xs transition-all hover:shadow-md cursor-pointer flex flex-col justify-between overflow-hidden ${getEventBadgeClass(
                              ev.kind,
                              ev.isPersonal,
                              ev.hasConflict
                            )}`}
                          >
                            <div>
                              <div className="text-[10px] text-slate-500 font-semibold tracking-tight">
                                {ev.startTime} – {ev.endTime}
                              </div>
                              <div className="font-bold text-[11px] sm:text-xs text-slate-900 leading-snug line-clamp-1 mt-0.5 flex items-center justify-between gap-1">
                                <span className="truncate">{ev.summary}</span>
                                {ev.hasConflict && (
                                  <span title="Conflict detected">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="text-[10px] text-slate-600 truncate mt-auto pt-1">
                              {ev.roomName} {ev.facultyName && ev.facultyName !== 'Personal' ? `• ${ev.facultyName}` : ''}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                );
              })()
            ) : (
              // Week View Grid: 7 day columns
              <div className="col-span-11 grid grid-cols-7 divide-x divide-slate-200 relative">
                {weekDates.map((col) => (
                  <div key={col.dayName} className="relative">
                    {/* Hour slot clickable backgrounds */}
                    <div className="divide-y divide-slate-100">
                      {hours.map((h) => (
                        <div
                          key={h}
                          onClick={() => handleSlotClick(col.dayName, col.dateStr, h)}
                          className={`h-16 group hover:bg-blue-50/20 transition-colors ${
                            canEdit ? 'cursor-pointer' : ''
                          }`}
                        >
                          {canEdit && (
                            <span className="opacity-0 group-hover:opacity-100 text-[9px] font-semibold text-blue-600 pl-1 inline-flex items-center">
                              <Plus className="w-2 h-2" />
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Today indicator line */}
                    {col.isToday && (
                      <div
                        className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                        style={{
                          top: `${((new Date().getHours() + new Date().getMinutes() / 60 - 8) / 12) * 100}%`,
                        }}
                      >
                        <div className="w-2 h-2 rounded-full bg-red-600 -ml-1"></div>
                        <div className="h-[2px] bg-red-500 w-full shadow-xs"></div>
                      </div>
                    )}

                    {/* Events for this day column */}
                    {eventsWithLayout
                      .filter((e) => e.day === col.dayName)
                      .map((ev) => {
                        const topPercent = ((ev.startHourFraction - 8) / 12) * 100;
                        const heightPercent = ((ev.endHourFraction - ev.startHourFraction) / 12) * 100;
                        const widthPercent = 100 / ev.totalCols;
                        const leftPercent = ev.colIndex * widthPercent;

                        return (
                          <div
                            key={ev.id}
                            onClick={() => setSelectedEvent(ev)}
                            style={{
                              top: `${Math.max(0, topPercent)}%`,
                              height: `${Math.max(5, heightPercent)}%`,
                              left: `${leftPercent}%`,
                              width: `${widthPercent}%`,
                            }}
                            className={`absolute z-10 p-2 m-0.5 rounded-lg border text-xs shadow-2xs transition-all hover:shadow-md cursor-pointer flex flex-col justify-between overflow-hidden ${getEventBadgeClass(
                              ev.kind,
                              ev.isPersonal,
                              ev.hasConflict
                            )}`}
                          >
                            <div>
                              <div className="text-[10px] text-slate-500 font-semibold tracking-tight">
                                {ev.startTime} – {ev.endTime}
                              </div>
                              <div className="font-bold text-[11px] text-slate-900 leading-snug line-clamp-1 mt-0.5 flex items-center justify-between gap-0.5">
                                <span className="truncate">{ev.courseId || ev.summary}</span>
                                {ev.hasConflict && (
                                  <span title="Conflict detected">
                                    <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="text-[10px] text-slate-600 truncate mt-auto pt-0.5">
                              {ev.roomName}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. EVENT DETAILS MODAL                                                    */}
      {/* ========================================================================= */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl p-6 space-y-4 text-xs">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <span
                  className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded-md mb-1 ${
                    selectedEvent.isPersonal
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {selectedEvent.kind?.toUpperCase() || 'SESSION'}
                </span>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  {selectedEvent.summary}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conflict Banner if present */}
            {selectedEvent.hasConflict && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Google Calendar Sync Conflict</div>
                  <div className="text-[11px] mt-0.5">{selectedEvent.conflictDetails}</div>
                </div>
              </div>
            )}

            {/* Details Grid */}
            <div className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex items-center space-x-2 text-slate-700">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  <strong className="text-slate-900">{selectedEvent.day}</strong> • {selectedEvent.startTime} – {selectedEvent.endTime}
                  {selectedEvent.duration ? ` (${selectedEvent.duration} period${selectedEvent.duration > 1 ? 's' : ''})` : ''}
                </span>
              </div>

              <div className="flex items-center space-x-2 text-slate-700">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Venue: <strong className="text-slate-900">{selectedEvent.roomName || 'N/A'}</strong></span>
              </div>

              <div className="flex items-center space-x-2 text-slate-700">
                <User className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Instructor: <strong className="text-slate-900">{selectedEvent.facultyName || 'N/A'}</strong></span>
              </div>

              {selectedEvent.groups && selectedEvent.groups.length > 0 && (
                <div className="flex items-center space-x-2 text-slate-700">
                  <Users className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Cohorts: <strong className="text-slate-900">{selectedEvent.groups.join(', ')}</strong></span>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="text-[11px] text-slate-400 font-mono">
                ID: {selectedEvent.id}
              </div>

              <div className="flex items-center space-x-2">
                {canEdit && !selectedEvent.isPersonal && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleEditClick(selectedEvent)}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs flex items-center space-x-1"
                    >
                      <Edit2 className="w-3 h-3 text-slate-500" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      disabled={mutationLoading}
                      onClick={() => handleDeleteSession(selectedEvent.id)}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold rounded-xl text-xs flex items-center space-x-1 disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CREATE EVENT MODAL                                                     */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <form
            onSubmit={handleCreateSubmit}
            className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl p-6 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Schedule Academic Session</h3>
                  <div className="text-[10px] text-slate-500">Add clash-free teaching slot to master timetable</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {mutationError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs">
                {mutationError}
              </div>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Course Code</label>
                  <input
                    type="text"
                    required
                    value={formCourseId}
                    onChange={(e) => setFormCourseId(e.target.value)}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                    placeholder="e.g. CS-501"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Type</label>
                  <select
                    value={formKind}
                    onChange={(e) => setFormKind(e.target.value as any)}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                  >
                    <option value="theory">Theory Lecture</option>
                    <option value="lab">Lab / Practical</option>
                    <option value="tutorial">Tutorial</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Day</label>
                  <select
                    value={formDay}
                    onChange={(e) => setFormDay(e.target.value)}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                  >
                    {DAY_NAMES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Start Period</label>
                  <select
                    value={formStartPeriod}
                    onChange={(e) => setFormStartPeriod(Number(e.target.value))}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                  >
                    {Object.entries(PERIOD_TIME_MAP).map(([p, info]) => (
                      <option key={p} value={p}>
                        P{p} ({info.start})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Duration</label>
                  <select
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                  >
                    <option value={1}>1 Period</option>
                    <option value={2}>2 Periods</option>
                    <option value={3}>3 Periods</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Allocated Room</label>
                <select
                  value={formRoomId}
                  onChange={(e) => setFormRoomId(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                >
                  {availableRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Assigned Faculty</label>
                <select
                  value={formFacultyId}
                  onChange={(e) => setFormFacultyId(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                >
                  {availableFaculty.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Cohorts / Student Groups</label>
                <input
                  type="text"
                  required
                  value={formGroups}
                  onChange={(e) => setFormGroups(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                  placeholder="e.g. CSE-3, CSE-A"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutationLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold disabled:opacity-50"
              >
                {mutationLoading ? 'Saving...' : 'Add Session'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. EDIT EVENT MODAL                                                       */}
      {/* ========================================================================= */}
      {isEditModalOpen && selectedEvent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <form
            onSubmit={handleEditSubmit}
            className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl p-6 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Reschedule Session</h3>
                <div className="text-[10px] text-slate-500">Modify slot, room, or faculty with conflict detection</div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {mutationError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs">
                {mutationError}
              </div>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Day</label>
                  <select
                    value={formDay}
                    onChange={(e) => setFormDay(e.target.value)}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                  >
                    {DAY_NAMES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Start Period</label>
                  <select
                    value={formStartPeriod}
                    onChange={(e) => setFormStartPeriod(Number(e.target.value))}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                  >
                    {Object.entries(PERIOD_TIME_MAP).map(([p, info]) => (
                      <option key={p} value={p}>
                        P{p} ({info.start})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Duration</label>
                  <select
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                  >
                    <option value={1}>1 Period</option>
                    <option value={2}>2 Periods</option>
                    <option value={3}>3 Periods</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Room</label>
                <select
                  value={formRoomId}
                  onChange={(e) => setFormRoomId(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                >
                  {availableRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Faculty</label>
                <select
                  value={formFacultyId}
                  onChange={(e) => setFormFacultyId(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                >
                  {availableFaculty.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Cohorts</label>
                <input
                  type="text"
                  required
                  value={formGroups}
                  onChange={(e) => setFormGroups(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutationLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold disabled:opacity-50"
              >
                {mutationLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
