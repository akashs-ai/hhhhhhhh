import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  FileCheck,
  AlertTriangle,
  Building2,
  Download,
  RefreshCw,
  Users,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { UserItem } from '../../types';
import { googleSignIn, getGoogleAccessToken, googleSignOut } from '../../services/googleAuth';
import { StaggerContainer, CardTransition, Skeleton } from '../../components/ui/motion';

interface FacultyDashboardProps {
  currentUser: UserItem;
  onNavigateTab: (tab: string) => void;
}

interface FacultySummary {
  role: string;
  user_name: string;
  department: string;
  faculty_id: string;
  today: {
    day: string;
    is_weekend: boolean;
    classes_count: number;
    classes: Array<{
      session_id: string;
      course_code: string;
      course_title: string;
      kind: string;
      room_id: string;
      group_id: string;
      day: string;
      start_period: number;
      duration: number;
      time_slot: string;
      student_count: number;
    }>;
  };
  stats: {
    today_load_classes: number;
    weekly_hours: number;
    weekly_target_hours: number;
    weekly_met_pct: number;
    upcoming_exams_count: number;
    pending_requests_count: number;
  };
  assigned_courses: Array<{
    course_code: string;
    course_title: string;
    section: string;
    weekly_load_hours: number;
    room_id: string;
    syllabus_progress: string;
  }>;
  upcoming_exams: Array<{
    exam_id: string;
    title: string;
    day: string;
    session: string;
    time: string;
    rooms: string;
    role: string;
  }>;
  pending_requests: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
  }>;
}

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({
  currentUser,
  onNavigateTab,
}) => {
  const [summaryData, setSummaryData] = useState<FacultySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [attendanceStarted, setAttendanceStarted] = useState(false);
  const [calendarSyncing, setCalendarSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [calendarConn, setCalendarConn] = useState<{
    connected: boolean;
    email: string | null;
    last_synced_at: string | null;
    events_synced: number;
  }>({ connected: false, email: null, last_synced_at: null, events_synced: 0 });

  // Fetch real database-backed faculty summary
  const fetchSummary = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);

    try {
      const token = currentUser.token || (typeof window !== 'undefined' ? localStorage.getItem('cit_auth_token') : '') || '';
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/dashboard/summary', { headers });
      const json = await res.json();
      if (res.ok && json.success) {
        setSummaryData(json);
      }
    } catch (err) {
      console.warn('Faculty dashboard summary fetch notice:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchSummary();

    const handleMutation = () => fetchSummary(false);
    window.addEventListener('cit:data-mutated', handleMutation);

    return () => {
      window.removeEventListener('cit:data-mutated', handleMutation);
    };
  }, [fetchSummary]);

  // Google Calendar status
  useEffect(() => {
    fetch('/api/calendar/status', {
      headers: { Authorization: `Bearer ${currentUser.token || currentUser.id}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.connection) {
          setCalendarConn(data.connection);
        }
      })
      .catch(() => {});
  }, [currentUser]);

  const handleSyncCalendar = async () => {
    setCalendarSyncing(true);
    setSyncFeedback(null);
    try {
      let gToken = getGoogleAccessToken();
      if (!calendarConn.connected || !gToken) {
        const authRes = await googleSignIn();
        if (authRes) {
          gToken = authRes.accessToken;
          await fetch('/api/calendar/connect', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${currentUser.token || currentUser.id}`,
            },
            body: JSON.stringify({
              googleEmail: authRes.user.email,
              calendarId: 'primary',
              googleAccessToken: gToken,
            }),
          });
          setCalendarConn((prev) => ({ ...prev, connected: true, email: authRes.user.email }));
        } else {
          setSyncFeedback({
            type: 'error',
            text: 'Google authorization window was closed.',
          });
          setCalendarSyncing(false);
          return;
        }
      }

      const res = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token || currentUser.id}`,
          'X-Google-Token': gToken || '',
        },
        body: JSON.stringify({
          googleAccessToken: gToken,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Google Workspace calendar sync error.');
      }
      setCalendarConn((prev) => ({
        ...prev,
        connected: true,
        last_synced_at: data.last_synced_at,
        events_synced: data.events_synced,
      }));
      setSyncFeedback({
        type: 'success',
        text: `Synchronized: ${data.events_synced} faculty timetable events to Google Calendar.`,
      });
    } catch (err: any) {
      setSyncFeedback({
        type: 'error',
        text: err.message || 'Sync encountered an error.',
      });
    } finally {
      setCalendarSyncing(false);
    }
  };

  const displayName = currentUser.name || summaryData?.user_name || 'Professor';
  const displayDept = currentUser.department || summaryData?.department || 'Computer Science & Engineering';

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600">
            <span>ACTIVE ACADEMIC TERM • CIT PORTAL</span>
            <span>•</span>
            <span className="text-slate-500">Chilika Institute of Technology</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Good Morning, {displayName}! 👨‍🏫
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Department of {displayDept} • Autumn Term 2026
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => fetchSummary(true)}
            disabled={refreshing}
            className="p-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer shadow-2xs"
            title="Refresh dashboard metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
          </button>

          <button
            onClick={() => onNavigateTab('timetable')}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer"
          >
            Weekly Schedule
          </button>
          <button
            onClick={() => onNavigateTab('requests')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer transition-all"
          >
            Submit Leave / Disruption
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Load */}
        <CardTransition className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Today's Load</div>
          <div className="h-9 flex items-baseline mt-1">
            {loading ? (
              <Skeleton className="h-7 w-24 rounded-md" />
            ) : (
              <span className="text-3xl font-black text-slate-900 leading-none">
                {summaryData?.stats.today_load_classes ?? 0} Classes
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            {summaryData?.today.is_weekend
              ? 'Weekend • Showing upcoming weekday schedule'
              : `${summaryData?.today.classes.filter((c) => c.kind === 'lecture').length ?? 0} Theory, ${
                  summaryData?.today.classes.filter((c) => c.kind !== 'lecture').length ?? 0
                } Practical Sessions`}
          </div>
        </CardTransition>

        {/* Card 2: Weekly Target */}
        <CardTransition className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Weekly Target</div>
          <div className="h-9 flex items-baseline mt-1">
            {loading ? (
              <Skeleton className="h-7 w-28 rounded-md" />
            ) : (
              <span className="text-3xl font-black text-slate-900 leading-none">
                {summaryData?.stats.weekly_hours ?? 18} / {summaryData?.stats.weekly_target_hours ?? 20} Hours
              </span>
            )}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-2">
            {summaryData?.stats.weekly_met_pct ?? 90}% Met • Compliant with Institutional Standards
          </div>
        </CardTransition>

        {/* Card 3: Mid-term Exams */}
        <CardTransition className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mid-term Exams</div>
          <div className="h-9 flex items-baseline mt-1">
            {loading ? (
              <Skeleton className="h-7 w-24 rounded-md" />
            ) : (
              <span className="text-3xl font-black text-slate-900 leading-none">
                {summaryData?.stats.upcoming_exams_count ?? 0} Upcoming
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 truncate">
            {summaryData?.upcoming_exams?.[0]
              ? `Next duty: ${summaryData.upcoming_exams[0].title} (${summaryData.upcoming_exams[0].rooms})`
              : 'Examination duties published'}
          </div>
        </CardTransition>

        {/* Card 4: Pending Requests */}
        <CardTransition className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Requests</div>
          <div className="h-9 flex items-baseline mt-1">
            {loading ? (
              <Skeleton className="h-7 w-24 rounded-md" />
            ) : (
              <span className="text-3xl font-black text-amber-700 leading-none">
                {summaryData?.stats.pending_requests_count ?? 0} Active
              </span>
            )}
          </div>
          <div className="text-[11px] text-amber-600 font-semibold mt-2 truncate">
            {summaryData?.stats.pending_requests_count
              ? `${summaryData.stats.pending_requests_count} request(s) under review by HOD/Admin`
              : '✓ All submitted requisitions cleared'}
          </div>
        </CardTransition>
      </StaggerContainer>

      {/* Middle Layout: Schedule (8 Cols) + Right Cards (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Schedule + Workload */}
        <div className="lg:col-span-8 space-y-6">
          {/* Today's Teaching Schedule */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Today's Teaching Schedule</h2>
                <div className="text-[11px] text-slate-400">
                  {summaryData?.today.day || 'MON'} Schedule • {summaryData?.today.classes_count ?? 0} Timetabled sessions
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center space-x-1 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Campus Timetable Feed</span>
              </span>
            </div>

            <div className="space-y-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <Skeleton className="h-4 w-1/3 rounded-md" />
                    <Skeleton className="h-3 w-1/2 rounded-md" />
                  </div>
                ))
              ) : !summaryData?.today.classes || summaryData.today.classes.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  No teaching sessions scheduled for this academic day. Enjoy your prep / research hours!
                </div>
              ) : (
                summaryData.today.classes.map((cls, idx) => (
                  <div
                    key={cls.session_id || idx}
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      idx === 0
                        ? 'bg-blue-50/70 border-blue-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-700">{cls.time_slot}</span>
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.2 rounded">
                          {cls.course_code}
                        </span>
                        <span className="font-bold text-slate-900 text-xs">{cls.course_title}</span>
                        {idx === 0 && (
                          <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.2 rounded-full">
                            Next Up
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Group: {cls.group_id} • Room {cls.room_id} •{' '}
                        {cls.kind === 'lecture' ? 'Theory Lecture' : cls.kind === 'tutorial' ? 'Tutorial Session' : 'Practical Lab'}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-start sm:self-auto">
                      <button
                        onClick={() => setAttendanceStarted(true)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                          attendanceStarted
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {attendanceStarted ? 'Attendance Recorded ✓' : 'Start Attendance'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Assigned Courses & Workload Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Assigned Courses & Workload Breakdown</h2>
              <button
                onClick={() => onNavigateTab('timetable')}
                className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                Detailed Curriculum →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400">
                  <tr>
                    <th className="p-2.5">COURSE</th>
                    <th className="p-2.5">SECTION</th>
                    <th className="p-2.5">WEEKLY LOAD</th>
                    <th className="p-2.5">ALLOCATED VENUE</th>
                    <th className="p-2.5">SYLLABUS PROGRESS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center">
                        <Skeleton className="h-6 w-full rounded-md" />
                      </td>
                    </tr>
                  ) : !summaryData?.assigned_courses || summaryData.assigned_courses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-400">
                        No courses currently assigned in approved master timetable.
                      </td>
                    </tr>
                  ) : (
                    summaryData.assigned_courses.map((c, i) => (
                      <tr key={c.course_code || i} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-2.5">
                          <span className="font-bold text-blue-600">{c.course_code}</span> {c.course_title}
                        </td>
                        <td className="p-2.5 text-slate-600">{c.section}</td>
                        <td className="p-2.5 font-bold text-slate-800">{c.weekly_load_hours}.0 hrs/wk</td>
                        <td className="p-2.5 text-slate-600">Room {c.room_id}</td>
                        <td className="p-2.5 font-semibold text-slate-700">{c.syllabus_progress}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between text-xs text-blue-900">
              <span>
                Total Committed Faculty Load:{' '}
                <strong>{summaryData?.stats.weekly_hours ?? 18} Teaching Hours</strong>
              </span>
              <span className="font-bold text-emerald-700 flex items-center space-x-1">
                <Check className="w-3.5 h-3.5" />
                <span>Dean Academic Compliant</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Invigilation Duties + Calendar Sync */}
        <div className="lg:col-span-4 space-y-6">
          {/* Invigilation Duties Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-900">Invigilation Duties</span>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                {summaryData?.upcoming_exams?.length ?? 0} Assigned
              </span>
            </div>

            <div className="space-y-2.5">
              {!summaryData?.upcoming_exams || summaryData.upcoming_exams.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs">
                  No pending invigilation duties scheduled.
                </div>
              ) : (
                summaryData.upcoming_exams.map((ex, i) => (
                  <div key={ex.exam_id || i} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500">Day: {ex.day}</span>
                      <span className="text-[9px] font-bold bg-blue-600 text-white px-2 py-0.2 rounded">
                        {ex.role}
                      </span>
                    </div>
                    <div className="font-bold text-slate-800">{ex.title}</div>
                    <div className="text-[11px] text-slate-500">
                      {ex.time} • Room(s): {ex.rooms}
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => onNavigateTab('exams')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <span>View Examination Roster</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Google Calendar Sync Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-900">Google Calendar</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  calendarConn.connected
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : 'text-slate-500 bg-slate-100 border-slate-200'
                }`}
              >
                {calendarConn.connected ? 'Connected' : 'Not Connected'}
              </span>
            </div>

            <p className="text-[11px] text-slate-500">
              Synchronize your teaching sessions and exam duties directly with Google Calendar for instant mobile reminders.
            </p>

            {syncFeedback && (
              <div
                className={`p-2.5 rounded-xl text-[11px] font-medium border ${
                  syncFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}
              >
                {syncFeedback.text}
              </div>
            )}

            <button
              onClick={handleSyncCalendar}
              disabled={calendarSyncing}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${calendarSyncing ? 'animate-spin' : ''}`} />
              <span>{calendarSyncing ? 'Synchronizing...' : calendarConn.connected ? 'Sync to Google Calendar' : 'Connect Google Calendar'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
